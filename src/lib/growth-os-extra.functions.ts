/**
 * Growth OS — Waves 3 + 4.
 *
 *  Wave 3 — Lifecycle Autopilot + UGC Studio
 *    - generateEmailFlow:  full multi-step email sequence (welcome, abandoned, post-purchase, win-back, VIP)
 *    - generateUgcBrief:   HeyGen-style avatar script + b-roll/shot list for a product
 *
 *  Wave 4 — SEO Content Factory + Ad Forge
 *    - generateSeoPage:   programmatic SEO landing page targeting a long-tail query
 *    - generateAdCreative: paid-social ad set (Meta + TikTok + Pinterest) with 6 angles
 *
 * All outputs land in content_queue as `draft`. Admin approves → status flips
 * to `approved` (auto-dispatch to email/ads platforms is wired once those
 * connectors are linked; for now admin copies & pastes / hands off).
 */

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { callAi, BudgetExceededError } from "@/lib/ai-gateway.server";
import { PALACE_BRAND_VOICE, PALACE_DOMAIN } from "@/lib/brand-voice";

// ── Shared helpers ─────────────────────────────────────────────────────────
async function pickInStockProduct(handle?: string) {
  let q = supabaseAdmin
    .from("bg_products")
    .select("handle, name, brand, category, subcategory, retail_price, currency, main_picture, description_plain")
    .eq("in_stock", true)
    .gt("total_stock", 0);
  if (handle) q = q.eq("handle", handle);
  else q = q.order("modified_at", { ascending: false, nullsFirst: false }).limit(30);
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  const rows = data ?? [];
  if (rows.length === 0) throw new Error("No in-stock product available");
  const p = handle ? rows[0] : rows[Math.floor(Math.random() * rows.length)];
  return {
    handle: p.handle,
    title: p.name ?? "Untitled",
    brand: p.brand,
    category: [p.category, p.subcategory].filter(Boolean).join(" / "),
    priceUsd: p.currency === "EUR" && p.retail_price ? Math.round(Number(p.retail_price) * 1.08) : Number(p.retail_price ?? 0),
    image: p.main_picture,
    blurb: (p.description_plain ?? "").slice(0, 320),
  };
}

