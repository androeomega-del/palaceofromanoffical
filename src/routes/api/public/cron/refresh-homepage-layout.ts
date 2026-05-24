import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { fetchProducts } from "@/lib/shopify";
import {
  homepageLayoutSchema,
  type HomepageLayout,
} from "@/lib/homepage-layout-schema";
import { callLlmJson } from "@/lib/llm.server";
import { PALACE_BRAND_VOICE } from "@/lib/brand-voice";

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
        id: "best-sellers",
        type: "product_rail",
        heading: "Best sellers — restocked",
        productHandles: products.map((p) => p.handle).slice(0, 12),
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
  const [women, men, accessories, trending] = await Promise.all([
    safeFetch("tag:women OR product_type:Dress OR product_type:Skirt", 16),
    safeFetch("tag:men OR product_type:Suit OR product_type:Shirt", 16),
    safeFetch("product_type:Bag OR product_type:Shoes OR product_type:Accessories", 12),
    pullTrendingHandles(),
  ]);

  // Bail out to fallback if Shopify is empty — Claude has nothing to anchor to.
  if (women.length === 0 && men.length === 0) {
    throw new Error("no shopify signals — fall back");
  }

  const trendingProducts = trending
    .map((h) => [...women, ...men, ...accessories].find((p) => p.handle === h))
    .filter((p): p is SignalProduct => !!p)
    .slice(0, 8);

  const brandTally = new Map<string, number>();
  for (const p of [...women, ...men, ...accessories]) {
    if (p.vendor) brandTally.set(p.vendor, (brandTally.get(p.vendor) ?? 0) + 1);
  }
  const topBrands = [...brandTally.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([v]) => v);

  const signalPayload = {
    women: women.slice(0, 12),
    men: men.slice(0, 12),
    accessories: accessories.slice(0, 8),
    trending_now: trendingProducts,
    top_brands: topBrands,
    editorial_stories: EDITORIAL_ROUTES,
    hero_image_keys: HERO_IMAGE_POOL,
    banner_image_keys: BANNER_IMAGE_POOL,
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
    { "id": "trending-brands", "type": "product_rail", "heading": "...", "subheading": "...", "productHandles": ["...","..."] }
  ]
}

Rules:
- Every productHandles entry MUST be a handle from the signals JSON below — never invent.
- Each rail: 6–10 handles, no duplicates within a rail.
- "image" on hero/banner MUST be one of the integer keys from hero_image_keys / banner_image_keys, returned as a string (e.g. "22").
- "cta.href" on the editorial banner MUST be one of editorial_stories[].href.
- Hero cta.href should link to /collections/women, /collections/men, /collections/new-arrivals or a real collection handle.
- Copy: editorial, restrained, curatorial. Headings ≤ 60 chars. Subheadings ≤ 160 chars. No emoji, no exclamation, no clichés, no fabricated reviews.
- "hotspots": leave as an empty array [].
- Output ONLY the JSON object — no prose, no markdown.

Signals JSON:
${JSON.stringify(signalPayload, null, 2)}`;

  type RawBlock = Record<string, unknown>;
  type RawLayout = { version?: number; source?: string; blocks?: RawBlock[] };

  const raw = await callLlmJson<RawLayout>(
    {
      system: PALACE_BRAND_VOICE,
      user: userPrompt,
      maxTokens: 2200,
      temperature: 0.4,
    },
    { blocks: [] },
  );

  if (!raw.blocks || raw.blocks.length === 0) {
    throw new Error("LLM returned no blocks");
  }

  // Resolve numeric/string image keys to URLs the frontend already understands.
  // Editorial library files live at src/assets/editorial/library/<n>.png and are
  // bundled by Vite — the renderer resolves the same key range via img(n).
  // We store the raw key string in layout_json so the frontend can call img().
  // Convert image keys to a normalized "library:<n>" token so the renderer can
  // distinguish them from external URLs in the future without breaking schema.
  const normalizeImage = (val: unknown): string => {
    if (typeof val !== "string") return String(val ?? "");
    const m = val.match(/^\s*(\d+)\s*$/);
    if (m) return `library:${m[1]}`;
    return val;
  };

  const cleanedBlocks = raw.blocks.map((b) => {
    const out: Record<string, unknown> = { ...b };
    if (b.type === "hero" || b.type === "editorial_banner") {
      out.image = normalizeImage(b.image);
      if (!out.alt || typeof out.alt !== "string") out.alt = "Palace of Roman editorial still";
    }
    if (b.type === "editorial_banner" && !Array.isArray((b as RawBlock).hotspots)) {
      out.hotspots = [];
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
        const now = new Date();
        const url = new URL(request.url);
        const previewMode = url.searchParams.get("preview") === "true";

        // PREVIEW MODE: build a fresh layout and insert as pending/inactive.
        // Does not touch the currently active edition.
        if (previewMode) {
          const previewLayout = await buildNextLayout();
          const { data: inserted, error: insertErr } = await supabaseAdmin
            .from("homepage_daily_layout")
            .insert({
              layout_json: previewLayout as never,
              is_active: false,
              status: "pending",
              generated_at: new Date().toISOString(),
            })
            .select("id")
            .single();
          if (insertErr) {
            console.error("[refresh-homepage-layout] preview insert failed:", insertErr);
            return Response.json({ error: "insert_failed" }, { status: 500 });
          }
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

          if (ageMs < CYCLE_MS) {
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

        const { error: deactivateErr } = await supabaseAdmin
          .from("homepage_daily_layout")
          .update({ is_active: false, status: "archived" })
          .eq("is_active", true);
        if (deactivateErr) {
          console.error("[refresh-homepage-layout] deactivate failed:", deactivateErr);
          return Response.json({ error: "deactivate_failed" }, { status: 500 });
        }

        const { data: inserted, error: insertErr } = await supabaseAdmin
          .from("homepage_daily_layout")
          .insert({
            layout_json: nextLayout as never,
            is_active: true,
            status: "active",
            generated_at: new Date().toISOString(),
          })
          .select("id")
          .single();
        if (insertErr) {
          console.error("[refresh-homepage-layout] insert failed:", insertErr);
          return Response.json({ error: "insert_failed" }, { status: 500 });
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
