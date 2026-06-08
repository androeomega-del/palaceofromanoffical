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
import { useMarketStore } from "@/stores/market-store";

export const SHOPIFY_API_VERSION = "2025-07";

// Use env vars when available (e.g. for local overrides or rotation) and
// fall back to the known production values so the storefront never breaks.
export const SHOPIFY_STORE_PERMANENT_DOMAIN =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_SHOPIFY_STORE_DOMAIN) ||
  "mwuwqi-vy.myshopify.com";

export const SHOPIFY_STOREFRONT_URL = `https://${SHOPIFY_STORE_PERMANENT_DOMAIN}/api/${SHOPIFY_API_VERSION}/graphql.json`;

export const SHOPIFY_STOREFRONT_TOKEN =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_SHOPIFY_STOREFRONT_TOKEN) ||
  "79bc8e00121fca48464e24c4443d8538";

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
export interface ShopifyMetafield { namespace: string; key: string; value: string; type: string }
export interface ShopifyVariant {
  id: string;
  title: string;
  sku?: string | null;
  price: Money;
  compareAtPrice?: Money | null;
  availableForSale: boolean;
  quantityAvailable?: number | null;
  image?: ShopifyImage | null;
  selectedOptions: Array<{ name: string; value: string }>;
}
export interface ShopifyProductNode {
  id: string;
  title: string;
  description: string;
  descriptionHtml?: string;
  handle: string;
  vendor: string;
  productType: string;
  seo?: { title: string | null; description: string | null } | null;
  tags?: string[];
  createdAt?: string;
  priceRange: { minVariantPrice: Money };
  compareAtPriceRange?: { minVariantPrice: Money };
  images: { edges: Array<{ node: ShopifyImage }> };
  variants: { edges: Array<{ node: ShopifyVariant }> };
  options: Array<{ name: string; values: string[] }>;
  metafields?: Array<ShopifyMetafield | null>;
  /**
   * Curated "Shop the Look" companions, sourced from the
   * `custom.look_products` metafield (type: list.product_reference).
   * When set in Shopify admin, takes priority over the algorithmic
   * Style-It-With rail on the PDP.
   */
  lookReferences?: {
    references: { nodes: ShopifyProductLite[] } | null;
  } | null;
}
export interface ShopifyProductLite {
  id: string;
  title: string;
  handle: string;
  vendor: string;
  availableForSale: boolean;
  priceRange: { minVariantPrice: Money };
  compareAtPriceRange?: { minVariantPrice: Money };
  images: { edges: Array<{ node: ShopifyImage }> };
  variants: { edges: Array<{ node: ShopifyVariant }> };
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
// Auto-injects Shopify Markets @inContext(country, language) into every
// outbound query so prices, currency, and (where the market is configured
// for inclusive pricing) tax-inclusive amounts come back already localised.
// Read at call time from `useMarketStore`; SSR returns the default (US/EN)
// and client re-fetches via TanStack Query when the shopper picks a market.
let BILLING_TOAST_SHOWN = false;

function injectInContext(query: string): string {
  if (/@inContext\s*\(/.test(query)) return query;
  // Match the first `query Name(...)? {`  — handles both with and without
  // a parameter list. Idempotent: if no match, the query is returned as-is.
  const re = /(query\s+\w+)\s*(?:\(([^)]*)\))?\s*\{/;
  if (!re.test(query)) return query;
  return query.replace(re, (_m, head: string, params: string | undefined) => {
    const extra = `$_country: CountryCode!, $_language: LanguageCode!`;
    const merged = params && params.trim() ? `${params.trim()}, ${extra}` : extra;
    return `${head}(${merged}) @inContext(country: $_country, language: $_language) {`;
  });
}

function readCurrentMarket(): { country: string; language: string } {
  try {
    const m = useMarketStore.getState().market;
    return { country: m.country, language: m.language };
  } catch {
    return { country: "US", language: "EN" };
  }
}

export async function storefrontApiRequest<T = unknown>(
  query: string,
  variables: Record<string, unknown> = {},
): Promise<{ data?: T } | undefined> {
  try {
    const mkt = readCurrentMarket();
    const localizedQuery = injectInContext(query);
    const localizedVars =
      localizedQuery === query
        ? variables
        : { ...variables, _country: mkt.country, _language: mkt.language };
    const res = await fetch(SHOPIFY_STOREFRONT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Storefront-Access-Token": SHOPIFY_STOREFRONT_TOKEN,
      },
      body: JSON.stringify({ query: localizedQuery, variables: localizedVars }),
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

/**
 * `shopifyFetch` — canonical reusable Storefront API client.
 *
 * Takes a GraphQL query string and optional variables, returns typed data
 * or `undefined` on any failure.  Never throws; UI callers can safely
 * destructure without try/catch.
 *
 * Usage:
 *   const { data } = await shopifyFetch<MyQueryType>(query, { handle: "abc" });
 *   if (!data) { /* graceful fallback /* }
 */
export async function shopifyFetch<T = unknown>(
  query: string,
  variables: Record<string, unknown> = {},
): Promise<{ data?: T } | undefined> {
  return storefrontApiRequest<T>(query, variables);
}

// ── GraphQL fragments ───────────────────────────────────────────────────────
// ProductLite — minimal shape sufficient to render a small card. Used for
// metafield references (Shopify rejects recursive fragment spreads on the
// same Product type), so curated `look_products` references stay shallow.
const PRODUCT_LITE_FRAGMENT = `
  fragment ProductLiteFields on Product {
    id
    title
    handle
    vendor
    availableForSale
    priceRange { minVariantPrice { amount currencyCode } }
    compareAtPriceRange { minVariantPrice { amount currencyCode } }
    images(first: 2) { edges { node { url altText width height } } }
    variants(first: 1) {
      edges {
        node {
          id
          title
          sku
          price { amount currencyCode }
          compareAtPrice { amount currencyCode }
          availableForSale
          image { url altText width height }
          selectedOptions { name value }
        }
      }
    }
  }
`;

const PRODUCT_FRAGMENT = `
  ${PRODUCT_LITE_FRAGMENT}
  fragment ProductFields on Product {
    id
    title
    description
    descriptionHtml
    handle
    seo { title description }
    vendor
    productType
    tags
    createdAt
    priceRange { minVariantPrice { amount currencyCode } }
    compareAtPriceRange { minVariantPrice { amount currencyCode } }
    images(first: 8) { edges { node { url altText width height } } }
    variants(first: 50) {
      edges {
        node {
          id
          title
          sku
          price { amount currencyCode }
          compareAtPrice { amount currencyCode }
          availableForSale
          image { url altText width height }
          selectedOptions { name value }
        }
      }
    }
    options { name values }
    metafields(identifiers: [
      { namespace: "custom", key: "composition" },
      { namespace: "custom", key: "care_instructions" },
      { namespace: "custom", key: "origin" },
      { namespace: "custom", key: "fabric" },
      { namespace: "custom", key: "factory_tags" },
      { namespace: "custom", key: "serial_card" },
      { namespace: "custom", key: "packaging_notes" },
      { namespace: "custom", key: "authenticity_documents" },
      { namespace: "custom", key: "dispatch_origin" },
      { namespace: "custom", key: "transit_window" }
    ]) { namespace key value type }
    lookReferences: metafield(namespace: "custom", key: "look_products") {
      references(first: 8) {
        nodes { ... on Product { ...ProductLiteFields } }
      }
    }
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

// ── Product recommendations ─────────────────────────────────────────────────
// Shopify-curated "Complete the Look" companions, driven by the Storefront
// API's productRecommendations resolver. Falls back to [] on any error so
// callers can render a graceful empty state.
const PRODUCT_RECOMMENDATIONS = `
  ${PRODUCT_FRAGMENT}
  query ProductRecommendations($productId: ID!, $intent: ProductRecommendationIntent) {
    productRecommendations(productId: $productId, intent: $intent) {
      ...ProductFields
    }
  }
`;

export async function fetchProductRecommendations(
  productId: string,
  intent: "RELATED" | "COMPLEMENTARY" = "COMPLEMENTARY",
): Promise<ShopifyProductNode[]> {
  const res = await storefrontApiRequest<{ productRecommendations: ShopifyProductNode[] | null }>(
    PRODUCT_RECOMMENDATIONS,
    { productId, intent },
  );
  return res?.data?.productRecommendations ?? [];
}

// ── Localized (@inContext) variants ─────────────────────────────────────────
// Shopify's Storefront API resolves prices, taxes (when inclusive pricing is
// configured for the market), and translated content based on the @inContext
// directive. We inject country/language at the query level so the SAME
// `productByHandle` and `productRecommendations` resolvers return the
// correct localised payload — no second endpoint required.
export type CountryCode =
  | "US" | "GB" | "FR" | "DE" | "IT" | "ES" | "JP" | "CN" | "HK" | "SG"
  | "AE" | "SA" | "AU" | "CA" | "CH" | "NL" | "BE" | "SE" | "NO" | "DK"
  | "BR" | "MX" | "KR" | "TW";
export type LanguageCode =
  | "EN" | "FR" | "DE" | "IT" | "ES" | "JA" | "ZH" | "AR" | "KO" | "PT" | "NL" | "SV";

const PRODUCT_BY_HANDLE_IN_CONTEXT = `
  ${PRODUCT_FRAGMENT}
  query ProductByHandleInContext(
    $handle: String!
    $country: CountryCode!
    $language: LanguageCode!
  ) @inContext(country: $country, language: $language) {
    productByHandle(handle: $handle) { ...ProductFields }
  }
`;

const PRODUCT_RECOMMENDATIONS_IN_CONTEXT = `
  ${PRODUCT_FRAGMENT}
  query ProductRecommendationsInContext(
    $productId: ID!
    $intent: ProductRecommendationIntent
    $country: CountryCode!
    $language: LanguageCode!
  ) @inContext(country: $country, language: $language) {
    productRecommendations(productId: $productId, intent: $intent) {
      ...ProductFields
    }
  }
`;

export async function fetchProductByHandleLocalized(
  handle: string,
  ctx: { country: CountryCode; language: LanguageCode },
): Promise<ShopifyProductNode | null> {
  const res = await storefrontApiRequest<{ productByHandle: ShopifyProductNode | null }>(
    PRODUCT_BY_HANDLE_IN_CONTEXT,
    { handle, country: ctx.country, language: ctx.language },
  );
  return res?.data?.productByHandle ?? null;
}

export async function fetchProductRecommendationsLocalized(
  productId: string,
  ctx: { country: CountryCode; language: LanguageCode },
  intent: "RELATED" | "COMPLEMENTARY" = "COMPLEMENTARY",
): Promise<ShopifyProductNode[]> {
  const res = await storefrontApiRequest<{ productRecommendations: ShopifyProductNode[] | null }>(
    PRODUCT_RECOMMENDATIONS_IN_CONTEXT,
    { productId, intent, country: ctx.country, language: ctx.language },
  );
  return res?.data?.productRecommendations ?? [];
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
    const res = (await storefrontApiRequest<Page>(
      COLLECTIONS_LIST,
      { first: Math.min(pageSize, max - out.length), after },
    )) as { data?: Page } | undefined;
    if (!res?.data) break;
    const pg: Page["collections"] = res.data.collections;
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
  // Luxury convention: whole-dollar prices, no decimals (e.g. $250 not $250.00).
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: money.currencyCode || "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.round(amount));
}

// Display-only currency conversion. Checkout / cart / fulfilment remain in
// USD (the source-of-truth currency). This helper exists purely so shoppers
// browsing from the EU/UK can see a familiar price tag in the grid — the
// actual charge is in USD and shown at checkout. Rates are conservative,
// updated manually, and intentionally never used in any cart mutation.
const DISPLAY_RATES: Record<string, { rate: number; symbol: string; code: string }> = {
  USD: { rate: 1, symbol: "$", code: "USD" },
  EUR: { rate: 0.92, symbol: "€", code: "EUR" },
  GBP: { rate: 0.79, symbol: "£", code: "GBP" },
};

export function convertForDisplay(money: Money | undefined, currency: string): string {
  if (!money) return "";
  const usd = parseFloat(money.amount);
  const target = DISPLAY_RATES[currency] ?? DISPLAY_RATES.USD;
  const converted = usd * target.rate;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: target.code,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.round(converted));
}

export const SUPPORTED_DISPLAY_CURRENCIES = Object.keys(DISPLAY_RATES);
