/**
 * Growth OS — Wave 2: Social Pilot.
 *
 * Generates a full social "pack" from a real Shopify/BG catalog product:
 *   - Instagram carousel (5 slides + caption + hashtags)
 *   - Pinterest pin (title + SEO description + hashtags)
 *   - X / Threads (3-tweet thread)
 *   - TikTok hook bank (5 hooks + trending audio archetypes)
 *
 * Each piece lands in `content_queue` as its own row so admin can review,
 * approve, and copy to the native app. (IG Graph / Pinterest / X auto-post
 * is wired in a later wave once Meta + Pinterest business connections exist.)
 */

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { callAi, BudgetExceededError } from "@/lib/ai-gateway.server";
import { PALACE_BRAND_VOICE, PALACE_DOMAIN } from "@/lib/brand-voice";

type SeedProduct = {
  handle: string;
  title: string;
  brand: string | null;
  category: string;
  priceUsd: number;
  image: string | null;
  blurb: string;
};

async function pickSeedProduct(handle?: string): Promise<SeedProduct> {
  let q = supabaseAdmin
    .from("bg_products")
    .select("handle, name, brand, category, subcategory, retail_price, currency, main_picture, description_plain")
    .eq("in_stock", true)
    .gt("total_stock", 0);
  if (handle) q = q.eq("handle", handle);
  else q = q.order("modified_at", { ascending: false, nullsFirst: false }).limit(40);
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  const rows = data ?? [];
  if (rows.length === 0) throw new Error("No in-stock products to seed a social pack");
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

const PACK_SCHEMA_HINT = `Return strict JSON with this exact shape:
{
  "instagram": {
    "caption": "string, 120-220 words, editorial voice, no emoji, no hashtags inline; ends with a CTA to link in bio",
    "slides": [
      { "headline": "short (<=6 words)", "body": "one-line subhead (<=14 words)" }
      // exactly 5 slides; slide 1 is the hook, slide 5 is the CTA
    ],
    "hashtags": ["#tag", ...]  // 12-18 mixed reach (broad + niche + brand)
  },
  "pinterest": {
    "title": "string, <=100 chars, keyword-rich",
    "description": "string, 200-400 chars, SEO-optimised, includes 2-3 long-tail keywords naturally",
    "hashtags": ["#tag", ...]  // 5-8 evergreen tags
  },
  "xThread": {
    "tweets": ["string", ...]  // exactly 3 tweets, each <=270 chars, no hashtags, last tweet ends with the product URL
  },
  "tiktok": {
    "hooks": ["string", ...],   // 5 hooks, <=90 chars each, scroll-stopping
    "audioArchetypes": ["string", ...],  // 3-4 trending audio styles (e.g. "slowed luxury R&B", "dark academia piano", "Berlin techno drop")
    "scriptOutline": "string, 60-120 words, beat-by-beat for a 15-25 second clip"
  }
}`;

export const generateSocialPack = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((d: { handle?: string } | undefined) =>
    z.object({ handle: z.string().min(1).max(255).optional() }).parse(d ?? {})
  )
  .handler(async ({ data }) => {
    const product = await pickSeedProduct(data.handle);
    const productUrl = `${PALACE_DOMAIN}/product/${product.handle}`;

    const userPrompt = `Generate a complete social media pack for this real catalog product.

Product:
- Title: ${product.title}
- Brand: ${product.brand ?? "—"}
- Category: ${product.category}
- Price: ~$${product.priceUsd} USD
- URL: ${productUrl}
- Image: ${product.image ?? "—"}
- Editorial notes: ${product.blurb || "(none — infer from title and brand)"}

${PACK_SCHEMA_HINT}

Rules:
- Voice = Palace of Roman editorial brand voice (see system).
- Always reference the real handle "${product.handle}" — never invent SKUs.
- Use ${productUrl} as the product link.
- US English. USD pricing.
- TikTok hooks should be platform-native (curiosity, contrast, before/after, price reveal, "POV" framing). They can be more punchy than other channels but still on-brand.
- Instagram caption should read like a magazine micro-essay, not a sales caption.`;

    let result;
    try {
      result = await callAi({
        module: "social_pilot",
        // gemini-2.5-flash is the sweet spot here: cheap, strong JSON, good copywriting
        model: "google/gemini-2.5-flash",
        system: PALACE_BRAND_VOICE,
        user: userPrompt,
        json: true,
        maxTokens: 2400,
        temperature: 0.85,
      });
    } catch (e) {
      if (e instanceof BudgetExceededError) return { ok: false as const, error: e.message };
      throw e;
    }

    let pack: {
      instagram?: { caption?: string; slides?: Array<{ headline: string; body: string }>; hashtags?: string[] };
      pinterest?: { title?: string; description?: string; hashtags?: string[] };
      xThread?: { tweets?: string[] };
      tiktok?: { hooks?: string[]; audioArchetypes?: string[]; scriptOutline?: string };
    } = {};
    try { pack = JSON.parse(result.content); } catch { /* fall through */ }

    if (!pack.instagram || !pack.pinterest || !pack.xThread || !pack.tiktok) {
      return { ok: false as const, error: "Model returned malformed social pack" };
    }

    const baseTitle = product.title.length > 80 ? product.title.slice(0, 77) + "…" : product.title;
    const sharedCost = Math.round((result.costUsd / 4) * 10000) / 100;
    const sharedSeed = { productHandle: product.handle, productUrl, image: product.image, brand: product.brand };

    const rows = [
      {
        kind: "social_post",
        channel: "instagram",
        title: `IG — ${baseTitle}`,
        status: "draft",
        cost_cents: sharedCost,
        payload: { ...sharedSeed, ...pack.instagram },
      },
      {
        kind: "social_pin",
        channel: "pinterest",
        title: `Pinterest — ${baseTitle}`,
        status: "draft",
        cost_cents: sharedCost,
        payload: { ...sharedSeed, ...pack.pinterest },
      },
      {
        kind: "social_thread",
        channel: "x",
        title: `X / Threads — ${baseTitle}`,
        status: "draft",
        cost_cents: sharedCost,
        payload: { ...sharedSeed, ...pack.xThread },
      },
      {
        kind: "social_hook",
        channel: "tiktok",
        title: `TikTok — ${baseTitle}`,
        status: "draft",
        cost_cents: sharedCost,
        payload: { ...sharedSeed, ...pack.tiktok },
      },
    ];

    const { data: inserted, error } = await supabaseAdmin
      .from("content_queue")
      .insert(rows)
      .select();
    if (error) throw new Error(error.message);

    return {
      ok: true as const,
      product: { handle: product.handle, title: product.title, image: product.image },
      costUsd: result.costUsd,
      count: inserted?.length ?? 0,
    };
  });

// Mark a social draft as approved + ready-to-post. Real auto-post (IG Graph,
// Pinterest, X) is wired in a later wave once those connectors are linked.
// For now: approval just flips status so admin can use the Copy buttons to
// hand off to the native scheduling app.
export const approveSocialItem = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const { data: item, error: e1 } = await supabaseAdmin
      .from("content_queue")
      .select("id, kind, status")
      .eq("id", data.id)
      .maybeSingle();
    if (e1) throw new Error(e1.message);
    if (!item) throw new Error("Not found");
    if (item.status !== "draft") throw new Error(`Cannot approve item in status: ${item.status}`);
    if (!item.kind.startsWith("social_")) throw new Error("Not a social item");

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
