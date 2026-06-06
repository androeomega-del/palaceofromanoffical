/**
 * Preloved JSON-LD builders.
 *
 * Emits a ProductCollection-style ItemList of Product nodes + a
 * BreadcrumbList for the Preloved hub and per-condition leaves. Each
 * Product carries an Offer with the correct schema.org itemCondition enum
 * (UsedCondition for Preloved/Pristine/Excellent, NewCondition for items
 * sold "New with tags").
 *
 * All strings round-trip through JSON.stringify so escaping is handled by
 * the serializer — never embed user-supplied strings in template literals.
 */
import type { ShopifyProductNode } from "@/lib/shopify";
import { absoluteUrl, SITE_NAME } from "@/lib/seo";
import {
  PRELOVED_CONDITION_LABEL,
  type PrelovedCondition,
} from "@/lib/rails/preloved";

/** schema.org canonical enum URLs (not the bare /schema.org root). */
const USED_CONDITION = "https://schema.org/UsedCondition";
const NEW_CONDITION = "https://schema.org/NewCondition";

/**
 * Pick the schema.org itemCondition for a product based on its title
 * (the only condition signal exposed on ShopifyProductNode without the
 * `tags` field on the storefront fragment). "New with tags" / "NWT" →
 * NewCondition; everything else in the preloved edit → UsedCondition.
 */
function itemConditionFor(title: string): string {
  const t = (title ?? "").toLowerCase();
  if (t.includes("new with tag") || /\bnwt\b/.test(t)) return NEW_CONDITION;
  return USED_CONDITION;
}

function productOffer(p: ShopifyProductNode) {
  const price = p.priceRange?.minVariantPrice;
  const url = absoluteUrl(`/product/${p.handle}`);
  return {
    "@type": "Product",
    "@id": `${url}#product`,
    name: p.title,
    url,
    ...(p.vendor ? { brand: { "@type": "Brand", name: p.vendor } } : {}),
    ...(p.images?.edges?.[0]?.node?.url
      ? { image: p.images.edges[0].node.url }
      : {}),
    offers: {
      "@type": "Offer",
      url,
      itemCondition: itemConditionFor(p.title),
      availability: "https://schema.org/InStock",
      ...(price
        ? {
            price: price.amount,
            priceCurrency: price.currencyCode,
          }
        : {}),
    },
  };
}

type Crumb = { name: string; path: string };

function breadcrumbList(crumbs: Crumb[]) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.name,
      item: absoluteUrl(c.path),
    })),
  };
}

function itemList(
  url: string,
  name: string,
  products: ShopifyProductNode[],
) {
  return {
    "@type": "ItemList",
    "@id": `${url}#itemlist`,
    name,
    numberOfItems: products.length,
    itemListElement: products.map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: absoluteUrl(`/product/${p.handle}`),
      item: productOffer(p),
    })),
  };
}

/** Build the @graph payload for the Preloved master hub. */
export function buildPrelovedHubJsonLd(
  products: ShopifyProductNode[],
): string {
  const url = absoluteUrl("/preloved");
  const graph = [
    {
      "@type": "CollectionPage",
      "@id": `${url}#page`,
      url,
      name: `Authentic Preloved Luxury Designer Fashion | ${SITE_NAME} Official`,
      description:
        "Curated pre-owned designer fashion authenticated by Palace of Roman — Pristine, Excellent, and New with Tags condition grades.",
    },
    itemList(url, "Preloved Designer Fashion", products),
    breadcrumbList([
      { name: "Home", path: "/" },
      { name: "Preloved", path: "/preloved" },
    ]),
  ];
  return JSON.stringify({ "@context": "https://schema.org", "@graph": graph });
}

/** Build the @graph payload for a per-condition preloved page. */
export function buildPrelovedConditionJsonLd(
  condition: PrelovedCondition,
  products: ShopifyProductNode[],
): string {
  const label = PRELOVED_CONDITION_LABEL[condition];
  const url = absoluteUrl(`/preloved/${condition}`);
  const graph = [
    {
      "@type": "CollectionPage",
      "@id": `${url}#page`,
      url,
      name: `Pristine & Excellent Condition Preloved ${label} | ${SITE_NAME}`,
      description: `Authenticated pre-owned designer fashion graded ${label} — Palace of Roman's multi-tiered structural and brand authentication pipeline.`,
    },
    itemList(url, `Preloved — ${label}`, products),
    breadcrumbList([
      { name: "Home", path: "/" },
      { name: "Preloved", path: "/preloved" },
      { name: label, path: `/preloved/${condition}` },
    ]),
  ];
  return JSON.stringify({ "@context": "https://schema.org", "@graph": graph });
}
