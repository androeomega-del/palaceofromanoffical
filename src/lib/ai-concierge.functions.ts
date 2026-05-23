import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { callLlmJson } from "@/lib/llm.server";
import {
  fetchProductByHandle,
  fetchProductsPage,
  type ShopifyProduct,
} from "@/lib/shopify";
import { isAllowedLuxuryBrand } from "@/lib/nav-config";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

type TrendRow = {
  brand_name: string;
  category: string;
  trend_status: string;
  key_aesthetic: string;
};

// Rank weights (higher = hotter). Used to bias the candidate pool toward
// brands the market is actively chasing right now.
const TREND_RANK: Record<string, number> = {
  "trending #1": 5,
  "high heat": 4,
  "rising trend": 3,
  "consistent top seller": 2,
};

function trendRank(status: string | undefined): number {
  if (!status) return 0;
  return TREND_RANK[status.toLowerCase()] ?? 0;
}

async function loadTrendingBrands(): Promise<Map<string, TrendRow>> {
  try {
    const { data, error } = await supabaseAdmin
      .from("trending_brands")
      .select("brand_name, category, trend_status, key_aesthetic");
    if (error || !data) return new Map();
    return new Map(data.map((r) => [r.brand_name.trim().toLowerCase(), r as TrendRow]));
  } catch (e) {
    console.error("[concierge] loadTrendingBrands failed:", e);
    return new Map();
  }
}

// Context the client sends about what the shopper is currently looking at.
const ContextSchema = z.object({
  /** Page type the shopper is on, drives the prompt voice. */
  pageType: z
    .enum(["home", "product", "brand", "collection", "shop", "other"])
    .default("other"),
  /** Current product handle (if on a product page). */
  currentProductHandle: z.string().trim().min(1).max(120).optional(),
  /** Current brand/vendor name (product, brand, or collection page). */
  currentVendor: z.string().trim().min(1).max(80).optional(),
  /** Current collection handle (if on a collection page). */
  currentCollection: z.string().trim().min(1).max(120).optional(),
  /** Wishlist + recently-viewed handles (browser signals). */
  wishlistHandles: z.array(z.string().min(1).max(120)).max(40).default([]),
  recentHandles: z.array(z.string().min(1).max(120)).max(40).default([]),
  /** Top-scored interaction handles (hover/click/cart weighted). */
  interactionHandles: z.array(z.string().min(1).max(120)).max(40).default([]),
  /** Optional first name to address the shopper personally. */
  shopperName: z.string().trim().min(1).max(60).optional(),
});

export type ConciergePick = { handle: string; reason: string };

export type ConciergeResult = {
  ok: true;
  greeting: string;
  picks: ConciergePick[];
  products: ShopifyProduct[];
} | {
  ok: false;
  error: string;
};

/**
 * Contextual product concierge. Picks up to 4 items the shopper would likely
 * enjoy *right now*, given the page they're on and their browsing signals.
 */
