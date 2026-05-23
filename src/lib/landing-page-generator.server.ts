// Server-only landing-page autopilot. Every cron cycle this:
//
//   1. OFFENSIVE SIGNAL — search-query spikes (>=5 distinct searches for
//      the same term in the last 48h). Priority score = velocity.
//   2. DEFENSIVE SIGNAL — collection page-views > 100 in 48h with an
//      add-to-cart rate below 2%. Priority score = views * (target - rate).
//
// Whichever signal scores highest wins; the loser is skipped this cycle.
// The winning directive is passed to the AI which returns a landing-page
// blueprint. The blueprint is validated, then atomically swapped into
// `dynamic_landing_pages` (stage -> archive prior -> promote).
//
// Linked from homepage tiles only (never the main nav).

import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { callAi } from "@/lib/ai-gateway.server";
import { fetchProducts, fetchProductByHandle } from "@/lib/shopify";
import { isAllowedLuxuryBrand } from "@/lib/nav-config";
import {
  LandingPageBlueprintSchema,
  type LandingPageBlueprint,
} from "@/lib/landing-page-schema";

const SEARCH_MIN_HITS = 5;
const COLLECTION_MIN_VIEWS = 100;
const COLLECTION_ATC_THRESHOLD = 0.02; // 2 %

type SearchSpike = {
  kind: "search_spike";
  term: string;
  hits: number;
  score: number;
};

type ConversionDrop = {
  kind: "conversion_drop";
  collectionHandle: string;
  views: number;
  atcRate: number;
  score: number;
};

type Signal = SearchSpike | ConversionDrop;

// ---------- signal collection ----------

async function detectSearchSpike(): Promise<SearchSpike | null> {
  const since = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabaseAdmin
    .from("search_queries")
    .select("query")
    .gte("created_at", since)
    .limit(5000);
  if (error || !data) return null;

  const counts = new Map<string, number>();
  for (const row of data) {
    const q = (row.query ?? "").trim().toLowerCase();
    if (q.length < 2 || q.length > 80) continue;
    counts.set(q, (counts.get(q) ?? 0) + 1);
  }

  let best: SearchSpike | null = null;
  for (const [term, hits] of counts) {
    if (hits < SEARCH_MIN_HITS) continue;
    // Velocity score: hits squared rewards concentration over spread.
    const score = hits * hits;
    if (!best || score > best.score) {
      best = { kind: "search_spike", term, hits, score };
    }
  }
  return best;
}

