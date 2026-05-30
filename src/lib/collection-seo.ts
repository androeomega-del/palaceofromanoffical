// Per-collection SEO meta titles & descriptions for /collections/$handle.
//
// Goal: every Shopify collection page ships with a unique, focus-tuned
// <title> and <meta description> instead of a generic "Shop {Title}…"
// fallback. Three tiers:
//
//   1. Curated TITLE_BY_HANDLE / DESC_BY_HANDLE for the 36 known
//      Palace of Roman collection handles (boutique-voiced, keyword-rich).
//   2. Auto-generated copy from Shopify title + description + handle for
//      anything new or one-off, using ALT_KEYWORD_RULES-style detection.
//   3. Generic store-level fallback if absolutely nothing is known.
//
// Outputs are pre-truncated to Google's safe limits (title <= 60,
// description <= 158).

import { metaDescription, pageTitle } from "@/lib/seo";

// ───────────────────────────────────────────────────────────────────────
// 1. Curated per-handle copy
// ───────────────────────────────────────────────────────────────────────

type Seo = { title: string; description: string };

const BY_HANDLE: Record<string, Seo> = {
  "all-products": {
    title: "Designer Fashion — Curated Luxury Boutique",
    description:
      "Shop a curated edit of luxury designer fashion at Palace of Roman. 100% authentic pieces from leading maisons, with worldwide shipping.",
  },
  "new-arrivals": {
    title: "New Arrivals — Latest Designer Drops",
    description:
      "Discover the newest designer arrivals at Palace of Roman. Fresh-season ready-to-wear, shoes, bags and accessories from luxury fashion houses.",
  },
  "best-selling-brands": {
    title: "Best-Selling Designer Brands",
    description:
      "Browse the most-loved luxury houses at Palace of Roman — best-selling designer brands handpicked across women's and men's fashion.",
  },
  "best-sellers": {
    title: "Best Sellers — Most-Loved Designer Pieces",
    description:
      "The pieces our clients reach for most — a live ranking of Palace of Roman's most-ordered designer styles across every luxury maison.",
  },

  // Women's
  "womens-clothing": {
    title: "Women's Designer Clothing — Luxury Ready-to-Wear",
    description:
      "Shop women's designer clothing at Palace of Roman — luxury dresses, tops, skirts and ready-to-wear from leading fashion houses, 100% authentic.",
  },
  "womens-shoes": {
    title: "Women's Designer Shoes — Heels, Pumps & Boots",
    description:
      "Discover women's designer shoes at Palace of Roman — luxury heels, pumps, sandals, sneakers and boots from the world's most-loved maisons.",
  },
  "womens-bags": {
    title: "Women's Designer Handbags & Totes",
    description:
      "Shop women's designer handbags at Palace of Roman — luxury totes, clutches, shoulder bags and crossbody styles from top fashion houses.",
  },
  "womens-accessories": {
    title: "Women's Designer Accessories",
    description:
      "Curated women's designer accessories at Palace of Roman — luxury handbags, jewelry, scarves, hats and finishing pieces from leading maisons.",
  },
  "womens-accessories-1": {
    title: "Women's Designer Accessories",
    description:
      "Curated women's designer accessories at Palace of Roman — luxury handbags, jewelry, scarves, hats and finishing pieces from leading maisons.",
  },
  "womens-wallets": {
    title: "Women's Designer Wallets & Small Leather Goods",
    description:
      "Shop women's designer wallets at Palace of Roman — luxury cardholders, zip wallets and small leather goods from the world's top fashion houses.",
  },
  "womens-belts": {
    title: "Women's Designer Belts — Luxury Leather",
    description:
      "Discover women's designer belts at Palace of Roman — luxury leather, signature hardware and statement buckles from leading fashion maisons.",
  },
  "womens-jewelry": {
    title: "Women's Designer Jewelry — Necklaces, Earrings & Rings",
    description:
      "Shop women's designer jewelry at Palace of Roman — fine necklaces, earrings, rings and bracelets from the world's most-loved luxury houses.",
  },
  "womens-watches": {
    title: "Women's Designer Watches — Luxury Timepieces",
    description:
      "Discover women's designer watches at Palace of Roman — luxury timepieces, bracelet watches and statement pieces from leading maisons.",
  },
  "womens-scarves": {
    title: "Women's Designer Scarves & Silk Shawls",
    description:
      "Shop women's designer scarves at Palace of Roman — luxury silk twills, cashmere shawls and printed scarves from top fashion houses.",
  },
  "womens-hats": {
    title: "Women's Designer Hats & Headwear",
    description:
      "Discover women's designer hats at Palace of Roman — luxury bucket hats, baseball caps, berets and headwear from leading fashion maisons.",
  },

  // Men's
  "mens-clothing": {
    title: "Men's Designer Clothing — Luxury Ready-to-Wear",
    description:
      "Shop men's designer clothing at Palace of Roman — luxury ready-to-wear and tailoring from leading fashion houses, 100% authentic.",
  },
  "mens-shoes": {
    title: "Men's Designer Shoes — Loafers, Oxfords & More",
    description:
      "Discover men's designer shoes at Palace of Roman — luxury loafers, oxfords, derbies and dress footwear from the world's top maisons.",
  },
  "mens-suits": {
    title: "Men's Designer Suits — Luxury Tailoring",
    description:
      "Shop men's designer suits at Palace of Roman — luxury tailoring, two-piece sets and formalwear from leading Italian and French houses.",
  },
  "mens-shirts": {
    title: "Men's Designer Shirts — Dress & Casual",
    description:
      "Discover men's designer shirts at Palace of Roman — luxury dress shirts and casual shirting from the world's top fashion maisons.",
  },
  "mens-tshirts-polos": {
    title: "Men's Designer T-Shirts & Polo Shirts",
    description:
      "Shop men's designer t-shirts and polos at Palace of Roman — luxury cotton tees, logo tees and polo shirts from top fashion houses.",
  },
  "mens-sweaters-knitwear": {
    title: "Men's Designer Sweaters & Knitwear",
    description:
      "Discover men's designer knitwear at Palace of Roman — luxury cashmere and merino sweaters, cardigans and pullovers from top maisons.",
  },
  "mens-hoodies-sweatshirts": {
    title: "Men's Designer Hoodies & Sweatshirts",
    description:
      "Shop men's designer hoodies and sweatshirts at Palace of Roman — luxury fleece, logo prints and elevated essentials from top fashion houses.",
  },
  "mens-jackets-coats": {
    title: "Men's Designer Jackets & Coats — Luxury Outerwear",
    description:
      "Discover men's designer outerwear at Palace of Roman — luxury jackets, overcoats, parkas and trenches from the world's top maisons.",
  },
  "mens-pants-trousers": {
    title: "Men's Designer Pants & Tailored Trousers",
    description:
      "Shop men's designer trousers at Palace of Roman — luxury tailored pants, chinos and dress trousers from leading fashion houses.",
  },
  "mens-shorts": {
    title: "Men's Designer Shorts — Luxury Fabrics",
    description:
      "Discover men's designer shorts at Palace of Roman — luxury cotton, linen and technical shorts from the world's top fashion maisons.",
  },
  "mens-activewear": {
    title: "Men's Designer Activewear & Sportswear",
    description:
      "Shop men's designer activewear at Palace of Roman — luxury sportswear, technical pieces and elevated athleisure from top fashion houses.",
  },
  "mens-swimwear": {
    title: "Men's Designer Swimwear & Swim Shorts",
    description:
      "Discover men's designer swimwear at Palace of Roman — luxury swim shorts and trunks from leading Italian and French fashion houses.",
  },
  "mens-underwear-loungewear": {
    title: "Men's Designer Underwear & Loungewear",
    description:
      "Shop men's designer underwear and loungewear at Palace of Roman — luxury essentials and lounge pieces from top fashion maisons.",
  },
  "mens-sneakers": {
    title: "Men's Designer Sneakers — Luxury Trainers",
    description:
      "Discover men's designer sneakers at Palace of Roman — luxury low-tops, high-tops and runners from the world's top fashion houses.",
  },
  "mens-boots": {
    title: "Men's Designer Boots — Chelsea, Lace-Up & Ankle",
    description:
      "Shop men's designer boots at Palace of Roman — luxury Chelsea boots, lace-ups and ankle boots from leading Italian fashion maisons.",
  },
  "mens-sandals-slides": {
    title: "Men's Designer Sandals & Slides",
    description:
      "Discover men's designer sandals and slides at Palace of Roman — luxury logo slides, pool sandals and resort styles from top maisons.",
  },
  "mens-bags": {
    title: "Men's Designer Bags",
    description:
      "Shop men's designer bags at Palace of Roman — luxury briefcases, backpacks, messenger bags and totes from top houses. Worldwide tracked shipping.",
  },
  "mens-wallets": {
    title: "Men's Designer Wallets & Small Leather Goods",
    description:
      "Discover men's designer wallets and card-holders at Palace of Roman — luxury bifolds, zip-around wallets and small leather goods from top maisons.",
  },
  "mens-belts": {
    title: "Men's Designer Belts — Luxury Leather",
    description:
      "Discover men's designer belts at Palace of Roman — luxury leather belts with signature hardware and reversible buckles from top maisons.",
  },
  "mens-watches-jewelry": {
    title: "Men's Designer Watches & Jewelry",
    description:
      "Shop men's designer watches and jewelry at Palace of Roman — luxury timepieces, bracelets, chains and rings from leading fashion houses.",
  },
  "mens-accessories": {
    title: "Men's Designer Accessories",
    description:
      "Curated men's designer accessories at Palace of Roman — luxury wallets, belts, sunglasses and finishing pieces from leading fashion maisons.",
  },
};

