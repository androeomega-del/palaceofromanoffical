import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const ItemSchema = z.object({
  handle: z.string().max(255).nullable(),
  title: z.string().max(500).nullable(),
  variant_title: z.string().max(255).nullable(),
  image: z.string().max(1000).nullable(),
  price_usd: z.number().min(0).max(1_000_000),
  quantity: z.number().int().min(1).max(100),
});

const InputSchema = z.object({
  session_id: z.string().min(1).max(128),
  email: z.string().email().max(320),
  items: z.array(ItemSchema).max(50),
  total_usd: z.number().min(0).max(1_000_000),
  item_count: z.number().int().min(0).max(1000),
  checkout_url: z.string().max(1000).nullable().optional(),
  page_path: z.string().max(500).nullable().optional(),
  user_agent: z.string().max(500).nullable().optional(),
  // Active Shopify Markets context — lets the recovery dispatcher reopen the
  // cart in the same currency/language the shopper was browsing in.
  market_country: z.string().min(2).max(4).nullable().optional(),
  market_language: z.string().min(2).max(8).nullable().optional(),
  market_currency: z.string().min(3).max(4).nullable().optional(),
});

type IncomingItem = z.infer<typeof ItemSchema>;

// Stable identity for a cart line — what counts as "the same product line"
// regardless of quantity / size swap detection upstream.
function lineKey(i: { handle?: string | null; variant_title?: string | null; title?: string | null }): string {
  return `${(i.handle ?? "").toLowerCase()}::${(i.variant_title ?? "").toLowerCase()}::${(i.title ?? "").toLowerCase()}`;
}

export const captureAbandonedCart = createServerFn({ method: "POST" })
  .inputValidator((input) => InputSchema.parse(input))
  .handler(async ({ data }) => {
    const email = data.email.trim().toLowerCase();

    // Fetch the existing row (if any) so we can decide whether this sync is a
    // "major" event that should re-arm the +1h / +24h / +72h recovery clock,
    // or a "minor" event (qty bump, size swap, remove) that should NOT reset
    // it. Without this distinction the clock used to reset on every tiny
    // mutation and no recovery email could ever fire for active sessions.
    const { data: existing, error: selectError } = await supabaseAdmin
      .from("abandoned_carts")
      .select("id, email, items, last_activity_at")
      .eq("session_id", data.session_id)
      .maybeSingle();

    if (selectError) {
      console.error("[abandoned-cart] lookup failed:", selectError.message);
      return { ok: false, error: "Could not read cart" };
    }

    // ---- Major-vs-minor classification --------------------------------------
    let isMajor = false;
    if (!existing) {
      // First capture for this session — establishes the clock.
      isMajor = true;
    } else {
      const previousEmail = (existing.email ?? "").trim().toLowerCase();
      if (!previousEmail && email) {
        // Shopper just typed their email into the cart-email capture form.
        isMajor = true;
      } else {
        const previousItems = Array.isArray(existing.items)
          ? (existing.items as IncomingItem[])
          : [];
        const previousKeys = new Set(previousItems.map(lineKey));
        const incomingKeys = new Set(data.items.map(lineKey));
        // Any incoming line key that wasn't there before = brand-new luxury
        // item added to basket. Quantity/size changes share the same key, so
        // they correctly fall through as "minor".
        for (const key of incomingKeys) {
          if (!previousKeys.has(key)) {
            isMajor = true;
            break;
          }
        }
      }
    }

    const nowIso = new Date().toISOString();

    if (isMajor) {
      // Re-arm the recovery clock + persist the new snapshot.
      const { error } = await supabaseAdmin
        .from("abandoned_carts")
        .upsert(
          {
            session_id: data.session_id,
            email,
            items: data.items,
            total_usd: data.total_usd,
            item_count: data.item_count,
            checkout_url: data.checkout_url ?? null,
            page_path: data.page_path ?? null,
            user_agent: data.user_agent ?? null,
            market_country: data.market_country ?? null,
            market_language: data.market_language ?? null,
            market_currency: data.market_currency ?? null,
            last_activity_at: nowIso,
          },
          { onConflict: "session_id" }
        );
      if (error) {
        console.error("[abandoned-cart] upsert failed:", error.message);
        return { ok: false, error: "Could not save cart" };
      }
      return { ok: true, activity: "major" as const };
    }

    // Minor mutation — refresh the snapshot but PRESERVE last_activity_at so
    // the recovery thresholds can actually elapse on still-active sessions.
    const { error } = await supabaseAdmin
      .from("abandoned_carts")
      .update({
        email,
        items: data.items,
        total_usd: data.total_usd,
        item_count: data.item_count,
        checkout_url: data.checkout_url ?? null,
        page_path: data.page_path ?? null,
        user_agent: data.user_agent ?? null,
        market_country: data.market_country ?? null,
        market_language: data.market_language ?? null,
        market_currency: data.market_currency ?? null,
        // intentionally omit last_activity_at
      })
      .eq("session_id", data.session_id);

    if (error) {
      console.error("[abandoned-cart] minor update failed:", error.message);
      return { ok: false, error: "Could not save cart" };
    }
    return { ok: true, activity: "minor" as const };
  });
