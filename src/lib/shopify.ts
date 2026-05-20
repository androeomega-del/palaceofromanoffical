// Direct Shopify Storefront API client.
// Source of truth for products, prices, inventory, and collections is now
// Shopify (mwuwqi-vy.myshopify.com). The BrandsGateway Supabase snapshot
// (bg_products / bg_variants / shopify_variant_map) is no longer read by the
// storefront — those tables remain in the DB for admin/ops use only.
//
// Per product decision: we do NOT fall back to BG-synthesized collections.
// A collection handle that does not exist in Shopify returns null; pages
// handle that as a 404. Add the collection in Shopify Admin to make it live.
import { toast } from "sonner";

export const SHOPIFY_API_VERSION = "2025-07";
export const SHOPIFY_STORE_PERMANENT_DOMAIN = "mwuwqi-vy.myshopify.com";
export const SHOPIFY_STOREFRONT_URL = `https://${SHOPIFY_STORE_PERMANENT_DOMAIN}/api/${SHOPIFY_API_VERSION}/graphql.json`;
export const SHOPIFY_STOREFRONT_TOKEN = "3b02ce4f61d642096147b804ec7ba962";
export const EXCLUDE_QUERY = "";

// Legacy query-string export stubs (kept for any leftover imports).
export const PRODUCTS_QUERY = "";
export const PRODUCT_BY_HANDLE_QUERY = "";
export const COLLECTION_BY_HANDLE_QUERY = "";
export const COLLECTIONS_QUERY = "";
export const COLLECTION_FILTERED_QUERY = "";
export const SEARCH_FILTERED_QUERY = "";

// ── Types (preserved shape — existing callers don't change) ─────────────────
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

// ── Storefront API client ───────────────────────────────────────────────────
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
      return undefined;
    }
    const json = await res.json();
    if (json.errors) {
      console.error("Storefront API GraphQL errors", json.errors);
      return undefined;
    }
    return json as { data?: T };
  } catch (err) {
    console.error("Storefront API fetch failed", err);
    return undefined;
  }
}

// ── GraphQL fragments ───────────────────────────────────────────────────────
const PRODUCT_FRAGMENT = `
  fragment ProductFields on Product {
    id
    title
    description
    handle
    vendor
    productType
    priceRange { minVariantPrice { amount currencyCode } }
    compareAtPriceRange { minVariantPrice { amount currencyCode } }
    images(first: 8) { edges { node { url altText width height } } }
    variants(first: 50) {
      edges {
        node {
          id
          title
          price { amount currencyCode }
          availableForSale
          selectedOptions { name value }
        }
      }
    }
    options { name values }
  }
`;

// ── Sort key translators ────────────────────────────────────────────────────
type ProductSortKey = "TITLE" | "PRICE" | "BEST_SELLING" | "CREATED_AT" | "RELEVANCE" | "VENDOR" | "ID" | "PRODUCT_TYPE";
type CollectionSortKey = "TITLE" | "PRICE" | "BEST_SELLING" | "CREATED" | "ID" | "MANUAL" | "COLLECTION_DEFAULT" | "RELEVANCE";

function toProductSortKey(s?: string): ProductSortKey {
  switch ((s ?? "BEST_SELLING").toUpperCase()) {
    case "PRICE": return "PRICE";
    case "TITLE": return "TITLE";
    case "CREATED":
    case "CREATED_AT": return "CREATED_AT";
    case "VENDOR": return "VENDOR";
    case "RELEVANCE": return "RELEVANCE";
    case "BEST_SELLING":
    default: return "BEST_SELLING";
  }
}
function toCollectionSortKey(s?: string): CollectionSortKey {
  switch ((s ?? "BEST_SELLING").toUpperCase()) {
    case "PRICE": return "PRICE";
    case "TITLE": return "TITLE";
    case "CREATED":
    case "CREATED_AT": return "CREATED";
    case "RELEVANCE": return "RELEVANCE";
    case "MANUAL": return "MANUAL";
    case "COLLECTION_DEFAULT": return "COLLECTION_DEFAULT";
    case "BEST_SELLING":
    default: return "BEST_SELLING";
  }
}

// ── ProductFilter translator ────────────────────────────────────────────────
// Accepts existing filter inputs (productVendor, available, price, productType,
// tag, variantOption) and outputs a Storefront ProductFilter array. Legacy
// BG-only inputs (gender, category, subcategory, color, material) are dropped
// here — Shopify exposes those via collection.products.filters dynamically.
function toProductFilters(raw?: object[]): Record<string, unknown>[] {
  if (!raw || raw.length === 0) return [];
  const out: Record<string, unknown>[] = [];
  for (const f of raw as Array<Record<string, unknown>>) {
    if (typeof f.available === "boolean") out.push({ available: f.available });
    if (typeof f.productVendor === "string") out.push({ productVendor: f.productVendor });
    if (typeof f.productType === "string") out.push({ productType: f.productType });
    if (typeof f.tag === "string") out.push({ tag: f.tag });
    if (f.price && typeof f.price === "object") out.push({ price: f.price });
    if (f.variantOption && typeof f.variantOption === "object") out.push({ variantOption: f.variantOption });
  }
  return out;
}

// ── Product list ────────────────────────────────────────────────────────────
const PRODUCTS_LIST = `
  ${PRODUCT_FRAGMENT}
  query Products($first: Int!, $after: String, $query: String, $sortKey: ProductSortKeys, $reverse: Boolean) {
    products(first: $first, after: $after, query: $query, sortKey: $sortKey, reverse: $reverse) {
      edges { cursor node { ...ProductFields } }
      pageInfo { hasNextPage endCursor }
    }
  }
`;

export async function fetchProducts(opts: { first?: number; after?: string | null; query?: string; sortKey?: string; reverse?: boolean } = {}) {
  const page = await fetchProductsPage(opts);
  return page.edges;
}

export async function fetchProductsPage(opts: { first?: number; after?: string | null; query?: string; sortKey?: string; reverse?: boolean } = {}) {
  const res = await storefrontApiRequest<{
    products: {
      edges: Array<{ node: ShopifyProductNode }>;
      pageInfo: { hasNextPage: boolean; endCursor: string | null };
    };
  }>(PRODUCTS_LIST, {
    first: Math.min(opts.first ?? 48, 250),
    after: opts.after ?? null,
    query: opts.query ?? null,
    sortKey: toProductSortKey(opts.sortKey),
    reverse: opts.reverse ?? false,
  });
  if (!res?.data) return { edges: [], pageInfo: { hasNextPage: false, endCursor: null } };
  return {
    edges: res.data.products.edges.map(({ node }) => ({ node })),
    pageInfo: res.data.products.pageInfo,
  };
}

// ── Product by handle ───────────────────────────────────────────────────────
const PRODUCT_BY_HANDLE = `
  ${PRODUCT_FRAGMENT}
  query ProductByHandle($handle: String!) {
    productByHandle(handle: $handle) { ...ProductFields }
  }
`;

export async function fetchProductByHandle(handle: string): Promise<ShopifyProductNode | null> {
  const res = await storefrontApiRequest<{ productByHandle: ShopifyProductNode | null }>(
    PRODUCT_BY_HANDLE,
    { handle },
  );
  return res?.data?.productByHandle ?? null;
}

// ── Collections list ────────────────────────────────────────────────────────
// Storefront API does not expose productCount on Collection; we ask for a
// single sentinel product to flag "has products" (1) vs "empty" (0). If a
// Shopify collection has no collection image, the storefront uses the first
// Shopify product image instead — never Cloud/BG image overrides.
const COLLECTIONS_LIST = `
  query Collections($first: Int!, $after: String) {
    collections(first: $first, after: $after, sortKey: TITLE) {
      pageInfo { hasNextPage endCursor }
      edges {
        node {
          id
          title
          handle
          description
          updatedAt
          image { url altText width height }
          products(first: 1) {
            edges {
              node {
                id
                images(first: 1) { edges { node { url altText width height } } }
              }
            }
          }
        }
      }
    }
  }
`;

interface CollectionListNode {
  id: string;
  title: string;
  handle: string;
  description: string | null;
  updatedAt: string;
  image: ShopifyImage | null;
  products: { edges: Array<{ node: { id: string; images: { edges: Array<{ node: ShopifyImage }> } } }> };
}

/**
 * Fetch up to `max` collections, paginating Shopify's 250-per-page cap so the
 * nav can see every category collection even when the store has hundreds of
 * vendor/brand collections sharing the same list.
 */
