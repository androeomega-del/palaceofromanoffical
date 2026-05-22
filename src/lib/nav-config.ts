// Top-nav structure is derived live from Shopify data.
//
// - Departments (Women / Men) are generated from live Smart Collections by
//   grouping handles with a `womens-` / `mens-` prefix into editorial column
//   buckets (Apparel, Tailoring, Bags & Leather, etc.). Any new collection
//   added in Shopify automatically appears in the right column the next time
//   the menu loads — no code change needed.
//
// - Brands are generated from live product vendor data, filtered through a
//   luxury allowlist so noise (dropship/dev-store vendors) never surfaces.
//
// Static labels (column headings, brand allowlist) are the only curated
// values; everything else flows from Shopify.

import type { ShopifyCollection } from "@/lib/shopify";
import { LUXURY_TIERS } from "@/lib/luxury-brands";

export type MegaItem = { handle: string; label: string };
export type MegaColumn = { heading: string; items: MegaItem[] };
export type MegaFeature = {
  /** Collection to link the featured tile to. */
  handle: string;
  eyebrow: string;
  title: string;
};
export type MegaDepartment = {
  key: "women" | "men";
  label: string;
  /** Hero/department-wide landing collection. */
  rootHandle: string;
  columns: MegaColumn[];
  feature: MegaFeature;
};

// -----------------------------------------------------------------------------
// Collection → column classifier
// -----------------------------------------------------------------------------

type ColumnKey = string;

type ClassifierRule = {
  column: ColumnKey;
  /** Order inside the column. Lower comes first. */
  order: number;
  /** Display label override; falls back to a cleaned-up collection title. */
  label?: string;
  /** Match by handle suffix (without the `womens-` / `mens-` prefix). */
  match: (suffix: string) => boolean;
};

const WOMEN_RULES: ClassifierRule[] = [
  { column: "Apparel",          order: 0,  match: (s) => s === "clothing",        label: "All Clothing" },
  { column: "Shoes",            order: 0,  match: (s) => s === "shoes",           label: "All Shoes" },
  { column: "Bags & Leather",   order: 0,  match: (s) => s === "bags",            label: "Bags" },
  { column: "Bags & Leather",   order: 1,  match: (s) => s === "wallets",         label: "Wallets" },
  { column: "Bags & Leather",   order: 2,  match: (s) => s === "belts",           label: "Belts" },
  { column: "Fine Accessories", order: 0,  match: (s) => s === "jewelry",         label: "Jewellery" },
  { column: "Fine Accessories", order: 1,  match: (s) => s === "watches",         label: "Watches" },
  { column: "Fine Accessories", order: 2,  match: (s) => s === "scarves",         label: "Scarves & Shawls" },
  { column: "Fine Accessories", order: 3,  match: (s) => s === "hats",            label: "Hats" },
  { column: "Fine Accessories", order: 9,  match: (s) => s === "accessories" || s.startsWith("accessories"), label: "All Accessories" },
];

const MEN_RULES: ClassifierRule[] = [
  { column: "Apparel",              order: 0, match: (s) => s === "clothing",               label: "All Clothing" },
  { column: "Tailoring",            order: 0, match: (s) => s === "suits",                  label: "Suits" },
  { column: "Tailoring",            order: 1, match: (s) => s === "jackets-coats",          label: "Jackets & Coats" },
  { column: "Shirts & Knitwear",    order: 0, match: (s) => s === "shirts",                 label: "Shirts" },
  { column: "Shirts & Knitwear",    order: 1, match: (s) => s === "tshirts-polos",          label: "T-Shirts & Polos" },
  { column: "Shirts & Knitwear",    order: 2, match: (s) => s === "sweaters-knitwear",      label: "Sweaters & Knitwear" },
  { column: "Shirts & Knitwear",    order: 3, match: (s) => s === "hoodies-sweatshirts",    label: "Hoodies & Sweatshirts" },
  { column: "Bottoms & Beach",      order: 0, match: (s) => s === "pants-trousers",         label: "Pants & Trousers" },
  { column: "Bottoms & Beach",      order: 1, match: (s) => s === "shorts",                 label: "Shorts" },
  { column: "Bottoms & Beach",      order: 2, match: (s) => s === "activewear",             label: "Activewear" },
  { column: "Bottoms & Beach",      order: 3, match: (s) => s === "swimwear",               label: "Swimwear" },
  { column: "Bottoms & Beach",      order: 4, match: (s) => s === "underwear-loungewear",   label: "Underwear & Lounge" },
  { column: "Shoes",                order: 0, match: (s) => s === "shoes",                  label: "All Shoes" },
  { column: "Shoes",                order: 1, match: (s) => s === "sneakers",               label: "Sneakers" },
  { column: "Shoes",                order: 2, match: (s) => s === "boots",                  label: "Boots" },
  { column: "Shoes",                order: 3, match: (s) => s === "sandals-slides",         label: "Sandals & Slides" },
  { column: "Accessories",          order: 0, match: (s) => s === "bags" || s === "bags-wallets", label: "Bags" },
  { column: "Accessories",          order: 1, match: (s) => s === "belts",                  label: "Belts" },
  { column: "Accessories",          order: 2, match: (s) => s === "watches-jewelry",        label: "Watches & Jewellery" },
  { column: "Accessories",          order: 9, match: (s) => s === "accessories" || s.startsWith("accessories"), label: "All Accessories" },
];

