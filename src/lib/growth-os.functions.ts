/**
 * Growth OS — Editorial Engine + content queue management.
 *
 * Wave 1 deliverable. Admin can:
 *   1. List queued content (drafts, scheduled, published, rejected)
 *   2. Generate a new editorial blog draft from real catalog data
 *   3. Approve a draft → publishes to Shopify blog + persists external_id
 *   4. Reject a draft
 *   5. View MTD AI spend vs the $160 cap
 */

import { createServerFn } from "@tanstack/react-start";
import { requireAdmin } from "@/lib/admin-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { callAi, getMonthlySpendUsd, MONTHLY_BUDGET_USD, BudgetExceededError } from "@/lib/ai-gateway.server";
import { PALACE_BRAND_VOICE, PALACE_DOMAIN } from "@/lib/brand-voice";
import { adminRest } from "@/lib/shopify-admin.server";
import { z } from "zod";

// ─── Queue list ────────────────────────────────────────────────────────────
export const listQueue = createServerFn({ method: "GET" })
  .middleware([requireAdmin])
  .inputValidator((d: { status?: string; limit?: number } | undefined) => d ?? {})
  .handler(async ({ data }) => {
    let q = supabaseAdmin
      .from("content_queue")
      .select("id, kind, channel, title, status, scheduled_for, published_at, cost_cents, external_id, error_message, created_at, updated_at")
      .order("created_at", { ascending: false })
      .limit(data.limit ?? 100);
    if (data.status) q = q.eq("status", data.status);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return { items: rows ?? [] };
  });

export const getQueueItem = createServerFn({ method: "GET" })
  .middleware([requireAdmin])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const { data: row, error } = await supabaseAdmin
      .from("content_queue")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) throw new Error("Not found");
    return row;
  });

// ─── Budget widget ─────────────────────────────────────────────────────────
export const getBudgetStatus = createServerFn({ method: "GET" })
  .middleware([requireAdmin])
  .handler(async () => {
    const mtd = await getMonthlySpendUsd();
    const now = new Date();
    const daysIn = now.getUTCDate();
    const daysInMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0)).getUTCDate();
    const projected = daysIn > 0 ? (mtd / daysIn) * daysInMonth : 0;
    return {
      mtdUsd: Math.round(mtd * 100) / 100,
      capUsd: MONTHLY_BUDGET_USD,
      projectedUsd: Math.round(projected * 100) / 100,
      percentUsed: Math.round((mtd / MONTHLY_BUDGET_USD) * 100),
    };
  });

// ─── Editorial generation ──────────────────────────────────────────────────
const ANGLES = [
  "The new evening: tailoring that travels",
  "Resort wardrobing: dressing for movement, light, and water",
  "Italian silk: why the hand still matters",
  "Statement outerwear under $1500: the maisons to know",
  "Leather goods that age in your favor",
  "Heritage swim: cuts, prints, and the case for restraint",
  "Why we still believe in the suit",
  "Dressing the long weekend: five outfits, one carry-on",
];

