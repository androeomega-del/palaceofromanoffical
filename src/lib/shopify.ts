// BrandsGateway snapshot adapter — preserves the `Shopify*` API surface so
// existing pages (product cards, collections, megamenu, brand index) keep
// working unchanged. Data source: public.bg_products + public.bg_variants
// in Lovable Cloud, seeded from the BrandsGateway CSV v7 snapshot.
// Temporary: swap internals for the live BrandsGateway REST API once the
// dropshipper token is provisioned.
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Live Shopify storefront — checkout handoff routes through this domain/token.
export const SHOPIFY_API_VERSION = "2025-07";
export const SHOPIFY_STORE_PERMANENT_DOMAIN = "mwuwqi-vy.myshopify.com";
export const SHOPIFY_STOREFRONT_URL = `https://${SHOPIFY_STORE_PERMANENT_DOMAIN}/api/${SHOPIFY_API_VERSION}/graphql.json`;
export const SHOPIFY_STOREFRONT_TOKEN = "3b02ce4f61d642096147b804ec7ba962";
export const EXCLUDE_QUERY = "";

// Query string constants kept as stubs for any leftover imports.
export const PRODUCTS_QUERY = "";
export const PRODUCT_BY_HANDLE_QUERY = "";
export const COLLECTION_BY_HANDLE_QUERY = "";
export const COLLECTIONS_QUERY = "";
export const COLLECTION_FILTERED_QUERY = "";
export const SEARCH_FILTERED_QUERY = "";

// ── Types (unchanged shape) ─────────────────────────────────────────────────
export interface Money { amount: string; currencyCode: string; }
export interface ShopifyImage { url: string; altText: string | null; width?: number | null; height?: number | null; }
export interface ShopifyVariant {
  id: string;
  title: string;
  price: Money;
  availableForSale: boolean;
  selectedOptions: Array<{ name: string; value: string }>;
}
export interface ShopifyProductNode {
  id: string;
  title: string;
  description: string;
  handle: string;
  vendor: string;
  productType: string;
  priceRange: { minVariantPrice: Money };
  compareAtPriceRange?: { minVariantPrice: Money };
  images: { edges: Array<{ node: ShopifyImage }> };
  variants: { edges: Array<{ node: ShopifyVariant }> };
  options: Array<{ name: string; values: string[] }>;
}
export interface ShopifyProduct { node: ShopifyProductNode }
export interface ShopifyCollection {
  id: string;
  title: string;
  handle: string;
  description: string;
  image: ShopifyImage | null;
  updatedAt?: string;
  productCount?: number;
}
export type StorefrontFilterValue = { id: string; label: string; count: number; input: string };
export type StorefrontFilter = {
  id: string;
  label: string;
  type: "LIST" | "PRICE_RANGE" | "BOOLEAN";
  values: StorefrontFilterValue[];
};
export type FilteredResult = {
  collection?: ShopifyCollection;
  filters: StorefrontFilter[];
  edges: ShopifyProduct[];
  pageInfo: { hasNextPage: boolean; endCursor: string | null };
};

// ── Storefront API (real fetch — used by cart-store for cartCreate/etc.) ────
let BILLING_TOAST_SHOWN = false;
export async function storefrontApiRequest<T = unknown>(
  query: string,
  variables: Record<string, unknown> = {},
): Promise<{ data?: T } | undefined> {
  try {
    const res = await fetch(SHOPIFY_STOREFRONT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Storefront-Access-Token": SHOPIFY_STOREFRONT_TOKEN,
      },
      body: JSON.stringify({ query, variables }),
    });

    if (res.status === 402) {
      if (!BILLING_TOAST_SHOWN) {
        BILLING_TOAST_SHOWN = true;
        toast.error("Checkout temporarily unavailable", {
          description: "Shopify billing needs to be active to process orders. Please try again shortly.",
        });
      }
      return undefined;
    }
    if (!res.ok) {
      console.error("Storefront API error", res.status, await res.text());
      toast.error("Couldn't reach checkout", { description: "Please try again in a moment." });
      return undefined;
    }
    const json = await res.json();
    if (json.errors) {
      console.error("Storefront API GraphQL errors", json.errors);
      toast.error("Checkout error", { description: json.errors[0]?.message ?? "Unknown error" });
      return undefined;
    }
    return json as { data?: T };
  } catch (err) {
    console.error("Storefront API fetch failed", err);
    toast.error("Network error", { description: "Couldn't reach checkout." });
    return undefined;
  }
}

// ── DB row → ShopifyProductNode ─────────────────────────────────────────────
type BgProductRow = {
  id: string;
  handle: string;
  group_sku: string;
  brand: string | null;
  name: string | null;
  description: string | null;
  description_plain: string | null;
  gender: string | null;
  category: string | null;
  subcategory: string | null;
  subsubcategory: string | null;
  color: string | null;
  material: string | null;
  main_picture: string | null;
  pictures: string[] | null;
  retail_price: number | string | null;
  currency: string | null;
  in_stock: boolean;
  total_stock: number;
};

type BgVariantRow = {
  product_sku: string;
  group_sku: string;
  size: string | null;
  quantity: number;
};

type VariantMapRow = { sku: string; variant_gid: string; available: boolean };

const PRODUCT_COLUMNS =
  "id,handle,group_sku,brand,name,description,description_plain,gender,category,subcategory,subsubcategory,color,material,main_picture,pictures,retail_price,currency,in_stock,total_stock";