async function insertQueueRow(row: {
  kind: string;
  channel: string;
  title: string;
  cost_cents: number;
  payload: Record<string, unknown>;
}) {
  // payload is JSONB on the server; cast through unknown to satisfy the
  // generated `Json` recursive type which doesn't accept Record<string, unknown> directly.
  const insertRow = {
    kind: row.kind,
    channel: row.channel,
    title: row.title,
    cost_cents: row.cost_cents,
    payload: row.payload as unknown as never,
    status: "draft",
  };
  const { data, error } = await supabaseAdmin
    .from("content_queue")
    .insert(insertRow)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

// ─── Wave 3a: Lifecycle Autopilot ──────────────────────────────────────────
const EMAIL_FLOW_TYPES = ["welcome", "abandoned_cart", "post_purchase", "win_back", "vip_invite"] as const;
type EmailFlowType = typeof EMAIL_FLOW_TYPES[number];

const FLOW_PROMPTS: Record<EmailFlowType, string> = {
  welcome: "A 3-email welcome series for a new newsletter subscriber. Step 1: brand intro + 10% welcome dispatch. Step 2 (day 2): editorial — what we curate, why. Step 3 (day 5): hero product reveal + soft CTA.",
  abandoned_cart: "A 3-email abandoned cart recovery series. Step 1 (1h): gentle reminder, no discount. Step 2 (24h): social proof + product-specific reassurance. Step 3 (72h): final nudge with 10% code.",
  post_purchase: "A 4-email post-purchase series. Step 1: order confirmed warmth. Step 2 (day 3): care/styling guide. Step 3 (day 14): cross-sell editorial. Step 4 (day 30): review request.",
  win_back: "A 2-email win-back for customers who haven't opened in 90 days. Step 1: 'we miss you' editorial + new arrivals. Step 2 (5 days later): 15% reactivation code.",
  vip_invite: "A 1-email VIP tier invitation for customers with 2+ orders or $1000+ LTV. Frame as private access, not loyalty points.",
};

export const generateEmailFlow = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((d: { flow?: EmailFlowType } | undefined) =>
    z.object({ flow: z.enum(EMAIL_FLOW_TYPES).optional() }).parse(d ?? {})
  )
  .handler(async ({ data }) => {
    const flow = data.flow ?? EMAIL_FLOW_TYPES[Math.floor(Math.random() * EMAIL_FLOW_TYPES.length)];
    const seed = await pickInStockProduct().catch(() => null);

    const userPrompt = `Write a complete lifecycle email flow for Palace of Roman.

Flow type: ${flow}
Brief: ${FLOW_PROMPTS[flow]}

${seed ? `Optional anchor product (use real handle ${seed.handle}, link ${PALACE_DOMAIN}/product/${seed.handle}): ${seed.brand ?? ""} ${seed.title} — ~$${seed.priceUsd}` : ""}

Return strict JSON:
{
  "flowName": "string",
  "steps": [
    {
      "delay": "string (e.g. 'immediately', '24h', 'day 3')",
      "subject": "string (under 55 chars, no emoji)",
      "preheader": "string (under 90 chars)",
      "bodyHtml": "<p>…</p> (semantic HTML, 120-260 words, editorial voice, one clear CTA button described inline as a [CTA: label → url])"
    }
  ]
}`;

    let result;
    try {
      result = await callAi({
        module: "lifecycle",
        model: "google/gemini-2.5-flash-lite",
        system: PALACE_BRAND_VOICE,
        user: userPrompt,
        json: true,
        maxTokens: 3000,
        temperature: 0.7,
      });
    } catch (e) {
      if (e instanceof BudgetExceededError) return { ok: false as const, error: e.message };
      throw e;
    }

    let parsed: { flowName?: string; steps?: Array<{ delay: string; subject: string; preheader: string; bodyHtml: string }> } = {};
    try { parsed = JSON.parse(result.content); } catch { /* fall through */ }

    if (!parsed.flowName || !Array.isArray(parsed.steps) || parsed.steps.length === 0) {
      return { ok: false as const, error: "Model returned malformed email flow" };
    }

    const item = await insertQueueRow({
      kind: "email_flow",
      channel: "email",
      title: `Email — ${parsed.flowName}`,
      cost_cents: Math.round(result.costUsd * 10000) / 100,
      payload: {
        flow,
        flowName: parsed.flowName,
        steps: parsed.steps,
        anchorProduct: seed ? { handle: seed.handle, title: seed.title } : null,
      },
    });

    return { ok: true as const, item, costUsd: result.costUsd };
  });

// ─── Wave 3b: UGC Studio (HeyGen-style avatar brief) ───────────────────────
export const generateUgcBrief = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((d: { handle?: string } | undefined) =>
    z.object({ handle: z.string().min(1).max(255).optional() }).parse(d ?? {})
  )
  .handler(async ({ data }) => {
    const product = await pickInStockProduct(data.handle);
    const productUrl = `${PALACE_DOMAIN}/product/${product.handle}`;

    const userPrompt = `Write a UGC video production brief for Palace of Roman, formatted for HeyGen avatar generation + Arcads-style AI creators.

Real product:
- ${product.brand ?? ""} ${product.title}
- Category: ${product.category}
- Price: ~$${product.priceUsd}
- URL: ${productUrl}
- Image: ${product.image ?? "—"}

Return strict JSON:
{
  "concept": "string (1-sentence high concept)",
  "targetLengthSec": 22,
  "avatarBrief": {
    "personaArchetype": "string (e.g. 'European stylist, late 20s, soft-spoken, refined')",
    "wardrobe": "string (what they're wearing on camera)",
    "tone": "string (e.g. 'intimate, confiding, low-energy')",
    "language": "en-US"
  },
  "script": [
    { "timecode": "0:00-0:03", "voSpoken": "string (hook line, <=14 words)", "broll": "string (visual)" },
    { "timecode": "0:03-0:10", "voSpoken": "string", "broll": "string" },
    { "timecode": "0:10-0:18", "voSpoken": "string", "broll": "string" },
    { "timecode": "0:18-0:22", "voSpoken": "string (CTA: 'link in bio' style)", "broll": "string" }
  ],
  "captionsOnScreen": ["string", "string", "string"],
  "hookVariants": ["string", "string", "string"],
  "audioStyle": "string (e.g. 'slowed luxury R&B, ASMR layer under VO')",
  "platforms": ["tiktok", "reels", "shorts"]
}`;

    let result;
    try {
      result = await callAi({
        module: "ugc",
        model: "google/gemini-2.5-flash-lite",
        system: PALACE_BRAND_VOICE,
        user: userPrompt,
        json: true,
        maxTokens: 2200,
        temperature: 0.85,
      });
    } catch (e) {
      if (e instanceof BudgetExceededError) return { ok: false as const, error: e.message };
      throw e;
    }

    let parsed: Record<string, unknown> = {};
    try { parsed = JSON.parse(result.content); } catch { /* fall through */ }

    if (!parsed.script || !parsed.avatarBrief) {
      return { ok: false as const, error: "Model returned malformed UGC brief" };
    }

    const item = await insertQueueRow({
      kind: "ugc_brief",
      channel: "tiktok",
      title: `UGC — ${product.title}`,
      cost_cents: Math.round(result.costUsd * 10000) / 100,
      payload: { ...parsed, productHandle: product.handle, productUrl, image: product.image },
    });

    return { ok: true as const, item, costUsd: result.costUsd };
  });

// ─── Wave 4a: SEO Content Factory (programmatic landing page) ─────────────
const SEO_QUERY_TEMPLATES = [
  "authentic {brand} for sale online",
  "where to buy {brand} {category} in the US",
  "{brand} vs {brand2} — which to invest in",
  "best {category} under $1000",
  "how to spot real vs fake {brand}",
  "{brand} {category} sizing guide",
  "{brand} resort 2026 edit",
];

export const generateSeoPage = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((d: { query?: string } | undefined) =>
    z.object({ query: z.string().min(3).max(180).optional() }).parse(d ?? {})
  )
  .handler(async ({ data }) => {
    // pull 6 products to feature; let the AI pick the angle if no query supplied
    const { data: pool, error } = await supabaseAdmin
      .from("bg_products")
      .select("handle, name, brand, category, retail_price, currency, main_picture")
      .eq("in_stock", true)
      .gt("total_stock", 0)
      .order("modified_at", { ascending: false, nullsFirst: false })
      .limit(40);
    if (error) throw new Error(error.message);
    const seeded = (pool ?? []).slice(0, 12).map((p) => ({
      handle: p.handle,
      title: p.name,
      brand: p.brand,
      category: p.category,
      priceUsd: p.currency === "EUR" && p.retail_price ? Math.round(Number(p.retail_price) * 1.08) : Number(p.retail_price ?? 0),
      image: p.main_picture,
    }));

    const query = data.query ?? (() => {
      const brands = Array.from(new Set(seeded.map((p) => p.brand).filter(Boolean))) as string[];
      const cats = Array.from(new Set(seeded.map((p) => p.category).filter(Boolean))) as string[];
      const tpl = SEO_QUERY_TEMPLATES[Math.floor(Math.random() * SEO_QUERY_TEMPLATES.length)];
      return tpl
        .replace("{brand}", brands[0] ?? "Gucci")
        .replace("{brand2}", brands[1] ?? "Saint Laurent")
        .replace("{category}", cats[0] ?? "leather goods");
    })();

    const userPrompt = `Generate a programmatic SEO landing page for Palace of Roman targeting this long-tail query:

Query: "${query}"

Available real products to feature (use real handles for links to ${PALACE_DOMAIN}/product/{handle}):
${seeded.map((p, i) => `${i + 1}. [${p.brand}] ${p.title} (${p.handle}) — ~$${p.priceUsd}`).join("\n")}

Return strict JSON:
{
  "slug": "lowercase-kebab-case (under 70 chars)",
  "title": "string (under 60 chars, includes target query naturally)",
  "metaDescription": "string (under 158 chars, includes query + value prop)",
  "h1": "string (matches title intent, not identical)",
  "intro": "<p>…</p> (60-120 words, answers the query above the fold)",
  "sections": [
    { "h2": "string", "html": "<p>…</p> with internal product links to ${PALACE_DOMAIN}/product/{handle} (4-7 products total across all sections)" }
  ],
  "faq": [ { "q": "string", "a": "string" } ],
  "featuredHandles": ["handle1", "handle2", ...],
  "schemaJsonLd": { "@context": "https://schema.org", "@type": "FAQPage", "mainEntity": [ { "@type": "Question", "name": "...", "acceptedAnswer": { "@type": "Answer", "text": "..." } } ] }
}

Rules:
- 700-1100 words total.
- 3-5 sections.
- 4-6 FAQ items mapped 1:1 into schemaJsonLd.
- US English. USD pricing.
- No fake reviews/quotes/awards.`;

    let result;
    try {
      result = await callAi({
        module: "seo",
        model: "google/gemini-2.5-flash-lite",
        system: PALACE_BRAND_VOICE,
        user: userPrompt,
        json: true,
        maxTokens: 4200,
        temperature: 0.6,
      });
    } catch (e) {
      if (e instanceof BudgetExceededError) return { ok: false as const, error: e.message };
      throw e;
    }

    let parsed: Record<string, unknown> = {};
    try { parsed = JSON.parse(result.content); } catch { /* fall through */ }

    if (!parsed.title || !parsed.slug || !parsed.sections) {
      return { ok: false as const, error: "Model returned malformed SEO page" };
    }

    const item = await insertQueueRow({
      kind: "seo_page",
      channel: "shopify_page",
      title: `SEO — ${String(parsed.title)}`,
      cost_cents: Math.round(result.costUsd * 10000) / 100,
      payload: { query, ...parsed },
    });

    return { ok: true as const, item, costUsd: result.costUsd };
  });

// ─── Wave 4b: Ad Forge (paid-social ad set) ────────────────────────────────
export const generateAdCreative = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((d: { handle?: string } | undefined) =>
    z.object({ handle: z.string().min(1).max(255).optional() }).parse(d ?? {})
  )
  .handler(async ({ data }) => {
    const product = await pickInStockProduct(data.handle);
    const productUrl = `${PALACE_DOMAIN}/product/${product.handle}`;

    const userPrompt = `Generate a paid-social ad set for Palace of Roman. Six distinct angles across Meta (Facebook/Instagram), TikTok, and Pinterest.

Product:
- ${product.brand ?? ""} ${product.title}
- Category: ${product.category}
- Price: ~$${product.priceUsd}
- URL: ${productUrl}
- Image: ${product.image ?? "—"}

Return strict JSON:
{
  "audiences": ["string", "string", "string"],
  "ads": [
    {
      "angle": "string (e.g. 'price-anchored', 'social-proof', 'POV scarcity', 'editorial', 'before/after-styling', 'gift')",
      "platforms": ["meta" | "tiktok" | "pinterest", ...],
      "headline": "string (<=40 chars)",
      "primaryText": "string (90-180 chars, no emoji unless platform-native)",
      "description": "string (<=90 chars)",
      "cta": "Shop Now" | "Learn More" | "Discover",
      "creativeBrief": "string (what the static/video should look like, 25-60 words)",
      "hashtags": ["#tag", ...]
    }
  ]
}

Rules:
- Exactly 6 ads.
- Each ad targets a different angle.
- TikTok ads: hook-first, conversational. Meta: editorial. Pinterest: keyword-rich descriptions.
- No fabricated reviews, no fake urgency ("only 2 left!").`;

    let result;
    try {
      result = await callAi({
        module: "ads",
        model: "google/gemini-2.5-flash-lite",
        system: PALACE_BRAND_VOICE,
        user: userPrompt,
        json: true,
        maxTokens: 2800,
        temperature: 0.8,
      });
    } catch (e) {
      if (e instanceof BudgetExceededError) return { ok: false as const, error: e.message };
      throw e;
    }

    let parsed: Record<string, unknown> = {};
    try { parsed = JSON.parse(result.content); } catch { /* fall through */ }

    if (!parsed.ads) {
      return { ok: false as const, error: "Model returned malformed ad set" };
    }

    const item = await insertQueueRow({
      kind: "ad_set",
      channel: "ads",
      title: `Ads — ${product.title}`,
      cost_cents: Math.round(result.costUsd * 10000) / 100,
      payload: { ...parsed, productHandle: product.handle, productUrl, image: product.image },
    });

    return { ok: true as const, item, costUsd: result.costUsd };
  });

// ─── Approval for non-publishing modules ───────────────────────────────────
// Email, UGC, SEO, Ads all just flip to "approved" — actual dispatch requires
// connecting Meta Ads, Pinterest Business, an SMTP/SES sender, and HeyGen API.
export const approveQueueItem = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const { data: item, error: e1 } = await supabaseAdmin
      .from("content_queue")
      .select("id, status")
      .eq("id", data.id)
      .maybeSingle();
    if (e1) throw new Error(e1.message);
    if (!item) throw new Error("Not found");
    if (item.status !== "draft") throw new Error(`Cannot approve item in status: ${item.status}`);
    const { error } = await supabaseAdmin
      .from("content_queue")
      .update({
        status: "approved",
        approved_by: userId,
        approved_at: new Date().toISOString(),
        error_message: null,
      })
      .eq("id", item.id);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });
