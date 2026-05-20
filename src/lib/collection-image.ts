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
import womensHandbags from "@/assets/collections/auto/womens-handbags.jpg";
import womensShoulderBags from "@/assets/collections/auto/womens-shoulder-bags.jpg";
import womensCrossbodyBags from "@/assets/collections/auto/womens-crossbody-bags.jpg";
import womensClutchBags from "@/assets/collections/auto/womens-clutch-bags.jpg";
import womensBackpacks from "@/assets/collections/auto/womens-backpacks.jpg";
import womensToteBags from "@/assets/collections/auto/womens-tote-bags.jpg";
import womensSneakers from "@/assets/collections/auto/womens-sneakers.jpg";
import womensBoots from "@/assets/collections/auto/womens-boots.jpg";
import womensSandals from "@/assets/collections/auto/womens-sandals.jpg";
import womensPumps from "@/assets/collections/auto/womens-pumps.jpg";
import womensFlats from "@/assets/collections/auto/womens-flats.jpg";
import womensLoafers from "@/assets/collections/auto/womens-loafers.jpg";
import womensDresses from "@/assets/collections/auto/womens-dresses.jpg";
import womensTops from "@/assets/collections/auto/womens-tops.jpg";
import womensPants from "@/assets/collections/auto/womens-pants.jpg";
import womensJeans from "@/assets/collections/auto/womens-jeans.jpg";
import womensSkirts from "@/assets/collections/auto/womens-skirts.jpg";
import womensJackets from "@/assets/collections/auto/womens-jackets.jpg";
import womensKnitwear from "@/assets/collections/auto/womens-knitwear.jpg";
import womensShorts from "@/assets/collections/auto/womens-shorts.jpg";
import womensSwimwear from "@/assets/collections/auto/womens-swimwear.jpg";
import womensSportswear from "@/assets/collections/auto/womens-sportswear.jpg";
import womensUnderwear from "@/assets/collections/auto/womens-underwear.jpg";
import womensSuits from "@/assets/collections/auto/womens-suits.jpg";
import womensSunglasses from "@/assets/collections/auto/womens-sunglasses.jpg";

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
  "womens-handbags": womensHandbags,
  "womens-shoulder-bags": womensShoulderBags,
  "womens-crossbody-bags": womensCrossbodyBags,
  "womens-clutch-bags": womensClutchBags,
  "womens-backpacks": womensBackpacks,
  "womens-tote-bags": womensToteBags,
  "womens-sneakers": womensSneakers,
  "womens-boots": womensBoots,
  "womens-sandals": womensSandals,
  "womens-pumps": womensPumps,
  "womens-flats": womensFlats,
  "womens-loafers": womensLoafers,
  "womens-dresses": womensDresses,
  "womens-tops": womensTops,
  "womens-shirts": womensTops,
  "womens-t-shirts": womensTops,
  "womens-blouses": womensTops,
  "womens-pants": womensPants,
  "womens-jeans": womensJeans,
  "womens-jeans-denim": womensJeans,
  "womens-skirts": womensSkirts,
  "womens-jackets": womensJackets,
  "womens-jackets-coats": womensJackets,
  "womens-knitwear": womensKnitwear,
  "womens-sweaters": womensKnitwear,
  "womens-shorts": womensShorts,
  "womens-swimwear": womensSwimwear,
  "womens-sportswear": womensSportswear,
  "womens-underwear": womensUnderwear,
  "womens-sleepwear": womensUnderwear,
  "womens-suits": womensSuits,
  "womens-sunglasses": womensSunglasses,
  "womens-glasses-and-sunglasses": womensSunglasses,
  // Subsubcategory-only handles (dynamic produces these without a gender prefix)
  "handbags": womensHandbags,
  "shoulder-bags": womensShoulderBags,
  "crossbody-bags": womensCrossbodyBags,
  "clutch-bags": womensClutchBags,
  "tote-bags": womensToteBags,
  "backpacks": womensBackpacks,
  "pumps": womensPumps,
  "flats": womensFlats,
  "loafers": womensLoafers,
  "boots": womensBoots,
  "sneakers": womensSneakers,
  "dresses": womensDresses,
  "skirts": womensSkirts,
  "jumpsuits": womensDresses,
  "shirts": womensTops,
  "tops": womensTops,
  "suits": womensSuits,
  "swimwear": womensSwimwear,
  "sleepwear": womensUnderwear,
  // Top-level unisex / gender-entry handles
  "women": womensClothing,
  "men": mensClothing,
  "accessories": womensAccessories,
  "bags": womensBags,
  "clothing": womensClothing,
  "shoes": womensShoes,
  "hats": womensHats,
  "gloves": womensAccessories,
  "scarves": womensScarves,
  "belts": womensBelts,
  "wallets": womensWallets,
  "watches": womensWatches,
  "jewelry": womensJewelry,
  "jewellery": womensJewelry,
  "sunglasses": womensSunglasses,
  "necklaces": womensJewelry,
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

// ───────────────────────────────────────────────────────────────────────
// Handle normalization & alerting
// ───────────────────────────────────────────────────────────────────────
//
// Shopify auto-suffixes duplicate handles (e.g. `womens-accessories-1`) and
// admins routinely rename collections (`mens-shoes` → `mens-footwear`).
// We normalise the incoming handle so cosmetic drift doesn't break the map,
// and we log anything that *still* misses so the admin QA page can surface it.

/** Normalises separators/case and strips Shopify's `-N` duplicate suffix. */
export function normalizeHandle(raw: string | null | undefined): string {
  if (!raw) return "";
  return raw
    .trim()
    .toLowerCase()
    .replace(/[_\s]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/-\d+$/, "");
}

/** Known synonyms — admin renames we've seen in the wild. */
const HANDLE_ALIASES: Record<string, string> = {
  "mens-footwear": "mens-shoes",
  "womens-footwear": "womens-shoes",
  "mens-knitwear": "mens-sweaters-knitwear",
  "mens-knit": "mens-sweaters-knitwear",
  "mens-sweaters": "mens-sweaters-knitwear",
  "mens-hoodies": "mens-hoodies-sweatshirts",
  "mens-sweatshirts": "mens-hoodies-sweatshirts",
  "mens-tshirts": "mens-tshirts-polos",
  "mens-tees": "mens-tshirts-polos",
  "mens-polos": "mens-tshirts-polos",
  "mens-pants": "mens-pants-trousers",
  "mens-trousers": "mens-pants-trousers",
  "mens-jackets": "mens-jackets-coats",
  "mens-coats": "mens-jackets-coats",
  "mens-outerwear": "mens-jackets-coats",
  "mens-sandals": "mens-sandals-slides",
  "mens-slides": "mens-sandals-slides",
  "mens-bags": "mens-bags-wallets",
  "mens-wallets": "mens-bags-wallets",
  "mens-watches": "mens-watches-jewelry",
  "mens-jewelry": "mens-watches-jewelry",
  "mens-underwear": "mens-underwear-loungewear",
  "mens-loungewear": "mens-underwear-loungewear",
  "sale": "high-discounts",
  "discounts": "high-discounts",
  "outlet": "high-discounts",
  "bestsellers": "best-selling-brands",
  "brands": "best-selling-brands",
  "new": "new-arrivals",
  "latest": "new-arrivals",
};

/** Map a raw handle to a canonical key in BY_HANDLE, or "" if no match. */
function resolveCanonicalHandle(raw: string): string {
  const direct = (raw ?? "").trim().toLowerCase();
  if (direct && BY_HANDLE[direct]) return direct;
  const norm = normalizeHandle(raw);
  if (!norm) return "";
  if (BY_HANDLE[norm]) return norm;
  if (HANDLE_ALIASES[norm] && BY_HANDLE[HANDLE_ALIASES[norm]]) {
    return HANDLE_ALIASES[norm];
  }
  // Prefix swap: dynamic collections produce `women-X` / `men-X` while
  // curated assets live under `womens-X` / `mens-X`.
  const prefixed = norm
    .replace(/^women-/, "womens-")
    .replace(/^men-/, "mens-");
  if (prefixed !== norm) {
    if (BY_HANDLE[prefixed]) return prefixed;
    if (HANDLE_ALIASES[prefixed] && BY_HANDLE[HANDLE_ALIASES[prefixed]]) {
      return HANDLE_ALIASES[prefixed];
    }
  }
  return "";
}

// In-memory registry of handles that fell all the way through to a rule or
// the generic default. Persistent across renders so the admin QA page can
// list them and so we don't spam the console with duplicates.
const unresolvedHandles = new Map<
  string,
  { handle: string; via: "rule" | "default"; topic: string; firstSeen: number; count: number }
>();

function reportUnresolved(handle: string, via: "rule" | "default", topic: string) {
  if (!handle) return;
  const existing = unresolvedHandles.get(handle);
  if (existing) {
    existing.count += 1;
    return;
  }
  unresolvedHandles.set(handle, {
    handle,
    via,
    topic,
    firstSeen: Date.now(),
    count: 1,
  });
  if (import.meta.env?.DEV) {
    // eslint-disable-next-line no-console
    console.warn(
      `[collection-image] Unmapped handle "${handle}" → fell back via ${via} to "${topic}". ` +
        `Add it to BY_HANDLE or HANDLE_ALIASES in src/lib/collection-image.ts.`,
    );
  }
}

/** Read-only snapshot of handles that failed exact + alias lookup. */
export function getUnresolvedHandleReport(): Array<{
  handle: string;
  via: "rule" | "default";
  topic: string;
  firstSeen: number;
  count: number;
}> {
  return Array.from(unresolvedHandles.values()).sort((a, b) => b.count - a.count);
}

/** Test/admin helper — clears the in-memory alert registry. */
export function resetUnresolvedHandleReport(): void {
  unresolvedHandles.clear();
}

export function collectionImage(input: {
  title?: string;
  handle?: string;
  description?: string | null;
  /** Optional handle → image URL map from the nightly sync (DB-backed). */
  dynamicMap?: Record<string, string>;
}): string {
  const rawHandle = (input.handle ?? "").trim().toLowerCase();

  // 1. Dynamic map from Shopify sync (preferred — auto-updates with new collections)
  if (rawHandle && input.dynamicMap) {
    if (input.dynamicMap[rawHandle]) return input.dynamicMap[rawHandle];
    const norm = normalizeHandle(rawHandle);
    if (norm && input.dynamicMap[norm]) return input.dynamicMap[norm];
  }

  // 2. Curated static map (exact handle, normalised handle, or known alias)
  const canonical = resolveCanonicalHandle(rawHandle);
  if (canonical) return BY_HANDLE[canonical];

  // 3. Topical regex rules — every fallback image must still represent the
  //    subject of the collection title (women's bags → a bags photo, not a
  //    random editorial). Duplicates within the same topic are accepted
  //    over off-topic uniqueness.
  const hay = `${input.title ?? ""} ${rawHandle} ${input.description ?? ""}`
    .toLowerCase()
    .replace(/[-_]+/g, " ");
  for (const rule of FALLBACK_RULES) {
    if (rule.test.test(hay)) {
      if (rawHandle) reportUnresolved(rawHandle, "rule", IMG_TO_TOPIC.get(rule.img) ?? "unknown");
      return rule.img;
    }
  }
  if (rawHandle) reportUnresolved(rawHandle, "default", "all-products");
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
  description?: string | null;
}): string {
  const handle = (input.handle ?? "").trim().toLowerCase();
  if (handle && ALT_BY_HANDLE[handle]) return ALT_BY_HANDLE[handle];

  const norm = normalizeHandle(handle);
  if (norm && ALT_BY_HANDLE[norm]) return ALT_BY_HANDLE[norm];

  return generateAltFromMeta({
    title: input.title,
    handle,
    description: input.description ?? null,
  });
}

