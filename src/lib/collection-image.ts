// Each Shopify collection gets a dedicated, semantically-accurate hero image.
// Mapped explicitly by handle so every card is both unique and on-topic.
// Fallback rules cover any future collections that haven't been mapped yet.

import allProducts from "@/assets/collections/auto/all-products.jpg";
import womensAccessories from "@/assets/collections/auto/womens-accessories-1.jpg";
import mensAccessories from "@/assets/collections/auto/mens-accessories.jpg";
import mensClothing from "@/assets/collections/auto/mens-clothing.jpg";
import mensShoesImg from "@/assets/collections/auto/mens-shoes.jpg";
import newArrivals from "@/assets/collections/auto/new-arrivals.jpg";
import bestSelling from "@/assets/collections/auto/best-selling-brands.jpg";
import highDiscounts from "@/assets/collections/auto/high-discounts.jpg";
import womensBags from "@/assets/collections/auto/womens-bags.jpg";
import womensWallets from "@/assets/collections/auto/womens-wallets.jpg";
import womensBelts from "@/assets/collections/auto/womens-belts.jpg";
import womensJewelry from "@/assets/collections/auto/womens-jewelry.jpg";
import womensWatches from "@/assets/collections/auto/womens-watches.jpg";
import womensScarves from "@/assets/collections/auto/womens-scarves.jpg";
import womensHats from "@/assets/collections/auto/womens-hats.jpg";
import mensJacketsCoats from "@/assets/collections/auto/mens-jackets-coats.jpg";
import mensSuits from "@/assets/collections/auto/mens-suits.jpg";
import mensShirts from "@/assets/collections/auto/mens-shirts.jpg";
import mensTshirtsPolos from "@/assets/collections/auto/mens-tshirts-polos.jpg";
import mensSweaters from "@/assets/collections/auto/mens-sweaters-knitwear.jpg";
import mensHoodies from "@/assets/collections/auto/mens-hoodies-sweatshirts.jpg";
import mensPants from "@/assets/collections/auto/mens-pants-trousers.jpg";
import mensShorts from "@/assets/collections/auto/mens-shorts.jpg";
import mensActivewear from "@/assets/collections/auto/mens-activewear.jpg";
import mensSwimwear from "@/assets/collections/auto/mens-swimwear.jpg";
import mensUnderwear from "@/assets/collections/auto/mens-underwear-loungewear.jpg";
import mensSneakers from "@/assets/collections/auto/mens-sneakers.jpg";
import mensBoots from "@/assets/collections/auto/mens-boots.jpg";
import mensSandals from "@/assets/collections/auto/mens-sandals-slides.jpg";
import mensBagsWallets from "@/assets/collections/auto/mens-bags-wallets.jpg";
import mensBelts from "@/assets/collections/auto/mens-belts.jpg";
import mensWatchesJewelry from "@/assets/collections/auto/mens-watches-jewelry.jpg";
import womensClothing from "@/assets/collections/auto/womens-clothing.jpg";
import womensShoes from "@/assets/collections/auto/womens-shoes.jpg";

const BY_HANDLE: Record<string, string> = {
  "all-products": allProducts,
  "womens-accessories-1": womensAccessories,
  "womens-accessories": womensAccessories,
  "mens-accessories": mensAccessories,
  "mens-clothing": mensClothing,
  "mens-shoes": mensShoesImg,
  "new-arrivals": newArrivals,
  "best-selling-brands": bestSelling,
  "high-discounts": highDiscounts,
  "womens-bags": womensBags,
  "womens-wallets": womensWallets,
  "womens-belts": womensBelts,
  "womens-jewelry": womensJewelry,
  "womens-watches": womensWatches,
  "womens-scarves": womensScarves,
  "womens-hats": womensHats,
  "mens-jackets-coats": mensJacketsCoats,
  "mens-suits": mensSuits,
  "mens-shirts": mensShirts,
  "mens-tshirts-polos": mensTshirtsPolos,
  "mens-sweaters-knitwear": mensSweaters,
  "mens-hoodies-sweatshirts": mensHoodies,
  "mens-pants-trousers": mensPants,
  "mens-shorts": mensShorts,
  "mens-activewear": mensActivewear,
  "mens-swimwear": mensSwimwear,
  "mens-underwear-loungewear": mensUnderwear,
  "mens-sneakers": mensSneakers,
  "mens-boots": mensBoots,
  "mens-sandals-slides": mensSandals,
  "mens-bags-wallets": mensBagsWallets,
  "mens-belts": mensBelts,
  "mens-watches-jewelry": mensWatchesJewelry,
  "womens-clothing": womensClothing,
  "womens-shoes": womensShoes,
};

