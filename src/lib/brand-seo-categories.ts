/**
 * Brand × Category SEO spotlights.
 *
 * Long-tail keywords surfaced via Semrush (US, May 2026) — each entry is a
 * proven low/medium-difficulty term mapped to its canonical /brand/$vendor
 * page. Rendered as an on-page H2 + filtered 4-up grid so we capture the
 * search intent without spinning up a new route.
 *
 * Keep entries focused: one per brand, the highest-opportunity category.
 * The filter combines `product_type` and `tag` so we catch both Shopify
 * taxonomy and the editorial tags applied by the BG normaliser.
 */

export interface BrandCategorySpotlight {
  /** Canonical brand name as returned by brandFromSlug(). */
  brand: string;
  /** SEO keyword this spotlight targets (used for analytics breadcrumbs). */
  keyword: string;
  /** On-page H2. Should read naturally, not keyword-stuffed. */
  h2: string;
  /** Eyebrow above the H2. */
  eyebrow: string;
  /** Short editorial paragraph (≤220 chars). */
  intro: string;
  /** CTA label. */
  ctaLabel: string;
  /**
   * Storefront search query fragment OR'd with the brand vendor filter.
   * Use `product_type` for catalog hits + `tag` for editorial fallbacks.
   */
  categoryQuery: string;
}

export const BRAND_CATEGORY_SPOTLIGHTS: Record<string, BrandCategorySpotlight> = {
  Moncler: {
    brand: "Moncler",
    keyword: "moncler men jacket",
    eyebrow: "The Moncler Jacket",
    h2: "Moncler Men's Jackets",
    intro:
      "Down-filled outerwear born in the French Alps and finished in Italy — quilted silhouettes, lacquered nylons, and the signature tricolour seal.",
    ctaLabel: "Shop Moncler Jackets",
    categoryQuery:
      '(product_type:"Jacket" OR product_type:"Jackets" OR product_type:"Coat" OR product_type:"Coats" OR tag:"jacket" OR tag:"outerwear")',
  },
  Prada: {
    brand: "Prada",
    keyword: "prada men sneakers",
    eyebrow: "The Prada Sneaker",
    h2: "Prada Men's Sneakers",
    intro:
      "From the Milanese house's technical archive — re-nylon uppers, brushed leathers, and the lug-soled silhouettes that defined a decade of luxury sport.",
    ctaLabel: "Shop Prada Sneakers",
    categoryQuery:
      '(product_type:"Sneakers" OR product_type:"Sneaker" OR product_type:"Trainers" OR tag:"sneakers" OR tag:"sneaker")',
  },
  "Bottega Veneta": {
    brand: "Bottega Veneta",
    keyword: "bottega veneta men wallet",
    eyebrow: "Intrecciato Leather",
    h2: "Bottega Veneta Men's Wallets",
    intro:
      "Hand-woven intrecciato in the Vicenza workshop — bifolds, cardholders, and zip-arounds in supple nappa, the house's quietest signature.",
    ctaLabel: "Shop Bottega Wallets",
    categoryQuery:
      '(product_type:"Wallet" OR product_type:"Wallets" OR product_type:"Cardholder" OR product_type:"Card Holder" OR tag:"wallet" OR tag:"wallets" OR tag:"cardholder")',
  },
  Gucci: {
    brand: "Gucci",
    keyword: "gucci men loafers",
    eyebrow: "The Gucci Loafer",
    h2: "Gucci Men's Loafers",
    intro:
      "The horsebit moccasin that entered the MoMA permanent collection — polished calfskin, leather soles, and the Florentine hardware that started it all in 1953.",
    ctaLabel: "Shop Gucci Loafers",
    categoryQuery:
      '(product_type:"Loafers" OR product_type:"Loafer" OR product_type:"Moccasin" OR product_type:"Moccasins" OR tag:"loafers" OR tag:"loafer")',
  },
  "Tom Ford": {
    brand: "Tom Ford",
    keyword: "tom ford men suit",
    eyebrow: "Tailoring",
    h2: "Tom Ford Men's Suits",
    intro:
      "The cinematic silhouette — peak lapels, sculpted shoulders, and the wool-mohair cloths that built the Tom Ford reputation for modern eveningwear.",
    ctaLabel: "Shop Tom Ford Suits",
    categoryQuery:
      '(product_type:"Suit" OR product_type:"Suits" OR product_type:"Blazer" OR product_type:"Blazers" OR tag:"suit" OR tag:"suiting" OR tag:"tailoring")',
  },
};

export function spotlightFor(brandName: string): BrandCategorySpotlight | null {
  return BRAND_CATEGORY_SPOTLIGHTS[brandName] ?? null;
}