// Display currency: BG catalog is priced in EUR, but the storefront is sold in USD.
// Apply a single FX constant at the read boundary so every surface (cards, PDP,
// cart, structured data, OG meta) sees the same USD amount.
const DISPLAY_CURRENCY = "USD";
const EUR_TO_USD = 1.08;

function priceMoney(amount: number | string | null, currency: string | null): Money {
  const n = typeof amount === "string" ? parseFloat(amount) : (amount ?? 0);
  const eur = Number.isFinite(n) ? n : 0;
  const src = (currency || "EUR").toUpperCase();
  const usd = src === "USD" ? eur : eur * EUR_TO_USD;
  return { amount: usd.toFixed(2), currencyCode: DISPLAY_CURRENCY };
}


function imagesFromRow(r: BgProductRow, alt: string): ShopifyProductNode["images"] {
  const urls: string[] = [];
  if (r.main_picture) urls.push(r.main_picture);
  for (const p of r.pictures ?? []) if (p && !urls.includes(p)) urls.push(p);
  return { edges: urls.map((url) => ({ node: { url, altText: alt } })) };
}

function rowToNode(r: BgProductRow, variants?: BgVariantRow[]): ShopifyProductNode {
  const title = r.name ?? "Untitled";
  const vendor = r.brand ?? "";
  const productType = r.subsubcategory || r.subcategory || r.category || "";
  const price = priceMoney(r.retail_price, r.currency);
  const alt = vendor ? `${title} — ${vendor}` : title;

  let variantEdges: ShopifyProductNode["variants"]["edges"];
  let options: ShopifyProductNode["options"];

  if (variants && variants.length > 0) {
    variantEdges = variants.map((v) => ({
      node: {
        id: v.product_sku,
        title: v.size ?? "Default Title",
        price,
        availableForSale: v.quantity > 0,
        selectedOptions: v.size ? [{ name: "Size", value: v.size }] : [],
      },
    }));
    const sizes = Array.from(new Set(variants.map((v) => v.size).filter((s): s is string => !!s)));
    options = sizes.length > 0 ? [{ name: "Size", values: sizes }] : [];
  } else {
    // List view: synth single variant so cards render. PDP refetches with real variants.
    variantEdges = [{
      node: {
        id: r.group_sku,
        title: "Default Title",
        price,
        availableForSale: r.in_stock,
        selectedOptions: [],
      },
    }];
    options = [];
  }

  return {
    id: r.id,
    title,
    description: r.description || r.description_plain || "",
    handle: r.handle,
    vendor,
    productType,
    priceRange: { minVariantPrice: price },
    images: imagesFromRow(r, alt),
    variants: { edges: variantEdges },
    options,
  };
}

async function fetchVariantMap(skus: string[]): Promise<Map<string, { gid: string; available: boolean }>> {
  const gidBySku = new Map<string, { gid: string; available: boolean }>();
  const uniqueSkus = Array.from(new Set(skus.filter(Boolean)));
  for (let i = 0; i < uniqueSkus.length; i += 200) {
    const batch = uniqueSkus.slice(i, i + 200);
    const { data, error } = await supabase
      .from("shopify_variant_map")
      .select("sku,variant_gid,available")
      .in("sku", batch);
    if (error) {
      console.error("shopify_variant_map fetch error:", error);
      continue;
    }
    for (const m of (data ?? []) as VariantMapRow[]) {
      gidBySku.set(m.sku, { gid: m.variant_gid, available: m.available });
    }
  }
  return gidBySku;
}

function applyVariantMap(node: ShopifyProductNode, gidBySku: Map<string, { gid: string; available: boolean }>) {
  node.variants.edges = node.variants.edges.map((e) => {
    const mapped = gidBySku.get(e.node.id);
    if (!mapped) return { node: { ...e.node, availableForSale: false } };
    return { node: { ...e.node, id: mapped.gid, availableForSale: e.node.availableForSale && mapped.available } };
  });
  return node;
}

// ── Cursor (base64-encoded offset) ──────────────────────────────────────────
function encodeCursor(offset: number): string { return btoa(`o:${offset}`); }
function decodeCursor(cursor: string | null | undefined): number {
  if (!cursor) return 0;
  try { const s = atob(cursor); if (s.startsWith("o:")) return parseInt(s.slice(2), 10) || 0; } catch { /* noop */ }
  return 0;
}

// ── Query string parsing (Shopify search syntax → SQL filters) ──────────────
type ParsedQuery = { vendor?: string; productType?: string; available?: boolean; free?: string };
function parseQuery(query?: string | null): ParsedQuery {
  if (!query) return {};
  const out: ParsedQuery = {};
  const free: string[] = [];
  // Match key:"value" or key:value
  const re = /(\w+):(?:"([^"]+)"|(\S+))/g;
  let lastIdx = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(query)) !== null) {
    free.push(query.slice(lastIdx, m.index));
    lastIdx = re.lastIndex;
    const key = m[1].toLowerCase();
    const val = m[2] ?? m[3];
    if (key === "vendor") out.vendor = val;
    else if (key === "product_type" || key === "producttype") out.productType = val;
    else if (key === "available_for_sale") out.available = val === "true";
  }
  free.push(query.slice(lastIdx));
  const f = free.join(" ").trim().replace(/^and\s+/i, "").trim();
  if (f) out.free = f;
  return out;
}

