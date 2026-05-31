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
    eyebrow: "Alpine Heritage",
    h2: "Moncler Men's Jackets",
    intro:
      "A Moncler men's jacket is more than outerwear — it is a passport to city winters and mountain altitudes alike. Quilted down, lacquered nylon, and the tricolour seal: three details that signal you know the difference.",
    ctaLabel: "Shop Moncler Jackets",
    categoryQuery:
      '(product_type:"Jacket" OR product_type:"Jackets" OR product_type:"Coat" OR product_type:"Coats" OR tag:"jacket" OR tag:"outerwear")',
  },
  Prada: {
    brand: "Prada",
    keyword: "prada men sneakers",
    eyebrow: "Milanese Movement",
    h2: "Prada Men's Sneakers",
    intro:
      "Prada men's sneakers move between boardroom and boarding gate without missing a step. Re-nylon uppers, brushed calfskin, lug soles — the house's technical archive, rebuilt for the way you live now.",
    ctaLabel: "Shop Prada Sneakers",
    categoryQuery:
      '(product_type:"Sneakers" OR product_type:"Sneaker" OR product_type:"Trainers" OR tag:"sneakers" OR tag:"sneaker")',
  },
  "Bottega Veneta": {
    brand: "Bottega Veneta",
    keyword: "bottega veneta men wallet",
    eyebrow: "The Quiet Signal",
    h2: "Bottega Veneta Men's Wallets",
    intro:
      "A Bottega Veneta men's wallet speaks before you do. Hand-woven intrecciato in Vicenza nappa — no logos, no noise, just the leather craft that discerning hands recognise instantly.",
    ctaLabel: "Shop Bottega Wallets",
    categoryQuery:
      '(product_type:"Wallet" OR product_type:"Wallets" OR product_type:"Cardholder" OR product_type:"Card Holder" OR tag:"wallet" OR tag:"wallets" OR tag:"cardholder")',
  },
  Gucci: {
    brand: "Gucci",
    keyword: "gucci men loafers",
    eyebrow: "The Original Icon",
    h2: "Gucci Men's Loafers",
    intro:
      "Gucci men's loafers have earned their place in the permanent collection — and in your rotation. The 1953 horsebit, Florentine calfskin, a leather sole that ages like a signature. Some codes never expire.",
    ctaLabel: "Shop Gucci Loafers",
    categoryQuery:
      '(product_type:"Loafers" OR product_type:"Loafer" OR product_type:"Moccasin" OR product_type:"Moccasins" OR tag:"loafers" OR tag:"loafer")',
  },
  "Tom Ford": {
    brand: "Tom Ford",
    keyword: "tom ford men suit",
    eyebrow: "Cinematic Cut",
    h2: "Tom Ford Men's Suits",
    intro:
      "The Tom Ford men's suit is cut for the moment the room goes quiet. Peak lapels, sculpted shoulders, wool-mohair cloth that catches light like a camera lens. This is not tailoring. This is presence.",
    ctaLabel: "Shop Tom Ford Suits",
    categoryQuery:
      '(product_type:"Suit" OR product_type:"Suits" OR product_type:"Blazer" OR product_type:"Blazers" OR tag:"suit" OR tag:"suiting" OR tag:"tailoring")',
  },
};

export function spotlightFor(brandName: string): BrandCategorySpotlight | null {
  return BRAND_CATEGORY_SPOTLIGHTS[brandName] ?? null;
}