const WOMEN_COLUMN_ORDER = ["Apparel", "Shoes", "Bags & Leather", "Fine Accessories", "More"];
const MEN_COLUMN_ORDER   = ["Apparel", "Tailoring", "Shirts & Knitwear", "Bottoms & Beach", "Shoes", "Accessories", "More"];

/**
 * Cross-gender category collections (no `women-`/`men-` prefix) that should
 * still appear inside the Women / Men dropdowns. Each entry routes the same
 * handle into the correct column for each gender.
 *
 * `women`/`men` is null when the category shouldn't appear in that gender
 * (e.g. `skirts` only under Women, `suits` only under Men).
 */
type CrossEntry = {
  handle: string;
  label: string;
  women: { column: string; order: number } | null;
  men:   { column: string; order: number } | null;
};
const CROSS_CATEGORIES: CrossEntry[] = [
  { handle: "best-sellers", label: "Best Sellers",  women: { column: "Apparel", order: 1 },           men: { column: "Apparel", order: 1 } },
  // Curated cross-category edit (polos, long sleeves, turtlenecks, cardigans,
  // hoodies, sweatshirts). Surfaces high in both gender menus.
  { handle: "layering-edit", label: "The Layering Edit", women: { column: "Apparel", order: 2 }, men: { column: "Shirts & Knitwear", order: -1 } },
  // `clothing`, `shoes`, `bags`, `accessories` are global (unisex) collections.
  // Gender dropdowns use the prefixed `womens-…` / `mens-…` variants as their
  // canonical "All …" links (handled by WOMEN_RULES / MEN_RULES). Do not
  // duplicate them here.
  { handle: "shirts",         label: "Shirts",         women: { column: "Apparel", order: 5 },           men: { column: "Shirts & Knitwear", order: 0 } },
  { handle: "skirts",         label: "Skirts",         women: { column: "Apparel", order: 6 },           men: null },
  { handle: "suits",          label: "Suits",          women: null,                                       men: { column: "Tailoring", order: 0 } },
  { handle: "swimwear",       label: "Swimwear",       women: { column: "Apparel", order: 7 },           men: { column: "Bottoms & Beach", order: 3 } },
  { handle: "sleepwear",      label: "Sleepwear",      women: { column: "Apparel", order: 8 },           men: { column: "Bottoms & Beach", order: 5 } },
  { handle: "boots",          label: "Boots",          women: { column: "Shoes", order: 2 },             men: { column: "Shoes", order: 2 } },
  { handle: "loafers",        label: "Loafers",        women: { column: "Shoes", order: 3 },             men: { column: "Shoes", order: 4 } },
  { handle: "oxfords-and-derbies", label: "Oxfords & Derbies", women: { column: "Shoes", order: 4 },     men: { column: "Shoes", order: 5 } },
  // Bag sub-types — surface in the Bags column for both genders so every
  // category collection we built is reachable from the menu.
  { handle: "handbags",       label: "Handbags",       women: { column: "Bags & Leather", order: 3 },    men: { column: "Accessories", order: 0 } },
  { handle: "shoulder-bags",  label: "Shoulder Bags",  women: { column: "Bags & Leather", order: 4 },    men: { column: "Accessories", order: 0 } },
  { handle: "crossbody-bags", label: "Crossbody Bags", women: { column: "Bags & Leather", order: 5 },    men: { column: "Accessories", order: 0 } },
  { handle: "tote-bags",      label: "Tote Bags",      women: { column: "Bags & Leather", order: 6 },    men: { column: "Accessories", order: 0 } },
  { handle: "clutch-bags",    label: "Clutch Bags",    women: { column: "Bags & Leather", order: 7 },    men: { column: "Accessories", order: 0 } },
  { handle: "backpacks",      label: "Backpacks",      women: { column: "Bags & Leather", order: 8 },    men: { column: "Accessories", order: 0 } },
  // `accessories` is the global (unisex) collection — gender dropdowns use
  // the prefixed `women-accessories` / `mens-accessories` as "All Accessories"
  // (handled by WOMEN_RULES / MEN_RULES). Do not duplicate here.
  { handle: "watches",        label: "Watches",        women: { column: "Fine Accessories", order: 1 },  men: { column: "Accessories", order: 2 } },
  { handle: "hats",           label: "Hats",           women: { column: "Fine Accessories", order: 3 },  men: { column: "Accessories", order: 3 } },
  { handle: "gloves",         label: "Gloves",         women: { column: "Fine Accessories", order: 4 },  men: { column: "Accessories", order: 4 } },
  { handle: "other-accessories", label: "Other Accessories", women: { column: "Fine Accessories", order: 8 }, men: { column: "Accessories", order: 8 } },

  // ---------------------------------------------------------------------------
  // Granular category collections built from BrandsGateway taxonomy
  // (auto-created via scripts/shopify/create-category-smart-collections*.mjs)
  // ---------------------------------------------------------------------------

  // Women — apparel
  { handle: "dresses",            label: "Dresses",            women: { column: "Apparel", order: 10 }, men: null },
  { handle: "short-dresses",      label: "Short Dresses",      women: { column: "Apparel", order: 11 }, men: null },
  { handle: "sleeveless-dresses", label: "Sleeveless Dresses", women: { column: "Apparel", order: 12 }, men: null },
  { handle: "tops",               label: "Tops",               women: { column: "Apparel", order: 13 }, men: null },
  { handle: "blouses",            label: "Blouses",            women: { column: "Apparel", order: 14 }, men: null },
  { handle: "tshirts-women",      label: "T-Shirts",           women: { column: "Apparel", order: 15 }, men: null },
  { handle: "shirts-women",       label: "Shirts",             women: { column: "Apparel", order: 16 }, men: null },
  { handle: "knitwear-women",     label: "Knitwear",           women: { column: "Apparel", order: 17 }, men: null },
  { handle: "jackets-women",      label: "Jackets",            women: { column: "Apparel", order: 18 }, men: null },
  { handle: "coats-women",        label: "Coats",              women: { column: "Apparel", order: 19 }, men: null },
  { handle: "denim-women",        label: "Denim",              women: { column: "Apparel", order: 20 }, men: null },
  { handle: "pants-women",        label: "Pants",              women: { column: "Apparel", order: 21 }, men: null },
  { handle: "shorts-women",       label: "Shorts",             women: { column: "Apparel", order: 22 }, men: null },
  { handle: "jumpsuits",          label: "Jumpsuits",          women: { column: "Apparel", order: 23 }, men: null },
  { handle: "swimwear-women",     label: "Swimwear",           women: { column: "Apparel", order: 24 }, men: null },
  { handle: "sportswear-women",   label: "Sportswear",         women: { column: "Apparel", order: 25 }, men: null },
  { handle: "lingerie",           label: "Lingerie & Underwear", women: { column: "Apparel", order: 26 }, men: null },
  { handle: "midi-dresses",       label: "Midi Dresses",       women: { column: "Apparel", order: 27 }, men: null },
  { handle: "long-sleeve-dresses", label: "Long Sleeve Dresses", women: { column: "Apparel", order: 28 }, men: null },
  { handle: "mini-skirts",        label: "Mini Skirts",        women: { column: "Apparel", order: 29 }, men: null },
  { handle: "midi-skirts",        label: "Midi Skirts",        women: { column: "Apparel", order: 30 }, men: null },



  // Men — apparel
  { handle: "tshirts-men",        label: "T-Shirts",           women: null, men: { column: "Shirts & Knitwear", order: 10 } },
  { handle: "tank-tops",          label: "Tank Tops",          women: null, men: { column: "Shirts & Knitwear", order: 11 } },
  { handle: "shirts-men",         label: "Casual Shirts",      women: null, men: { column: "Shirts & Knitwear", order: 12 } },
  { handle: "dress-shirts",       label: "Dress Shirts",       women: null, men: { column: "Shirts & Knitwear", order: 13 } },
  { handle: "pattern-shirts",     label: "Pattern Shirts",     women: null, men: { column: "Shirts & Knitwear", order: 14 } },
  { handle: "sweaters-men",       label: "Sweaters",           women: null, men: { column: "Shirts & Knitwear", order: 15 } },
  { handle: "cardigans",          label: "Cardigans",          women: { column: "Apparel", order: 31 }, men: { column: "Shirts & Knitwear", order: 15 } },
  { handle: "turtlenecks",        label: "Turtlenecks",        women: { column: "Apparel", order: 32 }, men: { column: "Shirts & Knitwear", order: 15 } },
  { handle: "sweatshirts",        label: "Sweatshirts",        women: null, men: { column: "Shirts & Knitwear", order: 16 } },
  { handle: "hoodies",            label: "Hoodies",            women: null, men: { column: "Shirts & Knitwear", order: 16 } },
  { handle: "polo-shirts",        label: "Polo Shirts",        women: null, men: { column: "Shirts & Knitwear", order: 17 } },
  { handle: "long-sleeve-tees",   label: "Long Sleeve Tees",   women: { column: "Apparel", order: 33 }, men: { column: "Shirts & Knitwear", order: 18 } },
  { handle: "blazers",            label: "Blazers",            women: { column: "Apparel", order: 34 }, men: { column: "Tailoring", order: 10 } },
  { handle: "jackets-men",        label: "Jackets",            women: null, men: { column: "Tailoring", order: 11 } },
  { handle: "bombers",            label: "Bomber Jackets",     women: null, men: { column: "Tailoring", order: 11 } },
  { handle: "leather-jackets",    label: "Leather Jackets",    women: { column: "Apparel", order: 35 }, men: { column: "Tailoring", order: 11 } },
  { handle: "coats-men",          label: "Coats",              women: null, men: { column: "Tailoring", order: 12 } },
  { handle: "trench-coats",       label: "Trench Coats",       women: { column: "Apparel", order: 36 }, men: { column: "Tailoring", order: 12 } },
  { handle: "parkas",             label: "Parkas",             women: null, men: { column: "Tailoring", order: 12 } },
  { handle: "denim-men",          label: "Denim",              women: null, men: { column: "Bottoms & Beach", order: 10 } },

  { handle: "skinny-jeans",       label: "Skinny Jeans",       women: null, men: { column: "Bottoms & Beach", order: 11 } },
  { handle: "slim-fit-jeans",     label: "Slim Fit Jeans",     women: null, men: { column: "Bottoms & Beach", order: 12 } },
  { handle: "casual-pants",       label: "Casual Pants",       women: null, men: { column: "Bottoms & Beach", order: 13 } },
  { handle: "dress-pants",        label: "Dress Pants",        women: null, men: { column: "Bottoms & Beach", order: 14 } },
  { handle: "athletic-pants",     label: "Athletic Pants",     women: null, men: { column: "Bottoms & Beach", order: 15 } },
  { handle: "joggers",            label: "Joggers",            women: null, men: { column: "Bottoms & Beach", order: 16 } },
  { handle: "sportswear",         label: "Sportswear",         women: null, men: { column: "Bottoms & Beach", order: 17 } },
  { handle: "bermuda-shorts",     label: "Bermuda Shorts",     women: null, men: { column: "Bottoms & Beach", order: 18 } },
  { handle: "swimwear-men",       label: "Swimwear",           women: null, men: { column: "Bottoms & Beach", order: 19 } },
  { handle: "underwear-men",      label: "Underwear",          women: null, men: { column: "Bottoms & Beach", order: 20 } },
  { handle: "suits",              label: "Suits",              women: null, men: { column: "Tailoring", order: 13 } },

  // Unisex — shoes
  { handle: "sneakers",           label: "Sneakers",           women: { column: "Shoes", order: 10 }, men: { column: "Shoes", order: 10 } },
  { handle: "athletic-sneakers",  label: "Athletic Sneakers",  women: { column: "Shoes", order: 11 }, men: { column: "Shoes", order: 11 } },
  { handle: "low-top-sneakers",   label: "Low-Top Sneakers",   women: { column: "Shoes", order: 12 }, men: { column: "Shoes", order: 12 } },
  { handle: "sandals-slides",     label: "Sandals & Slides",   women: { column: "Shoes", order: 13 }, men: { column: "Shoes", order: 13 } },
  { handle: "flats",              label: "Flats",              women: { column: "Shoes", order: 14 }, men: null },
  { handle: "espadrilles",        label: "Espadrilles",        women: { column: "Shoes", order: 15 }, men: { column: "Shoes", order: 15 } },
  { handle: "slip-on-loafers",    label: "Slip-On Loafers",    women: { column: "Shoes", order: 16 }, men: { column: "Shoes", order: 16 } },

  // Unisex — bags & leather
  { handle: "leather-goods",      label: "Leather Goods",      women: { column: "Bags & Leather", order: 10 }, men: { column: "Accessories", order: 10 } },

  // Unisex — accessories
  { handle: "belts",              label: "Belts",              women: { column: "Fine Accessories", order: 10 }, men: { column: "Accessories", order: 11 } },
  { handle: "regular-belts",      label: "Regular Belts",      women: { column: "Fine Accessories", order: 11 }, men: { column: "Accessories", order: 12 } },
  { handle: "wallets",            label: "Wallets",            women: { column: "Bags & Leather", order: 11 }, men: { column: "Accessories", order: 13 } },
  { handle: "scarves",            label: "Scarves",            women: { column: "Fine Accessories", order: 12 }, men: { column: "Accessories", order: 14 } },
  { handle: "sunglasses",         label: "Sunglasses",         women: { column: "Fine Accessories", order: 13 }, men: { column: "Accessories", order: 15 } },
  { handle: "eyewear",            label: "Eyewear",            women: { column: "Fine Accessories", order: 14 }, men: { column: "Accessories", order: 16 } },
  { handle: "cashmere",           label: "Cashmere",           women: { column: "Apparel", order: 30 }, men: { column: "Shirts & Knitwear", order: 30 } },

  { handle: "unisex",         label: "Unisex",         women: { column: "More", order: 0 },              men: { column: "More", order: 0 } },
];

