// Server-only helper: pulls abandoned checkouts from Shopify's Admin REST
// API and merges them into our `abandoned_carts` table so they:
//   1. Appear in the admin dashboard
//   2. Flow through the existing +1h / +24h / +72h recovery-email cron
//
// Dedupe strategy:
//   • Each Shopify checkout is keyed by `session_id = "shopify:<token>"`
//     (upsert by session_id).
//   • If a local capture row exists for the same email within the last 48h
//     and isn't a shopify:* row, we MERGE Shopify's checkout_url + items
//     into that local row instead of creating a duplicate.
//   • The recovery cron has its own per-email throttle (12h) to prevent
//     double-sending if a duplicate ever slips through.

import { supabaseAdmin } from "@/integrations/supabase/client.server";
import {
  SHOPIFY_API_VERSION,
  SHOPIFY_STORE_PERMANENT_DOMAIN,
} from "@/lib/shopify";
import { getAdminAccessToken } from "@/lib/shopify-admin.server";

const EUR_TO_USD = 1.08;
const HOUR_MS = 60 * 60 * 1000;

async function adminToken(): Promise<string> {
  // Use Client Credentials Grant — the custom app token has read_all_orders,
  // while the static SHOPIFY_ACCESS_TOKEN does not.
  return getAdminAccessToken();
}

interface ShopifyCheckout {
  id: number;
  token: string;
  email: string | null;
  abandoned_checkout_url: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  total_price: string;
  currency: string;
  customer?: {
    first_name?: string | null;
    last_name?: string | null;
  } | null;
  line_items?: Array<{
    title?: string;
    variant_title?: string | null;
    quantity?: number;
    price?: string;
    image_url?: string | null;
    handle?: string | null;
  }>;
}