export async function fetchCollections(max = 500): Promise<ShopifyCollection[]> {
  const out: ShopifyCollection[] = [];
  let after: string | null = null;
  const pageSize = 250;
  type Page = {
    collections: {
      pageInfo: { hasNextPage: boolean; endCursor: string | null };
      edges: Array<{ node: CollectionListNode }>;
    };
  };
  while (out.length < max) {
    const res: { data?: Page } | null = await storefrontApiRequest<Page>(
      COLLECTIONS_LIST,
      { first: Math.min(pageSize, max - out.length), after },
    );
    if (!res?.data) break;
    const pg = res.data.collections;
    for (const { node } of pg.edges) {
      const firstProductImage = node.products?.edges?.[0]?.node?.images?.edges?.[0]?.node ?? null;
      out.push({
        id: node.id,
        title: node.title,
        handle: node.handle,
        description: node.description ?? "",
        image: node.image ?? firstProductImage,
        updatedAt: node.updatedAt,
        productCount: (node.products?.edges?.length ?? 0) > 0 ? 1 : 0,
      });
    }
    if (!pg.pageInfo.hasNextPage || !pg.pageInfo.endCursor) break;
    after = pg.pageInfo.endCursor;
  }
  return out;
}


// ── Collection by handle (simple list view) ─────────────────────────────────
const COLLECTION_BY_HANDLE = `
  ${PRODUCT_FRAGMENT}
  query CollectionByHandle($handle: String!, $first: Int!) {
    collectionByHandle(handle: $handle) {
      id
      title
      handle
      description
      updatedAt
      image { url altText width height }
      products(first: $first, sortKey: BEST_SELLING) {
        edges { node { ...ProductFields } }
      }
    }
  }
`;

export async function fetchCollection(handle: string, first = 36) {
  const res = await storefrontApiRequest<{
    collectionByHandle: ({
      id: string;
      title: string;
      handle: string;
      description: string | null;
      updatedAt: string;
      image: ShopifyImage | null;
      products: { edges: Array<{ node: ShopifyProductNode }> };
    }) | null;
  }>(COLLECTION_BY_HANDLE, { handle, first: Math.min(first, 250) });
  const c = res?.data?.collectionByHandle;
  if (!c) return null;
  const firstProductImage = c.products.edges[0]?.node.images?.edges?.[0]?.node ?? null;
  return {
    id: c.id,
    title: c.title,
    handle: c.handle,
    description: c.description ?? "",
    image: c.image ?? firstProductImage,
    updatedAt: c.updatedAt,
    products: { edges: c.products.edges.map(({ node }) => ({ node })) },
  };
}

// ── Collection filtered (with facets + pagination) ──────────────────────────
const COLLECTION_FILTERED = `
  ${PRODUCT_FRAGMENT}
  query CollectionFiltered(
    $handle: String!, $first: Int!, $after: String,
    $filters: [ProductFilter!], $sortKey: ProductCollectionSortKeys, $reverse: Boolean
  ) {
    collectionByHandle(handle: $handle) {
      id title handle description updatedAt
      image { url altText width height }
      products(first: $first, after: $after, filters: $filters, sortKey: $sortKey, reverse: $reverse) {
        edges { node { ...ProductFields } }
        pageInfo { hasNextPage endCursor }
        filters {
          id label type
          values { id label count input }
        }
      }
    }
  }
`;

export async function fetchCollectionFiltered(opts: {
  handle: string; first?: number; after?: string | null;
  filters?: object[]; sortKey?: string; reverse?: boolean;
}): Promise<FilteredResult | null> {
  const res = await storefrontApiRequest<{
    collectionByHandle: ({
      id: string;
      title: string;
      handle: string;
      description: string | null;
      updatedAt: string;
      image: ShopifyImage | null;
      products: {
        edges: Array<{ node: ShopifyProductNode }>;
        pageInfo: { hasNextPage: boolean; endCursor: string | null };
        filters: StorefrontFilter[];
      };
    }) | null;
  }>(COLLECTION_FILTERED, {
    handle: opts.handle,
    first: Math.min(opts.first ?? 24, 250),
    after: opts.after ?? null,
    filters: toProductFilters(opts.filters),
    sortKey: toCollectionSortKey(opts.sortKey),
    reverse: opts.reverse ?? false,
  });
  const c = res?.data?.collectionByHandle;
  if (!c) return null;
  const firstProductImage = c.products.edges[0]?.node.images?.edges?.[0]?.node ?? null;
  return {
    collection: {
      id: c.id,
      title: c.title,
      handle: c.handle,
      description: c.description ?? "",
      image: c.image ?? firstProductImage,
      updatedAt: c.updatedAt,
    },
    filters: c.products.filters ?? [],
    edges: c.products.edges.map(({ node }) => ({ node })),
    pageInfo: c.products.pageInfo,
  };
}