// ── ProductFilter[] (Storefront API style) → SQL filters ────────────────────
type FilterInput = Record<string, unknown>;
function applyFilters(builder: any, filters: object[] | undefined) {
  if (!filters || filters.length === 0) return builder;
  let b = builder;
  // Group multi-select values per key so we can emit a single OR clause.
  const multi: Record<string, string[]> = {
    productVendor: [], gender: [], category: [], subcategory: [], color: [], material: [],
  };
  for (const raw of filters) {
    const f = raw as FilterInput;
    if (typeof f.available === "boolean") {
      if (f.available) b = b.eq("in_stock", true);
    }
    if (typeof f.productVendor === "string") multi.productVendor.push(f.productVendor);
    if (typeof f.gender === "string") multi.gender.push(f.gender);
    if (typeof f.category === "string") multi.category.push(f.category);
    if (typeof f.subcategory === "string") multi.subcategory.push(f.subcategory);
    if (typeof f.color === "string") multi.color.push(f.color);
    if (typeof f.material === "string") multi.material.push(f.material);
    if (typeof f.productType === "string") {
      const t = f.productType;
      b = b.or(`category.ilike.${t},subcategory.ilike.${t},subsubcategory.ilike.${t}`);
    }
    if (f.price && typeof f.price === "object") {
      const p = f.price as { min?: number; max?: number };
      if (typeof p.min === "number") b = b.gte("retail_price", p.min);
      if (typeof p.max === "number") b = b.lte("retail_price", p.max);
    }
  }
  const orClause = (col: string, vals: string[]) =>
    vals.map((v) => `${col}.ilike.${v.replace(/,/g, " ")}`).join(",");
  if (multi.productVendor.length) b = b.or(orClause("brand", multi.productVendor));
  if (multi.gender.length) b = b.or(orClause("gender", multi.gender));
  if (multi.category.length) b = b.or(orClause("category", multi.category));
  if (multi.subcategory.length) b = b.or(orClause("subcategory", multi.subcategory));
  if (multi.color.length) b = b.or(orClause("color", multi.color));
  if (multi.material.length) b = b.or(orClause("material", multi.material));
  return b;
}

function applyParsed(builder: any, q: ParsedQuery) {
  let b = builder;
  if (q.vendor) b = b.ilike("brand", q.vendor);
  if (q.productType) {
    const t = q.productType;
    b = b.or(`category.ilike.${t},subcategory.ilike.${t},subsubcategory.ilike.${t}`);
  }
  if (q.available) b = b.eq("in_stock", true);
  if (q.free) {
    const t = `%${q.free}%`;
    b = b.or(`name.ilike.${t},brand.ilike.${t},category.ilike.${t},subcategory.ilike.${t},subsubcategory.ilike.${t}`);
  }
  return b;
}

function applySort(builder: any, sortKey?: string, reverse?: boolean) {
  const ascDefault = !reverse;
  switch ((sortKey ?? "BEST_SELLING").toUpperCase()) {
    case "PRICE":
      return builder.order("retail_price", { ascending: ascDefault, nullsFirst: false });
    case "TITLE":
      return builder.order("name", { ascending: ascDefault, nullsFirst: false });
    case "CREATED":
    case "CREATED_AT":
      return builder.order("modified_at", { ascending: ascDefault, nullsFirst: false });
    case "RELEVANCE":
    case "BEST_SELLING":
    default:
      return builder
        .order("in_stock", { ascending: false })
        .order("total_stock", { ascending: false })
        .order("modified_at", { ascending: false, nullsFirst: false });
  }
}

// ── Core list fetcher ───────────────────────────────────────────────────────
async function listProducts(opts: {
  first: number;
  after?: string | null;
  query?: string | null;
  filters?: object[];
  sortKey?: string;
  reverse?: boolean;
}): Promise<{ edges: ShopifyProduct[]; pageInfo: { hasNextPage: boolean; endCursor: string | null } }> {
  const offset = decodeCursor(opts.after);
  const first = Math.max(1, Math.min(opts.first, 250));
  let b: any = supabase.from("bg_products").select(PRODUCT_COLUMNS);
  b = applyParsed(b, parseQuery(opts.query));
  b = applyFilters(b, opts.filters);
  b = applySort(b, opts.sortKey, opts.reverse);
  b = b.range(offset, offset + first); // fetch +1 to detect next page
  const { data, error } = await b;
  if (error) { console.error("bg_products list error:", error); return { edges: [], pageInfo: { hasNextPage: false, endCursor: null } }; }
  const rows = (data ?? []) as BgProductRow[];
  const hasNext = rows.length > first;
  const slice = hasNext ? rows.slice(0, first) : rows;
  const groupSkus = slice.map((r) => r.group_sku);
  const { data: variantRows } = groupSkus.length
    ? await supabase
      .from("bg_variants")
      .select("product_sku,group_sku,size,quantity")
      .in("group_sku", groupSkus)
    : { data: [] };
  const variantsByGroup = new Map<string, BgVariantRow[]>();
  for (const v of (variantRows ?? []) as BgVariantRow[]) {
    const list = variantsByGroup.get(v.group_sku) ?? [];
    list.push(v);
    variantsByGroup.set(v.group_sku, list);
  }
  const gidBySku = await fetchVariantMap(((variantRows ?? []) as BgVariantRow[]).map((v) => v.product_sku));
  return {
    edges: slice.map((r) => ({ node: applyVariantMap(rowToNode(r, variantsByGroup.get(r.group_sku)), gidBySku) })),
    pageInfo: { hasNextPage: hasNext, endCursor: hasNext ? encodeCursor(offset + first) : null },
  };
}

