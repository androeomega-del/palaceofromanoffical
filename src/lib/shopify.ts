// Shopify Storefront API client — 2025-07
import { toast } from "sonner";

export const SHOPIFY_API_VERSION = "2025-07";
export const SHOPIFY_STORE_PERMANENT_DOMAIN = "i1w7wx-gu.myshopify.com";
export const SHOPIFY_STOREFRONT_URL = `https://${SHOPIFY_STORE_PERMANENT_DOMAIN}/api/${SHOPIFY_API_VERSION}/graphql.json`;
export const SHOPIFY_STOREFRONT_TOKEN = "fe3b8c80fa66fbfd3c0bbe7a10ccd6b0";

export interface Money {
  amount: string;
  currencyCode: string;
}

export interface ShopifyImage {
  url: string;
  altText: string | null;
  width?: number | null;
  height?: number | null;
}

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

export async function storefrontApiRequest<T = any>(
  query: string,
  variables: Record<string, any> = {}
): Promise<{ data?: T } | undefined> {
  const response = await fetch(SHOPIFY_STOREFRONT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Storefront-Access-Token": SHOPIFY_STOREFRONT_TOKEN,
    },
    body: JSON.stringify({ query, variables }),
  });

  if (response.status === 402) {
    toast.error("Shopify: Payment required", {
      description: "Shopify API access requires an active billing plan. Visit https://admin.shopify.com to upgrade.",
    });
    return;
  }

  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

  const data = await response.json();
  if (data.errors) throw new Error(`Shopify error: ${data.errors.map((e: any) => e.message).join(", ")}`);
  return data;
}

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
    images(first: 6) { edges { node { url altText } } }
    variants(first: 25) {
      edges {
        node {
          id title availableForSale
          price { amount currencyCode }
          selectedOptions { name value }
        }
      }
    }
    options { name values }
  }
`;

// Global catalog exclusion (none currently — full catalog visible).
export const EXCLUDE_QUERY = "";

function composeQuery(userQuery?: string | null) {
  if (!userQuery) return EXCLUDE_QUERY || null;
  return EXCLUDE_QUERY ? `(${userQuery}) AND ${EXCLUDE_QUERY}` : userQuery;
}

export const PRODUCTS_QUERY = `
  ${PRODUCT_FRAGMENT}
  query GetProducts($first: Int!, $after: String, $query: String, $sortKey: ProductSortKeys, $reverse: Boolean) {
    products(first: $first, after: $after, query: $query, sortKey: $sortKey, reverse: $reverse) {
      pageInfo { hasNextPage endCursor }
      edges { cursor node { ...ProductFields } }
    }
  }
`;

export const PRODUCT_BY_HANDLE_QUERY = `
  ${PRODUCT_FRAGMENT}
  query GetProduct($handle: String!) {
    product(handle: $handle) { ...ProductFields }
  }
`;

export const COLLECTION_BY_HANDLE_QUERY = `
  ${PRODUCT_FRAGMENT}
  query GetCollection($handle: String!, $first: Int!) {
    collection(handle: $handle) {
      id title handle description
      image { url altText width height }
      products(first: $first) { edges { node { ...ProductFields } } }
    }
  }
`;

export const COLLECTIONS_QUERY = `
  query GetCollections($first: Int!) {
    collections(first: $first) {
      edges {
        node {
          id title handle description updatedAt
          image { url altText width height }
        }
      }
    }
  }
`;

// Filter-aware queries (Storefront API ProductFilter + availableFilters)
export type StorefrontFilterValue = {
  id: string;
  label: string;
  count: number;
  input: string; // JSON string passed back as filter input
};
export type StorefrontFilter = {
  id: string;
  label: string;
  type: "LIST" | "PRICE_RANGE" | "BOOLEAN";
  values: StorefrontFilterValue[];
};

export const COLLECTION_FILTERED_QUERY = `
  ${PRODUCT_FRAGMENT}
  query GetCollectionFiltered(
    $handle: String!
    $first: Int!
    $after: String
    $filters: [ProductFilter!]
    $sortKey: ProductCollectionSortKeys
    $reverse: Boolean
  ) {
    collection(handle: $handle) {
      id title handle description
      image { url altText width height }
      products(first: $first, after: $after, filters: $filters, sortKey: $sortKey, reverse: $reverse) {
        filters { id label type values { id label count input } }
        pageInfo { hasNextPage endCursor }
        edges { cursor node { ...ProductFields } }
      }
    }
  }
`;

export const SEARCH_FILTERED_QUERY = `
  ${PRODUCT_FRAGMENT}
  query SearchFiltered(
    $first: Int!
    $after: String
    $query: String!
    $productFilters: [ProductFilter!]
    $sortKey: SearchSortKeys
    $reverse: Boolean
  ) {
    search(
      first: $first
      after: $after
      query: $query
      productFilters: $productFilters
      sortKey: $sortKey
      reverse: $reverse
      types: PRODUCT
    ) {
      productFilters { id label type values { id label count input } }
      pageInfo { hasNextPage endCursor }
      edges { node { ... on Product { ...ProductFields } } }
    }
  }