// ── Search filtered (used by /shop and search overlay) ──────────────────────
const SEARCH_FILTERED = `
  ${PRODUCT_FRAGMENT}
  query SearchFiltered(
    $query: String!, $first: Int!, $after: String,
    $productFilters: [ProductFilter!], $sortKey: SearchSortKeys, $reverse: Boolean
  ) {
    search(
      query: $query, first: $first, after: $after, types: PRODUCT,
      productFilters: $productFilters, sortKey: $sortKey, reverse: $reverse
    ) {
      edges { node { ... on Product { ...ProductFields } } }
      pageInfo { hasNextPage endCursor }
      productFilters {
        id label type
        values { id label count input }
      }
    }
  }
`;

function toSearchSortKey(s?: string): string {
  switch ((s ?? "RELEVANCE").toUpperCase()) {
    case "PRICE": return "PRICE";
    case "BEST_SELLING":
    case "BEST_SELLERS":
      return "RELEVANCE"; // Search API doesn't expose BEST_SELLING; fall back.
    case "RELEVANCE":
    default: return "RELEVANCE";
  }
}

export async function fetchSearchFiltered(opts: {
  query?: string; first?: number; after?: string | null;
  filters?: object[]; sortKey?: string; reverse?: boolean;
  available?: boolean;
}): Promise<Omit<FilteredResult, "collection">> {
  const available = opts.available ?? true;
  const baseQuery = opts.query && opts.query !== "*" ? opts.query.trim() : "";
  // Search requires a non-empty query. When no user term + we want all in-stock,
  // we filter on availability via productFilters and pass "*" as the search.
  const filtersIn = toProductFilters(opts.filters);
  if (available && !filtersIn.some((f) => "available" in f)) {
    filtersIn.push({ available: true });
  }
  const searchQuery = baseQuery || "*";
  const res = await storefrontApiRequest<{
    search: {
      edges: Array<{ node: ShopifyProductNode | null }>;
      pageInfo: { hasNextPage: boolean; endCursor: string | null };
      productFilters: StorefrontFilter[];
    };
  }>(SEARCH_FILTERED, {
    query: searchQuery,
    first: Math.min(opts.first ?? 24, 250),
    after: opts.after ?? null,
    productFilters: filtersIn,
    sortKey: toSearchSortKey(opts.sortKey),
    reverse: opts.reverse ?? false,
  });
  const s = res?.data?.search;
  if (!s) return { filters: [], edges: [], pageInfo: { hasNextPage: false, endCursor: null } };
  return {
    filters: s.productFilters ?? [],
    edges: s.edges.filter((e): e is { node: ShopifyProductNode } => !!e.node?.id),
    pageInfo: s.pageInfo,
  };
}

// ── Vendor index (used by /brands, megamenu) ────────────────────────────────
// Aggregates vendors from up to ~1000 in-stock products in 4 paginated calls.
// Cached for the session.
let VENDOR_INDEX_CACHE: Array<{ vendor: string; count: number }> | null = null;

export async function fetchVendorIndex(): Promise<Array<{ vendor: string; count: number }>> {
  if (VENDOR_INDEX_CACHE) return VENDOR_INDEX_CACHE;
  const counts = new Map<string, number>();
  let after: string | null = null;
  type VendorPageRes = {
    products: {
      edges: Array<{ node: { vendor: string } }>;
      pageInfo: { hasNextPage: boolean; endCursor: string | null };
    };
  };
  for (let page = 0; page < 4; page++) {
    const res: { data?: VendorPageRes } | undefined = await storefrontApiRequest<VendorPageRes>(
      `query VendorPage($first: Int!, $after: String) {
        products(first: $first, after: $after, query: "available_for_sale:true", sortKey: BEST_SELLING) {
          edges { node { vendor } }
          pageInfo { hasNextPage endCursor }
        }
      }`,
      { first: 250, after },
    );
    if (!res?.data) break;
    for (const e of res.data.products.edges) {
      const v = e.node.vendor;
      if (v) counts.set(v, (counts.get(v) ?? 0) + 1);
    }
    if (!res.data.products.pageInfo.hasNextPage) break;
    after = res.data.products.pageInfo.endCursor;
  }
  VENDOR_INDEX_CACHE = Array.from(counts.entries())
    .map(([vendor, count]) => ({ vendor, count }))
    .sort((a, b) => b.count - a.count);
  return VENDOR_INDEX_CACHE;
}

// ── Money formatting ────────────────────────────────────────────────────────
export function formatPrice(money: Money | undefined) {
  if (!money) return "";
  const amount = parseFloat(money.amount);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: money.currencyCode || "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}