export const fetchConciergePicks = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => ContextSchema.parse(i))
  .handler(async ({ data }): Promise<ConciergeResult> => {
    // 1. Hydrate context anchor + browsing signals + trend intelligence.
    const [trendMap, anchor] = await Promise.all([
      loadTrendingBrands(),
      (async () => {
        const anchorHandle = data.currentProductHandle ?? data.recentHandles[0];
        return anchorHandle
          ? await fetchProductByHandle(anchorHandle).catch(() => null)
          : null;
      })(),
    ]);

    // 2. Build the candidate pool from the most relevant Shopify slices.
    //    - Same vendor (highest signal)
    //    - Same product type
    //    - Best sellers (cross-house anchor)
    const vendorHint = data.currentVendor || anchor?.vendor || "";
    const typeHint = anchor?.productType || "";
    const pages = await Promise.all([
      vendorHint
        ? fetchProductsPage({
            first: 12,
            sortKey: "BEST_SELLING",
            query: `vendor:"${vendorHint}"`,
          }).catch(emptyPage)
        : Promise.resolve(emptyPage()),
      typeHint
        ? fetchProductsPage({
            first: 12,
            sortKey: "BEST_SELLING",
            query: `product_type:"${typeHint}"`,
          }).catch(emptyPage)
        : Promise.resolve(emptyPage()),
      data.currentCollection
        ? fetchProductsPage({
            first: 12,
            sortKey: "BEST_SELLING",
            query: `tag:'${data.currentCollection}'`,
          }).catch(emptyPage)
        : Promise.resolve(emptyPage()),
      fetchProductsPage({ first: 18, sortKey: "BEST_SELLING" }).catch(emptyPage),
    ]);

    // 3. Filter to curated 100, exclude already-seen handles, cap at 24.
    const seen = new Set<string>([
      ...(anchor ? [anchor.handle] : []),
      ...data.wishlistHandles,
      ...data.recentHandles,
      ...data.interactionHandles,
    ]);
    const candidates: ShopifyProduct[] = [];
    for (const page of pages) {
      for (const edge of page.edges) {
        if (seen.has(edge.node.handle)) continue;
        if (!edge.node.vendor || !isAllowedLuxuryBrand(edge.node.vendor)) continue;
        seen.add(edge.node.handle);
        candidates.push(edge);
        if (candidates.length >= 24) break;
      }
      if (candidates.length >= 24) break;
    }

    if (candidates.length === 0) {
      return {
        ok: true,
        greeting: "The buyers are refreshing this section — please check back shortly.",
        picks: [],
        products: [],
      };
    }

    // 4. Compose the brief for Claude.
    const contextSummary = [
      data.shopperName ? `Shopper's name: ${data.shopperName}.` : null,
      data.pageType === "product" && anchor
        ? `Shopper is viewing the product "${anchor.title}" by ${anchor.vendor} (${anchor.productType || "—"}).`
        : null,
      data.pageType === "brand" && vendorHint
        ? `Shopper is browsing the ${vendorHint} brand page.`
        : null,
      data.pageType === "collection" && data.currentCollection
        ? `Shopper is browsing the "${data.currentCollection}" collection.`
        : null,
      data.pageType === "home"
        ? `Shopper just landed on the boutique homepage.`
        : null,
      data.recentHandles.length > 0
        ? `Recently viewed: ${data.recentHandles.slice(0, 5).join(", ")}.`
        : null,
      data.wishlistHandles.length > 0
        ? `Wishlist (declared affinity): ${data.wishlistHandles.slice(0, 5).join(", ")}.`
        : null,
      data.interactionHandles.length > 0
        ? `Strongest implicit interest (hover/click/cart-weighted): ${data.interactionHandles.slice(0, 5).join(", ")}.`
        : null,
    ]
      .filter(Boolean)
      .join("\n");

    const candidateLines = candidates
      .map(
        (c) =>
          `- ${c.node.handle} :: ${c.node.vendor} · ${c.node.productType || "—"} · "${c.node.title}"`,
      )
      .join("\n");

    type LlmOut = { greeting: string; picks: ConciergePick[] };
    const fallback: LlmOut = {
      greeting:
        anchor && anchor.vendor
          ? `Pieces that pair beautifully with this ${anchor.vendor}.`
          : "Three pieces from the boutique you may not have seen.",
      picks: candidates.slice(0, 4).map((c) => ({
        handle: c.node.handle,
        reason: `Pairs with ${c.node.vendor}`,
      })),
    };

    const systemPrompt = `You are the exclusive Digital Concierge and Head Stylist for Palace of Roman, a luxury multi-brand fashion destination. Your tone is editorial, refined, sophisticated, and authoritative — yet warmly accommodating. You speak the way a stylist at Bergdorf Goodman or a senior fashion editor at Vogue would speak to a long-standing client.

PRIMARY TASKS
1. Read the shopper's current anchor piece and propose pairings that complete the silhouette.
2. Surface pieces that align with their declared affinity (wishlist) and implicit interest (recently viewed, interaction-weighted handles).
3. If a shopper's name is provided, you may address them by it — once, with restraint.

RULES (non-negotiable)
- You may ONLY recommend handles that appear verbatim in the CANDIDATES list. Every handle in that list is currently active and in stock at Palace of Roman. Never invent a handle. Never reference a piece outside the list.
- Use fashion-literate terminology: drape, silhouette, line, proportion, tonal balance, structural contrast, grounding the look, weight, hand, fall, register. Avoid generic phrasing like "this looks good with", "great choice", "you'll love this".
- No exclamation marks. No emojis. No hard-sell. The voice is curatorial, not transactional.
- Greeting (≤120 chars) is a single editorial line that frames the edit — not a question, not a sales pitch.
- Each pick's reason (≤70 chars) names the specific styling rationale (e.g. "Grounds the silhouette with a leather counterweight", "Tonal echo to the camel cashmere").

OUTPUT
JSON ONLY: { "greeting": string, "picks": [{ "handle": string, "reason": string }] } — return EXACTLY 4 picks. Each handle MUST be present verbatim in the candidate list.`;

    const llmOut = await callLlmJson<LlmOut>(
      {
        system: systemPrompt,
        user: `BROWSING CONTEXT:\n${contextSummary || "(none provided)"}\n\nCANDIDATES (handle :: vendor · type · title):\n${candidateLines}\n\nNow return the JSON.`,
        maxTokens: 700,
        temperature: 0.55,
      },
      fallback,
    );

    const map = new Map(candidates.map((c) => [c.node.handle, c]));
    const products: ShopifyProduct[] = [];
    const picks: ConciergePick[] = [];
    for (const p of llmOut.picks ?? []) {
      const hit = map.get(p.handle);
      if (!hit) continue;
      if (products.some((x) => x.node.handle === hit.node.handle)) continue;
      products.push(hit);
      picks.push({ handle: p.handle, reason: (p.reason || "").slice(0, 80) });
      if (products.length >= 4) break;
    }
    // Pad if model under-delivered.
    if (products.length < 4) {
      for (const c of candidates) {
        if (products.length >= 4) break;
        if (products.some((x) => x.node.handle === c.node.handle)) continue;
        products.push(c);
        picks.push({ handle: c.node.handle, reason: `Pairs with ${c.node.vendor}` });
      }
    }

    return {
      ok: true,
      greeting: llmOut.greeting?.toString().slice(0, 140) || fallback.greeting,
      picks,
      products,
    };
  });

function emptyPage() {
  return {
    edges: [] as ShopifyProduct[],
    pageInfo: { hasNextPage: false, endCursor: null as string | null },
  };
}
