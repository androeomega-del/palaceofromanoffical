import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { fetchProducts } from "@/lib/shopify";
import {
  homepageLayoutSchema,
  type HomepageLayout,
} from "@/lib/homepage-layout-schema";
import { callLlmJson } from "@/lib/llm.server";
import { PALACE_BRAND_VOICE } from "@/lib/brand-voice";
import { logHomepageAudit } from "@/lib/homepage-audit.server";
import { checkWebhookSecret } from "@/lib/webhook-secret";

/**
 * /api/public/cron/refresh-homepage-layout
 *
 * Called every ~48 hours by pg_cron. Atomic swap of `homepage_daily_layout`.
 *
 * Each cycle now composes a real multi-block edition via Claude, blending
 * live Shopify signals (best sellers by gender, trending brand list) with
 * curated editorial copy in the Palace of Roman voice. Cold-start fallback
 * stays as a safety net — if any signal fetch or the LLM call fails, the
 * cron still ships a usable rail rather than erroring.
 *
 * GUARDRAIL: before wiping the current edition, check its conversion
 * performance against a rolling 7-day baseline. If it is >= 30% above
 * baseline (a "viral" edition), extend it by an additional 24 hours
 * rather than swapping. Underperforming or normal editions roll over
 * on schedule.
 */

const CYCLE_MS = 48 * 60 * 60 * 1000;
const EXTENSION_MS = 24 * 60 * 60 * 1000;
const OUTPERFORM_THRESHOLD = 1.3; // 30% above baseline
const BASELINE_WINDOW_DAYS = 7;
const MIN_CURRENT_SIGNAL = 25; // need at least this many sessions before we trust the lift

type ConversionStats = {
  sessions: number;
  conversions: number;
  rate: number;
};

async function computeWindowStats(since: Date, until: Date): Promise<ConversionStats> {
  const { data: sessionsData } = await supabaseAdmin
    .from("interaction_events")
    .select("session_id")
    .gte("created_at", since.toISOString())
    .lt("created_at", until.toISOString())
    .not("session_id", "is", null);

  const uniqueSessions = new Set<string>();
  for (const row of sessionsData ?? []) {
    if (row.session_id) uniqueSessions.add(row.session_id);
  }

  const { count: conversions } = await supabaseAdmin
    .from("cart_events")
    .select("id", { count: "exact", head: true })
    .gte("created_at", since.toISOString())
    .lt("created_at", until.toISOString())
    .eq("event_type", "reached_checkout");

  const sessions = uniqueSessions.size;
  const c = conversions ?? 0;
  return {
    sessions,
    conversions: c,
    rate: sessions > 0 ? c / sessions : 0,
  };
}

// ---------------------------------------------------------------------------
// Signal pulls — feed Claude with real catalog + behavior data.
// ---------------------------------------------------------------------------

type SignalProduct = { handle: string; title: string; vendor: string };

async function safeFetch(query: string, first = 12): Promise<SignalProduct[]> {
  try {
    const edges = await fetchProducts({ first, sortKey: "BEST_SELLING", query });
    return edges
      .map((e) => ({
        handle: e.node.handle,
        title: e.node.title,
        vendor: e.node.vendor,
      }))
      .filter((p) => p.handle && p.title);
  } catch (err) {
    console.error(`[refresh-homepage-layout] fetch failed for "${query}":`, err);
    return [];
  }
}

async function pullTrendingHandles(): Promise<string[]> {
  try {
    const since = new Date(Date.now() - 14 * 86_400_000).toISOString();
    const { data } = await supabaseAdmin
      .from("interaction_events")
      .select("handle")
      .gte("created_at", since)
      .not("handle", "is", null)
      .limit(5000);
    const tally = new Map<string, number>();
    for (const row of data ?? []) {
      const h = (row as { handle: string | null }).handle;
      if (!h) continue;
      tally.set(h, (tally.get(h) ?? 0) + 1);
    }
    return [...tally.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([h]) => h);
  } catch (err) {
    console.error("[refresh-homepage-layout] trending pull failed:", err);
    return [];
  }
}

