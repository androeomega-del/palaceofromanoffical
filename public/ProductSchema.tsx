// components/pdp/ProductSchema.tsx
//
// Palace of Roman — unified JSON-LD @graph schema for the PDP.
// Stack: Vercel + Next.js (App Router), Sanity.io (editorial) + Headless
// Shopify Storefront API (transaction/inventory core), synced via Sanity Connect.
//
// Design rules enforced here:
//  - One @graph (WebSite + Store + Product); seller references the Store @id,
//    no duplicated Store block.
//  - Availability is derived honestly: vault-drop / curated-demand => PreOrder;
//    oversell on NOT-in-stock => PreOrder; real stock on hand => InStock
//    (oversell never mislabels real stock); nothing sellable => OutOfStock.
//  - countryOfOrigin is read from product.origin and OMITTED when absent.
//    It is never hardcoded/defaulted — country of origin is a regulated claim.
//  - priceValidUntil is emitted only alongside price.
//  - XSS-safe: object-only construction, JSON.stringify, plus "<" escaping so a
//    "</script>" inside any string value cannot break out of the <script> tag
//    (plain JSON.stringify does NOT handle this on its own).

import Script from "next/script";

const SITE_URL = "https://palaceofromanofficial.com";
const STORE_ID = `${SITE_URL}/#store`;
const WEBSITE_ID = `${SITE_URL}/#website`;

// ---- Types: bound to the real shapes from Storefront API + Sanity ----------

export interface ShopifyMoney {
  amount: string; // Storefront API returns decimal strings, e.g. "4800.00"
  currencyCode: string; // ISO 4217
}

export interface ShopifyVariant {
  id: string;
  title: string;
  sku?: string;
  availableForSale: boolean; // Storefront API field
  currentlyNotInStock: boolean; // true when sellable via oversell but 0 on hand
  price: ShopifyMoney;
}

export interface PdpProduct {
  // From Shopify Storefront API
  handle: string;
  title: string;
  vendor: string; // the maison -> Product.brand
  sku?: string;
  variants: ShopifyVariant[];
  priceRange: { minVariantPrice: ShopifyMoney };
  // From Sanity (editorial, synced via Sanity Connect)
  category: string; // url segment
  material?: string;
  origin?: string; // read from product.origin; OMITTED downstream if undefined
  narrative?: string;
  isVaultDrop: boolean; // explicit editorial toggle
  isCuratedDemand?: boolean; // explicit editorial toggle
  images: { url: string; alt: string }[];
  priceValidUntil?: string; // only emitted alongside price
}

// ---- Status resolution -----------------------------------------------------

export type UiMode = "reserve" | "acquire" | "purchase" | "soldout";

export interface ResolvedStatus {
  schemaAvailability: string;
  uiMode: UiMode;
  ctaLabel: string;
}

const isOversellActive = (p: PdpProduct) =>
  p.variants.some((v) => v.availableForSale && v.currentlyNotInStock);

const anyRealStock = (p: PdpProduct) =>
  p.variants.some((v) => v.availableForSale && !v.currentlyNotInStock);

// Defensive guard: a malformed listing must fail loudly, not ship broken schema.
function assertRenderable(p: PdpProduct) {
  if (
    !p?.handle ||
    !p?.priceRange?.minVariantPrice?.amount ||
    !Array.isArray(p.variants)
  ) {
    throw new Error(`PdpProduct malformed (handle="${p?.handle ?? "?"}")`);
  }
}

export function resolveStatus(p: PdpProduct): ResolvedStatus {
  // 1. Editorial demand flags win — both map to the truthful forward-sourced state.
  if (p.isVaultDrop || p.isCuratedDemand) {
    return {
      schemaAvailability: "https://schema.org/PreOrder",
      uiMode: p.isVaultDrop ? "reserve" : "acquire",
      ctaLabel: p.isVaultDrop ? "Reserve via Registry" : "Acquire on Demand",
    };
  }

  // 2. Oversell on a NOT-in-stock item -> genuinely forward -> PreOrder.
  if (isOversellActive(p) && !anyRealStock(p)) {
    return {
      schemaAvailability: "https://schema.org/PreOrder",
      uiMode: "acquire",
      ctaLabel: "Acquire on Demand",
    };
  }

  // 3. Real stock on hand (even if oversell is also enabled) -> truthful InStock.
  if (anyRealStock(p)) {
    return {
      schemaAvailability: "https://schema.org/InStock",
      uiMode: "purchase",
      ctaLabel: "Add to Collection",
    };
  }

  // 4. Nothing sellable.
  return {
    schemaAvailability: "https://schema.org/OutOfStock",
    uiMode: "soldout",
    ctaLabel: "Join the Waitlist",
  };
}

// ---- Schema construction (object-only; no string concatenation) ------------

export function buildGraph(p: PdpProduct, status: ResolvedStatus) {
  const url = `${SITE_URL}/${p.category}/${p.handle}`;
  const price = p.priceRange.minVariantPrice;

  const offer: Record<string, unknown> = {
    "@type": "Offer",
    url,
    availability: status.schemaAvailability,
    seller: { "@id": STORE_ID }, // node reference — no duplicated Store block
    price: price.amount,
    priceCurrency: price.currencyCode,
  };
  // Future-dated validity paired with price; never emitted orphaned.
  if (p.priceValidUntil) offer.priceValidUntil = p.priceValidUntil;

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": WEBSITE_ID,
        url: SITE_URL,
        name: "Palace of Roman",
      },
      {
        "@type": "Store",
        "@id": STORE_ID,
        name: "Palace of Roman",
        url: SITE_URL,
      },
      {
        "@type": "Product",
        "@id": `${url}/#product`,
        name: p.title,
        ...(p.sku ? { sku: p.sku } : {}),
        category: p.category,
        brand: { "@type": "Brand", name: p.vendor },
        ...(p.narrative ? { description: p.narrative } : {}),
        ...(p.material ? { material: p.material } : {}),
        // Per-item only. Absent origin => field omitted. No hardcoded default.
        ...(p.origin ? { countryOfOrigin: p.origin } : {}),
        image: p.images.map((i) => i.url),
        offers: offer,
      },
    ],
  };
}

// JSON.stringify does NOT neutralize "</script>" inside string values.
// Escaping "<" closes that breakout vector while remaining valid JSON for parsers.
export function safeJsonLd(obj: unknown): string {
  return JSON.stringify(obj).replace(/</g, "\\u003c");
}

// ---- Component -------------------------------------------------------------

export function ProductSchemaScript({ product }: { product: PdpProduct }) {
  assertRenderable(product);
  const status = resolveStatus(product);
  return (
    <Script
      id={`por-graph-${product.handle}`}
      type="application/ld+json"
      strategy="beforeInteractive"
      dangerouslySetInnerHTML={{ __html: safeJsonLd(buildGraph(product, status)) }}
    />
  );
}

export default ProductSchemaScript;
