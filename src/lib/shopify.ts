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

export const PRODUCTS_QUERY = `
  ${PRODUCT_FRAGMENT}
  query GetProducts($first: Int!, $query: String, $sortKey: ProductSortKeys, $reverse: Boolean) {
    products(first: $first, query: $query, sortKey: $sortKey, reverse: $reverse) {
      edges { node { ...ProductFields } }
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
      image { url altText }
      products(first: $first) { edges { node { ...ProductFields } } }
    }
  }
`;

export const COLLECTIONS_QUERY = `
  query GetCollections($first: Int!) {
    collections(first: $first) {
      edges {
        node {
          id title handle description
          image { url altText }
        }
      }
    }
  }
`;

export async function fetchProducts(opts: { first?: number; query?: string; sortKey?: string; reverse?: boolean } = {}) {
  const data = await storefrontApiRequest<{ products: { edges: ShopifyProduct[] } }>(PRODUCTS_QUERY, {
    first: opts.first ?? 24,
    query: opts.query ?? null,
    sortKey: opts.sortKey ?? "BEST_SELLING",
    reverse: opts.reverse ?? false,
  });
  return data?.data?.products?.edges ?? [];
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

export async function fetchCollections(first = 50) {
  const data = await storefrontApiRequest<{ collections: { edges: Array<{ node: ShopifyCollection }> } }>(COLLECTIONS_QUERY, { first });
  return data?.data?.collections?.edges?.map((e) => e.node) ?? [];
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