// Fallback rules — first match wins. Used only for handles not in BY_HANDLE.
const FALLBACK_RULES: { test: RegExp; img: string }[] = [
  { test: /\bmen('?s)?\b.*(suit|tuxedo|tailoring)/, img: mensSuits },
  { test: /\bmen('?s)?\b.*(shirt|polo)/, img: mensShirts },
  { test: /\bmen('?s)?\b.*(coat|outerwear|jacket|parka|trench)/, img: mensJacketsCoats },
  { test: /\bmen('?s)?\b.*(boot)/, img: mensBoots },
  { test: /\bmen('?s)?\b.*(sneaker)/, img: mensSneakers },
  { test: /\bmen('?s)?\b.*(sandal|slide)/, img: mensSandals },
  { test: /\bmen('?s)?\b.*(shoe|loafer|oxford|derby|footwear)/, img: mensShoesImg },
  { test: /\bmen('?s)?\b.*(knit|sweater|cashmere|jumper|cardigan)/, img: mensSweaters },
  { test: /\bmen('?s)?\b.*(hoodie|sweatshirt)/, img: mensHoodies },
  { test: /\bmen('?s)?\b.*(pant|trouser)/, img: mensPants },
  { test: /\bmen('?s)?\b.*(short)/, img: mensShorts },
  { test: /\bmen('?s)?\b.*(swim)/, img: mensSwimwear },
  { test: /\bmen('?s)?\b.*(active|sport|gym)/, img: mensActivewear },
  { test: /\bmen('?s)?\b.*(underwear|lounge|pajama|sleep)/, img: mensUnderwear },
  { test: /\bmen('?s)?\b.*(watch|jewel)/, img: mensWatchesJewelry },
  { test: /\bmen('?s)?\b.*(bag|wallet|brief)/, img: mensBagsWallets },
  { test: /\bmen('?s)?\b.*(belt)/, img: mensBelts },
  { test: /\bmen('?s)?\b.*(access)/, img: mensAccessories },
  { test: /\bmen('?s)?\b/, img: mensClothing },
  { test: /\bwomen('?s)?\b.*(dress|gown|evening)/, img: womensClothing },
  { test: /\bwomen('?s)?\b.*(blouse|shirt|top)/, img: womensClothing },
  { test: /\bwomen('?s)?\b.*(shoe|heel|pump|sandal|mule|stiletto|boot)/, img: womensShoes },
  { test: /\bwomen('?s)?\b.*(bag|tote|clutch|handbag|purse)/, img: womensBags },
  { test: /\bwomen('?s)?\b.*(wallet)/, img: womensWallets },
  { test: /\bwomen('?s)?\b.*(belt)/, img: womensBelts },
  { test: /\bwomen('?s)?\b.*(jewel)/, img: womensJewelry },
  { test: /\bwomen('?s)?\b.*(watch)/, img: womensWatches },
  { test: /\bwomen('?s)?\b.*(scarf|shawl)/, img: womensScarves },
  { test: /\bwomen('?s)?\b.*(hat|cap)/, img: womensHats },
  { test: /\bwomen('?s)?\b.*(access)/, img: womensAccessories },
  { test: /\bwomen('?s)?\b/, img: womensClothing },
  { test: /\b(new|arrival|fresh)\b/, img: newArrivals },
  { test: /\b(brand|maison|designer)\b/, img: bestSelling },
  { test: /\b(sale|discount|deal|outlet)\b/, img: highDiscounts },
];

export function collectionImage(input: {
  title?: string;
  handle?: string;
  description?: string | null;
  /** Optional handle → image URL map from the nightly sync (DB-backed). */
  dynamicMap?: Record<string, string>;
}): string {
  const handle = (input.handle ?? "").trim().toLowerCase();

  // 1. Dynamic map from Shopify sync (preferred — auto-updates with new collections)
  if (handle && input.dynamicMap && input.dynamicMap[handle]) {
    return input.dynamicMap[handle];
  }

  // 2. Curated static map (bundled fallback for the 34 known handles)
  if (handle && BY_HANDLE[handle]) return BY_HANDLE[handle];

  // 3. Regex rules for unknown handles
  const hay = `${input.title ?? ""} ${handle} ${input.description ?? ""}`
    .toLowerCase()
    .replace(/[-_]+/g, " ");
  for (const rule of FALLBACK_RULES) {
    if (rule.test.test(hay)) return rule.img;
  }
  return allProducts;
}

// SEO-friendly alt text per collection handle. Each line describes what the
// hero image actually depicts plus the category it represents, so search
// engines and screen readers get meaningful context — not just the title.
const ALT_BY_HANDLE: Record<string, string> = {
  "all-products": "Curated selection of luxury designer fashion at Palace of Roman",
  "new-arrivals": "Latest designer arrivals — newest luxury fashion drops at Palace of Roman",
  "best-selling-brands": "Best-selling luxury fashion houses and designer brands at Palace of Roman",
  "high-discounts": "Discounted designer fashion — luxury items on sale at Palace of Roman",
  "womens-accessories": "Women's designer accessories — luxury handbags, jewelry and finishing pieces",
  "womens-accessories-1": "Women's designer accessories — luxury handbags, jewelry and finishing pieces",
  "womens-clothing": "Women's designer clothing — luxury dresses, tops and ready-to-wear",
  "womens-shoes": "Women's designer shoes — luxury heels, pumps, sandals and boots",
  "womens-bags": "Women's designer handbags — luxury totes, clutches and shoulder bags",
  "womens-wallets": "Women's designer wallets and small leather goods",
  "womens-belts": "Women's designer belts in luxury leather and signature hardware",
  "womens-jewelry": "Women's designer jewelry — fine necklaces, earrings and rings",
  "womens-watches": "Women's designer watches — luxury timepieces and bracelets",
  "womens-scarves": "Women's designer scarves and silk shawls",
  "womens-hats": "Women's designer hats and headwear",
  "mens-accessories": "Men's designer accessories — luxury wallets, belts and finishing pieces",
  "mens-clothing": "Men's designer clothing — luxury ready-to-wear and tailoring",
  "mens-shoes": "Men's designer shoes — luxury loafers, oxfords and dress footwear",
  "mens-jackets-coats": "Men's designer jackets and coats — luxury outerwear and overcoats",
  "mens-suits": "Men's designer suits and luxury tailoring",
  "mens-shirts": "Men's designer shirts — luxury dress and casual shirting",
  "mens-tshirts-polos": "Men's designer t-shirts and polo shirts",
  "mens-sweaters-knitwear": "Men's designer sweaters and knitwear — cashmere and merino knits",
  "mens-hoodies-sweatshirts": "Men's designer hoodies and sweatshirts",
  "mens-pants-trousers": "Men's designer pants and tailored trousers",
  "mens-shorts": "Men's designer shorts in luxury fabrics",
  "mens-activewear": "Men's designer activewear and luxury sportswear",
  "mens-swimwear": "Men's designer swimwear and swim shorts",
  "mens-underwear-loungewear": "Men's designer underwear and loungewear",
  "mens-sneakers": "Men's designer sneakers — luxury low- and high-top trainers",
  "mens-boots": "Men's designer boots — luxury Chelsea, lace-up and ankle boots",
  "mens-sandals-slides": "Men's designer sandals and slides",
  "mens-bags-wallets": "Men's designer bags and wallets — briefcases, backpacks and leather goods",
  "mens-belts": "Men's designer belts in luxury leather",
  "mens-watches-jewelry": "Men's designer watches and jewelry",
};

export function collectionImageAlt(input: {
  title?: string;
  handle?: string;
}): string {
  const handle = (input.handle ?? "").trim().toLowerCase();
  if (handle && ALT_BY_HANDLE[handle]) return ALT_BY_HANDLE[handle];
  const title = (input.title ?? "").trim();
  if (title) return `${title} — designer collection at Palace of Roman`;
  return "Designer collection at Palace of Roman";
}

// Focal point per collection handle, expressed as a CSS `object-position`
// value. Combined with `object-cover` and a fixed aspect ratio, this keeps
// the subject in frame across mobile (narrow), tablet, and desktop crops.
//
// Rule of thumb used below:
//  - Apparel on a model → upper portion (face/torso) — "50% 30%"
//  - Footwear / bags / small leather goods → center weighted — "50% 55%"
//  - Watches & jewelry → tight center — "50% 50%"
//  - Flat-lay or product groupings → center — "50% 50%"
const FOCAL_BY_HANDLE: Record<string, string> = {
  "all-products": "50% 45%",
  "new-arrivals": "50% 35%",
  "best-selling-brands": "50% 45%",
  "high-discounts": "50% 50%",

  // Women's — apparel framed on torso/face
  "womens-clothing": "50% 30%",
  "womens-shoes": "50% 60%",
  "womens-bags": "50% 50%",
  "womens-wallets": "50% 55%",
  "womens-belts": "50% 50%",
  "womens-jewelry": "50% 45%",
  "womens-watches": "50% 50%",
  "womens-scarves": "50% 35%",
  "womens-hats": "50% 25%",
  "womens-accessories": "50% 45%",
  "womens-accessories-1": "50% 45%",

  // Men's — apparel framed on torso/face
  "mens-clothing": "50% 30%",
  "mens-shoes": "50% 60%",
  "mens-jackets-coats": "50% 30%",
  "mens-suits": "50% 30%",
  "mens-shirts": "50% 30%",
  "mens-tshirts-polos": "50% 30%",
  "mens-sweaters-knitwear": "50% 30%",
  "mens-hoodies-sweatshirts": "50% 30%",
  "mens-pants-trousers": "50% 55%",
  "mens-shorts": "50% 55%",
  "mens-activewear": "50% 35%",
  "mens-swimwear": "50% 40%",
  "mens-underwear-loungewear": "50% 40%",
  "mens-sneakers": "50% 60%",
  "mens-boots": "50% 60%",
  "mens-sandals-slides": "50% 60%",
  "mens-bags-wallets": "50% 50%",
  "mens-belts": "50% 50%",
  "mens-watches-jewelry": "50% 50%",
  "mens-accessories": "50% 45%",
};

// Heuristics for collections not yet mapped — keep subject visible across crops.
const FOCAL_RULES: { test: RegExp; pos: string }[] = [
  { test: /(suit|jacket|coat|shirt|polo|sweater|knit|hoodie|tshirt|t-shirt|dress|blouse|top)/, pos: "50% 30%" },
  { test: /(hat|cap|headwear)/, pos: "50% 25%" },
  { test: /(scarf|shawl)/, pos: "50% 35%" },
  { test: /(shoe|sneaker|boot|sandal|slide|loafer|heel|pump)/, pos: "50% 60%" },
  { test: /(pant|trouser|short|swim)/, pos: "50% 55%" },
  { test: /(bag|wallet|tote|clutch|purse|brief|backpack)/, pos: "50% 50%" },
  { test: /(belt)/, pos: "50% 50%" },
  { test: /(watch|jewel|ring|necklace|earring)/, pos: "50% 50%" },
];

/**
 * Returns a CSS `object-position` value for the collection hero image.
 * Pass directly to `<img style={{ objectPosition: ... }} className="object-cover" />`
 * so the subject stays framed at every responsive aspect ratio.
 */
export function collectionImageFocal(input: {
  title?: string;
  handle?: string;
}): string {
  const handle = (input.handle ?? "").trim().toLowerCase();
  if (handle && FOCAL_BY_HANDLE[handle]) return FOCAL_BY_HANDLE[handle];
  const hay = `${input.title ?? ""} ${handle}`.toLowerCase().replace(/[-_]+/g, " ");
  for (const rule of FOCAL_RULES) {
    if (rule.test.test(hay)) return rule.pos;
  }
  return "50% 40%";
}

// ───────────────────────────────────────────────────────────────────────
// QA / admin helpers
// ───────────────────────────────────────────────────────────────────────

// Reverse map: bundled image URL → canonical topic key. Lets us tell which
// "topic" the resolved image actually represents, so QA can compare it
// against the collection's title/description.
const IMG_TO_TOPIC: Map<string, string> = new Map(
  Object.entries(BY_HANDLE).map(([handle, img]) => [img, handle]),
);

export type CollectionImageSource = "dynamic" | "handle" | "rule" | "default";

export interface ResolvedCollectionImage {
  src: string;
  /** Canonical topic key (a handle from BY_HANDLE), or "dynamic" for sync-sourced. */
  topic: string;
  source: CollectionImageSource;
}

/** Same resolution as collectionImage(), but also reports how it was chosen. */
export function resolveCollectionImage(input: {
  title?: string;
  handle?: string;
  description?: string | null;
  dynamicMap?: Record<string, string>;
}): ResolvedCollectionImage {
  const handle = (input.handle ?? "").trim().toLowerCase();

  if (handle && input.dynamicMap && input.dynamicMap[handle]) {
    return { src: input.dynamicMap[handle], topic: "dynamic", source: "dynamic" };
  }
  if (handle && BY_HANDLE[handle]) {
    return { src: BY_HANDLE[handle], topic: handle, source: "handle" };
  }
  const hay = `${input.title ?? ""} ${handle} ${input.description ?? ""}`
    .toLowerCase()
    .replace(/[-_]+/g, " ");
  for (const rule of FALLBACK_RULES) {
    if (rule.test.test(hay)) {
      return { src: rule.img, topic: IMG_TO_TOPIC.get(rule.img) ?? "unknown", source: "rule" };
    }
  }
  return { src: allProducts, topic: "all-products", source: "default" };
}

// Expected gender + category keywords per topic. Used to QA-score whether the
// resolved image semantically matches the collection's title/description.
interface TopicExpectation {
  gender: "mens" | "womens" | null;
  /** Any one of these patterns appearing in title+desc counts as a category match. */
  category: RegExp[];
  /** Topics that don't need a category check (broad/marketing buckets). */
  broad?: boolean;
}

const TOPIC_EXPECTATIONS: Record<string, TopicExpectation> = {
  "all-products": { gender: null, category: [], broad: true },
  "new-arrivals": { gender: null, category: [/\b(new|arrival|fresh|just[- ]in|drop)\b/], broad: true },
  "best-selling-brands": { gender: null, category: [/\b(brand|maison|designer|bestsell|best[- ]selling)\b/], broad: true },
  "high-discounts": { gender: null, category: [/\b(sale|discount|deal|outlet|off|markdown)\b/], broad: true },

  "womens-clothing": { gender: "womens", category: [/\b(cloth|dress|gown|blouse|top|skirt|jumpsuit|knit|coat|jacket)\b/] },
  "womens-shoes": { gender: "womens", category: [/\b(shoe|heel|pump|sandal|mule|stiletto|boot|loafer|footwear)\b/] },
  "womens-bags": { gender: "womens", category: [/\b(bag|tote|clutch|handbag|purse|shoulder|hobo|satchel)\b/] },
  "womens-wallets": { gender: "womens", category: [/\b(wallet|cardholder|purse|pouch)\b/] },
  "womens-belts": { gender: "womens", category: [/\bbelt/] },
  "womens-jewelry": { gender: "womens", category: [/\b(jewel|necklace|earring|ring|bracelet|pendant)\b/] },
  "womens-watches": { gender: "womens", category: [/\bwatch/] },
  "womens-scarves": { gender: "womens", category: [/\b(scarf|shawl|stole|foulard)\b/] },
  "womens-hats": { gender: "womens", category: [/\b(hat|cap|beanie|fedora|headwear)\b/] },
  "womens-accessories": { gender: "womens", category: [/\b(access|jewel|belt|bag|scarf|hat|wallet|sunglass)\b/] },
  "womens-accessories-1": { gender: "womens", category: [/\b(access|jewel|belt|bag|scarf|hat|wallet|sunglass)\b/] },

  "mens-clothing": { gender: "mens", category: [/\b(cloth|shirt|suit|jacket|coat|knit|sweater|pant|trouser|short|tee|polo)\b/] },
  "mens-shoes": { gender: "mens", category: [/\b(shoe|loafer|oxford|derby|footwear|brogue)\b/] },
  "mens-jackets-coats": { gender: "mens", category: [/\b(jacket|coat|outerwear|parka|trench|blazer|bomber)\b/] },
  "mens-suits": { gender: "mens", category: [/\b(suit|tuxedo|tailor|formal)\b/] },
  "mens-shirts": { gender: "mens", category: [/\b(shirt|button[- ]?down|oxford|dress shirt)\b/] },
  "mens-tshirts-polos": { gender: "mens", category: [/\b(t[- ]?shirt|tee|polo)\b/] },
  "mens-sweaters-knitwear": { gender: "mens", category: [/\b(sweater|knit|cashmere|jumper|cardigan|pullover)\b/] },
  "mens-hoodies-sweatshirts": { gender: "mens", category: [/\b(hoodie|sweatshirt|hooded)\b/] },
  "mens-pants-trousers": { gender: "mens", category: [/\b(pant|trouser|chino|jean|denim)\b/] },
  "mens-shorts": { gender: "mens", category: [/\bshort\b/] },
  "mens-activewear": { gender: "mens", category: [/\b(active|sport|gym|training|track)\b/] },
  "mens-swimwear": { gender: "mens", category: [/\b(swim|beach|boardshort|trunk)\b/] },
  "mens-underwear-loungewear": { gender: "mens", category: [/\b(underwear|lounge|pajama|sleep|boxer|brief|robe)\b/] },
  "mens-sneakers": { gender: "mens", category: [/\b(sneaker|trainer|kicks)\b/] },
  "mens-boots": { gender: "mens", category: [/\bboot/] },
  "mens-sandals-slides": { gender: "mens", category: [/\b(sandal|slide|flip[- ]?flop)\b/] },
  "mens-bags-wallets": { gender: "mens", category: [/\b(bag|wallet|briefcase|backpack|messenger|pouch)\b/] },
  "mens-belts": { gender: "mens", category: [/\bbelt/] },
  "mens-watches-jewelry": { gender: "mens", category: [/\b(watch|jewel|cufflink|bracelet|ring|necklace)\b/] },
  "mens-accessories": { gender: "mens", category: [/\b(access|belt|wallet|bag|tie|cufflink|sunglass|hat)\b/] },
};

function detectGender(text: string): "mens" | "womens" | null {
  // Strip "women(s)" first so it doesn't get re-matched as "men".
  const womenHits = /\b(women|ladies|female|her)\b/.test(text);
  const stripped = text.replace(/\bwomen('?s)?\b/g, " ").replace(/\bladies\b/g, " ");
  const menHits = /\b(men|male|gentlem|his)\b/.test(stripped);
  if (womenHits && !menHits) return "womens";
  if (menHits && !womenHits) return "mens";
  if (womenHits && menHits) return null; // unisex / mixed
  return null;
}

export type QaStatus = "ok" | "review" | "mismatch";

export interface CollectionImageQa {
  status: QaStatus;
  /** Topic the resolved image represents. */
  imageTopic: string;
  /** Gender inferred from the collection's title/description. */
  collectionGender: "mens" | "womens" | null;
  /** Human-readable reason for the status. */
  reason: string;
  /** Optional fix suggestion. */
  suggestion?: string;
  source: CollectionImageSource;
}

/**
 * Audits whether the resolved image semantically matches a Shopify
 * collection's title + description. Status legend:
 *  - ok:       image topic, gender, and category all line up
 *  - review:   image was chosen by a regex fallback (worth a human glance)
 *  - mismatch: image gender or category clearly disagrees with the copy
 *
 * Dynamic (Shopify-supplied or DB-synced) images skip the topic check —
 * we trust the source — and are always reported as "ok".
 */
export function qaCollectionImage(input: {
  handle: string;
  title?: string;
  description?: string | null;
  dynamicMap?: Record<string, string>;
}): CollectionImageQa {
  const resolved = resolveCollectionImage(input);
  const hay = `${input.title ?? ""} ${input.handle} ${input.description ?? ""}`
    .toLowerCase()
    .replace(/[-_]+/g, " ");
  const collectionGender = detectGender(hay);

  // Trust dynamic/Shopify-supplied imagery.
  if (resolved.source === "dynamic") {
    return {
      status: "ok",
      imageTopic: "dynamic",
      collectionGender,
      reason: "Image supplied by Shopify/sync — not generated from the topic map.",
      source: resolved.source,
    };
  }

  const expectation = TOPIC_EXPECTATIONS[resolved.topic];

  // Default bucket on a non-broad collection → almost certainly miscategorised.
  if (resolved.source === "default") {
    return {
      status: "mismatch",
      imageTopic: resolved.topic,
      collectionGender,
      reason: "No topic matched — falling back to the generic 'all-products' hero.",
      suggestion: "Add this handle to BY_HANDLE or extend FALLBACK_RULES with a matching keyword.",
      source: resolved.source,
    };
  }

  if (!expectation) {
    return {
      status: "review",
      imageTopic: resolved.topic,
      collectionGender,
      reason: `Image topic '${resolved.topic}' has no QA expectation defined.`,
      source: resolved.source,
    };
  }

  // Gender mismatch is the strongest signal.
  if (expectation.gender && collectionGender && expectation.gender !== collectionGender) {
    return {
      status: "mismatch",
      imageTopic: resolved.topic,
      collectionGender,
      reason: `Image is a ${expectation.gender} hero but the collection reads as ${collectionGender}.`,
      suggestion: `Remap '${input.handle}' to a ${collectionGender}-* topic.`,
      source: resolved.source,
    };
  }

  // Category keyword check (skipped for broad marketing buckets).
  if (!expectation.broad && expectation.category.length > 0) {
    const hit = expectation.category.some((rx) => rx.test(hay));
    if (!hit) {
      return {
        status: resolved.source === "rule" ? "review" : "mismatch",
        imageTopic: resolved.topic,
        collectionGender,
        reason: `Title/description don't mention the image's category (${resolved.topic}).`,
        suggestion: "Confirm the topic is correct or update BY_HANDLE.",
        source: resolved.source,
      };
    }
  }

  // Rule-matched but otherwise consistent — flag for a quick eyeball.
  if (resolved.source === "rule") {
    return {
      status: "review",
      imageTopic: resolved.topic,
      collectionGender,
      reason: "Image was chosen by a fallback rule rather than an explicit handle mapping.",
      suggestion: `Consider adding '${input.handle}' to BY_HANDLE for a deterministic mapping.`,
      source: resolved.source,
    };
  }

  return {
    status: "ok",
    imageTopic: resolved.topic,
    collectionGender,
    reason: "Image topic, gender, and category align with the collection copy.",
    source: resolved.source,
  };
}