async function detectConversionDrop(): Promise<ConversionDrop | null> {
  const since = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();

  // Collection page views — pdp/collection impressions live in interaction_events.page_path
  const { data: views } = await supabaseAdmin
    .from("interaction_events")
    .select("page_path")
    .gte("created_at", since)
    .like("page_path", "/collections/%")
    .limit(20000);

  const viewsByHandle = new Map<string, number>();
  for (const row of views ?? []) {
    const p = row.page_path as string | null;
    if (!p) continue;
    const m = p.match(/^\/collections\/([^/?#]+)/);
    if (!m) continue;
    const h = m[1];
    viewsByHandle.set(h, (viewsByHandle.get(h) ?? 0) + 1);
  }

  // Cart adds in the same window, grouped by collection page they came from.
  const { data: carts } = await supabaseAdmin
    .from("cart_events")
    .select("page_path, event_type")
    .gte("created_at", since)
    .eq("event_type", "add_to_cart")
    .like("page_path", "/collections/%")
    .limit(20000);

  const atcByHandle = new Map<string, number>();
  for (const row of carts ?? []) {
    const p = row.page_path as string | null;
    if (!p) continue;
    const m = p.match(/^\/collections\/([^/?#]+)/);
    if (!m) continue;
    const h = m[1];
    atcByHandle.set(h, (atcByHandle.get(h) ?? 0) + 1);
  }

  let best: ConversionDrop | null = null;
  for (const [handle, v] of viewsByHandle) {
    if (v < COLLECTION_MIN_VIEWS) continue;
    const atc = atcByHandle.get(handle) ?? 0;
    const rate = atc / v;
    if (rate >= COLLECTION_ATC_THRESHOLD) continue;
    const drop = COLLECTION_ATC_THRESHOLD - rate;
    const score = v * drop * 50; // tune so comparable to search-spike scores
    if (!best || score > best.score) {
      best = { kind: "conversion_drop", collectionHandle: handle, views: v, atcRate: rate, score };
    }
  }
  return best;
}

// ---------- candidate pools ----------

async function poolForSearchTerm(term: string) {
  const edges = await fetchProducts({ first: 24, query: term });
  return edges
    .map((e) => e.node)
    .filter((n) => !n.vendor || isAllowedLuxuryBrand(n.vendor));
}

async function poolForCollection(handle: string) {
  const edges = await fetchProducts({ first: 24, query: `tag:${handle} OR product_type:${handle}` });
  let nodes = edges.map((e) => e.node).filter((n) => !n.vendor || isAllowedLuxuryBrand(n.vendor));
  if (nodes.length < 6) {
    const fallback = await fetchProducts({ first: 24, sortKey: "BEST_SELLING" });
    for (const e of fallback) {
      const n = e.node;
      if (n.vendor && !isAllowedLuxuryBrand(n.vendor)) continue;
      if (!nodes.some((x) => x.handle === n.handle)) nodes.push(n);
    }
  }
  return nodes;
}

// ---------- AI prompt ----------

const SYSTEM_PROMPT = `You are the Creative Director for Palace of Roman, an editorial luxury fashion boutique. You generate hyper-targeted landing pages that capture demand or salvage stalling conversions.

Voice: curatorial, restrained, confident, no exclamation marks, no emojis, no "shop now" filler.

Rules:
- ALL product handles MUST come from the candidate list. Never invent handles.
- 1 to 3 sections, each 3-6 products, each with a distinct angle.
- For "search_spike": the page should feel like a fresh trend-driven edit named after the term.
- For "conversion_drop": completely re-merchandise the collection — fresh angle, different copy, re-prioritise products. Treat it as a recovery edit.
- accents.bg / fg / accent must be WCAG-readable hex pairs that match the mood.

Return ONLY this JSON shape:
{
  "page_title": string,
  "meta_description": string,
  "hero": { "eyebrow": string, "headline": string, "subcopy": string, "cta": string },
  "accents": { "bg": "#rrggbb", "fg": "#rrggbb", "accent": "#rrggbb", "font_pair": one of [cormorant-karla, instrument-serif-work-sans, dm-serif-display-fira-sans, libre-baskerville-ibm-plex, space-grotesk-dm-sans, syne-plus-jakarta] },
  "sections": [ { "id": string, "title": string, "blurb": string, "handles": [string, ...] } ]
}`;

function buildUserPrompt(signal: Signal, pool: Array<{ handle: string; vendor: string | null; title: string; productType: string | null; priceRange?: { minVariantPrice: { amount: string } } }>) {
  const lines = pool.map(
    (n, i) =>
      `${i + 1}. ${n.handle} | ${n.vendor ?? "?"} | ${n.title} | ${n.productType ?? "?"} | $${
        n.priceRange?.minVariantPrice?.amount
          ? Math.round(parseFloat(n.priceRange.minVariantPrice.amount))
          : "?"
      }`,
  );

  const directive =
    signal.kind === "search_spike"
      ? `OFFENSIVE / SEARCH SPIKE — visitors searched "${signal.term}" ${signal.hits} times in the last 48h. Build a trend-focused landing page named around that term to capture the high-intent traffic before it cools.`
      : `DEFENSIVE / CONVERSION DROP — the /collections/${signal.collectionHandle} page got ${signal.views} views with only ${(signal.atcRate * 100).toFixed(2)}% add-to-cart rate. Re-merchandise it: fresh editorial angle, different section hierarchy, reorder the products to recover stalling conversions.`;

  return `${directive}\n\nCandidate products (handle | brand | title | category | price):\n\n${lines.join("\n")}\n\nReturn the JSON blueprint only.`;
}

// ---------- main ----------

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export type LandingGenerationResult = {
  id: string;
  slug: string;
  signal: "search_spike" | "conversion_drop";
  sourceTerm: string;
  score: number;
};

export async function generateDynamicLandingPage(): Promise<LandingGenerationResult | null> {
  const [search, drop] = await Promise.all([detectSearchSpike(), detectConversionDrop()]);

  const winner: Signal | null =
    search && drop ? (search.score >= drop.score ? search : drop) : (search ?? drop ?? null);
  if (!winner) {
    console.log("[landing-gen] no qualifying signal this cycle");
    return null;
  }

  const sourceTerm = winner.kind === "search_spike" ? winner.term : winner.collectionHandle;
  const slug =
    winner.kind === "search_spike"
      ? `trend-${slugify(sourceTerm)}`
      : `${slugify(sourceTerm)}-edit`;

  const pool =
    winner.kind === "search_spike"
      ? await poolForSearchTerm(winner.term)
      : await poolForCollection(winner.collectionHandle);

  if (pool.length < 4) {
    console.log("[landing-gen] candidate pool too thin", { signal: winner, pool: pool.length });
    return null;
  }

  const ai = await callAi({
    module: "landing-page",
    model: "google/gemini-2.5-flash",
    system: SYSTEM_PROMPT,
    user: buildUserPrompt(winner, pool),
    json: true,
    temperature: 0.85,
    maxTokens: 1400,
  });

  let parsed: unknown;
  try {
    const cleaned = ai.content.replace(/^```json\s*|^```\s*|```$/gm, "").trim();
    parsed = JSON.parse(cleaned);
  } catch (err) {
    throw new Error(`AI returned non-JSON: ${(err as Error).message}`);
  }

  const validated = LandingPageBlueprintSchema.parse(parsed);

  // Enforce handle allowlist
  const allowed = new Set(pool.map((n) => n.handle));
  const filtered: LandingPageBlueprint = {
    ...validated,
    sections: validated.sections
      .map((s) => ({ ...s, handles: s.handles.filter((h) => allowed.has(h)).slice(0, 6) }))
      .filter((s) => s.handles.length >= 2),
  };
  if (filtered.sections.length < 1) {
    throw new Error("AI produced no sections with valid handles after allowlist filter");
  }

  // Verify at least one handle resolves on Shopify so the page isn't empty.
  const firstHandle = filtered.sections[0].handles[0];
  const probe = await fetchProductByHandle(firstHandle).catch(() => null);
  if (!probe) {
    throw new Error(`Could not verify any landing-page product (${firstHandle})`);
  }

  // ATOMIC SWAP: insert staged, archive prior active for this slug, promote.
  const { data: inserted, error: insertErr } = await supabaseAdmin
    .from("dynamic_landing_pages")
    .insert({
      slug,
      signal_type: winner.kind,
      source_term: sourceTerm,
      priority_score: winner.score,
      blueprint_json: JSON.parse(JSON.stringify(filtered)),
      status: "staged",
      expires_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    })
    .select("id")
    .single();

  if (insertErr || !inserted) {
    throw new Error(`Failed to stage landing page: ${insertErr?.message ?? "unknown"}`);
  }

  await supabaseAdmin
    .from("dynamic_landing_pages")
    .update({ status: "archived" })
    .eq("slug", slug)
    .eq("status", "active");

  const { error: promoteErr } = await supabaseAdmin
    .from("dynamic_landing_pages")
    .update({ status: "active" })
    .eq("id", inserted.id);

  if (promoteErr) {
    await supabaseAdmin
      .from("dynamic_landing_pages")
      .update({ status: "archived" })
      .eq("id", inserted.id);
    throw new Error(`Failed to promote landing page: ${promoteErr.message}`);
  }

  return {
    id: inserted.id,
    slug,
    signal: winner.kind,
    sourceTerm,
    score: winner.score,
  };
}
