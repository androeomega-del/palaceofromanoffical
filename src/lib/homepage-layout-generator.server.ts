// Server-only generator: pulls 48h velocity signal, asks the AI Creative
// Director for a fresh editorial blueprint, validates it, and writes the
// new active row into `homepage_daily_layout`.
//
// Called by the cron route (every 48h) and by the admin "Run now" button.

import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { callAi } from "@/lib/ai-gateway.server";
import { fetchProductByHandle } from "@/lib/shopify";
import { isAllowedLuxuryBrand } from "@/lib/nav-config";
import { HomepageLayoutSchema, type HomepageLayout } from "@/lib/homepage-layout-schema";

const EVENT_WEIGHTS: Record<string, number> = {
  impression: 0.1,
  hover: 0.5,
  click: 1,
  pdp_view: 2,
  wishlist: 3,
  cart: 5,
};

type Candidate = {
  handle: string;
  vendor?: string | null;
  score: number;
  title?: string;
  productType?: string;
  priceUsd?: string;
  tags?: string[];
};

async function getVelocityCandidates(limit = 30): Promise<Candidate[]> {
  const since = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabaseAdmin
    .from("interaction_events")
    .select("handle, vendor, event_type, product_type")
    .gte("created_at", since)
    .limit(5000);

  if (error) {
    console.error("[homepage-gen] interaction_events query failed:", error.message);
    return [];
  }

  const scores = new Map<string, Candidate>();
  for (const row of data ?? []) {
    const w = EVENT_WEIGHTS[row.event_type as string] ?? 0;
    if (!w || !row.handle) continue;
    const prev = scores.get(row.handle) ?? {
      handle: row.handle,
      vendor: row.vendor,
      productType: row.product_type ?? undefined,
      score: 0,
    };
    prev.score += w;
    scores.set(row.handle, prev);
  }

  return [...scores.values()].sort((a, b) => b.score - a.score).slice(0, limit);
}

async function hydrateCandidates(cands: Candidate[]): Promise<Candidate[]> {
  const results = await Promise.allSettled(
    cands.map(async (c) => {
      // Fast path: candidate already carries the fields we need (e.g. came
      // from the Shopify fallback). Skip the per-handle round-trip — that
      // call sometimes fails under load and was starving the generator.
      if (c.title && c.vendor && c.priceUsd) {
        if (c.vendor && !isAllowedLuxuryBrand(c.vendor)) return null;
        return c;
      }
      try {
        const node = await fetchProductByHandle(c.handle);
        if (!node) return null;
        const vendor = node.vendor ?? c.vendor ?? undefined;
        if (vendor && !isAllowedLuxuryBrand(vendor)) return null;
        const price = node.priceRange?.minVariantPrice?.amount;
        return {
          ...c,
          vendor,
          title: node.title,
          productType: node.productType ?? c.productType,
          priceUsd: price ? String(Math.round(parseFloat(price))) : undefined,
        } satisfies Candidate;
      } catch (e) {
        console.warn(`[homepage-gen] hydrate failed for ${c.handle}:`, (e as Error).message);
        return null;
      }
    }),
  );

  const hydrated: Candidate[] = [];
  for (const r of results) {
    if (r.status === "fulfilled" && r.value) hydrated.push(r.value);
  }
  return hydrated;
}

// Cold-start fallback: if velocity data is thin, pull a few best-selling
// products so the AI has something to riff on.
async function fallbackCandidates(): Promise<Candidate[]> {
  const { fetchProducts } = await import("@/lib/shopify");
  const edges = await fetchProducts({ first: 24, sortKey: "BEST_SELLING" });
  const out: Candidate[] = [];
  for (const e of edges) {
    const n = e.node;
    if (n.vendor && !isAllowedLuxuryBrand(n.vendor)) continue;
    out.push({
      handle: n.handle,
      vendor: n.vendor,
      score: 0.1,
      title: n.title,
      productType: n.productType,
      priceUsd: n.priceRange?.minVariantPrice?.amount
        ? String(Math.round(parseFloat(n.priceRange.minVariantPrice.amount)))
        : undefined,
    });
  }
  return out;
}