async function fetchSeedProducts(limit = 12) {
  const { data, error } = await supabaseAdmin
    .from("bg_products")
    .select("handle, name, brand, category, subcategory, retail_price, currency, main_picture, description_plain")
    .eq("in_stock", true)
    .gt("total_stock", 0)
    .order("modified_at", { ascending: false, nullsFirst: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return (data ?? []).map((p) => ({
    handle: p.handle,
    title: p.name,
    brand: p.brand,
    category: [p.category, p.subcategory].filter(Boolean).join(" / "),
    priceUsd: p.currency === "EUR" && p.retail_price ? Math.round(Number(p.retail_price) * 1.08) : Number(p.retail_price ?? 0),
    image: p.main_picture,
    blurb: (p.description_plain ?? "").slice(0, 240),
  }));
}

export const generateEditorial = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((d: { angle?: string } | undefined) =>
    z.object({ angle: z.string().min(3).max(160).optional() }).parse(d ?? {})
  )
  .handler(async ({ data }) => {
    const angle = data.angle ?? ANGLES[Math.floor(Math.random() * ANGLES.length)];
    const products = await fetchSeedProducts(12);

    const productCtx = products
      .map((p, i) => `${i + 1}. [${p.brand}] ${p.title} — handle: ${p.handle} — ${p.category} — ~$${p.priceUsd}`)
      .join("\n");

    const userPrompt = `Write an editorial blog article for Palace of Roman.

Angle: "${angle}"

Available real catalog products you may reference (use exact handles for links to ${PALACE_DOMAIN}/product/{handle}):
${productCtx}

Return JSON with this shape:
{
  "title": "string (under 60 chars, SEO-strong)",
  "metaDescription": "string (under 158 chars)",
  "slug": "lowercase-kebab-case",
  "tags": ["string", ...],
  "summary": "1-sentence dek under the title",
  "bodyHtml": "<p>…</p><h2>…</h2>… (800-1200 words, semantic HTML, internal links to ${PALACE_DOMAIN}/product/{handle} for 4-7 of the products above; one <h2> per section; no <h1>; no inline styles; no emoji)",
  "featuredProductHandles": ["handle1", "handle2", ...]
}`;

    let result;
    try {
      result = await callAi({
        module: "editorial",
        model: "google/gemini-2.5-flash-lite",
        system: PALACE_BRAND_VOICE,
        user: userPrompt,
        json: true,
        maxTokens: 4000,
        temperature: 0.75,
      });
    } catch (e) {
      if (e instanceof BudgetExceededError) {
        return { ok: false as const, error: e.message };
      }
      throw e;
    }

    let parsed: {
      title?: string;
      metaDescription?: string;
      slug?: string;
      tags?: string[];
      summary?: string;
      bodyHtml?: string;
      featuredProductHandles?: string[];
    } = {};
    try { parsed = JSON.parse(result.content); } catch { /* fall through */ }

    if (!parsed.title || !parsed.bodyHtml) {
      return { ok: false as const, error: "Model returned malformed editorial" };
    }

    const { data: row, error } = await supabaseAdmin
      .from("content_queue")
      .insert({
        kind: "editorial",
        channel: "shopify_blog",
        title: parsed.title,
        status: "draft",
        cost_cents: Math.round(result.costUsd * 10000) / 100,
        payload: {
          angle,
          metaDescription: parsed.metaDescription,
          slug: parsed.slug,
          tags: parsed.tags ?? [],
          summary: parsed.summary,
          bodyHtml: parsed.bodyHtml,
          featuredProductHandles: parsed.featuredProductHandles ?? [],
          seedProductHandles: products.map((p) => p.handle),
        },
      })
      .select()
      .single();
    if (error) throw new Error(error.message);

    return { ok: true as const, item: row, costUsd: result.costUsd };
  });

// ─── Approve / publish to Shopify blog ─────────────────────────────────────
async function shopifyAdmin<T>(path: string, init: RequestInit = {}): Promise<T> {
  return adminRest<T>(path, init);
}

async function getOrCreateJournalBlogId(): Promise<number> {
  const blogs = await shopifyAdmin<{ blogs: Array<{ id: number; handle: string; title: string }> }>(`/blogs.json`);
  const existing = blogs.blogs.find((b) => b.handle === "journal") ?? blogs.blogs[0];
  if (existing) return existing.id;
  const created = await shopifyAdmin<{ blog: { id: number } }>(`/blogs.json`, {
    method: "POST",
    body: JSON.stringify({ blog: { title: "Journal", handle: "journal" } }),
  });
  return created.blog.id;
}

export const approveAndPublish = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const { data: item, error: e1 } = await supabaseAdmin
      .from("content_queue")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (e1) throw new Error(e1.message);
    if (!item) throw new Error("Not found");
    if (item.status !== "draft") throw new Error(`Cannot publish item in status: ${item.status}`);
    if (item.kind !== "editorial" || item.channel !== "shopify_blog") {
      throw new Error("approveAndPublish currently supports editorial → shopify_blog only");
    }

    const payload = (item.payload ?? {}) as {
      bodyHtml?: string;
      metaDescription?: string;
      tags?: string[];
      summary?: string;
      slug?: string;
    };

    try {
      const blogId = await getOrCreateJournalBlogId();
      const article = await shopifyAdmin<{ article: { id: number; handle: string } }>(
        `/blogs/${blogId}/articles.json`,
        {
          method: "POST",
          body: JSON.stringify({
            article: {
              title: item.title,
              body_html: payload.bodyHtml,
              author: "Palace of Roman",
              tags: (payload.tags ?? []).join(", "),
              published: true,
              summary_html: payload.summary ? `<p>${payload.summary}</p>` : undefined,
              handle: payload.slug,
              metafields: payload.metaDescription
                ? [
                    {
                      namespace: "global",
                      key: "description_tag",
                      value: payload.metaDescription,
                      type: "single_line_text_field",
                    },
                  ]
                : undefined,
            },
          }),
        }
      );

      await supabaseAdmin
        .from("content_queue")
        .update({
          status: "published",
          approved_by: userId,
          approved_at: new Date().toISOString(),
          published_at: new Date().toISOString(),
          external_id: String(article.article.id),
          error_message: null,
        })
        .eq("id", item.id);

      return { ok: true as const, articleId: article.article.id, handle: article.article.handle };
    } catch (e) {
      const msg = e instanceof Error ? e.message : "publish failed";
      await supabaseAdmin
        .from("content_queue")
        .update({ status: "draft", error_message: msg })
        .eq("id", item.id);
      return { ok: false as const, error: msg };
    }
  });

export const rejectItem = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((d: { id: string; reason?: string }) =>
    z.object({ id: z.string().uuid(), reason: z.string().max(500).optional() }).parse(d)
  )
  .handler(async ({ data }) => {
    const { error } = await supabaseAdmin
      .from("content_queue")
      .update({ status: "rejected", error_message: data.reason ?? null })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });
