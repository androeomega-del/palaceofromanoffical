/**
 * UGC Content Recommender — turns four buyer-behavior signals from Supabase
 * into ready-to-edit content briefs with per-channel captions.
 *
 * Signals (last 14 days):
 *   1. Top-viewed products       — interaction_events
 *   2. Wishlist with no add-to-cart — interaction_events
 *   3. Most-abandoned products   — abandoned_carts.items
 *   4. No-results searches       — search_queries
 *
 * Admin-only. AI calls capped at 8 per run (~$0.01 total on Gemini Flash).
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { callAi } from "@/lib/ai-gateway.server";
import { PALACE_BRAND_VOICE } from "@/lib/brand-voice";

const LOOKBACK_DAYS = 14;
const MAX_IDEAS = 8;
const PER_SIGNAL = 3;

export type UgcSignalKind = "top_viewed" | "wishlist_no_cart" | "abandoned" | "no_results_search";

export type UgcOpportunity = {
  signal: UgcSignalKind;
  signalLabel: string;
  weight: number; // higher = stronger signal
  productHandle?: string;
  productTitle?: string;
  searchQuery?: string;
  metric: string; // human-readable "23 PDP views, 5 wishlists"
};

export type UgcDraft = {
  opportunity: UgcOpportunity;
  rationale: string;
  hook: string;
  instagram_caption: string;
  pinterest_caption: string;
  x_caption: string;
  costUsd: number;
};

// ---------------------------------------------------------------------------
// Signal extraction
// ---------------------------------------------------------------------------
async function getOpportunities(): Promise<UgcOpportunity[]> {
  const since = new Date(Date.now() - LOOKBACK_DAYS * 24 * 60 * 60 * 1000).toISOString();

  const [interactions, abandonments, searches] = await Promise.all([
    supabaseAdmin.from("interaction_events").select("handle, event_type").gte("created_at", since),
    supabaseAdmin.from("abandoned_carts").select("items").gte("created_at", since),
    supabaseAdmin.from("search_queries").select("query, result_count").gte("created_at", since),
  ]);

  const opps: UgcOpportunity[] = [];

  // 1. Top-viewed (weighted: pdp_view×3 + click×2 + impression×1)
  const viewScore = new Map<string, { pdp: number; click: number; impr: number }>();
  const wishlistByHandle = new Map<string, number>();
  const cartByHandle = new Map<string, number>();
  for (const row of interactions.data ?? []) {
    const h = row.handle;
    if (!h) continue;
    const cur = viewScore.get(h) ?? { pdp: 0, click: 0, impr: 0 };
    if (row.event_type === "pdp_view") cur.pdp++;
    else if (row.event_type === "click") cur.click++;
    else if (row.event_type === "impression") cur.impr++;
    else if (row.event_type === "wishlist") wishlistByHandle.set(h, (wishlistByHandle.get(h) ?? 0) + 1);
    else if (row.event_type === "cart") cartByHandle.set(h, (cartByHandle.get(h) ?? 0) + 1);
    viewScore.set(h, cur);
  }
  const topViewed = Array.from(viewScore.entries())
    .map(([h, s]) => ({ handle: h, score: s.pdp * 3 + s.click * 2 + s.impr, detail: s }))
    .filter((x) => x.score >= 3)
    .sort((a, b) => b.score - a.score)
    .slice(0, PER_SIGNAL);
  for (const t of topViewed) {
    opps.push({
      signal: "top_viewed",
      signalLabel: "Trending on-site",
      weight: t.score,
      productHandle: t.handle,
      metric: `${t.detail.pdp} PDP views · ${t.detail.click} clicks · ${t.detail.impr} impressions`,
    });
  }

  // 2. Wishlist → no cart
  const wishNoCart = Array.from(wishlistByHandle.entries())
    .filter(([h, w]) => w >= 2 && (cartByHandle.get(h) ?? 0) === 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, PER_SIGNAL);
  for (const [h, w] of wishNoCart) {
    opps.push({
      signal: "wishlist_no_cart",
      signalLabel: "Desired but unsold",
      weight: w * 4,
      productHandle: h,
      metric: `${w} wishlist saves · 0 add-to-cart`,
    });
  }

  // 3. Abandoned-cart handles
  const abCount = new Map<string, number>();
  for (const row of abandonments.data ?? []) {
    const items = (row.items ?? []) as Array<{ handle?: string; product_handle?: string }>;
    for (const it of items) {
      const h = it.handle ?? it.product_handle;
      if (h) abCount.set(h, (abCount.get(h) ?? 0) + 1);
    }
  }
  const topAb = Array.from(abCount.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, PER_SIGNAL);
  for (const [h, c] of topAb) {
    opps.push({
      signal: "abandoned",
      signalLabel: "Frequently abandoned",
      weight: c * 5,
      productHandle: h,
      metric: `Abandoned in ${c} cart${c === 1 ? "" : "s"}`,
    });
  }

  // 4. No-results searches
  const noResults = new Map<string, number>();
  for (const row of searches.data ?? []) {
    if (row.result_count === 0 && row.query) {
      noResults.set(row.query.toLowerCase(), (noResults.get(row.query.toLowerCase()) ?? 0) + 1);
    }
  }
  const topNoResult = Array.from(noResults.entries())
    .filter(([, c]) => c >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, PER_SIGNAL);
  for (const [q, c] of topNoResult) {
    opps.push({
      signal: "no_results_search",
      signalLabel: "Searched but never delivered",
      weight: c * 6,
      searchQuery: q,
      metric: `Searched ${c} time${c === 1 ? "" : "s"} with zero results`,
    });
  }

  // Rank by weight, cap to MAX_IDEAS
  return opps.sort((a, b) => b.weight - a.weight).slice(0, MAX_IDEAS);
}

// ---------------------------------------------------------------------------
// Server fns
// ---------------------------------------------------------------------------
export const getUgcSignals = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .handler(async (): Promise<{ opportunities: UgcOpportunity[]; lookbackDays: number }> => {
    const opportunities = await getOpportunities();
    return { opportunities, lookbackDays: LOOKBACK_DAYS };
  });

const draftSchema = z.object({
  rationale: z.string().min(10).max(400),
  hook: z.string().min(5).max(200),
  instagram_caption: z.string().min(20).max(800),
  pinterest_caption: z.string().min(20).max(800),
  x_caption: z.string().min(10).max(280),
});

function buildPrompt(opp: UgcOpportunity): string {
  const subject = opp.productHandle
    ? `the product with handle "${opp.productHandle}" on palaceofromanofficial.com`
    : `the search query "${opp.searchQuery}" that visitors typed but found nothing for`;

  const angle: Record<UgcSignalKind, string> = {
    top_viewed: `This product is trending on-site (${opp.metric}). Write content that capitalises on real momentum — feel inevitable, not hype.`,
    wishlist_no_cart: `Visitors are saving this to their wishlist but not buying (${opp.metric}). Surface the missing reason-to-buy — confidence, sizing, styling, or scarcity — without sounding pushy.`,
    abandoned: `This product is repeatedly abandoned at checkout (${opp.metric}). Address the silent objection: authenticity, shipping, fit, or value, in the Palace voice.`,
    no_results_search: `Visitors searched for "${opp.searchQuery}" and got nothing. The content should acknowledge the gap and either redirect them to the closest curated edit or signal that we are sourcing it.`,
  };

  return `Generate a single piece of cross-channel content about ${subject}.

Context: ${angle[opp.signal]}

Return JSON with these exact keys:
- rationale: one sentence on WHY this is a good post right now, citing the signal.
- hook: a single tight opening line (max 12 words) usable across channels.
- instagram_caption: ~120–150 chars. Curatorial Palace voice. No emojis. Single subtle CTA at the end.
- pinterest_caption: ~180–220 chars. Keyword-rich for Pinterest search (mention category + occasion + maison style language).
- x_caption: ≤240 chars. Conversational, one clear statement + a soft pull. No hashtags.

Do not invent facts about a specific maison or product spec you cannot confirm. Stay at the level of style, mood, occasion, and curation. Do not use the words "exclusive", "luxury", "authentic" gratuitously.`;
}

export const generateUgcIdeas = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .handler(async (): Promise<{ drafts: UgcDraft[]; totalCostUsd: number; lookbackDays: number; signalCount: number }> => {
    const opps = await getOpportunities();
    if (opps.length === 0) {
      return { drafts: [], totalCostUsd: 0, lookbackDays: LOOKBACK_DAYS, signalCount: 0 };
    }

    const drafts: UgcDraft[] = [];
    let total = 0;

    // Sequential to stay under rate limits and keep cost visible per call
    for (const opp of opps) {
      try {
        const res = await callAi({
          module: "ugc_recommender",
        model: "google/gemini-2.5-pro",
          system: PALACE_BRAND_VOICE,
          user: buildPrompt(opp),
          json: true,
          maxTokens: 600,
          temperature: 0.75,
        });
        const parsed = draftSchema.safeParse(JSON.parse(res.content));
        if (!parsed.success) {
          console.warn("[ugc-recommender] invalid JSON from model, skipping opportunity", parsed.error.message);
          continue;
        }
        total += res.costUsd;
        drafts.push({ opportunity: opp, ...parsed.data, costUsd: res.costUsd });
      } catch (e) {
        console.error("[ugc-recommender] draft failed for", opp, e);
        // continue on; one failed opportunity should not kill the batch
      }
    }

    return { drafts, totalCostUsd: total, lookbackDays: LOOKBACK_DAYS, signalCount: opps.length };
  });

const queueSchema = z.object({
  channel: z.enum(["instagram", "pinterest", "x"]),
  caption: z.string().min(10).max(2000),
  hook: z.string().min(1).max(280),
  productHandle: z.string().max(255).optional(),
  searchQuery: z.string().max(200).optional(),
  signal: z.enum(["top_viewed", "wishlist_no_cart", "abandoned", "no_results_search"]),
});

export const queueUgcDraft = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((input: unknown) => queueSchema.parse(input))
  .handler(async ({ data }) => {
    const title = data.productHandle
      ? `${data.signal}: ${data.productHandle}`
      : `${data.signal}: "${data.searchQuery ?? ""}"`;

    const { error } = await supabaseAdmin.from("content_queue").insert({
      kind: `ugc_${data.channel}`,
      channel: data.channel,
      title: title.slice(0, 200),
      status: "draft",
      payload: {
        source: "ugc_recommender",
        signal: data.signal,
        hook: data.hook,
        caption: data.caption,
        product_handle: data.productHandle ?? null,
        search_query: data.searchQuery ?? null,
      },
    });
    if (error) {
      console.error("[ugc-recommender] queue insert failed:", error.message);
      return { ok: false as const, error: "Failed to queue draft" };
    }
    return { ok: true as const };
  });