`;

export async function fetchProducts(opts: { first?: number; after?: string | null; query?: string; sortKey?: string; reverse?: boolean } = {}) {
  const data = await storefrontApiRequest<{ products: { edges: ShopifyProduct[]; pageInfo: { hasNextPage: boolean; endCursor: string | null } } }>(PRODUCTS_QUERY, {
    first: opts.first ?? 24,
    after: opts.after ?? null,
    query: composeQuery(opts.query),
    sortKey: opts.sortKey ?? "BEST_SELLING",
    reverse: opts.reverse ?? false,
  });
  return data?.data?.products?.edges ?? [];
}

export async function fetchProductsPage(opts: { first?: number; after?: string | null; query?: string; sortKey?: string; reverse?: boolean } = {}) {
  const data = await storefrontApiRequest<{ products: { edges: ShopifyProduct[]; pageInfo: { hasNextPage: boolean; endCursor: string | null } } }>(PRODUCTS_QUERY, {
    first: opts.first ?? 48,
    after: opts.after ?? null,
    query: composeQuery(opts.query),
    sortKey: opts.sortKey ?? "BEST_SELLING",
    reverse: opts.reverse ?? false,
  });
  return {
    edges: data?.data?.products?.edges ?? [],
    pageInfo: data?.data?.products?.pageInfo ?? { hasNextPage: false, endCursor: null },
  };
}

export async function fetchProductByHandle(handle: string) {
  const data = await storefrontApiRequest<{ product: ShopifyProductNode | null }>(PRODUCT_BY_HANDLE_QUERY, { handle });
  return data?.data?.product ?? null;
}

export async function fetchCollection(handle: string, first = 36) {
  const data = await storefrontApiRequest<{ collection: (ShopifyCollection & { products: { edges: ShopifyProduct[] } }) | null }>(
    COLLECTION_BY_HANDLE_QUERY, { handle, first }
  );
  return data?.data?.collection ?? null;
}

export type FilteredResult = {
  collection?: ShopifyCollection;
  filters: StorefrontFilter[];
  edges: ShopifyProduct[];
  pageInfo: { hasNextPage: boolean; endCursor: string | null };
};

export async function fetchCollectionFiltered(opts: {
  handle: string;
  first?: number;
  after?: string | null;
  filters?: object[];
  sortKey?: string;
  reverse?: boolean;
}): Promise<FilteredResult | null> {
  const data = await storefrontApiRequest<any>(COLLECTION_FILTERED_QUERY, {
    handle: opts.handle,
    first: opts.first ?? 24,
    after: opts.after ?? null,
    filters: opts.filters ?? [],
    sortKey: opts.sortKey ?? "BEST_SELLING",
    reverse: opts.reverse ?? false,
  });
  const c = data?.data?.collection;
  if (!c) return null;
  return {
    collection: { id: c.id, title: c.title, handle: c.handle, description: c.description, image: c.image },
    filters: c.products.filters ?? [],
    edges: c.products.edges ?? [],
    pageInfo: c.products.pageInfo,
  };
}

export async function fetchSearchFiltered(opts: {
  query?: string;
  first?: number;
  after?: string | null;
  filters?: object[];
  sortKey?: string;
  reverse?: boolean;
}): Promise<Omit<FilteredResult, "collection">> {
  // Storefront search requires a non-null query string. Use "" to mean "all
  // products" (matches everything). composeQuery() can return null when there
  // is no user query and no exclude filter, which would 400 the request.
  const composed =
    opts.query && opts.query !== "*" ? composeQuery(opts.query) : EXCLUDE_QUERY || "";
  const data = await storefrontApiRequest<any>(SEARCH_FILTERED_QUERY, {
    query: composed ?? "",
    first: opts.first ?? 24,
    after: opts.after ?? null,
    productFilters: opts.filters ?? [],
    sortKey: opts.sortKey ?? "RELEVANCE",
    reverse: opts.reverse ?? false,
  });
  const s = data?.data?.search;
  return {
    filters: s?.productFilters ?? [],
    edges: s?.edges ?? [],
    pageInfo: s?.pageInfo ?? { hasNextPage: false, endCursor: null },
  };
}

export async function fetchCollections(first = 50) {
  const data = await storefrontApiRequest<{ collections: { edges: Array<{ node: ShopifyCollection }> } }>(COLLECTIONS_QUERY, { first });
  return data?.data?.collections?.edges?.map((e) => e.node) ?? [];
}

/**
 * Scan the catalog in pages and aggregate vendor counts. Storefront API has
 * no vendor index, so we walk products. `maxPages` bounds the cost.
 */
export async function fetchVendorIndex(maxPages = 4, perPage = 250): Promise<Array<{ vendor: string; count: number }>> {
  const counts = new Map<string, number>();
  let cursor: string | null = null;
  for (let i = 0; i < maxPages; i++) {
    const page = await fetchProductsPage({ first: perPage, after: cursor, sortKey: "BEST_SELLING" });
    for (const e of page.edges) {
      const v = e.node.vendor?.trim();
      if (!v) continue;
      counts.set(v, (counts.get(v) ?? 0) + 1);
    }
    if (!page.pageInfo.hasNextPage) break;
    cursor = page.pageInfo.endCursor;
  }
  return Array.from(counts.entries())
    .map(([vendor, count]) => ({ vendor, count }))
    .sort((a, b) => b.count - a.count);
}

export function formatPrice(money: Money | undefined) {
  if (!money) return "";
  const amount = parseFloat(money.amount);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: money.currencyCode || "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}