/**
 * Pull the highest-volume site search queries from the last 14 days so the
 * AI can theme rails around what shoppers are actively typing — both queries
 * that returned results (validated demand) and zero-result queries (demand
 * the catalog isn't satisfying, useful as editorial framing).
 */
async function pullSearchSignals(): Promise<{
  top_queries: { query: string; count: number; avg_results: number }[];
  zero_result_queries: { query: string; count: number }[];
}> {
  try {
    const since = new Date(Date.now() - 14 * 86_400_000).toISOString();
    const { data } = await supabaseAdmin
      .from("search_queries")
      .select("query, result_count")
      .gte("created_at", since)
      .not("query", "is", null)
      .limit(5000);

    const tally = new Map<string, { count: number; results: number }>();
    for (const row of data ?? []) {
      const raw = (row as { query: string | null; result_count: number | null }).query;
      if (!raw) continue;
      const q = raw.trim().toLowerCase();
      if (q.length < 2 || q.length > 60) continue;
      const prev = tally.get(q) ?? { count: 0, results: 0 };
      prev.count += 1;
      prev.results += (row as { result_count: number | null }).result_count ?? 0;
      tally.set(q, prev);
    }

    const all = [...tally.entries()].map(([query, v]) => ({
      query,
      count: v.count,
      avg_results: v.count > 0 ? Math.round(v.results / v.count) : 0,
    }));

    const top_queries = all
      .filter((q) => q.avg_results > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 12)
      .map((q) => ({ query: q.query, count: q.count, avg_results: q.avg_results }));

    const zero_result_queries = all
      .filter((q) => q.avg_results === 0 && q.count >= 2)
      .sort((a, b) => b.count - a.count)
      .slice(0, 8)
      .map((q) => ({ query: q.query, count: q.count }));

    return { top_queries, zero_result_queries };
  } catch (err) {
    console.error("[refresh-homepage-layout] search signals pull failed:", err);
    return { top_queries: [], zero_result_queries: [] };
  }
}

// ---------------------------------------------------------------------------
// Cold-start fallback (unchanged shape — used only if AI path fails).
// ---------------------------------------------------------------------------

async function buildFallbackLayout(): Promise<HomepageLayout> {
  let products: SignalProduct[] = [];
  try {
    const edges = await fetchProducts({ first: 12, sortKey: "BEST_SELLING" });
    products = edges
      .map((e) => ({
        handle: e.node.handle,
        title: e.node.title,
        vendor: e.node.vendor,
      }))
      .filter((p) => p.handle && p.title);
  } catch (err) {
    console.error("[refresh-homepage-layout] best-seller fetch failed:", err);
  }

  return homepageLayoutSchema.parse({
    version: 1,
    generated_at: new Date().toISOString(),
    source: "cold_start_fallback",
    blocks: [
      {
        id: "hero",
        type: "hero",
        image: "library:22",
        alt: "Palace of Roman editorial curation",
        heading: "The Current Edit",
        subheading:
          "A restrained selection of designer pieces, refreshed as live boutique signals return.",
        cta: { label: "Shop new arrivals", href: "/collections/new-arrivals" },
      },
      {
        id: "best-sellers",
        type: "product_rail",
        heading: "Best sellers — restocked",
        subheading: "The pieces with the clearest demand signal in the boutique right now.",
        collectionHandle: products.length === 0 ? "best-sellers" : undefined,
        productHandles: products.length > 0 ? products.map((p) => p.handle).slice(0, 12) : undefined,
      },
      {
        id: "editorial-feature",
        type: "editorial_banner",
        image: "library:36",
        alt: "Palace of Roman seasonal editorial still",
        heading: "A quieter kind of arrival",
        subheading:
          "Evening, tailoring, resort pieces and accessories held together by proportion and restraint.",
        cta: { label: "Read the story", href: "/editorial/the-new-evening" },
        hotspots: [],
      },
      {
        id: "women-now",
        type: "product_rail",
        heading: "Women’s selection",
        subheading: "Dresses, tailoring and accessories selected for the current rotation.",
        collectionHandle: "women",
      },
      {
        id: "men-now",
        type: "product_rail",
        heading: "Men’s selection",
        subheading: "Tailoring, shirting and off-duty pieces with a precise finish.",
        collectionHandle: "men",
      },
    ],
  } satisfies HomepageLayout);
}

