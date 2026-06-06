/**
 * Build descriptive, SEO-friendly alt text for product images.
 *
 * Pattern: "{Vendor} {Title} — {ProductType}{, material}{, color} — view {n} of {N} | Palace of Roman"
 *
 * Use as a fallback when the Shopify-supplied altText is missing OR is just
 * a duplicate of the product title (the most common Shopify default).
 */
import { parseComposition } from "@/lib/product-composition";

export interface ProductAltInput {
  title: string;
  vendor?: string | null;
  productType?: string | null;
  description?: string | null;
  /** Selected variant options (e.g. [{name:"Color", value:"Black"}]) — optional. */
  selectedOptions?: Array<{ name: string; value: string }> | null;
}

/**
 * Luxury-listing alt format used for primary product imagery across the
 * storefront (cards, PDP gallery, look-bundle anchors). Strict shape:
 *   "Authentic {Vendor} {Title} available at Palace of Roman"
 * Falls back gracefully when vendor is missing.
 */
export function buildLuxuryListingAlt(p: { title: string; vendor?: string | null }): string {
  const vendor = (p.vendor || "").trim();
  const title = (p.title || "").trim();
  const head = vendor ? `${vendor} ${title}` : title;
  return `Authentic ${head} available at Palace of Roman`.replace(/\s+/g, " ").trim();
}

function pickOption(opts: ProductAltInput["selectedOptions"], names: string[]): string | null {
  if (!opts) return null;
  for (const o of opts) {
    if (names.some((n) => o.name.toLowerCase() === n)) {
      const v = (o.value || "").trim();
      if (v && v.toLowerCase() !== "default title") return v;
    }
  }
  return null;
}

/** Produce a single rich alt-text string for a product image. */
export function buildProductAlt(
  product: ProductAltInput,
  opts: { index?: number; total?: number; shopifyAlt?: string | null } = {},
): string {
  const { index, total, shopifyAlt } = opts;

  // If Shopify provides alt text that isn't just a copy of the title, trust it.
  const cleanShopify = (shopifyAlt ?? "").trim();
  const isRedundant =
    !cleanShopify ||
    cleanShopify.toLowerCase() === product.title.trim().toLowerCase() ||
    cleanShopify.toLowerCase() === (product.vendor || "").trim().toLowerCase();
  if (cleanShopify && !isRedundant) return cleanShopify;

  const parts: string[] = [];
  const head = [product.vendor, product.title].filter(Boolean).join(" ").trim();
  if (head) parts.push(head);

  const attrs: string[] = [];
  if (product.productType) attrs.push(product.productType);
  const material =
    parseComposition(product.description || "").composition?.replace(/\.$/, "") || null;
  if (material) attrs.push(material.toLowerCase());
  const color = pickOption(product.selectedOptions, ["color", "colour"]);
  if (color) attrs.push(color.toLowerCase());

  if (attrs.length) parts.push(attrs.join(", "));

  if (typeof index === "number" && typeof total === "number" && total > 1) {
    parts.push(`view ${index + 1} of ${total}`);
  }

  parts.push("Palace of Roman");
  return parts.join(" — ");
}