const SYSTEM_PROMPT = `You are the Creative Director and Storefront Designer for Palace of Roman, an editorial luxury fashion boutique. Every 48 hours you invent a fresh edition that morphs the homepage.

Your job: pick a cohesive thematic edition (e.g. "Sleek Brutalism", "Resort Modernist Drop", "Quiet Power Suiting", "Noir Velvet Hour", "Riviera Heatwave"). Then design a homepage blueprint built ENTIRELY around that theme using ONLY the products provided.

Voice: curatorial, restrained, confident, no exclamation marks, no emojis, no "shop now" filler. Think Vogue Runway editorial copy.

Rules:
- ALL product handles you use MUST come from the candidate list. Never invent handles.
- Three sections, each with a distinct angle on the edition (e.g. "Sharp Tailoring" / "Soft Counterpoint" / "Closing Statement"). 3-6 products per section.
- Hero copy must reference the edition theme, not generic luxury filler.
- Accents: pick hex colors that match the edition mood. \`bg\` is the section background, \`fg\` is the text on it, \`accent\` is the highlight. Ensure WCAG-readable contrast between bg and fg.
- font_pair: pick from the enum. Match the mood.
- Return ONLY the JSON object, no commentary.

Schema:
{
  "edition_name": string,
  "hero": { "eyebrow": string, "headline": string, "subcopy": string, "cta": string },
  "accents": { "bg": "#rrggbb", "fg": "#rrggbb", "accent": "#rrggbb", "font_pair": one of [cormorant-karla, instrument-serif-work-sans, dm-serif-display-fira-sans, libre-baskerville-ibm-plex, space-grotesk-dm-sans, syne-plus-jakarta], "texture": one of [grain, gloss, matte, none] },
  "sections": [ { "id": string, "title": string, "blurb": string, "handles": [string, ...] }, x3 ],
  "layout_order": ["hero", "<section-id>", "<section-id>", "<section-id>"]
}`;

function buildUserPrompt(cands: Candidate[]): string {
  const lines = cands.map(
    (c, i) =>
      `${i + 1}. ${c.handle} | ${c.vendor ?? "?"} | ${c.title ?? "?"} | ${c.productType ?? "?"} | $${c.priceUsd ?? "?"}`,
  );
  return `Top-performing products over the last 48 hours (handle | brand | title | category | price):\n\n${lines.join("\n")}\n\nDesign the next 48-hour edition. Return the JSON blueprint only.`;
}

function enforceHandleAllowlist(layout: HomepageLayout, allowed: Set<string>): HomepageLayout {
  return {
    ...layout,
    sections: layout.sections.map((s) => ({
      ...s,
      handles: s.handles.filter((h) => allowed.has(h)).slice(0, 6),
    })),
  };
}

export type GenerationResult = {
  layoutId: string;
  editionName: string;
  sectionsKept: number;
  totalHandles: number;
};

export async function generateHomepageLayout(): Promise<GenerationResult> {
  let cands = await getVelocityCandidates(30);
  if (cands.length < 8) {
    const extra = await fallbackCandidates();
    const seen = new Set(cands.map((c) => c.handle));
    for (const c of extra) {
      if (!seen.has(c.handle)) cands.push(c);
    }
  }
  const hydrated = await hydrateCandidates(cands.slice(0, 30));
  if (hydrated.length < 6) {
    // Last resort: use fallback alone
    hydrated.push(...(await hydrateCandidates(await fallbackCandidates())));
  }
  if (hydrated.length < 6) {
    throw new Error("Not enough valid candidate products to generate a homepage layout.");
  }

  const allowed = new Set(hydrated.map((c) => c.handle));

  const ai = await callAi({
    module: "homepage-layout",
    model: "google/gemini-2.5-flash",
    system: SYSTEM_PROMPT,
    user: buildUserPrompt(hydrated.slice(0, 24)),
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

  const validated = HomepageLayoutSchema.parse(parsed);
  const filtered = enforceHandleAllowlist(validated, allowed);

  const kept = filtered.sections.filter((s) => s.handles.length >= 2);
  if (kept.length < 3) {
    throw new Error(`AI produced too few valid handles after allowlist filtering (kept ${kept.length}/3).`);
  }

  // Deactivate prior rows, insert the new active row.
  await supabaseAdmin
    .from("homepage_daily_layout")
    .update({ is_active: false })
    .eq("is_active", true);

  const { data: inserted, error: insertErr } = await supabaseAdmin
    .from("homepage_daily_layout")
    .insert({
      layout_json: JSON.parse(JSON.stringify(filtered)),
      is_active: true,
      generated_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (insertErr || !inserted) {
    throw new Error(`Failed to persist layout: ${insertErr?.message ?? "unknown"}`);
  }

  return {
    layoutId: inserted.id,
    editionName: filtered.edition_name,
    sectionsKept: kept.length,
    totalHandles: kept.reduce((s, x) => s + x.handles.length, 0),
  };
}