function cleanTitle(title: string, prefixWord: "Women's" | "Men's"): string {
  return title.replace(new RegExp(`^${prefixWord.replace("'", "['']")}\\s*`, "i"), "").trim() || title;
}

function buildDepartment(
  collections: ShopifyCollection[],
  prefixes: string[],
  rules: ClassifierRule[],
  columnOrder: string[],
  dept: Omit<MegaDepartment, "columns">,
): MegaDepartment {
  const prefixWord = prefixes[0].startsWith("women") ? "Women's" : "Men's";
  const genderKey: "women" | "men" = prefixes[0].startsWith("women") ? "women" : "men";
  const byHandle = new Map(collections.map((c) => [c.handle, c]));

  // Group rule matches by column.
  const grouped = new Map<string, Array<MegaItem & { _order: number }>>();
  const push = (col: string, item: MegaItem & { _order: number }) => {
    const arr = grouped.get(col) ?? [];
    arr.push(item);
    grouped.set(col, arr);
  };

  // 1) "New Arrivals" sits at the top of Apparel for both departments.
  if (byHandle.has("new-arrivals")) {
    push(columnOrder[0], { handle: "new-arrivals", label: "New Arrivals", _order: 0 });
  }

  // 2) Cross-gender categories (unprefixed handles that still belong here).
  const seen = new Set<string>(["new-arrivals"]);
  for (const cx of CROSS_CATEGORIES) {
    const slot = cx[genderKey];
    if (!slot) continue;
    if (!byHandle.has(cx.handle)) continue;
    if (seen.has(cx.handle)) continue;
    seen.add(cx.handle);
    push(slot.column, { handle: cx.handle, label: cx.label, _order: slot.order });
  }

  // 3) Prefixed collections (womens-/women-/mens-/men-), routed by rule or "More".
  const moreItems: Array<MegaItem & { _order: number }> = [];
  for (const c of collections) {
    const matchedPrefix = prefixes.find((p) => c.handle.startsWith(p));
    if (!matchedPrefix) continue;
    if (seen.has(c.handle)) continue;
    seen.add(c.handle);
    const suffix = c.handle.slice(matchedPrefix.length);
    const rule = rules.find((r) => r.match(suffix));

    if (rule) {
      const label = rule.label ?? cleanTitle(c.title, prefixWord);
      push(rule.column, { handle: c.handle, label, _order: rule.order });
    } else {
      moreItems.push({ handle: c.handle, label: cleanTitle(c.title, prefixWord), _order: 99 });
    }
  }
  if (moreItems.length > 0) {
    moreItems.sort((a, b) => a.label.localeCompare(b.label));
    for (const m of moreItems) push("More", m);
  }

  // Build columns in defined order. Dedupe by handle (per column) AND by label
  // (across the whole department) so the same display name — e.g. "All Shoes"
  // or "All Accessories" — can never appear twice even if two Shopify handles
  // would otherwise resolve to the same label.
  const columns: MegaColumn[] = [];
  const seenLabel = new Set<string>();
  for (const heading of columnOrder) {
    const items = grouped.get(heading);
    if (!items || items.length === 0) continue;
    const dedup = new Map<string, MegaItem & { _order: number }>();
    for (const it of items) {
      if (dedup.has(it.handle)) continue;
      const labelKey = it.label.trim().toLowerCase();
      if (seenLabel.has(labelKey)) continue;
      seenLabel.add(labelKey);
      dedup.set(it.handle, it);
    }
    if (dedup.size === 0) continue;
    const sorted = [...dedup.values()].sort((a, b) => a._order - b._order);
    columns.push({
      heading,
      items: sorted.map(({ handle, label }) => ({ handle, label })),
    });
  }


  return { ...dept, columns };
}