// ---------------------------------------------------------------------------
// AI-composed layout — the real curation generator.
// ---------------------------------------------------------------------------

// Curated editorial-library image slugs Claude can pick from for hero / banner.
// These map 1:1 to the numeric keys in src/lib/editorial-library.ts.
const HERO_IMAGE_POOL = [7, 12, 18, 22, 28, 34, 42, 50, 58, 66];
const BANNER_IMAGE_POOL = [14, 20, 26, 36, 44, 52, 60, 70];

const EDITORIAL_ROUTES = [
  { href: "/editorial/resort-2026", title: "Resort 2026 — Light as Architecture" },
  { href: "/editorial/the-new-evening", title: "The New Evening" },
  { href: "/editorial/may-2026", title: "May 2026 Edit" },
];

async function buildAiLayout(): Promise<HomepageLayout> {
  // Pull a much wider signal pool so each rail can draw from a distinct
  // bucket of handles. Variety only happens if the inputs themselves
  // are varied — feeding three overlapping queries guarantees collisions
  // no matter what the model does.
  const [
    womenDresses,
    womenSkirtsKnits,
    womenShoes,
    menTailoring,
    menShirtsKnits,
    menShoes,
    bags,
    accessories,
    newArrivals,
    trending,
    searchSignals,
    previousRow,
  ] = await Promise.all([
    safeFetch("tag:women AND (product_type:Dress OR product_type:Jumpsuit)", 16),
    safeFetch("tag:women AND (product_type:Skirt OR product_type:Knitwear OR product_type:Top)", 16),
    safeFetch("tag:women AND (product_type:Shoes OR product_type:Boots)", 12),
    safeFetch("tag:men AND (product_type:Suit OR product_type:Jacket OR product_type:Trousers)", 16),
    safeFetch("tag:men AND (product_type:Shirt OR product_type:Knitwear OR product_type:T-Shirt)", 16),
    safeFetch("tag:men AND (product_type:Shoes OR product_type:Sneakers OR product_type:Boots)", 12),
    safeFetch("product_type:Bag OR product_type:Handbag OR tag:bags", 14),
    safeFetch("product_type:Accessories OR tag:accessories", 14),
    safeFetch("tag:new OR tag:new-arrivals", 16),
    pullTrendingHandles(),
    pullSearchSignals(),
    (async () => {
      try {
        const { data } = await supabaseAdmin
          .from("homepage_daily_layout")
          .select("layout_json")
          .order("generated_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        return (data?.layout_json ?? null) as unknown;
      } catch {
        return null;
      }
    })(),
  ]);

  const women = [...womenDresses, ...womenSkirtsKnits, ...womenShoes];
  const men = [...menTailoring, ...menShirtsKnits, ...menShoes];
  const allProducts = [
    ...women,
    ...men,
    ...bags,
    ...accessories,
    ...newArrivals,
  ];

  // Bail out to fallback if Shopify is empty — Claude has nothing to anchor to.
  if (women.length === 0 && men.length === 0) {
    throw new Error("no shopify signals — fall back");
  }

  // Dedup by handle while preserving the bucket each handle came from so we
  // can backfill rails from the correct pool later.
  const dedupByHandle = (items: SignalProduct[]): SignalProduct[] => {
    const seen = new Set<string>();
    const out: SignalProduct[] = [];
    for (const p of items) {
      if (!p.handle || seen.has(p.handle)) continue;
      seen.add(p.handle);
      out.push(p);
    }
    return out;
  };
  const womenPool = dedupByHandle(women);
  const menPool = dedupByHandle(men);
  const bagsPool = dedupByHandle(bags);
  const accessoriesPool = dedupByHandle(accessories);
  const newArrivalsPool = dedupByHandle(newArrivals);

  const trendingProducts = trending
    .map((h) => allProducts.find((p) => p.handle === h))
    .filter((p): p is SignalProduct => !!p)
    .slice(0, 10);

  const brandTally = new Map<string, number>();
  for (const p of allProducts) {
    if (p.vendor) brandTally.set(p.vendor, (brandTally.get(p.vendor) ?? 0) + 1);
  }
  const topBrands = [...brandTally.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([v]) => v);

  // Variation signal: feed the previous edition's headings + hero image + a
  // sample of used handles so Claude can deliberately diverge instead of
  // re-deriving the same answer from the same inputs.
  type PrevBlock = {
    type?: string;
    heading?: string;
    image?: string;
    productHandles?: string[];
  };
  const prev = (previousRow as { blocks?: PrevBlock[] } | null) ?? null;
  const previous_edition = prev
    ? {
        headings: (prev.blocks ?? [])
          .map((b) => b.heading)
          .filter((h): h is string => !!h)
          .slice(0, 8),
        hero_image: (prev.blocks ?? []).find((b) => b.type === "hero")?.image,
        used_handles: Array.from(
          new Set(
            (prev.blocks ?? [])
              .flatMap((b) => (b.type === "product_rail" ? b.productHandles ?? [] : []))
              .slice(0, 40),
          ),
        ),
      }
    : null;

  const signalPayload = {
    women_dresses_jumpsuits: womenDresses.slice(0, 12),
    women_skirts_knits_tops: womenSkirtsKnits.slice(0, 12),
    women_shoes: womenShoes.slice(0, 10),
    men_tailoring: menTailoring.slice(0, 12),
    men_shirts_knits: menShirtsKnits.slice(0, 12),
    men_shoes: menShoes.slice(0, 10),
    bags: bagsPool.slice(0, 12),
    accessories: accessoriesPool.slice(0, 12),
    new_arrivals: newArrivalsPool.slice(0, 12),
    trending_now: trendingProducts,
    top_brands: topBrands,
    top_search_queries: searchSignals.top_queries,
    unmet_search_demand: searchSignals.zero_result_queries,
    editorial_stories: EDITORIAL_ROUTES,
    hero_image_keys: HERO_IMAGE_POOL,
    banner_image_keys: BANNER_IMAGE_POOL,
    previous_edition,
    edition_nonce: `${new Date().toISOString()}-${Math.random().toString(36).slice(2, 8)}`,
  };

  const userPrompt = `You are composing the next 48-hour homepage edition for Palace of Roman.

Compose a JSON object that matches this exact shape and nothing else:

{
  "version": 1,
  "source": "claude",
  "blocks": [
    { "id": "hero", "type": "hero", "image": "<image_key>", "alt": "...", "heading": "...", "subheading": "...", "cta": { "label": "...", "href": "/collections/<handle>" } },
    { "id": "women-now", "type": "product_rail", "heading": "...", "subheading": "...", "productHandles": ["...","..."] },
    { "id": "editorial-feature", "type": "editorial_banner", "image": "<image_key>", "alt": "...", "heading": "...", "subheading": "...", "cta": { "label": "Read the story", "href": "<editorial href>" }, "hotspots": [] },
    { "id": "men-now", "type": "product_rail", "heading": "...", "subheading": "...", "productHandles": ["...","..."] },
    { "id": "accessories-edit", "type": "product_rail", "heading": "...", "subheading": "...", "productHandles": ["...","..."] },
    { "id": "trending-brands", "type": "product_rail", "heading": "...", "subheading": "...", "productHandles": ["...","..."] }
  ]
}

VARIETY RULES — these are non-negotiable, the renderer will drop rails that violate them:
- CROSS-RAIL UNIQUENESS: every productHandles entry across ALL rails combined MUST be unique. A handle that appears in "women-now" MUST NOT appear in "men-now", "accessories-edit", or "trending-brands". No exceptions.
- MIN 8 / MAX 10 unique handles per rail.
- women-now: pull primarily from women_dresses_jumpsuits, women_skirts_knits_tops, women_shoes. Mix at least 2 of those 3 buckets so the rail isn't just one product type.
- men-now: pull primarily from men_tailoring, men_shirts_knits, men_shoes. Mix at least 2 of those 3 buckets.
- accessories-edit: pull from bags + accessories. Do NOT reuse handles already in women-now or men-now.
- trending-brands: pull from trending_now first, then top up from new_arrivals — but skip any handle already used above.
- Each rail should represent at least 4 distinct vendors when the pool allows it (avoid stacking 6 Gucci pieces in one rail).
- Avoid repeating headings, hero image, or used_handles from previous_edition.headings/hero_image/used_handles — pick a different image_key and a different angle.

OTHER RULES:
- Every productHandles entry MUST be a handle from the signals JSON below — never invent.
- "image" on hero/banner MUST be one of the integer keys from hero_image_keys / banner_image_keys, returned as a string (e.g. "22").
- "cta.href" on the editorial banner MUST be one of editorial_stories[].href.
- Hero cta.href should link to /collections/women, /collections/men, /collections/new-arrivals or a real collection handle.
- Copy: editorial, restrained, curatorial. Headings ≤ 60 chars. Subheadings ≤ 160 chars. No emoji, no exclamation, no clichés, no fabricated reviews.
- "hotspots": leave as an empty array [].
- SEARCH SIGNALS: top_search_queries can influence framing. Reference at most one subtly in a subheading; never quote verbatim in a heading.
- UNMET DEMAND: do NOT mention zero-result queries in copy.
- Output ONLY the JSON object — no prose, no markdown.

Signals JSON:
${JSON.stringify(signalPayload, null, 2)}`;

  type RawBlock = Record<string, unknown>;
  type RawLayout = { version?: number; source?: string; blocks?: RawBlock[] };

  const raw = await callLlmJson<RawLayout>(
    {
      system: PALACE_BRAND_VOICE,
      user: userPrompt,
      maxTokens: 2800,
      temperature: 0.55,
    },
    { blocks: [] },
  );

  if (!raw.blocks || raw.blocks.length === 0) {
    throw new Error("LLM returned no blocks");
  }

  const normalizeImage = (val: unknown): string => {
    if (typeof val !== "string") return String(val ?? "");
    const m = val.match(/^\s*(\d+)\s*$/);
    if (m) return `library:${m[1]}`;
    return val;
  };

  // Resolve the right backfill pool for a given rail id, in priority order.
  const backfillPoolFor = (id: string): SignalProduct[] => {
    const lc = id.toLowerCase();
    if (lc.includes("women")) return [...womenPool, ...newArrivalsPool];
    if (lc.includes("men")) return [...menPool, ...newArrivalsPool];
    if (lc.includes("access") || lc.includes("bag"))
      return [...bagsPool, ...accessoriesPool];
    if (lc.includes("trend") || lc.includes("brand"))
      return [...trendingProducts, ...newArrivalsPool, ...bagsPool, ...accessoriesPool];
    if (lc.includes("new") || lc.includes("arrival"))
      return [...newArrivalsPool, ...womenPool, ...menPool];
    return [...newArrivalsPool, ...womenPool, ...menPool, ...bagsPool, ...accessoriesPool];
  };

  // HARD ENFORCEMENT of cross-rail uniqueness + min-per-rail. The model has
  // been known to ignore the rule, so we redo the job here deterministically.
  const usedHandles = new Set<string>();
  const MIN_PER_RAIL = 6;
  const MAX_PER_RAIL = 10;

  const cleanedBlocks = raw.blocks.map((b) => {
    const out: Record<string, unknown> = { ...b };
    if (b.type === "hero" || b.type === "editorial_banner") {
      out.image = normalizeImage(b.image);
      if (!out.alt || typeof out.alt !== "string") out.alt = "Palace of Roman editorial still";
    }
    if (b.type === "editorial_banner" && !Array.isArray((b as RawBlock).hotspots)) {
      out.hotspots = [];
    }
    if (b.type === "product_rail") {
      const rawHandles = Array.isArray((b as RawBlock).productHandles)
        ? ((b as RawBlock).productHandles as unknown[]).filter(
            (h): h is string => typeof h === "string" && h.length > 0,
          )
        : [];
      const seenInRail = new Set<string>();
      const kept: string[] = [];
      for (const h of rawHandles) {
        if (kept.length >= MAX_PER_RAIL) break;
        if (seenInRail.has(h) || usedHandles.has(h)) continue;
        // Must exist in the signal pool, otherwise the renderer would drop it.
        if (!allProducts.some((p) => p.handle === h)) continue;
        seenInRail.add(h);
        kept.push(h);
      }
      // Backfill from the right pool if the model under-delivered or
      // collided too heavily with earlier rails.
      if (kept.length < MIN_PER_RAIL) {
        const pool = backfillPoolFor(String((b as RawBlock).id ?? ""));
        for (const p of pool) {
          if (kept.length >= MAX_PER_RAIL) break;
          if (seenInRail.has(p.handle) || usedHandles.has(p.handle)) continue;
          seenInRail.add(p.handle);
          kept.push(p.handle);
        }
      }
      for (const h of kept) usedHandles.add(h);
      out.productHandles = kept;
    }
    return out;
  });

  return homepageLayoutSchema.parse({
    version: 1,
    generated_at: new Date().toISOString(),
    source: "claude",
    blocks: cleanedBlocks,
  });
}

async function buildNextLayout(): Promise<HomepageLayout> {
  try {
    return await buildAiLayout();
  } catch (err) {
    console.error("[refresh-homepage-layout] AI compose failed, using fallback:", err);
    return await buildFallbackLayout();
  }
}

export const Route = createFileRoute("/api/public/cron/refresh-homepage-layout")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const unauthorized = checkWebhookSecret(request);
        if (unauthorized) return unauthorized;

        const now = new Date();
        const url = new URL(request.url);
        const previewMode = url.searchParams.get("preview") === "true";
        const forceMode = url.searchParams.get("force") === "true";

        // PREVIEW MODE: build a fresh layout and insert as pending/inactive.
        // Does not touch the currently active edition.
        if (previewMode) {
          const previewLayout = await buildNextLayout();
          const { data: inserted, error: insertErr } = await supabaseAdmin
            .from("homepage_daily_layout")
            .insert({
              layout_json: previewLayout as never,
              is_active: false,
              status: "staged",
              generated_at: new Date().toISOString(),
            })
            .select("id")
            .single();
          if (insertErr) {
            console.error("[refresh-homepage-layout] preview insert failed:", insertErr);
            await logHomepageAudit({
              action: "generation_failed",
              actor: "cron",
              details: { stage: "preview_insert", error: insertErr.message },
            });
            return Response.json({ error: "insert_failed" }, { status: 500 });
          }
          await logHomepageAudit({
            action: "preview_generated",
            edition_id: inserted.id,
            actor: "cron",
            details: { source: previewLayout.source, block_count: previewLayout.blocks.length },
          });
          return Response.json({
            action: "preview_created",
            new_layout_id: inserted.id,
            block_count: previewLayout.blocks.length,
            source: previewLayout.source,
          });
        }

        // 1. Load the currently active layout (if any).
        const { data: activeRow } = await supabaseAdmin
          .from("homepage_daily_layout")
          .select("id, generated_at")
          .eq("is_active", true)
          .order("generated_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        // 2. If we have an active layout, evaluate the guardrail before wiping.
        if (activeRow?.generated_at) {
          const activeSince = new Date(activeRow.generated_at);
          const ageMs = now.getTime() - activeSince.getTime();

          if (!forceMode && ageMs < CYCLE_MS) {
            return Response.json({
              action: "skipped",
              reason: "cycle_not_elapsed",
              age_hours: +(ageMs / 3.6e6).toFixed(2),
            });
          }

          const baselineUntil = activeSince;
          const baselineSince = new Date(
            baselineUntil.getTime() - BASELINE_WINDOW_DAYS * 24 * 60 * 60 * 1000,
          );
          const [current, baseline] = await Promise.all([
            computeWindowStats(activeSince, now),
            computeWindowStats(baselineSince, baselineUntil),
          ]);

          const isOutperforming =
            baseline.rate > 0 &&
            current.sessions >= MIN_CURRENT_SIGNAL &&
            current.rate >= baseline.rate * OUTPERFORM_THRESHOLD;

          if (isOutperforming) {
            const extendsUntil = new Date(now.getTime() + EXTENSION_MS);
            console.log(
              `[refresh-homepage-layout] extending viral edition ${activeRow.id} ` +
                `(current rate ${current.rate.toFixed(4)} vs baseline ${baseline.rate.toFixed(4)}, ` +
                `+${(((current.rate - baseline.rate) / baseline.rate) * 100).toFixed(1)}%)`,
            );
            return Response.json({
              action: "extended",
              layout_id: activeRow.id,
              extends_until: extendsUntil.toISOString(),
              current,
              baseline,
              lift_pct: ((current.rate - baseline.rate) / baseline.rate) * 100,
            });
          }
        }

        // 3. Proceed with atomic swap.
        const nextLayout = await buildNextLayout();

        const { data: inserted, error: insertErr } = await supabaseAdmin
          .from("homepage_daily_layout")
          .insert({
            layout_json: nextLayout as never,
            is_active: false,
            status: "staged",
            generated_at: new Date().toISOString(),
          })
          .select("id")
          .single();
        if (insertErr) {
            console.error("[refresh-homepage-layout] staged insert failed:", insertErr);
          await logHomepageAudit({
            action: "generation_failed",
            actor: "cron",
            details: { stage: "staged_insert", error: insertErr.message },
          });
          return Response.json({ error: "insert_failed" }, { status: 500 });
        }

        const { error: deactivateErr } = await supabaseAdmin
          .from("homepage_daily_layout")
          .update({ is_active: false, status: "archived" })
          .eq("is_active", true)
          .neq("id", inserted.id);
        if (deactivateErr) {
          console.error("[refresh-homepage-layout] deactivate failed:", deactivateErr);
          await logHomepageAudit({
            action: "generation_failed",
            edition_id: inserted.id,
            actor: "cron",
            details: { stage: "deactivate", error: deactivateErr.message },
          });
          return Response.json({ error: "deactivate_failed", staged_layout_id: inserted.id }, { status: 500 });
        }

        const { error: activateErr } = await supabaseAdmin
          .from("homepage_daily_layout")
          .update({ is_active: true, status: "active" })
          .eq("id", inserted.id);
        if (activateErr) {
          console.error("[refresh-homepage-layout] activate new layout failed:", activateErr);
          await logHomepageAudit({
            action: "generation_failed",
            edition_id: inserted.id,
            actor: "cron",
            details: { stage: "activate", error: activateErr.message },
          });
          return Response.json({ error: "activate_failed" }, { status: 500 });
        }

        await logHomepageAudit({
          action: "generated",
          edition_id: inserted.id,
          actor: "cron",
          details: {
            previous_layout_id: activeRow?.id ?? null,
            source: nextLayout.source,
            block_count: nextLayout.blocks.length,
            forced: forceMode,
          },
        });
        if (activeRow?.id) {
          await logHomepageAudit({
            action: "archived",
            edition_id: activeRow.id,
            actor: "cron",
            details: { replaced_by: inserted.id },
          });
        }

        return Response.json({
          action: "swapped",
          previous_layout_id: activeRow?.id ?? null,
          new_layout_id: inserted.id,
          block_count: nextLayout.blocks.length,
          source: nextLayout.source,
        });
      },
    },
  },
});
