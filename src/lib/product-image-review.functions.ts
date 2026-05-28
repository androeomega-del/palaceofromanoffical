/**
 * Product image review — strict data-bound generation + side-by-side QA.
 *
 * RULES (per project policy):
 *  1. The image prompt is built ONLY from the catalog row's own data fields
 *     (color, style/subcategory, category, gender, brand, material). We
 *     NEVER infer attributes from the generated image.
 *  2. Tags / alt-text / labels stored alongside the image are pulled from
 *     the catalog record BEFORE generation runs — never from a visual
 *     interpretation of the output.
 *  3. SKU is the only link between an image file and the catalog row. The
 *     generated PNG is stored at `${sku}.png` in the `product-images`
 *     bucket; the review row is keyed by SKU.
 *  4. Every generated image lands as `status='pending'` so a human can
 *     approve or reject it before publishing.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireAdmin } from "@/lib/admin-middleware";

const skuSchema = z.string().min(1).max(128).regex(/^[A-Za-z0-9._\-/]+$/);

export type CatalogAttributes = {
  sku: string;
  handle: string;
  name: string | null;
  brand: string | null;
  gender: string | null;
  category: string | null;
  subcategory: string | null;
  subsubcategory: string | null;
  color: string | null;
  material: string | null;
};

export type ProductImageReviewRow = {
  sku: string;
  handle: string;
  attributes: CatalogAttributes;
  prompt: string;
  image_url: string | null;
  image_path: string | null;
  status: "pending" | "approved" | "rejected";
  reviewer_notes: string | null;
  reviewed_at: string | null;
  updated_at: string;
};

export type QueueItem = {
  sku: string;
  catalog: CatalogAttributes;
  review: ProductImageReviewRow | null;
  mainPicture: string | null;
};

// ─── Prompt builder (DATA-BOUND ONLY) ──────────────────────────────────
//
// Important: this function takes the catalog row as its single input and
// composes the prompt purely from its fields. Do not add free-text
// embellishment or anything derived from a previously generated image.
export function buildProductImagePrompt(c: CatalogAttributes): string {
  const genderWord = (() => {
    const g = (c.gender ?? "").toLowerCase();
    if (g.startsWith("m")) return "men";
    if (g.startsWith("w") || g.startsWith("f")) return "women";
    if (g.startsWith("u")) return "unisex";
    return null;
  })();

  // category phrase, most specific first
  const categoryParts = [c.subsubcategory, c.subcategory, c.category]
    .filter((v): v is string => !!v && v.length > 0);
  const categoryPhrase = categoryParts[0] ?? "fashion item";

  const subject = [
    c.color,
    c.material,
    categoryPhrase,
    genderWord ? `for ${genderWord}` : null,
    c.brand ? `by ${c.brand}` : null,
  ]
    .filter(Boolean)
    .join(" ");

  // Reference fields (NOT visual cues). Useful for traceability in the
  // generated prompt without instructing the model to invent extra detail.
  const refs = [`SKU ${c.sku}`, c.name ? `model ref: ${c.name}` : null]
    .filter(Boolean)
    .join("; ");

  return [
    `Editorial product photograph of ${subject}.`,
    "Studio lighting, neutral seamless background, single product, centred composition, 4:5 vertical.",
    "No text, no logos overlaid, no watermarks, no humans, no props beyond the product itself.",
    `Catalog reference (do not render as text): ${refs}.`,
  ].join(" ");
}

// ─── Catalog fetch ─────────────────────────────────────────────────────
async function fetchCatalogRow(sku: string): Promise<CatalogAttributes> {
  const { data, error } = await supabaseAdmin
    .from("bg_products")
    .select(
      "group_sku, handle, name, brand, gender, category, subcategory, subsubcategory, color, material",
    )
    .eq("group_sku", sku)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error(`No catalog row for SKU ${sku}`);
  return {
    sku: data.group_sku,
    handle: data.handle,
    name: data.name,
    brand: data.brand,
    gender: data.gender,
    category: data.category,
    subcategory: data.subcategory,
    subsubcategory: data.subsubcategory,
    color: data.color,
    material: data.material,
  };
}

// ─── Image generation (Lovable AI Gateway) ─────────────────────────────
async function generateImageBytes(prompt: string): Promise<Uint8Array> {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) throw new Error("LOVABLE_API_KEY missing");

  const res = await fetch(
    "https://ai.gateway.lovable.dev/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image-preview",
        messages: [{ role: "user", content: prompt }],
        modalities: ["image", "text"],
      }),
    },
  );
  if (!res.ok) {
    throw new Error(`AI gateway ${res.status}: ${await res.text()}`);
  }
  const json = (await res.json()) as {
    choices?: Array<{
      message?: { images?: Array<{ image_url?: { url?: string } }> };
    }>;
  };
  const dataUrl = json.choices?.[0]?.message?.images?.[0]?.image_url?.url;
  if (!dataUrl) throw new Error("No image returned");
  const b64 = dataUrl.includes(",") ? dataUrl.split(",", 2)[1] : dataUrl;
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

// Sanitise SKU for storage filename (storage rejects slashes mid-path
// only when used as separators; collapsing to underscore is safer).
function skuToPath(sku: string): string {
  return `${sku.replace(/[^A-Za-z0-9._-]/g, "_")}.png`;
}

// ─── Server fns ────────────────────────────────────────────────────────

/**
 * Queue: most-recent in-stock catalog rows joined with their review row
 * (if any). Filterable by status.
 */