/**
 * Build the Women / Men megamenu departments live from Shopify collections.
 * Pass the full collection list from `fetchCollections()`.
 *
 * Both `womens-` and `women-` prefixes are accepted (Shopify has a mix —
 * `womens-clothing` and `women-bags` both exist as real collections).
 */
export function buildDepartments(collections: ShopifyCollection[]): MegaDepartment[] {
  return [
    buildDepartment(collections, ["womens-", "women-"], WOMEN_RULES, WOMEN_COLUMN_ORDER, {
      key: "women",
      label: "Women",
      rootHandle: "womens-clothing",
      feature: {
        handle: "womens-clothing",
        eyebrow: "The Spring Edit",
        title: "A study in considered dressing.",
      },
    }),
    buildDepartment(collections, ["mens-", "men-"], MEN_RULES, MEN_COLUMN_ORDER, {
      key: "men",
      label: "Men",
      rootHandle: "mens-clothing",
      feature: {
        handle: "mens-clothing",
        eyebrow: "The Tailoring Room",
        title: "Sharp lines, quiet codes.",
      },
    }),
  ];
}

// -----------------------------------------------------------------------------
// Brands — every vendor surfaced from live product data, no allowlist
// -----------------------------------------------------------------------------

export type BrandEntry = { vendor: string; count: number };