// ───────────────────────────────────────────────────────────────────────
// 2. Auto-generated copy for unknown handles
// ───────────────────────────────────────────────────────────────────────

type Inferred = { kind: string; phrase: string; titleHead: string };

const RULES: Array<{ test: RegExp; out: Inferred }> = [
  { test: /\b(women'?s?|woman|ladies|female)\b.*\b(dress|gown)/i,
    out: { kind: "dresses", phrase: "luxury dresses and gowns", titleHead: "Women's Designer Dresses" } },
  { test: /\b(women'?s?|woman|ladies|female)\b.*\b(shoe|heel|pump|sandal|boot|sneaker)/i,
    out: { kind: "shoes", phrase: "luxury heels, pumps, sandals and boots", titleHead: "Women's Designer Shoes" } },
  { test: /\b(women'?s?|woman|ladies|female)\b.*\b(bag|tote|clutch|handbag|purse)/i,
    out: { kind: "bags", phrase: "luxury totes, clutches and shoulder bags", titleHead: "Women's Designer Handbags" } },
  { test: /\b(women'?s?|woman|ladies|female)\b.*\b(jewel|necklace|earring|ring|bracelet)/i,
    out: { kind: "jewelry", phrase: "fine necklaces, earrings and rings", titleHead: "Women's Designer Jewelry" } },
  { test: /\b(women'?s?|woman|ladies|female)\b.*\b(watch|timepiece)/i,
    out: { kind: "watches", phrase: "luxury timepieces and bracelets", titleHead: "Women's Designer Watches" } },
  { test: /\b(women'?s?|woman|ladies|female)\b.*\b(accessor|scarf|hat|belt|wallet)/i,
    out: { kind: "accessories", phrase: "luxury accessories and finishing pieces", titleHead: "Women's Designer Accessories" } },
  { test: /\b(women'?s?|woman|ladies|female)\b/i,
    out: { kind: "women", phrase: "luxury designer pieces", titleHead: "Women's Designer Fashion" } },

  { test: /\b(men'?s?|man|male|gentlemen)\b.*\b(suit|tuxedo|tailoring)/i,
    out: { kind: "suits", phrase: "luxury suits and tailoring", titleHead: "Men's Designer Suits" } },
  { test: /\b(men'?s?|man|male|gentlemen)\b.*\b(shirt|polo)/i,
    out: { kind: "shirts", phrase: "luxury dress and casual shirts", titleHead: "Men's Designer Shirts" } },
  { test: /\b(men'?s?|man|male|gentlemen)\b.*\b(jacket|coat|outerwear|overcoat)/i,
    out: { kind: "outerwear", phrase: "luxury jackets, coats and outerwear", titleHead: "Men's Designer Outerwear" } },
  { test: /\b(men'?s?|man|male|gentlemen)\b.*\b(shoe|loafer|oxford|sneaker|boot|sandal)/i,
    out: { kind: "shoes", phrase: "luxury loafers, sneakers and dress footwear", titleHead: "Men's Designer Shoes" } },
  { test: /\b(men'?s?|man|male|gentlemen)\b.*\b(bag|backpack|briefcase|wallet)/i,
    out: { kind: "bags", phrase: "luxury bags, briefcases and leather goods", titleHead: "Men's Designer Bags & Leather Goods" } },
  { test: /\b(men'?s?|man|male|gentlemen)\b.*\b(watch|jewel)/i,
    out: { kind: "watches", phrase: "luxury timepieces and jewelry", titleHead: "Men's Designer Watches & Jewelry" } },
  { test: /\b(men'?s?|man|male|gentlemen)\b.*\b(accessor|belt|scarf|hat)/i,
    out: { kind: "accessories", phrase: "luxury accessories and finishing pieces", titleHead: "Men's Designer Accessories" } },
  { test: /\b(men'?s?|man|male|gentlemen)\b/i,
    out: { kind: "men", phrase: "luxury designer pieces", titleHead: "Men's Designer Fashion" } },

  { test: /\b(sale|discount|markdown|outlet|clearance)\b/i,
    out: { kind: "sale", phrase: "discounted luxury fashion at up to 70% off", titleHead: "Designer Sale" } },
  { test: /\b(new[-\s]?arrival|just[-\s]?in|latest|new[-\s]?drop)\b/i,
    out: { kind: "new", phrase: "the newest designer arrivals", titleHead: "New Designer Arrivals" } },
  { test: /\b(best[-\s]?sell|popular|trending|top[-\s]?pick)\b/i,
    out: { kind: "best", phrase: "best-selling designer pieces", titleHead: "Best-Selling Designer Pieces" } },
  { test: /\b(brand|house|maison|designer)s?\b/i,
    out: { kind: "brands", phrase: "the world's leading luxury fashion houses", titleHead: "Luxury Designer Brands" } },
];

function inferFromText(text: string): Inferred | null {
  for (const r of RULES) if (r.test.test(text)) return r.out;
  return null;
}

function titleizeHandle(handle: string): string {
  return handle
    .replace(/[-_]+/g, " ")
    .replace(/\b(\w)/g, (c) => c.toUpperCase())
    .replace(/\bs\b/g, "'s")
    .trim();
}

// ───────────────────────────────────────────────────────────────────────
// Public API
// ───────────────────────────────────────────────────────────────────────

export interface CollectionSeoInput {
  handle: string;
  title?: string;
  description?: string | null;
}

export interface CollectionSeo {
  /** Pre-truncated <title> tag (<= 60 chars including " — Palace of Roman"). */
  title: string;
  /** Pre-truncated <meta description> (<= 158 chars). */
  description: string;
  /** True when the copy came from the curated BY_HANDLE map. */
  curated: boolean;
}

export function collectionSeo(input: CollectionSeoInput): CollectionSeo {
  const handle = (input.handle ?? "").trim().toLowerCase();
  const title = (input.title ?? "").trim() || titleizeHandle(handle);
  const description = (input.description ?? "").trim();

  // 1. Curated
  if (handle && BY_HANDLE[handle]) {
    const curated = BY_HANDLE[handle];
    return {
      title: pageTitle(curated.title),
      description: metaDescription(curated.description),
      curated: true,
    };
  }

  // 2. Inferred — mine title + handle + description
  const haystack = `${title} ${handle.replace(/[-_]+/g, " ")} ${description}`;
  const inferred = inferFromText(haystack);

  if (inferred) {
    const seoTitle = pageTitle(
      title && !inferred.titleHead.toLowerCase().includes(title.toLowerCase())
        ? `${title} — ${inferred.titleHead}`
        : inferred.titleHead,
    );
    // Prefer the Shopify description verbatim if it is well-sized; otherwise
    // synthesize a focus-specific line from the inferred phrase.
    const fromShopify = description && metaDescription(description);
    const synthesized = `Shop ${title} at Palace of Roman — ${inferred.phrase} from leading fashion houses, 100% authentic with worldwide shipping.`;
    return {
      title: seoTitle,
      description: metaDescription(
        fromShopify && fromShopify.length >= 80 ? fromShopify : synthesized,
      ),
      curated: false,
    };
  }

  // 3. Generic fallback (title-driven)
  const fromShopify = description && metaDescription(description);
  const fallbackDesc =
    fromShopify && fromShopify.length >= 80
      ? fromShopify
      : `Shop ${title} from luxury designers at Palace of Roman. 100% authentic, worldwide shipping on every order.`;
  return {
    title: pageTitle(title),
    description: metaDescription(fallbackDesc),
    curated: false,
  };
}
