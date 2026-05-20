// BrandsGateway snapshot adapter — preserves the `Shopify*` API surface so
// existing pages (product cards, collections, megamenu, brand index) keep
// working unchanged. Data source: public.bg_products + public.bg_variants
// in Lovable Cloud, seeded from the BrandsGateway CSV v7 snapshot.
// Temporary: swap internals for the live BrandsGateway REST API once the
// dropshipper token is provisioned.
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Kept for compatibility with cart-store which references these constants.
export const SHOPIFY_API_VERSION = "2025-07";
export const SHOPIFY_STORE_PERMANENT_DOMAIN = "i1w7wx-gu.myshopify.com";
export const SHOPIFY_STOREFRONT_URL = `https://${SHOPIFY_STORE_PERMANENT_DOMAIN}/api/${SHOPIFY_API_VERSION}/graphql.json`;
export const SHOPIFY_STOREFRONT_TOKEN = "fe3b8c80fa66fbfd3c0bbe7a10ccd6b0";
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

// ── Storefront stub (cart-store calls this; snapshot mode has no Shopify) ───
export async function storefrontApiRequest<T = unknown>(): Promise<{ data?: T } | undefined> {
  toast.error("Checkout is not connected", {
    description: "This is a catalog snapshot. Checkout will activate once the BrandsGateway API + payments are wired.",
  });
  return undefined;
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

const PRODUCT_COLUMNS =
  "id,handle,group_sku,brand,name,description,description_plain,gender,category,subcategory,subsubcategory,color,material,main_picture,pictures,retail_price,currency,in_stock,total_stock";

function priceMoney(amount: number | string | null, currency: string | null): Money {
  const n = typeof amount === "string" ? parseFloat(amount) : (amount ?? 0);
  return { amount: (Number.isFinite(n) ? n : 0).toFixed(2), currencyCode: currency || "EUR" };
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
function applyFilters(builder: any, filters: FilterInput[] | undefined) {
  if (!filters || filters.length === 0) return builder;
  let b = builder;
  for (const f of filters) {
    if (typeof f.available === "boolean") {
      if (f.available) b = b.eq("in_stock", true);
    }
    if (typeof f.productVendor === "string") b = b.ilike("brand", f.productVendor);
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
  filters?: FilterInput[];
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
  return {
    edges: slice.map((r) => ({ node: rowToNode(r) })),
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
  return rowToNode(product, (vRows ?? []) as BgVariantRow[]);
}

// ── Public API: collections ─────────────────────────────────────────────────
// Synthesised collections — built from gender + category combinations so
// existing collection routes keep working without a Shopify collections table.
type CollectionDef = {
  handle: string;
  title: string;
  description: string;
  filter: ParsedQuery & { gender?: string; category?: string; subcategory?: string; subsubcategory?: string };
};

function slug(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

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
  { handle: "accessories", title: "Accessories", description: "Bags, belts, jewellery, eyewear.", filter: { category: "Accessories" } },
  // Common gender × category crosses
  { handle: "women-clothing", title: "Women · Clothing", description: "Women's ready-to-wear.", filter: { gender: "Women", category: "Clothing" } },
  { handle: "women-shoes", title: "Women · Shoes", description: "Women's footwear.", filter: { gender: "Women", category: "Shoes" } },
  { handle: "women-accessories", title: "Women · Accessories", description: "Women's accessories.", filter: { gender: "Women", category: "Accessories" } },
  { handle: "men-clothing", title: "Men · Clothing", description: "Men's ready-to-wear.", filter: { gender: "Men", category: "Clothing" } },
  { handle: "men-shoes", title: "Men · Shoes", description: "Men's footwear.", filter: { gender: "Men", category: "Shoes" } },
  { handle: "men-accessories", title: "Men · Accessories", description: "Men's accessories.", filter: { gender: "Men", category: "Accessories" } },
];

let DYNAMIC_COLLECTIONS_CACHE: CollectionDef[] | null = null;

async function getDynamicCollections(): Promise<CollectionDef[]> {
  if (DYNAMIC_COLLECTIONS_CACHE) return DYNAMIC_COLLECTIONS_CACHE;
  // Pull the most common subcategories per gender from a sample of rows
  // (a full GROUP BY would need an RPC; sample is acceptable for nav).
  const { data } = await supabase
    .from("bg_products").select("gender,category,subcategory,subsubcategory")
    .eq("in_stock", true).limit(5000);
  const rows = (data ?? []) as Array<Pick<BgProductRow, "gender"|"category"|"subcategory"|"subsubcategory">>;
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
  if (f.available) b = b.eq("in_stock", true);
  return b;
}

function collectionImageNode(def: CollectionDef): ShopifyImage | null {
  // Real hero images come from collection_images table elsewhere; return null
  // here so collection-image helpers fall back to their curated artwork.
  void def;
  return null;
}

function defToShopify(def: CollectionDef): ShopifyCollection {
  return {
    id: `bg-collection:${def.handle}`,
    title: def.title,
    handle: def.handle,
    description: def.description,
    image: collectionImageNode(def),
    updatedAt: new Date().toISOString(),
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
  return {
    ...defToShopify(def),
    products: { edges: rows.map((r) => ({ node: rowToNode(r) })) },
  };
}

export async function fetchCollections(first = 50): Promise<ShopifyCollection[]> {
  const dyn = await getDynamicCollections();
  const all = [...STATIC_COLLECTIONS, ...dyn];
  return all.slice(0, first).map(defToShopify);
}

export async function fetchCollectionFiltered(opts: {
  handle: string; first?: number; after?: string | null;
  filters?: FilterInput[]; sortKey?: string; reverse?: boolean;
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
    edges: slice.map((r) => ({ node: rowToNode(r) })),
    pageInfo: { hasNextPage: hasNext, endCursor: hasNext ? encodeCursor(offset + first) : null },
  };
}

export async function fetchSearchFiltered(opts: {
  query?: string; first?: number; after?: string | null;
  filters?: FilterInput[]; sortKey?: string; reverse?: boolean;
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
  return {
    filters: [],
    edges: slice.map((r) => ({ node: rowToNode(r) })),
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
    currency: money.currencyCode || "EUR",
    maximumFractionDigits: 0,
  }).format(amount);
}