/** Return every vendor, sorted alphabetically. No curation. */
export function buildBrandList(vendors: BrandEntry[]): BrandEntry[] {
  return vendors
    .filter((v) => v.vendor && v.vendor.trim().length > 0)
    .sort((a, b) => a.vendor.localeCompare(b.vendor));
}


/**
 * Group brands into curated luxury tiers for the megamenu panel.
 * Each tier column only shows houses that are actually live in the catalog.
 * Any live vendor not in the curated tiers falls into "More Houses" at the
 * end (alphabetical), so nothing is hidden but the marquee names lead.
 */
export function groupBrandsForMenu(brands: BrandEntry[]): { heading: string; items: BrandEntry[] }[] {
  if (brands.length === 0) return [];
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "");
  const liveByKey = new Map(brands.map((b) => [norm(b.vendor), b]));
  const used = new Set<string>();

  const tierColumns: { heading: string; items: BrandEntry[] }[] = LUXURY_TIERS.map((t) => {
    const items: BrandEntry[] = [];
    for (const lb of t.brands) {
      const hit = liveByKey.get(norm(lb.name));
      if (hit && !used.has(hit.vendor)) {
        items.push(hit);
        used.add(hit.vendor);
      }
    }
    return { heading: t.label as string, items };
  }).filter((c) => c.items.length > 0);

  const rest = brands
    .filter((b) => !used.has(b.vendor))
    .sort((a, b) => a.vendor.localeCompare(b.vendor));
  if (rest.length > 0) {
    tierColumns.push({ heading: "More Houses", items: rest });
  }
  return tierColumns;
}

/** Convert a vendor display name to its `/brand/$vendor` URL slug.
 *  Mirrors the slug pattern used on the /brands index so links round-trip. */
export function vendorSlug(name: string): string {
  return name.toLowerCase().replace(/\s+/g, "-");
}

