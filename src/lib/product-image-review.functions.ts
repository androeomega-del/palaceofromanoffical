/**
 * Product image review — strict data-bound generation + side-by-side QA.
 *
 * Two catalog sources are supported:
 *   - 'bg_products' → rows in the BrandsGateway mirror table
 *   - 'shopify'     → live products from the Shopify Admin API
 *
 * RULES (per project policy, applied to BOTH sources):
 *  1. Prompts are built ONLY from catalog fields (color, style/subcategory,
 *     category, SKU, gender, brand, material). Never inferred from output.
 *  2. Tags / alt-text are pulled from the catalog record BEFORE generation.
 *  3. (sku, source) is the unique link between an image and its catalog row.
 *     Generated PNG is stored at `${source}/${sku}.png` in `product-images`.
 *  4. Every generated image lands as `status='pending'`. Approved rows write
 *     back the SKU reference. Rejected rows re-enter the queue (status flips
 *     back to 'ungenerated' on next regen) — reviewer notes become an
 *     optional override appended to the data-bound prompt.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireAdmin } from "@/lib/admin-middleware";

const skuSchema = z.string().min(1).max(128).regex(/^[A-Za-z0-9._\-/]+$/);
const sourceSchema = z.enum(["bg_products", "shopify"]);
export type CatalogSource = z.infer<typeof sourceSchema>;

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
  style: string | null;
};

export type ProductImageReviewRow = {
  sku: string;
  source: CatalogSource;
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
  source: CatalogSource;
  catalog: CatalogAttributes;
  review: ProductImageReviewRow | null;
  mainPicture: string | null;
};

// ─── Prompt builder (DATA-BOUND ONLY) ──────────────────────────────────
export function buildProductImagePrompt(
  c: CatalogAttributes,
  override?: string | null,
): string {
  const genderWord = (() => {
    const g = (c.gender ?? "").toLowerCase();
    if (g.startsWith("m")) return "men";
    if (g.startsWith("w") || g.startsWith("f")) return "women";
    if (g.startsWith("u")) return "unisex";
    return null;
  })();

  const categoryParts = [c.subsubcategory, c.subcategory, c.category]
    .filter((v): v is string => !!v && v.length > 0);
  const categoryPhrase = categoryParts[0] ?? "fashion item";

  const subject = [
    c.color,
    c.material,
    c.style,
    categoryPhrase,
    genderWord ? `for ${genderWord}` : null,
    c.brand ? `by ${c.brand}` : null,
  ]
    .filter(Boolean)
    .join(" ");

  const refs = [`SKU ${c.sku}`, c.name ? `model ref: ${c.name}` : null]
    .filter(Boolean)
    .join("; ");

  const base = [
    `Editorial product photograph of ${subject}.`,
    "Studio lighting, neutral seamless background, single product, centred composition, 4:5 vertical.",
    "No text, no logos overlaid, no watermarks, no humans, no props beyond the product itself.",
    `Catalog reference (do not render as text): ${refs}.`,
  ].join(" ");

  const trimmed = (override ?? "").trim();
  return trimmed ? `${base} Reviewer override: ${trimmed}` : base;
}

// ─── BG catalog ────────────────────────────────────────────────────────
async function fetchBgCatalogRow(sku: string): Promise<CatalogAttributes> {
  const { data, error } = await supabaseAdmin
    .from("bg_products")
    .select(
      "group_sku, handle, name, brand, gender, category, subcategory, subsubcategory, color, material",
    )
    .eq("group_sku", sku)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error(`No bg_products row for SKU ${sku}`);
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
    style: data.subcategory ?? null,
  };
}

async function listBgCatalog(limit: number): Promise<{
  items: { sku: string; catalog: CatalogAttributes; mainPicture: string | null }[];
}> {
  const { data, error } = await supabaseAdmin
    .from("bg_products")
    .select(
      "group_sku, handle, name, brand, gender, category, subcategory, subsubcategory, color, material, main_picture, modified_at",
    )
    .eq("in_stock", true)
    .gt("total_stock", 0)
    .order("modified_at", { ascending: false, nullsFirst: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return {
    items: (data ?? []).map((p) => ({
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
        style: p.subcategory ?? null,
      },
      mainPicture: p.main_picture,
    })),
  };
}

// ─── Shopify catalog ───────────────────────────────────────────────────
// Maps tags + metafields → attributes. Tags use `key:value` convention
// (e.g. `color:navy`, `style:swim-briefs`, `gender:men`). Recognised keys:
// color, style, category, subcategory, material, gender. SKU is read from
// the first variant.
const SHOPIFY_API_VERSION = "2025-07";

type ShopifyProduct = {
  id: number;
  handle: string;
  title: string;
  vendor: string | null;
  product_type: string | null;
  tags: string; // comma separated
  image: { src: string } | null;
  variants: Array<{ sku: string | null }>;
  metafields?: Array<{ namespace: string; key: string; value: string }>;
};

function parseShopifyTags(tagsCsv: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const raw of tagsCsv.split(",")) {
    const tag = raw.trim();
    const m = /^([a-zA-Z_-]+)\s*:\s*(.+)$/.exec(tag);
    if (m) out[m[1].toLowerCase()] = m[2].trim();
  }
  return out;
}

function shopifyToCatalog(p: ShopifyProduct): CatalogAttributes | null {
  const sku = p.variants.find((v) => !!v.sku)?.sku ?? null;
  if (!sku) return null;
  const tagMap = parseShopifyTags(p.tags ?? "");
  const mf: Record<string, string> = {};
  for (const m of p.metafields ?? []) mf[m.key.toLowerCase()] = m.value;
  const pick = (k: string) => mf[k] ?? tagMap[k] ?? null;
  return {
    sku,
    handle: p.handle,
    name: p.title,
    brand: p.vendor,
    gender: pick("gender"),
    category: p.product_type || pick("category"),
    subcategory: pick("subcategory"),
    subsubcategory: null,
    color: pick("color"),
    material: pick("material"),
    style: pick("style") ?? pick("subcategory"),
  };
}

async function shopifyAdminFetch(path: string): Promise<unknown> {
  const token = process.env.SHOPIFY_ACCESS_TOKEN;
  const domain = process.env.SHOPIFY_STORE_DOMAIN;
  if (!token || !domain) throw new Error("Shopify credentials missing");
  const url = `https://${domain}/admin/api/${SHOPIFY_API_VERSION}/${path}`;
  const res = await fetch(url, {
    headers: {
      "X-Shopify-Access-Token": token,
      "Content-Type": "application/json",
    },
  });
  if (!res.ok) throw new Error(`Shopify ${res.status}: ${await res.text()}`);
  return res.json();
}

async function listShopifyCatalog(limit: number) {
  const json = (await shopifyAdminFetch(
    `products.json?limit=${Math.min(limit, 250)}&status=active`,
  )) as { products: ShopifyProduct[] };
  const items: { sku: string; catalog: CatalogAttributes; mainPicture: string | null }[] = [];
  for (const p of json.products) {
    const cat = shopifyToCatalog(p);
    if (cat) items.push({ sku: cat.sku, catalog: cat, mainPicture: p.image?.src ?? null });
  }
  return { items };
}

async function fetchShopifyCatalogRow(sku: string): Promise<CatalogAttributes> {
  // Shopify Admin search by SKU
  const json = (await shopifyAdminFetch(
    `products.json?limit=50&fields=id,handle,title,vendor,product_type,tags,image,variants&status=active`,
  )) as { products: ShopifyProduct[] };
  for (const p of json.products) {
    const cat = shopifyToCatalog(p);
    if (cat && cat.sku === sku) return cat;
  }
  throw new Error(`No Shopify product for SKU ${sku}`);
}

// ─── Image generation ──────────────────────────────────────────────────
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
  if (!res.ok) throw new Error(`AI gateway ${res.status}: ${await res.text()}`);
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

function skuToPath(source: CatalogSource, sku: string): string {
  const safe = sku.replace(/[^A-Za-z0-9._-]/g, "_");
  return `${source}/${safe}.png`;
}

// ─── Server fns ────────────────────────────────────────────────────────

export const listProductImageQueue = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator(
    (d: { status?: string; limit?: number; source?: string } | undefined) =>
      z
        .object({
          source: sourceSchema.default("bg_products"),
          status: z
            .enum(["all", "pending", "approved", "rejected", "ungenerated"])
            .default("ungenerated"),
          limit: z.number().int().min(1).max(200).default(40),
        })
        .parse(d ?? {}),
  )
  .handler(async ({ data }) => {
    const catalog =
      data.source === "shopify"
        ? await listShopifyCatalog(data.limit * 3)
        : await listBgCatalog(data.limit * 3);

    const skus = catalog.items.map((p) => p.sku);
    const { data: reviews, error: rErr } = await supabaseAdmin
      .from("product_image_reviews")
      .select("*")
      .eq("source", data.source)
      .in("sku", skus.length ? skus : ["__none__"]);
    if (rErr) throw new Error(rErr.message);

    const byId = new Map<string, ProductImageReviewRow>();
    for (const r of (reviews ?? []) as unknown as ProductImageReviewRow[]) {
      byId.set(r.sku, r);
    }

    const items: QueueItem[] = catalog.items.map((p) => ({
      sku: p.sku,
      source: data.source,
      catalog: p.catalog,
      mainPicture: p.mainPicture,
      review: byId.get(p.sku) ?? null,
    }));

    const filtered = items.filter((it) => {
      if (data.status === "all") return true;
      if (data.status === "ungenerated") return !it.review;
      return it.review?.status === data.status;
    });

    return { items: filtered.slice(0, data.limit), source: data.source };
  });

export const generateProductImageForSku = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((d: { sku: string; source: string; override?: string }) =>
    z
      .object({
        sku: skuSchema,
        source: sourceSchema,
        override: z.string().max(2000).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const catalog =
      data.source === "shopify"
        ? await fetchShopifyCatalogRow(data.sku)
        : await fetchBgCatalogRow(data.sku);

    // ENQUEUE-TIME HANDLE BINDING — resolve the live Shopify handle for
    // this SKU and persist it on the queue row alongside the SKU. The
    // shoppable button URL is built from this handle later; it is never
    // inferred from the generated image.
    let storedHandle = catalog.handle;
    const { data: vm } = await supabaseAdmin
      .from("shopify_variant_map")
      .select("product_handle")
      .eq("sku", data.sku)
      .maybeSingle();
    if (vm?.product_handle) storedHandle = vm.product_handle;

    const prompt = buildProductImagePrompt(catalog, data.override ?? null);
    const bytes = await generateImageBytes(prompt);
    const path = skuToPath(data.source, catalog.sku);

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
      .upsert(
        {
          sku: catalog.sku,
          source: data.source,
          handle: storedHandle,
          attributes: { ...catalog, handle: storedHandle },
          prompt,
          image_url: pub.publicUrl,
          image_path: path,
          status: "pending",
          reviewer_notes: data.override ?? null,
          reviewed_by: null,
          reviewed_at: null,
        },
        { onConflict: "sku,source" },
      );
    if (dbErr) throw new Error(dbErr.message);

    const domain = process.env.SHOPIFY_STORE_DOMAIN;
    const shoppableUrl = domain
      ? `https://${domain}/products/${storedHandle}`
      : null;

    return {
      ok: true as const,
      sku: catalog.sku,
      source: data.source,
      handle: storedHandle,
      shoppableUrl,
      imageUrl: pub.publicUrl,
      prompt,
    };
  });

export const reviewProductImage = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator(
    (d: { sku: string; source: string; decision: string; notes?: string }) =>
      z
        .object({
          sku: skuSchema,
          source: sourceSchema,
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
      .eq("sku", data.sku)
      .eq("source", data.source);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

// ─── DEBUG: raw Shopify Admin API probe ────────────────────────────────
// Returns status code, headers, and body verbatim — never interpreted.
export const shopifyAdminDebugProbe = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((d: { handle?: string; sku?: string } | undefined) =>
    z
      .object({
        handle: z.string().min(1).max(255).optional(),
        sku: z.string().min(1).max(128).optional(),
      })
      .parse(d ?? {}),
  )
  .handler(async ({ data }) => {
    const token = process.env.SHOPIFY_ACCESS_TOKEN;
    const domain = process.env.SHOPIFY_STORE_DOMAIN;
    if (!token || !domain) {
      return {
        ok: false as const,
        url: null as string | null,
        status: 0,
        statusText: "missing-credentials",
        headers: {} as Record<string, string>,
        body:
          "SHOPIFY_ACCESS_TOKEN or SHOPIFY_STORE_DOMAIN is not set in the server env.",
      };
    }
    const qs = data.handle
      ? `handle=${encodeURIComponent(data.handle)}`
      : `limit=1&fields=id,handle,title,variants&status=active`;
    const url = `https://${domain}/admin/api/${SHOPIFY_API_VERSION}/products.json?${qs}`;
    const res = await fetch(url, {
      headers: {
        "X-Shopify-Access-Token": token,
        "Content-Type": "application/json",
      },
    });
    const headers: Record<string, string> = {};
    res.headers.forEach((v, k) => {
      headers[k] = v;
    });
    const body = await res.text();
    return {
      ok: res.ok,
      url,
      status: res.status,
      statusText: res.statusText,
      headers,
      body,
    };
  });

// ─── Shoppable overlay metadata (DATA-BOUND ONLY) ──────────────────────
// Used on approved images. Label = "[color] [style]" from the catalog
// record; URL is the Shopify product page resolved by SKU → handle.
// NEVER inferred from the image.
export const resolveShoppableOverlay = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((d: { sku: string; source: string }) =>
    z.object({ sku: skuSchema, source: sourceSchema }).parse(d),
  )
  .handler(async ({ data }) => {
    const { data: review, error: revErr } = await supabaseAdmin
      .from("product_image_reviews")
      .select("sku, source, handle, status, attributes")
      .eq("sku", data.sku)
      .eq("source", data.source)
      .maybeSingle();
    if (revErr) throw new Error(revErr.message);
    if (!review) throw new Error(`No review row for SKU ${data.sku}`);
    if (review.status !== "approved") {
      throw new Error(`SKU ${data.sku} is not approved (status=${review.status})`);
    }
    const attrs = (review.attributes ?? {}) as Partial<CatalogAttributes>;

    // Handle is the one stored on the queue row at enqueue time — that
    // value is the SKU↔handle binding. No re-resolution here.
    const resolvedHandle = review.handle ?? null;

    // Label is strictly "[color] [style]" from the catalog record.
    const labelParts = [attrs.color, attrs.style ?? attrs.subcategory]
      .filter((s): s is string => !!s && s.trim().length > 0);
    const label = labelParts.length ? labelParts.join(" ") : (attrs.name ?? data.sku);

    const domain = process.env.SHOPIFY_STORE_DOMAIN;
    const url = resolvedHandle && domain
      ? `https://${domain}/products/${resolvedHandle}`
      : null;

    return {
      sku: review.sku,
      source: review.source as CatalogSource,
      handle: resolvedHandle,
      label,
      url,
    };
  });