// ── Public API: list ────────────────────────────────────────────────────────
export async function fetchProducts(opts: { first?: number; after?: string | null; query?: string; sortKey?: string; reverse?: boolean } = {}) {
  const { edges } = await listProducts({
    first: opts.first ?? 24, after: opts.after ?? null,
    query: opts.query ?? null, sortKey: opts.sortKey, reverse: opts.reverse,
  });
  return edges;
}

export async function fetchProductsPage(opts: { first?: number; after?: string | null; query?: string; sortKey?: string; reverse?: boolean } = {}) {
  return listProducts({
    first: opts.first ?? 48, after: opts.after ?? null,
    query: opts.query ?? null, sortKey: opts.sortKey, reverse: opts.reverse,
  });
}

// ── Public API: PDP ─────────────────────────────────────────────────────────
export async function fetchProductByHandle(handle: string): Promise<ShopifyProductNode | null> {
  const { data: pRow, error: pErr } = await supabase
    .from("bg_products").select(PRODUCT_COLUMNS).eq("handle", handle).maybeSingle();
  if (pErr) { console.error("bg_products byHandle error:", pErr); return null; }
  if (!pRow) return null;
  const product = pRow as BgProductRow;
  const { data: vRows } = await supabase
    .from("bg_variants").select("product_sku,group_sku,size,quantity")
    .eq("group_sku", product.group_sku).order("size");
  const variants = (vRows ?? []) as BgVariantRow[];

  // Enrich with real Shopify variant GIDs so cart → cartCreate works.
  const gidBySku = await fetchVariantMap(variants.map((v) => v.product_sku));
  return applyVariantMap(rowToNode(product, variants), gidBySku);
}

// ── Public API: collections ─────────────────────────────────────────────────
// Synthesised collections — built from gender + category combinations so
// existing collection routes keep working without a Shopify collections table.
type CollectionDef = {
  handle: string;
  title: string;
  description: string;
  filter: ParsedQuery & {
    gender?: string;
    category?: string;
    subcategory?: string;
    subsubcategory?: string;
    /** Match if `subcategory` ILIKE any of these. Lets one nav bucket span
     *  several BG subcategories (e.g. "tshirts-polos" -> T-Shirts + Polo). */
    subcategoryIn?: string[];
    /** Match if `category` ILIKE any of these. */
    categoryIn?: string[];
  };
};

function slug(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

// Shortcuts for building the nav handle list below.
const W = (handle: string, title: string, description: string, filter: CollectionDef["filter"]): CollectionDef =>
  ({ handle, title, description, filter: { gender: "Women", ...filter } });
const M = (handle: string, title: string, description: string, filter: CollectionDef["filter"]): CollectionDef =>
  ({ handle, title, description, filter: { gender: "Men", ...filter } });

const STATIC_COLLECTIONS: CollectionDef[] = [
  { handle: "best-sellers", title: "Best Sellers", description: "The pieces our clients reach for most.", filter: { available: true } },
  { handle: "new-arrivals", title: "New Arrivals", description: "Latest additions to the boutique.", filter: { available: true } },
  
  { handle: "women", title: "Women", description: "Womenswear edit.", filter: { gender: "Women" } },
  { handle: "men", title: "Men", description: "Menswear edit.", filter: { gender: "Men" } },
  { handle: "kids", title: "Kids", description: "Childrenswear.", filter: { gender: "Kids" } },
  { handle: "unisex", title: "Unisex", description: "Pieces for everyone.", filter: { gender: "Unisex" } },
  // Top-level categories
  { handle: "clothing", title: "Clothing", description: "Ready-to-wear across every house.", filter: { category: "Clothing" } },
  { handle: "shoes", title: "Shoes", description: "Footwear from sneakers to soirée.", filter: { category: "Shoes" } },
  { handle: "accessories", title: "Accessories", description: "Bags, belts, jewellery, eyewear.", filter: { categoryIn: ["Accessories", "Bags"] } },
  // Legacy short aliases kept for any pre-existing inbound link.
  { handle: "women-clothing", title: "Women's Clothing", description: "Women's ready-to-wear.", filter: { gender: "Women", category: "Clothing" } },
  { handle: "women-shoes", title: "Women's Shoes", description: "Women's footwear.", filter: { gender: "Women", category: "Shoes" } },
  { handle: "women-accessories", title: "Women's Accessories", description: "Women's accessories.", filter: { gender: "Women", categoryIn: ["Accessories", "Bags"] } },
  { handle: "men-clothing", title: "Men's Clothing", description: "Men's ready-to-wear.", filter: { gender: "Men", category: "Clothing" } },
  { handle: "men-shoes", title: "Men's Shoes", description: "Men's footwear.", filter: { gender: "Men", category: "Shoes" } },
  { handle: "men-accessories", title: "Men's Accessories", description: "Men's accessories.", filter: { gender: "Men", categoryIn: ["Accessories", "Bags"] } },

  // ── Women — possessive-form nav handles ──────────────────────────────────
  W("womens-clothing",    "Women's Clothing",     "Women's ready-to-wear from every house.",                { category: "Clothing" }),
  W("womens-shoes",       "Women's Shoes",        "Women's footwear from sneakers to soirée.",              { category: "Shoes" }),
  W("womens-accessories", "Women's Accessories",  "Women's bags, belts, jewellery and eyewear.",            { categoryIn: ["Accessories", "Bags"] }),
  W("womens-bags",        "Women's Bags",         "Handbags, shoulder bags, crossbody and clutches.",       { categoryIn: ["Bags"], subcategoryIn: ["Handbags", "Shoulder Bags", "Crossbody Bags", "Clutch Bags", "Backpacks", "Belt Bags"] }),
  W("womens-wallets",     "Women's Wallets",      "Small leather goods and cardholders.",                   { subcategoryIn: ["Wallets"] }),
  W("womens-belts",       "Women's Belts",        "Leather belts and waist accessories.",                   { subcategoryIn: ["Belts"] }),
  W("womens-jewelry",     "Women's Jewellery",    "Fine and fashion jewellery.",                            { subcategoryIn: ["Jewellery"] }),
  W("womens-watches",     "Women's Watches",      "Wristwatches from celebrated maisons.",                  { subcategoryIn: ["Watches"] }),
  W("womens-scarves",     "Women's Scarves & Shawls", "Silk scarves, shawls and wraps.",                    { subcategoryIn: ["Scarves"] }),
  W("womens-hats",        "Women's Hats",         "Hats, caps and headwear.",                               { subcategoryIn: ["Hats"] }),
  W("womens-sunglasses",  "Women's Sunglasses",   "Sunglasses and optical eyewear.",                        { subcategoryIn: ["Glasses and Sunglasses"] }),
  W("womens-dresses",     "Women's Dresses",      "Day dresses, gowns and slips.",                          { subcategoryIn: ["Dresses"] }),
  W("womens-jackets",     "Women's Jackets & Coats", "Outerwear from light layers to tailored coats.",      { subcategoryIn: ["Jackets", "Jackets & Coats"] }),
  W("womens-knitwear",    "Women's Knitwear",     "Sweaters, cardigans and knit pieces.",                   { subcategoryIn: ["Sweaters"] }),
  W("womens-tops",        "Women's Tops & Shirts","Shirts, blouses and T-shirts.",                          { subcategoryIn: ["Shirts", "T-Shirts"] }),
  W("womens-pants",       "Women's Pants & Trousers", "Trousers, tailored pants and jeans.",                { subcategoryIn: ["Pants", "Jeans Denim"] }),
  W("womens-skirts",      "Women's Skirts",       "Mini, midi and maxi skirts.",                            { subcategoryIn: ["Skirts"] }),
  W("womens-shorts",      "Women's Shorts",       "Tailored and casual shorts.",                            { subcategoryIn: ["Shorts"] }),
  W("womens-swimwear",    "Women's Swimwear",     "Swimsuits, bikinis and beachwear.",                      { subcategoryIn: ["Swimwear"] }),
  W("womens-sportswear",  "Women's Sportswear",   "Performance and athleisure.",                            { subcategoryIn: ["Sportswear"] }),
  W("womens-underwear",   "Women's Underwear & Loungewear", "Lingerie, loungewear and sleepwear.",          { subcategoryIn: ["Underwear", "Sleepwear"] }),
  W("womens-suits",       "Women's Suits",        "Tailored suits and separates.",                          { subcategoryIn: ["Suits"] }),
  W("womens-sneakers",    "Women's Sneakers",     "Designer sneakers and trainers.",                        { subcategoryIn: ["Sneakers"] }),
  W("womens-boots",       "Women's Boots",        "Ankle boots, knee-high boots and booties.",              { subcategoryIn: ["Boots"] }),
  W("womens-sandals",     "Women's Sandals",      "Flat sandals, slides and heeled sandals.",               { subcategoryIn: ["Sandals"] }),
  W("womens-pumps",       "Women's Pumps & Heels","Pumps, heels and elevated evening shoes.",               { subcategoryIn: ["Pumps"] }),
  W("womens-flats",       "Women's Flats",        "Ballet flats, loafers and flat shoes.",                  { subcategoryIn: ["Flats"] }),

  // ── Men — possessive-form nav handles ────────────────────────────────────
  M("mens-clothing",       "Men's Clothing",      "Men's ready-to-wear from every house.",                  { category: "Clothing" }),
  M("mens-shoes",          "Men's Shoes",         "Men's footwear from sneakers to dress.",                 { category: "Shoes" }),
  M("mens-accessories",    "Men's Accessories",   "Bags, belts, eyewear and small leather goods.",          { categoryIn: ["Accessories", "Bags"] }),
  M("mens-bags",           "Men's Bags",          "Briefcases, backpacks and travel.",                      { categoryIn: ["Bags"] }),
  M("mens-bags-wallets",   "Men's Bags & Wallets","Bags, backpacks and small leather goods.",               { subcategoryIn: ["Wallets", "Handbags", "Shoulder Bags", "Crossbody Bags", "Clutch Bags", "Backpacks", "Belt Bags", "Luggage and Travel"] }),
  M("mens-belts",          "Men's Belts",         "Leather belts and waist accessories.",                   { subcategoryIn: ["Belts"] }),
  M("mens-watches-jewelry","Men's Watches & Jewellery", "Wristwatches and fine jewellery for men.",         { subcategoryIn: ["Watches", "Jewellery"] }),
  M("mens-sunglasses",     "Men's Sunglasses",    "Sunglasses and optical eyewear.",                        { subcategoryIn: ["Glasses and Sunglasses"] }),
  M("mens-scarves",        "Men's Scarves",       "Silk and wool scarves.",                                 { subcategoryIn: ["Scarves"] }),
  M("mens-hats",           "Men's Hats",          "Hats, caps and headwear.",                               { subcategoryIn: ["Hats"] }),
  M("mens-ties",           "Men's Ties & Formal Accessories", "Ties, bowties and formal accessories.",      { subcategoryIn: ["Ties and Formal Accessories"] }),
  M("mens-suits",          "Men's Suits",         "Two-piece, three-piece and tailored separates.",         { subcategoryIn: ["Suits", "Suits & Blazers", "Blazers"] }),
  M("mens-jackets-coats",  "Men's Jackets & Coats", "Outerwear from light layers to overcoats.",            { subcategoryIn: ["Jackets", "Jackets & Coats"] }),
  M("mens-shirts",         "Men's Shirts",        "Dress shirts, casual shirts and overshirts.",            { subcategoryIn: ["Shirts"] }),
  M("mens-tshirts-polos",  "Men's T-Shirts & Polos", "T-shirts and polos.",                                 { subcategoryIn: ["T-Shirts"] }),
  M("mens-sweaters-knitwear", "Men's Sweaters & Knitwear", "Sweaters, cardigans and knitwear.",             { subcategoryIn: ["Sweaters"] }),
  M("mens-hoodies-sweatshirts", "Men's Hoodies & Sweatshirts", "Hoodies, sweatshirts and athleisure tops.", { subcategoryIn: ["Sportswear"] }),
  M("mens-pants-trousers", "Men's Pants & Trousers", "Trousers, tailored pants and jeans.",                 { subcategoryIn: ["Pants", "Jeans Denim"] }),
  M("mens-shorts",         "Men's Shorts",        "Tailored and casual shorts.",                            { subcategoryIn: ["Shorts", "Short"] }),
  M("mens-activewear",     "Men's Activewear",    "Performance and athleisure.",                            { subcategoryIn: ["Sportswear"] }),
  M("mens-swimwear",       "Men's Swimwear",      "Swim shorts and beachwear.",                             { subcategoryIn: ["Swimwear"] }),
  M("mens-underwear-loungewear", "Men's Underwear & Loungewear", "Underwear, loungewear and sleepwear.",    { subcategoryIn: ["Underwear", "Sleepwear"] }),
  M("mens-sneakers",       "Men's Sneakers",      "Designer sneakers and trainers.",                        { subcategoryIn: ["Sneakers"] }),
  M("mens-boots",          "Men's Boots",         "Chelsea boots, ankle boots and lace-ups.",               { subcategoryIn: ["Boots"] }),
  M("mens-sandals-slides", "Men's Sandals & Slides", "Sandals and slides for warm weather.",                { subcategoryIn: ["Sandals"] }),
  M("mens-loafers",        "Men's Loafers",       "Loafers, moccasins and slip-ons.",                       { subcategoryIn: ["Loafers"] }),
  M("mens-dress-shoes",    "Men's Dress Shoes",   "Oxfords, derbies and formal footwear.",                  { subcategoryIn: ["Oxfords and Derbies"] }),

  // Kids
  { handle: "kids-clothing", title: "Kids' Clothing", description: "Childrenswear from every house.", filter: { gender: "Kids", category: "Clothing" } },
  { handle: "kids-shoes", title: "Kids' Shoes", description: "Children's footwear.", filter: { gender: "Kids", category: "Shoes" } },
  { handle: "kids-accessories", title: "Kids' Accessories", description: "Children's accessories.", filter: { gender: "Kids", categoryIn: ["Accessories", "Bags"] } },
];

let DYNAMIC_COLLECTIONS_CACHE: CollectionDef[] | null = null;
let INVENTORY_DIMENSION_ROWS_CACHE: Array<Pick<BgProductRow, "gender"|"category"|"subcategory"|"subsubcategory">> | null = null;

async function getInventoryDimensionRows(): Promise<Array<Pick<BgProductRow, "gender"|"category"|"subcategory"|"subsubcategory">>> {
  if (INVENTORY_DIMENSION_ROWS_CACHE) return INVENTORY_DIMENSION_ROWS_CACHE;
  const rows: Array<Pick<BgProductRow, "gender"|"category"|"subcategory"|"subsubcategory">> = [];
  const pageSize = 1000;
  for (let offset = 0; offset < 80000; offset += pageSize) {
    const { data, error } = await supabase
      .from("bg_products")
      .select("gender,category,subcategory,subsubcategory")
      .eq("in_stock", true)
      .range(offset, offset + pageSize - 1);
    if (error) {
      console.error("bg dynamic collections fetch error:", error);
      break;
    }
    const page = (data ?? []) as Array<Pick<BgProductRow, "gender"|"category"|"subcategory"|"subsubcategory">>;
    rows.push(...page);
    if (page.length < pageSize) break;
  }
  INVENTORY_DIMENSION_ROWS_CACHE = rows;
  return INVENTORY_DIMENSION_ROWS_CACHE;
}

async function getDynamicCollections(): Promise<CollectionDef[]> {
  if (DYNAMIC_COLLECTIONS_CACHE) return DYNAMIC_COLLECTIONS_CACHE;
  const rows = await getInventoryDimensionRows();
  const subSet = new Map<string, CollectionDef>();
  for (const r of rows) {
    if (r.gender && r.subcategory) {
      const h = `${slug(r.gender)}-${slug(r.subcategory)}`;
      if (!subSet.has(h)) {
        subSet.set(h, {
          handle: h,
          title: `${r.gender} · ${r.subcategory}`,
          description: `${r.gender}'s ${r.subcategory.toLowerCase()}.`,
          filter: { gender: r.gender, subcategory: r.subcategory },
        });
      }
    }
    if (r.subsubcategory) {
      const h = slug(r.subsubcategory);
      if (!subSet.has(h)) {
        subSet.set(h, {
          handle: h,
          title: r.subsubcategory,
          description: `${r.subsubcategory} across every maison.`,
          filter: { subsubcategory: r.subsubcategory },
        });
      }
    }
  }
  DYNAMIC_COLLECTIONS_CACHE = Array.from(subSet.values());
  return DYNAMIC_COLLECTIONS_CACHE;
}

async function resolveCollection(handle: string): Promise<CollectionDef | null> {
  const stat = STATIC_COLLECTIONS.find((c) => c.handle === handle);
  if (stat) return stat;
  const dyn = await getDynamicCollections();
  return dyn.find((c) => c.handle === handle) ?? null;
}

function applyCollectionFilter(builder: any, def: CollectionDef): any {
  let b = builder;
  const f = def.filter;
  if (f.gender) b = b.ilike("gender", f.gender);
  if (f.category) b = b.ilike("category", f.category);
  if (f.subcategory) b = b.ilike("subcategory", f.subcategory);
  if (f.subsubcategory) b = b.ilike("subsubcategory", f.subsubcategory);
  if (f.subcategoryIn && f.subcategoryIn.length > 0) {
    const clause = f.subcategoryIn
      .map((s) => `subcategory.ilike.${s.replace(/,/g, " ")}`)
      .join(",");
    b = b.or(clause);
  }
  if (f.categoryIn && f.categoryIn.length > 0) {
    const clause = f.categoryIn
      .map((s) => `category.ilike.${s.replace(/,/g, " ")}`)
      .join(",");
    b = b.or(clause);
  }
  if (f.available) b = b.eq("in_stock", true);
  return b;
}

function collectionImageNode(def: CollectionDef): ShopifyImage | null {
  // Real hero images come from collection_images table elsewhere; return null
  // here so collection-image helpers fall back to their curated artwork.
  void def;
  return null;
}

function defToShopify(def: CollectionDef, productCount?: number): ShopifyCollection {
  return {
    id: `bg-collection:${def.handle}`,
    title: def.title,
    handle: def.handle,
    description: def.description,
    image: collectionImageNode(def),
    updatedAt: new Date().toISOString(),
    productCount,
  };
}

export async function fetchCollection(handle: string, first = 36) {
  const def = await resolveCollection(handle);
  if (!def) return null;
  let b: any = supabase.from("bg_products").select(PRODUCT_COLUMNS);
  b = applyCollectionFilter(b, def);
  b = applySort(b, "BEST_SELLING", false).range(0, first - 1);
  const { data } = await b;
  const rows = (data ?? []) as BgProductRow[];
  const groupSkus = rows.map((r) => r.group_sku);
  const { data: variantRows } = groupSkus.length
    ? await supabase
      .from("bg_variants")
      .select("product_sku,group_sku,size,quantity")
      .in("group_sku", groupSkus)
    : { data: [] };
  const variantsByGroup = new Map<string, BgVariantRow[]>();
  for (const v of (variantRows ?? []) as BgVariantRow[]) {
    const list = variantsByGroup.get(v.group_sku) ?? [];
    list.push(v);
    variantsByGroup.set(v.group_sku, list);
  }
  const gidBySku = await fetchVariantMap(((variantRows ?? []) as BgVariantRow[]).map((v) => v.product_sku));
  return {
    ...defToShopify(def),
    products: { edges: rows.map((r) => ({ node: applyVariantMap(rowToNode(r, variantsByGroup.get(r.group_sku)), gidBySku) })) },
  };
}

function rowMatchesCollectionFilter(
  row: Pick<BgProductRow, "gender"|"category"|"subcategory"|"subsubcategory">,
  def: CollectionDef,
): boolean {
  const f = def.filter;
  const same = (a: string | null, b?: string) => !b || (a ?? "").toLowerCase() === b.toLowerCase();
  const inList = (a: string | null, list?: string[]) => !list?.length || list.some((v) => same(a, v));
  return same(row.gender, f.gender)
    && same(row.category, f.category)
    && same(row.subcategory, f.subcategory)
    && same(row.subsubcategory, f.subsubcategory)
    && inList(row.subcategory, f.subcategoryIn)
    && inList(row.category, f.categoryIn);
}

export async function fetchCollections(first = 250): Promise<ShopifyCollection[]> {
  const dyn = await getDynamicCollections();
  const all = [...STATIC_COLLECTIONS, ...dyn];
  const rows = await getInventoryDimensionRows();
  return all
    .map((def) => ({ def, count: rows.filter((row) => rowMatchesCollectionFilter(row, def)).length }))
    .filter(({ count }) => count > 0)
    .slice(0, first)
    .map(({ def, count }) => defToShopify(def, count));
}

export async function fetchCollectionFiltered(opts: {
  handle: string; first?: number; after?: string | null;
  filters?: object[]; sortKey?: string; reverse?: boolean;
}): Promise<FilteredResult | null> {
  const def = await resolveCollection(opts.handle);
  if (!def) return null;
  const first = opts.first ?? 24;
  const offset = decodeCursor(opts.after);

  let b: any = supabase.from("bg_products").select(PRODUCT_COLUMNS);
  b = applyCollectionFilter(b, def);
  b = applyFilters(b, opts.filters);
  b = applySort(b, opts.sortKey, opts.reverse).range(offset, offset + first);
  const { data, error } = await b;
  if (error) console.error("bg fetchCollectionFiltered error:", error);
  const rows = (data ?? []) as BgProductRow[];
  const hasNext = rows.length > first;
  const slice = hasNext ? rows.slice(0, first) : rows;
  const groupSkus = slice.map((r) => r.group_sku);
  const { data: variantRows } = groupSkus.length
    ? await supabase
      .from("bg_variants")
      .select("product_sku,group_sku,size,quantity")
      .in("group_sku", groupSkus)
    : { data: [] };
  const variantsByGroup = new Map<string, BgVariantRow[]>();
  for (const v of (variantRows ?? []) as BgVariantRow[]) {
    const list = variantsByGroup.get(v.group_sku) ?? [];
    list.push(v);
    variantsByGroup.set(v.group_sku, list);
  }
  const gidBySku = await fetchVariantMap(((variantRows ?? []) as BgVariantRow[]).map((v) => v.product_sku));

  // Filter aggregates: top vendors within this collection
  let agg: any = supabase.from("bg_products").select("brand").eq("in_stock", true);
  agg = applyCollectionFilter(agg, def).not("brand", "is", null).limit(2000);
  const { data: brandRows } = await agg;
  const vendorCount = new Map<string, number>();
  for (const r of (brandRows ?? []) as Array<{ brand: string }>) vendorCount.set(r.brand, (vendorCount.get(r.brand) ?? 0) + 1);
  const vendorValues: StorefrontFilterValue[] = Array.from(vendorCount.entries())
    .sort((a, b) => b[1] - a[1]).slice(0, 30)
    .map(([brand, count]) => ({
      id: `vendor:${brand}`, label: brand, count,
      input: JSON.stringify({ productVendor: brand }),
    }));

  const filters: StorefrontFilter[] = [
    { id: "filter.v.availability", label: "Availability", type: "BOOLEAN", values: [
      { id: "available:true", label: "In stock", count: vendorCount.size > 0 ? Array.from(vendorCount.values()).reduce((a,b)=>a+b,0) : 0, input: JSON.stringify({ available: true }) },
    ]},
    { id: "filter.p.vendor", label: "Designer", type: "LIST", values: vendorValues },
  ];

  return {
    collection: defToShopify(def),
    filters,
    edges: slice.map((r) => ({ node: applyVariantMap(rowToNode(r, variantsByGroup.get(r.group_sku)), gidBySku) })),
    pageInfo: { hasNextPage: hasNext, endCursor: hasNext ? encodeCursor(offset + first) : null },
  };
}

export async function fetchSearchFiltered(opts: {
  query?: string; first?: number; after?: string | null;
  filters?: object[]; sortKey?: string; reverse?: boolean;
}): Promise<Omit<FilteredResult, "collection">> {
  const first = opts.first ?? 24;
  const offset = decodeCursor(opts.after);
  let b: any = supabase.from("bg_products").select(PRODUCT_COLUMNS);
  if (opts.query && opts.query !== "*") b = applyParsed(b, parseQuery(opts.query));
  b = applyFilters(b, opts.filters);
  b = applySort(b, opts.sortKey ?? "RELEVANCE", opts.reverse).range(offset, offset + first);
  const { data, error } = await b;
  if (error) console.error("bg fetchSearchFiltered error:", error);
  const rows = (data ?? []) as BgProductRow[];
  const hasNext = rows.length > first;
  const slice = hasNext ? rows.slice(0, first) : rows;
  const groupSkus = slice.map((r) => r.group_sku);
  const { data: variantRows } = groupSkus.length
    ? await supabase
      .from("bg_variants")
      .select("product_sku,group_sku,size,quantity")
      .in("group_sku", groupSkus)
    : { data: [] };
  const variantsByGroup = new Map<string, BgVariantRow[]>();
  for (const v of (variantRows ?? []) as BgVariantRow[]) {
    const list = variantsByGroup.get(v.group_sku) ?? [];
    list.push(v);
    variantsByGroup.set(v.group_sku, list);
  }
  const gidBySku = await fetchVariantMap(((variantRows ?? []) as BgVariantRow[]).map((v) => v.product_sku));
  return {
    filters: [],
    edges: slice.map((r) => ({ node: applyVariantMap(rowToNode(r, variantsByGroup.get(r.group_sku)), gidBySku) })),
    pageInfo: { hasNextPage: hasNext, endCursor: hasNext ? encodeCursor(offset + first) : null },
  };
}

// ── Vendor index (used by /brands and megamenu) ─────────────────────────────
let VENDOR_INDEX_CACHE: Array<{ vendor: string; count: number }> | null = null;

export async function fetchVendorIndex(_maxPages = 4, _perPage = 250): Promise<Array<{ vendor: string; count: number }>> {
  if (VENDOR_INDEX_CACHE) return VENDOR_INDEX_CACHE;
  // Walk in chunks because Supabase caps a single request at 1000 rows.
  const counts = new Map<string, number>();
  const PAGE = 1000;
  for (let offset = 0; offset < 80000; offset += PAGE) {
    const { data, error } = await supabase
      .from("bg_products").select("brand")
      .eq("in_stock", true).not("brand", "is", null)
      .range(offset, offset + PAGE - 1);
    if (error) { console.error("vendor index error:", error); break; }
    const rows = (data ?? []) as Array<{ brand: string | null }>;
    if (rows.length === 0) break;
    for (const r of rows) if (r.brand) counts.set(r.brand, (counts.get(r.brand) ?? 0) + 1);
    if (rows.length < PAGE) break;
  }
  VENDOR_INDEX_CACHE = Array.from(counts.entries())
    .map(([vendor, count]) => ({ vendor, count }))
    .sort((a, b) => b.count - a.count);
  return VENDOR_INDEX_CACHE;
}

// ── Money formatting (unchanged) ────────────────────────────────────────────
export function formatPrice(money: Money | undefined) {
  if (!money) return "";
  const amount = parseFloat(money.amount);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: money.currencyCode || "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}