export const listProductImageQueue = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((d: { status?: string; limit?: number } | undefined) =>
    z
      .object({
        status: z
          .enum(["all", "pending", "approved", "rejected", "ungenerated"])
          .default("ungenerated"),
        limit: z.number().int().min(1).max(200).default(40),
      })
      .parse(d ?? {}),
  )
  .handler(async ({ data }) => {
    // Pull a window of in-stock products to consider
    const { data: products, error: pErr } = await supabaseAdmin
      .from("bg_products")
      .select(
        "group_sku, handle, name, brand, gender, category, subcategory, subsubcategory, color, material, main_picture, modified_at",
      )
      .eq("in_stock", true)
      .gt("total_stock", 0)
      .order("modified_at", { ascending: false, nullsFirst: false })
      .limit(data.limit * 3); // overscan; we filter below
    if (pErr) throw new Error(pErr.message);

    const skus = (products ?? []).map((p) => p.group_sku);
    const { data: reviews, error: rErr } = await supabaseAdmin
      .from("product_image_reviews")
      .select("*")
      .in("sku", skus.length ? skus : ["__none__"]);
    if (rErr) throw new Error(rErr.message);

    const byId = new Map<string, ProductImageReviewRow>();
    for (const r of (reviews ?? []) as ProductImageReviewRow[]) byId.set(r.sku, r);

    const items: QueueItem[] = (products ?? []).map((p) => ({
      sku: p.group_sku,
      catalog: {
        sku: p.group_sku,
        handle: p.handle,
        name: p.name,
        brand: p.brand,
        gender: p.gender,
        category: p.category,
        subcategory: p.subcategory,
        subsubcategory: p.subsubcategory,
        color: p.color,
        material: p.material,
      },
      mainPicture: p.main_picture,
      review: byId.get(p.group_sku) ?? null,
    }));

    const filtered = items.filter((it) => {
      if (data.status === "all") return true;
      if (data.status === "ungenerated") return !it.review;
      return it.review?.status === data.status;
    });

    return { items: filtered.slice(0, data.limit) };
  });

/**
 * Generate (or regenerate) an image for one SKU. The prompt is built
 * STRICTLY from catalog fields by `buildProductImagePrompt`. Writes a
 * `pending` review row; reviewer approves/rejects separately.
 */
export const generateProductImageForSku = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((d: { sku: string }) =>
    z.object({ sku: skuSchema }).parse(d),
  )
  .handler(async ({ data }) => {
    const catalog = await fetchCatalogRow(data.sku);
    const prompt = buildProductImagePrompt(catalog);

    const bytes = await generateImageBytes(prompt);
    const path = skuToPath(catalog.sku);
    const { error: upErr } = await supabaseAdmin.storage
      .from("product-images")
      .upload(path, bytes, {
        contentType: "image/png",
        upsert: true,
        cacheControl: "31536000",
      });
    if (upErr) throw new Error(upErr.message);
    const { data: pub } = supabaseAdmin.storage
      .from("product-images")
      .getPublicUrl(path);

    const { error: dbErr } = await supabaseAdmin
      .from("product_image_reviews")
      .upsert({
        sku: catalog.sku,
        handle: catalog.handle,
        attributes: catalog,
        prompt,
        image_url: pub.publicUrl,
        image_path: path,
        status: "pending",
        reviewer_notes: null,
        reviewed_by: null,
        reviewed_at: null,
      });
    if (dbErr) throw new Error(dbErr.message);

    return { ok: true as const, sku: catalog.sku, imageUrl: pub.publicUrl, prompt };
  });

export const reviewProductImage = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((d: { sku: string; decision: string; notes?: string }) =>
    z
      .object({
        sku: skuSchema,
        decision: z.enum(["approved", "rejected"]),
        notes: z.string().max(2000).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const { error } = await supabaseAdmin
      .from("product_image_reviews")
      .update({
        status: data.decision,
        reviewer_notes: data.notes ?? null,
        reviewed_by: userId,
        reviewed_at: new Date().toISOString(),
      })
      .eq("sku", data.sku);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });
