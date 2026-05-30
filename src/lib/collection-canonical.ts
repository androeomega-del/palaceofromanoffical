// Canonical mapping for collection handles. Shopify exposes paired handles
// for the same category (e.g. `men-accessories` and `mens-accessories`).
// We pick a single canonical handle and redirect the rest so we never serve
// duplicate landing pages — every category has exactly one URL.
export const CANONICAL_COLLECTION_HANDLE: Record<string, string> = {
  "women-clothing": "womens-clothing",
  "women-shoes": "womens-shoes",
  "women-accessories": "womens-accessories",
  "men-clothing": "mens-clothing",
  "men-shoes": "mens-shoes",
  "men-bags": "mens-bags",
  "men-accessories": "mens-accessories",
  "best-sellers": "best-selling-brands",
  "sale": "high-discounts",
  "on-sale": "high-discounts",
};

export function canonicalCollectionHandle(handle: string): string {
  const lower = handle.toLowerCase();
  return CANONICAL_COLLECTION_HANDLE[lower] ?? lower;
}