// ───────────────────────────────────────────────────────────────────────
// Auto-generated alt text for unknown/missing handles
// ───────────────────────────────────────────────────────────────────────
//
// Builds a single, SEO-friendly alt string from whatever metadata Shopify
// gives us. Priority:
//   1. Curated ALT_BY_HANDLE  (handled in collectionImageAlt above)
//   2. Title + keyword-rich descriptor inferred from title/handle/description
//   3. Title alone with brand suffix
//   4. Generic brand-level fallback
//
// Output is plain text (no markdown), <= ~150 chars to stay within the
// recommended alt-attribute length for screen readers and Google Images.

const ALT_KEYWORD_RULES: Array<{ test: RegExp; phrase: string }> = [
  // Gender-specific apparel and accessories
  { test: /\b(women'?s?|woman|ladies|female)\b.*\b(dress|gown)/i, phrase: "women's designer dresses and gowns" },
  { test: /\b(women'?s?|woman|ladies|female)\b.*\b(shoe|heel|pump|sandal|boot|sneaker)/i, phrase: "women's designer shoes" },
  { test: /\b(women'?s?|woman|ladies|female)\b.*\b(bag|tote|clutch|handbag|purse)/i, phrase: "women's designer handbags" },
  { test: /\b(women'?s?|woman|ladies|female)\b.*\b(jewel|necklace|earring|ring|bracelet)/i, phrase: "women's designer jewelry" },
  { test: /\b(women'?s?|woman|ladies|female)\b.*\b(watch|timepiece)/i, phrase: "women's designer watches" },
  { test: /\b(women'?s?|woman|ladies|female)\b.*\b(accessor|scarf|hat|belt|wallet)/i, phrase: "women's designer accessories" },
  { test: /\b(women'?s?|woman|ladies|female)\b.*\b(cloth|wear|top|blouse|skirt)/i, phrase: "women's designer clothing" },
  { test: /\b(women'?s?|woman|ladies|female)\b/i, phrase: "women's designer fashion" },

  { test: /\b(men'?s?|man|male|gentlemen)\b.*\b(suit|tuxedo|tailoring)/i, phrase: "men's designer suits and tailoring" },
  { test: /\b(men'?s?|man|male|gentlemen)\b.*\b(shirt|polo)/i, phrase: "men's designer shirts" },
  { test: /\b(men'?s?|man|male|gentlemen)\b.*\b(jacket|coat|outerwear|overcoat)/i, phrase: "men's designer outerwear" },
  { test: /\b(men'?s?|man|male|gentlemen)\b.*\b(shoe|loafer|oxford|sneaker|boot|sandal)/i, phrase: "men's designer shoes" },
  { test: /\b(men'?s?|man|male|gentlemen)\b.*\b(bag|backpack|briefcase|wallet)/i, phrase: "men's designer bags and leather goods" },
  { test: /\b(men'?s?|man|male|gentlemen)\b.*\b(watch|jewel)/i, phrase: "men's designer watches and jewelry" },
  { test: /\b(men'?s?|man|male|gentlemen)\b.*\b(accessor|belt|scarf|hat)/i, phrase: "men's designer accessories" },
  { test: /\b(men'?s?|man|male|gentlemen)\b.*\b(cloth|wear|trouser|pant|short|knit|sweater)/i, phrase: "men's designer clothing" },
  { test: /\b(men'?s?|man|male|gentlemen)\b/i, phrase: "men's designer fashion" },

  // Cross-gender categories
  { test: /\b(sale|discount|markdown|outlet|clearance)\b/i, phrase: "discounted luxury designer fashion" },
  { test: /\b(new[-\s]?arrival|just[-\s]?in|latest|new[-\s]?drop)\b/i, phrase: "newest designer arrivals" },
  { test: /\b(best[-\s]?sell|popular|trending|top[-\s]?pick)\b/i, phrase: "best-selling designer pieces" },
  { test: /\b(brand|house|maison|designer)s?\b/i, phrase: "luxury designer brands" },
  { test: /\b(bag|tote|clutch|handbag|purse)\b/i, phrase: "designer handbags" },
  { test: /\b(shoe|heel|pump|sandal|boot|sneaker|loafer|oxford)\b/i, phrase: "designer shoes" },
  { test: /\b(jewel|necklace|earring|ring|bracelet)\b/i, phrase: "designer jewelry" },
  { test: /\b(watch|timepiece)\b/i, phrase: "designer watches" },
  { test: /\b(belt|wallet|scarf|hat|sunglass|eyewear)\b/i, phrase: "designer accessories" },
  { test: /\b(dress|gown|skirt|blouse|top)\b/i, phrase: "designer clothing" },
  { test: /\b(jacket|coat|outerwear|overcoat|blazer)\b/i, phrase: "designer outerwear" },
  { test: /\b(suit|tuxedo|tailoring|trouser|pant|shirt)\b/i, phrase: "designer tailoring" },
  { test: /\b(knit|sweater|hoodie|sweatshirt|cashmere|merino)\b/i, phrase: "designer knitwear" },
  { test: /\b(swim|beach|resort)\b/i, phrase: "designer swim and resortwear" },
  { test: /\b(active|sport|athleis)\w*/i, phrase: "designer activewear" },
];

const STOP_WORDS = new Set([
  "the", "and", "or", "of", "for", "to", "in", "with", "from", "by", "a", "an",
  "our", "your", "this", "that", "these", "those", "all", "new", "shop",
]);

function generateAltFromMeta(input: {
  title?: string;
  handle?: string;
  description?: string | null;
}): string {
  const title = (input.title ?? "").trim();
  const handle = (input.handle ?? "").trim().toLowerCase();
  const description = (input.description ?? "").trim();

  // Build a haystack of all available text to mine for keywords.
  const haystack = `${title} ${handle.replace(/[-_]+/g, " ")} ${description}`;

  // First matching rule wins (rules are ordered most-specific first).
  let descriptor: string | null = null;
  for (const rule of ALT_KEYWORD_RULES) {
    if (rule.test.test(haystack)) {
      descriptor = rule.phrase;
      break;
    }
  }

  // Pull a couple of distinctive words from the description to keep the
  // alt unique across similar collections (helps Google Images variety).
  const distinctive = pickDistinctiveWords(description, title);

  const titleClean = title || titleFromHandle(handle);
  if (!titleClean && !descriptor) {
    return "Designer collection at Palace of Roman";
  }

  const head = titleClean
    ? `${titleClean} — ${descriptor ?? "designer collection"}`
    : descriptor!;
  const tail = distinctive ? ` (${distinctive})` : "";
  const suffix = " at Palace of Roman";

  const full = `${head}${tail}${suffix}`;
  // Soft cap at 150 chars so screen readers don't truncate awkwardly.
  if (full.length <= 150) return full;
  const trimmed = `${head}${suffix}`;
  return trimmed.length <= 150 ? trimmed : `${titleClean || "Designer collection"}${suffix}`;
}

function titleFromHandle(handle: string): string {
  if (!handle) return "";
  return handle
    .replace(/[-_]+/g, " ")
    .replace(/\b(\w)/g, (c) => c.toUpperCase())
    .replace(/\bs\b/g, "'s")
    .trim();
}

function pickDistinctiveWords(description: string, title: string): string {
  if (!description) return "";
  const titleTokens = new Set(
    title.toLowerCase().split(/\s+/).filter(Boolean),
  );
  const words = description
    .toLowerCase()
    .replace(/[^a-z0-9\s'-]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 4 && !STOP_WORDS.has(w) && !titleTokens.has(w));
  // Keep first 2 unique nouns-ish words.
  const seen = new Set<string>();
  const picks: string[] = [];
  for (const w of words) {
    if (seen.has(w)) continue;
    seen.add(w);
    picks.push(w);
    if (picks.length === 2) break;
  }
  return picks.join(", ");
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
 *
 * Resolution order:
 *   1. Curated `FOCAL_BY_HANDLE` (exact or normalised handle)
 *   2. Keyword rules over title + handle
 *   3. Orientation-based fallback derived from the stored Shopify image's
 *      aspect ratio — biases vertical position so the subject stays in
 *      frame when cropped into the storefront's portrait/landscape boxes.
 *   4. Generic safe default
 */
export function collectionImageFocal(input: {
  title?: string;
  handle?: string;
  /** Width/height of the source image (e.g. from the synced Shopify image). */
  imageWidth?: number | null;
  imageHeight?: number | null;
  /** Pre-computed aspect ratio (width / height). Wins over width+height. */
  aspectRatio?: number | null;
  /** Admin-tuned overrides from the focal-point editor: `{ [handle]: "x% y%" }`. */
  dynamicFocal?: Record<string, string>;
}): string {
  const handle = (input.handle ?? "").trim().toLowerCase();

  // 1. Admin-tuned override (highest priority — beats everything else).
  if (handle && input.dynamicFocal) {
    if (input.dynamicFocal[handle]) return input.dynamicFocal[handle];
    const norm = normalizeHandle(handle);
    if (norm && input.dynamicFocal[norm]) return input.dynamicFocal[norm];
  }

  // 2. Curated static map.
  if (handle && FOCAL_BY_HANDLE[handle]) return FOCAL_BY_HANDLE[handle];
  const norm = normalizeHandle(handle);
  if (norm && FOCAL_BY_HANDLE[norm]) return FOCAL_BY_HANDLE[norm];

  const hay = `${input.title ?? ""} ${handle}`.toLowerCase().replace(/[-_]+/g, " ");
  for (const rule of FOCAL_RULES) {
    if (rule.test.test(hay)) return rule.pos;
  }

  // Orientation-based fallback. When we have nothing semantic to go on,
  // the source image's shape is still a useful signal: tall portrait
  // sources almost always frame the subject in the upper half (head/torso),
  // wide landscape sources are usually subject-centered, and very wide
  // banner-style sources benefit from a slight upper bias when cropped
  // into a tall hero box.
  const ratio =
    typeof input.aspectRatio === "number" && input.aspectRatio > 0
      ? input.aspectRatio
      : input.imageWidth && input.imageHeight && input.imageHeight > 0
        ? input.imageWidth / input.imageHeight
        : null;

  if (ratio !== null) {
    if (ratio <= 0.85) return "50% 30%";   // portrait → keep face/torso visible
    if (ratio >= 1.7) return "50% 38%";    // wide banner → modest upper bias
    if (ratio >= 1.2) return "50% 42%";    // landscape → near-center, slight upper
    return "50% 40%";                       // ~square → balanced
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

export type CollectionImageSource = "dynamic" | "handle" | "alias" | "rule" | "default";

export interface ResolvedCollectionImage {
  src: string;
  /** Canonical topic key (a handle from BY_HANDLE), or "dynamic" for sync-sourced. */
  topic: string;
  source: CollectionImageSource;
  /** Set when the incoming handle was matched via normalization or an alias. */
  matchedVia?: string;
}

/** Same resolution as collectionImage(), but also reports how it was chosen. */
export function resolveCollectionImage(input: {
  title?: string;
  handle?: string;
  description?: string | null;
  dynamicMap?: Record<string, string>;
}): ResolvedCollectionImage {
  const handle = (input.handle ?? "").trim().toLowerCase();

  if (handle && input.dynamicMap) {
    if (input.dynamicMap[handle]) {
      return { src: input.dynamicMap[handle], topic: "dynamic", source: "dynamic" };
    }
    const norm = normalizeHandle(handle);
    if (norm && input.dynamicMap[norm]) {
      return { src: input.dynamicMap[norm], topic: "dynamic", source: "dynamic", matchedVia: norm };
    }
  }
  if (handle && BY_HANDLE[handle]) {
    return { src: BY_HANDLE[handle], topic: handle, source: "handle" };
  }
  // Try normalized form / known alias before falling to regex rules.
  const canonical = resolveCanonicalHandle(handle);
  if (canonical) {
    return { src: BY_HANDLE[canonical], topic: canonical, source: "alias", matchedVia: canonical };
  }
  const hay = `${input.title ?? ""} ${handle} ${input.description ?? ""}`
    .toLowerCase()
    .replace(/[-_]+/g, " ");
  for (const rule of FALLBACK_RULES) {
    if (rule.test.test(hay)) {
      const topic = IMG_TO_TOPIC.get(rule.img) ?? "unknown";
      if (handle) reportUnresolved(handle, "rule", topic);
      return { src: rule.img, topic, source: "rule" };
    }
  }
  if (handle) reportUnresolved(handle, "default", "all-products");
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

  "womens-clothing": { gender: "womens", category: [/\b(cloth|dress|gown|blouse|top|skirt|jumpsuit|knit|coat|jacket)\w*/] },
  "womens-shoes": { gender: "womens", category: [/\b(shoe|heel|pump|sandal|mule|stiletto|boot|loafer|footwear)\w*/] },
  "womens-bags": { gender: "womens", category: [/\b(bag|tote|clutch|handbag|purse|shoulder|hobo|satchel)\w*/] },
  "womens-wallets": { gender: "womens", category: [/\b(wallet|cardholder|purse|pouch)\w*/] },
  "womens-belts": { gender: "womens", category: [/\bbelt\w*/] },
  "womens-jewelry": { gender: "womens", category: [/\b(jewel|necklace|earring|ring|bracelet|pendant)\w*/] },
  "womens-watches": { gender: "womens", category: [/\bwatch\w*/] },
  "womens-scarves": { gender: "womens", category: [/\b(scarf|scarves|shawl|stole|foulard)\w*/] },
  "womens-hats": { gender: "womens", category: [/\b(hat|cap|beanie|fedora|headwear)\w*/] },
  "womens-accessories": { gender: "womens", category: [/\b(access|jewel|belt|bag|scarf|hat|wallet|sunglass)\w*/] },
  "womens-accessories-1": { gender: "womens", category: [/\b(access|jewel|belt|bag|scarf|hat|wallet|sunglass)\w*/] },

  "mens-clothing": { gender: "mens", category: [/\b(cloth|shirt|suit|jacket|coat|knit|sweater|pant|trouser|short|tee|polo)\w*/] },
  "mens-shoes": { gender: "mens", category: [/\b(shoe|loafer|oxford|derby|footwear|brogue)\w*/] },
  "mens-jackets-coats": { gender: "mens", category: [/\b(jacket|coat|outerwear|parka|trench|blazer|bomber)\w*/] },
  "mens-suits": { gender: "mens", category: [/\b(suit|tuxedo|tailor|formal)\w*/] },
  "mens-shirts": { gender: "mens", category: [/\b(shirt|button[- ]?down|oxford|dress shirt)\w*/] },
  "mens-tshirts-polos": { gender: "mens", category: [/\b(t[- ]?shirt|tee|polo)\w*/] },
  "mens-sweaters-knitwear": { gender: "mens", category: [/\b(sweater|knit|cashmere|jumper|cardigan|pullover)\w*/] },
  "mens-hoodies-sweatshirts": { gender: "mens", category: [/\b(hoodie|sweatshirt|hooded)\w*/] },
  "mens-pants-trousers": { gender: "mens", category: [/\b(pant|trouser|chino|jean|denim)\w*/] },
  "mens-shorts": { gender: "mens", category: [/\bshort\w*/] },
  "mens-activewear": { gender: "mens", category: [/\b(active|sport|gym|training|track)\w*/] },
  "mens-swimwear": { gender: "mens", category: [/\b(swim|beach|boardshort|trunk)\w*/] },
  "mens-underwear-loungewear": { gender: "mens", category: [/\b(underwear|lounge|pajama|sleep|boxer|brief|robe)\w*/] },
  "mens-sneakers": { gender: "mens", category: [/\b(sneaker|trainer|kicks)\w*/] },
  "mens-boots": { gender: "mens", category: [/\bboot\w*/] },
  "mens-sandals-slides": { gender: "mens", category: [/\b(sandal|slide|flip[- ]?flop)\w*/] },
  "mens-bags-wallets": { gender: "mens", category: [/\b(bag|wallet|briefcase|backpack|messenger|pouch)\w*/] },
  "mens-belts": { gender: "mens", category: [/\bbelt\w*/] },
  "mens-watches-jewelry": { gender: "mens", category: [/\b(watch|jewel|cufflink|bracelet|ring|necklace)\w*/] },
  "mens-accessories": { gender: "mens", category: [/\b(access|belt|wallet|bag|tie|cufflink|sunglass|hat)\w*/] },
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

// ---------------------------------------------------------------------------
// Responsive image helper
// ---------------------------------------------------------------------------
// Builds a srcset for Shopify CDN URLs (which honor ?width=N for on-the-fly
// resizing). For local bundled assets or unknown hosts we return src only —
// the browser will load the single bundled file as-is.
//
// Usage:
//   const r = responsiveCollectionImage(src, { widths: [480, 768, 1200, 1800], sizes: "100vw" });
//   <img src={r.src} srcSet={r.srcSet} sizes={r.sizes} ... />

export interface ResponsiveImage {
  src: string;
  srcSet?: string;
  sizes?: string;
}

const DEFAULT_HERO_WIDTHS = [480, 768, 1024, 1440, 1920];
const DEFAULT_TILE_WIDTHS = [240, 360, 480, 720, 960];

function isShopifyCdn(url: string): boolean {
  return /(^https?:)?\/\/cdn\.shopify\.com\//i.test(url);
}

function withShopifyWidth(url: string, width: number): string {
  // Strip any existing width/height query so we don't double-apply.
  // Shopify accepts ?width=N (and optional &height, &crop) on its image CDN.
  try {
    const u = new URL(url, "https://cdn.shopify.com");
    u.searchParams.delete("width");
    u.searchParams.delete("height");
    u.searchParams.delete("crop");
    u.searchParams.set("width", String(width));
    return u.toString();
  } catch {
    const sep = url.includes("?") ? "&" : "?";
    return `${url}${sep}width=${width}`;
  }
}

export function responsiveCollectionImage(
  src: string,
  opts: { widths?: number[]; sizes?: string } = {},
): ResponsiveImage {
  const widths = opts.widths ?? DEFAULT_HERO_WIDTHS;
  const sizes = opts.sizes;
  if (!src) return { src };
  if (!isShopifyCdn(src)) {
    // Bundled assets are pre-optimised at a single resolution; nothing to do.
    return { src, sizes };
  }
  const sorted = [...new Set(widths)].sort((a, b) => a - b);
  const srcSet = sorted
    .map((w) => `${withShopifyWidth(src, w)} ${w}w`)
    .join(", ");
  // Use the largest as the base src for browsers without srcset support.
  const baseSrc = withShopifyWidth(src, sorted[sorted.length - 1]);
  return { src: baseSrc, srcSet, sizes };
}

export const HERO_RESPONSIVE_WIDTHS = DEFAULT_HERO_WIDTHS;
export const TILE_RESPONSIVE_WIDTHS = DEFAULT_TILE_WIDTHS;
