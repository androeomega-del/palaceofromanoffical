// Canonical mapping for collection handles. Shopify exposes paired handles
// for the same category (e.g. `men-accessories` and `mens-accessories`).
// We pick a single canonical handle and redirect the rest so we never serve
// duplicate landing pages — every category has exactly one URL.
export const CANONICAL_COLLECTION_HANDLE: Record<string, string> = {
  // Apparel/shoes — Storefront uses the `mens-`/`womens-` (with S) form.
  "women-clothing": "womens-clothing",
  "women-shoes": "womens-shoes",
  "men-clothing": "mens-clothing",
  "men-shoes": "mens-shoes",
  // Bags/accessories — Storefront uses the bare `men-`/`women-` form for
  // these (no `mens-bags`/`mens-accessories` collection exists).
  "mens-bags": "men-bags",
  "mens-accessories": "men-accessories",
  "womens-accessories-alt": "women-accessories", // keep `womens-accessories` as-is (it exists)
  // Sale-style aliases — no `high-discounts`/`sale` collection exists on
  // Storefront, point to the curated best-sellers tile instead.
  "best-sellers": "best-selling-brands",
  "sale": "best-selling-brands",
  "on-sale": "best-selling-brands",
  "high-discounts": "best-selling-brands",
  // Brand vendor slugs — Storefront exposes the bare vendor handle, our
  // legacy nav and tiles use a `brand-` prefix. Map to the live handle.
  "brand-bottega-veneta": "bottega-veneta",
  "brand-brunello-cucinelli": "brunello-cucinelli",
  "brand-dolce-gabbana": "dolce-gabbana",
  "brand-giorgio-armani": "giorgio-armani",
  "brand-gucci": "gucci",
  "brand-prada": "prada",
  "brand-saint-laurent": "saint-laurent",
  "brand-tom-ford": "tom-ford",
  "brand-versace": "versace",
  // No Loro Piana collection on Storefront — fall back to the curated
  // quiet-luxury edit so the tile never lands on an empty page.
  "brand-loro-piana": "best-selling-brands",
  // Misnamed nav handles → live Storefront slugs.
  "shirts-men": "mens-shirts",
  "sandals-slides": "mens-sandals-slides",
  "dress-shirts": "mens-shirts",
};

export function canonicalCollectionHandle(handle: string): string {
  const lower = handle.toLowerCase();
  return CANONICAL_COLLECTION_HANDLE[lower] ?? lower;
}
