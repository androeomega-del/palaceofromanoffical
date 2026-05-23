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
import { fetchInStockHandles } from "@/lib/shopify-admin.server";
import { getShippingOrigin, formatOriginLabel } from "@/lib/shipping-origin";
import { estimateDelivery } from "@/lib/shipping-eta";

/** Support handoff destination — wired into AI responses and the UI button. */
const SUPPORT_EMAIL = "support@palaceofromanofficial.com";

/** True if any variant on the product is currently available for sale. */
function isInStock(p: ShopifyProduct): boolean {
  return p.node.variants.edges.some((v) => v.node.availableForSale);
}

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
  /** ISO 3166-1 alpha-2 destination country (e.g. "US", "GB", "DE"). */
  shopperCountry: z.string().trim().length(2).optional(),
  /** Shopper's local "now" as ISO string — used for delivery-window math. */
  shopperLocalTime: z.string().trim().min(10).max(40).optional(),
  /** Free-form last user message — used for support-handoff keyword detection. */
  userMessage: z.string().trim().max(500).optional(),
});

export type ConciergePick = { handle: string; reason: string };

/** Support handoff payload — present when the AI detected a service intent. */
export type ConciergeHandoff = {
  message: string;
  mailto: string;
  buttonLabel: string;
};

export type ConciergeResult = {
  ok: true;
  greeting: string;
  picks: ConciergePick[];
  products: ShopifyProduct[];
  handoff?: ConciergeHandoff;
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
    // 0. Service-intent short-circuit. If the shopper's last message
    //    mentions a customer-service concern (returns, refunds, customs,
    //    tracking, damaged or wrong-size receipts), the AI MUST hand off
    //    to a human rather than try to style its way out. Keyword match
    //    is deterministic and cheap; no LLM call needed.
    const handoff = detectServiceHandoff(data.userMessage);
    if (handoff) {
      return {
        ok: true,
        greeting:
          "To ensure your inquiry is handled with the utmost care, I'm passing this directly to our Senior Concierge.",
        picks: [],
        products: [],
        handoff,
      };
    }

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
            query: `vendor:"${vendorHint}" AND available_for_sale:true`,
          }).catch(emptyPage)
        : Promise.resolve(emptyPage()),
      typeHint
        ? fetchProductsPage({
            first: 12,
            sortKey: "BEST_SELLING",
            query: `product_type:"${typeHint}" AND available_for_sale:true`,
          }).catch(emptyPage)
        : Promise.resolve(emptyPage()),
      data.currentCollection
        ? fetchProductsPage({
            first: 12,
            sortKey: "BEST_SELLING",
            query: `tag:'${data.currentCollection}' AND available_for_sale:true`,
          }).catch(emptyPage)
        : Promise.resolve(emptyPage()),
      fetchProductsPage({
        first: 18,
        sortKey: "BEST_SELLING",
        query: "available_for_sale:true",
      }).catch(emptyPage),
    ]);

    // Cross-reference with the Admin API (Client Credentials Grant) for the
    // freshest in-stock truth. Storefront cache can lag behind by minutes;
    // Admin reflects realtime inventory. Best-effort: if admin auth fails,
    // we fall back to the Storefront `availableForSale` flag.
    const adminInStock = await fetchInStockHandles({
      vendor: vendorHint || undefined,
      productType: typeHint || undefined,
      first: 250,
    }).catch(() => new Set<string>());

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
        // Strict in-stock gate: Storefront flag must be true AND, when the
        // Admin lookup returned any handles, the candidate must appear there.
        if (!isInStock(edge)) continue;
        if (adminInStock.size > 0 && !adminInStock.has(edge.node.handle)) continue;
        seen.add(edge.node.handle);
        candidates.push(edge);
        if (candidates.length >= 36) break;
      }
      if (candidates.length >= 36) break;
    }

    // Sort candidates by market trend rank (hottest brands surface first),
    // then cap at 24 so the LLM has a curated, market-aware pool to pick from.
    candidates.sort((a, b) => {
      const ra = trendRank(trendMap.get((a.node.vendor || "").toLowerCase())?.trend_status);
      const rb = trendRank(trendMap.get((b.node.vendor || "").toLowerCase())?.trend_status);
      return rb - ra;
    });
    candidates.splice(24);

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
      .map((c) => {
        const trend = trendMap.get((c.node.vendor || "").toLowerCase());
        const trendTag = trend ? ` [${trend.trend_status} · ${trend.key_aesthetic}]` : "";
        return `- ${c.node.handle} :: ${c.node.vendor} · ${c.node.productType || "—"} · "${c.node.title}"${trendTag}`;
      })
      .join("\n");

    // Surface the market-trend brief so the LLM knows which houses are hot
    // right now and can echo the right aesthetic vocabulary.
    const trendBrief = Array.from(trendMap.values())
      .sort((a, b) => trendRank(b.trend_status) - trendRank(a.trend_status))
      .map((t) => `- ${t.brand_name} (${t.category} · ${t.trend_status}): ${t.key_aesthetic}`)
      .join("\n");

    type LlmOut = { greeting: string; picks: ConciergePick[] };
    const fallback: LlmOut = {
      greeting:
        anchor && anchor.vendor
          ? `Pieces that pair beautifully with this ${anchor.vendor}.`
          : "Three pieces from the boutique you may not have seen.",
      picks: candidates.slice(0, 4).map((c) => {
        const trend = trendMap.get((c.node.vendor || "").toLowerCase());
        const reason = trend
          ? `${trend.trend_status} — ${c.node.vendor}`
          : `Pairs with ${c.node.vendor}`;
        return { handle: c.node.handle, reason };
      }),
    };

    const systemPrompt = `You are the exclusive Digital Concierge and Head Stylist for Palace of Roman, a luxury multi-brand fashion destination. Your tone is editorial, refined, sophisticated, and authoritative — yet warmly accommodating. You speak the way a stylist at Bergdorf Goodman or a senior fashion editor at Vogue would speak to a long-standing client.

PRIMARY TASKS
1. Read the shopper's current anchor piece and propose pairings that complete the silhouette.
2. Surface pieces that align with their declared affinity (wishlist) and implicit interest (recently viewed, interaction-weighted handles).
3. Weight your edit toward houses the market is actively chasing right now — see MARKET TRENDS. Use the trend status to inform priority and the key aesthetic to inform vocabulary.
4. If a shopper's name is provided, you may address them by it — once, with restraint.

RULES (non-negotiable)
- You may ONLY recommend handles that appear verbatim in the CANDIDATES list. Every handle in that list is currently active and in stock at Palace of Roman. Never invent a handle. Never reference a piece outside the list.
- When a candidate carries a trend tag (in brackets after its title), prefer it — Trending #1 > High Heat > Rising Trend > Consistent Top Seller — unless the shopper's anchor or affinity argues otherwise.
- When the rationale touches on momentum (e.g. a Miu Miu ballet flat or a Loewe Puzzle silhouette), weave the trend language in subtly — never as marketing copy, always as a stylist's observation.
- Use fashion-literate terminology: drape, silhouette, line, proportion, tonal balance, structural contrast, grounding the look, weight, hand, fall, register. Avoid generic phrasing like "this looks good with", "great choice", "you'll love this".
- No exclamation marks. No emojis. No hard-sell. The voice is curatorial, not transactional.
- Greeting (≤120 chars) is a single editorial line that frames the edit — not a question, not a sales pitch.
- Each pick's reason (≤70 chars) names the specific styling rationale (e.g. "Grounds the silhouette with a leather counterweight", "Echoes the Miu Miu ballet-flat moment").

OUTPUT
JSON ONLY: { "greeting": string, "picks": [{ "handle": string, "reason": string }] } — return EXACTLY 4 picks. Each handle MUST be present verbatim in the candidate list.`;

    const llmOut = await callLlmJson<LlmOut>(
      {
        system: systemPrompt,
        user: `BROWSING CONTEXT:\n${contextSummary || "(none provided)"}\n\nMARKET TRENDS (luxury houses ranked by current heat):\n${trendBrief || "(none available)"}\n\nCANDIDATES (handle :: vendor · type · title [trend status · key aesthetic]):\n${candidateLines}\n\nNow return the JSON.`,
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
