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


/** Group brands into A–G / H–N / O–Z columns for the megamenu panel. */
export function groupBrandsForMenu(brands: BrandEntry[]): { heading: string; items: BrandEntry[] }[] {
  const buckets: { heading: string; range: (c: string) => boolean }[] = [
    { heading: "A — G", range: (c) => c >= "A" && c <= "G" },
    { heading: "H — N", range: (c) => c >= "H" && c <= "N" },
    { heading: "O — Z", range: (c) => c >= "O" && c <= "Z" },
  ];
  return buckets
    .map((b) => ({
      heading: b.heading,
      items: brands.filter((br) => b.range(br.vendor[0]?.toUpperCase() ?? "")),
    }))
    .filter((b) => b.items.length > 0);
}

/** Convert a vendor display name to its `/brand/$vendor` URL slug.
 *  Mirrors the slug pattern used on the /brands index so links round-trip. */
export function vendorSlug(name: string): string {
  return name.toLowerCase().replace(/\s+/g, "-");
}