async function fetchAbandonedCheckouts(
  sinceIso: string,
): Promise<ShopifyCheckout[]> {
  const token = await adminToken();
  const base = `https://${SHOPIFY_STORE_PERMANENT_DOMAIN}/admin/api/${SHOPIFY_API_VERSION}/checkouts.json`;
  let url: string | null = `${base}?limit=250&status=open&created_at_min=${encodeURIComponent(sinceIso)}`;
  const out: ShopifyCheckout[] = [];
  let safety = 10; // up to 2 500 checkouts
  while (url && safety-- > 0) {
    const res: Response = await fetch(url, {
      headers: {
        "X-Shopify-Access-Token": token,
        "Content-Type": "application/json",
      },
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(
        `Shopify checkouts ${res.status}: ${body.slice(0, 300)}`,
      );
    }
    const json = (await res.json()) as { checkouts?: ShopifyCheckout[] };
    out.push(...(json.checkouts ?? []));
    const link: string | null =
      res.headers.get("link") || res.headers.get("Link");
    const next: string | undefined = link
      ? link.split(",").find((p: string) => p.includes('rel="next"'))
      : undefined;
    const match: RegExpMatchArray | null = next
      ? next.match(/<([^>]+)>/)
      : null;
    url = match ? match[1] : null;
  }
  return out;
}

function toUsd(amount: string | number | undefined, currency: string): number {
  const n = typeof amount === "string" ? Number(amount) : (amount ?? 0);
  if (!Number.isFinite(n)) return 0;
  if (currency === "USD") return n;
  if (currency === "EUR") return Number((n * EUR_TO_USD).toFixed(2));
  return n;
}

export interface SyncResult {
  ok: boolean;
  error?: string;
  checked: number;
  inserted: number;
  updated: number;
  merged: number;
  skipped: number;
}

export async function syncShopifyAbandonedCheckoutsImpl(opts?: {
  days?: number;
}): Promise<SyncResult> {
  const days = opts?.days ?? 30;
  const sinceIso = new Date(Date.now() - days * 24 * HOUR_MS).toISOString();

  let checkouts: ShopifyCheckout[];
  try {
    checkouts = await fetchAbandonedCheckouts(sinceIso);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[shopify-abandoned-sync] fetch failed:", msg);
    return {
      ok: false,
      error: msg,
      checked: 0,
      inserted: 0,
      updated: 0,
      merged: 0,
      skipped: 0,
    };
  }

  let inserted = 0;
  let updated = 0;
  let merged = 0;
  let skipped = 0;
  const fortyEightHAgo = new Date(Date.now() - 48 * HOUR_MS).toISOString();

  for (const co of checkouts) {
    if (co.completed_at) {
      skipped++;
      continue;
    }
    if (!co.email) {
      skipped++;
      continue;
    }
    const email = co.email.trim().toLowerCase();
    const sessionId = `shopify:${co.token}`;
    const totalUsd = toUsd(co.total_price, co.currency);
    const lineItems = co.line_items ?? [];
    const items = lineItems.map((li) => ({
      handle: li.handle ?? null,
      title: li.title ?? null,
      variant_title: li.variant_title ?? null,
      image: li.image_url ?? null,
      price_usd: toUsd(li.price, co.currency),
      quantity: li.quantity ?? 1,
    }));
    const itemCount = items.reduce((s, i) => s + (i.quantity || 0), 0);
    if (itemCount === 0) {
      skipped++;
      continue;
    }
    const customerName =
      [co.customer?.first_name, co.customer?.last_name]
        .filter(Boolean)
        .join(" ")
        .trim() || null;

    // Try to merge into a recent local capture for the same email.
    const { data: localRows } = await supabaseAdmin
      .from("abandoned_carts")
      .select(
        "id, session_id, last_activity_at, checkout_url, recovered_at",
      )
      .eq("email", email)
      .gte("last_activity_at", fortyEightHAgo)
      .not("session_id", "like", "shopify:%")
      .order("last_activity_at", { ascending: false })
      .limit(1);
    const localMatch = (localRows ?? [])[0];

    if (localMatch && !localMatch.recovered_at) {
      const shopifyTs = new Date(co.updated_at).getTime();
      const localTs = new Date(localMatch.last_activity_at).getTime();
      const newActivity =
        shopifyTs > localTs ? co.updated_at : localMatch.last_activity_at;
      const { error: upErr } = await supabaseAdmin
        .from("abandoned_carts")
        .update({
          checkout_url: co.abandoned_checkout_url ?? localMatch.checkout_url,
          last_activity_at: newActivity,
          items,
          total_usd: totalUsd,
          item_count: itemCount,
          customer_name: customerName,
        })
        .eq("id", localMatch.id);
      if (upErr) {
        console.error(
          "[shopify-abandoned-sync] merge failed:",
          upErr.message,
        );
        skipped++;
      } else {
        merged++;
      }
      continue;
    }

    // Upsert by session_id
    const { data: existing } = await supabaseAdmin
      .from("abandoned_carts")
      .select("id, recovered_at")
      .eq("session_id", sessionId)
      .maybeSingle();

    if (existing) {
      if (existing.recovered_at) {
        skipped++;
        continue;
      }
      const { error: upErr } = await supabaseAdmin
        .from("abandoned_carts")
        .update({
          email,
          customer_name: customerName,
          items,
          total_usd: totalUsd,
          item_count: itemCount,
          checkout_url: co.abandoned_checkout_url,
          last_activity_at: co.updated_at,
        })
        .eq("id", existing.id);
      if (upErr) {
        console.error(
          "[shopify-abandoned-sync] update failed:",
          upErr.message,
        );
        skipped++;
      } else {
        updated++;
      }
    } else {
      const { error: insErr } = await supabaseAdmin
        .from("abandoned_carts")
        .insert({
          session_id: sessionId,
          email,
          customer_name: customerName,
          items,
          total_usd: totalUsd,
          item_count: itemCount,
          checkout_url: co.abandoned_checkout_url,
          page_path: null,
          user_agent: "shopify-checkout",
          last_activity_at: co.updated_at,
        });
      if (insErr) {
        console.error(
          "[shopify-abandoned-sync] insert failed:",
          insErr.message,
        );
        skipped++;
      } else {
        inserted++;
      }
    }
  }

  return {
    ok: true,
    checked: checkouts.length,
    inserted,
    updated,
    merged,
    skipped,
  };
}
