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

const WOMEN_COLUMN_ORDER = ["Apparel", "Shoes", "Bags & Leather", "Fine Accessories"];
const MEN_COLUMN_ORDER   = ["Apparel", "Tailoring", "Shirts & Knitwear", "Bottoms & Beach", "Shoes", "Accessories"];

function cleanTitle(title: string, prefixWord: "Women's" | "Men's"): string {
  return title.replace(new RegExp(`^${prefixWord.replace("'", "['']")}\\s*`, "i"), "").trim() || title;
}

function buildDepartment(
  collections: ShopifyCollection[],
  prefix: "womens-" | "mens-",
  rules: ClassifierRule[],
  columnOrder: string[],
  dept: Omit<MegaDepartment, "columns">,
): MegaDepartment {
  const prefixWord = prefix === "womens-" ? "Women's" : "Men's";

  // Group rule matches by column.
  const grouped = new Map<string, MegaItem[]>();

  // 1) "New Arrivals" sits at the top of Apparel for both departments —
  //    it's a smart collection that crosses genders, but it reads as the
  //    natural lead item in an apparel column.
  const newArrivals = collections.find((c) => c.handle === "new-arrivals");
  if (newArrivals) {
    const colName = columnOrder[0]; // Apparel / Tailoring
    grouped.set(colName, [{ handle: "new-arrivals", label: "New Arrivals" }]);
  }

  for (const c of collections) {
    if (!c.handle.startsWith(prefix)) continue;
    const suffix = c.handle.slice(prefix.length);
    const rule = rules.find((r) => r.match(suffix));
    if (!rule) continue;

    const label = rule.label ?? cleanTitle(c.title, prefixWord);
    const arr = grouped.get(rule.column) ?? [];
    arr.push({ handle: c.handle, label, ...({ _order: rule.order } as object) } as MegaItem & { _order: number });
    grouped.set(rule.column, arr);
  }

  // Build columns in defined order, sorting items by their rule order.
  const columns: MegaColumn[] = [];
  for (const heading of columnOrder) {
    const items = grouped.get(heading);
    if (!items || items.length === 0) continue;
    items.sort((a, b) => ((a as any)._order ?? 99) - ((b as any)._order ?? 99));
    // strip internal _order before returning
    columns.push({
      heading,
      items: items.map(({ handle, label }) => ({ handle, label })),
    });
  }

  return { ...dept, columns };
}

/**
 * Build the Women / Men megamenu departments live from Shopify collections.
 * Pass the full collection list from `fetchCollections()`.
 */
export function buildDepartments(collections: ShopifyCollection[]): MegaDepartment[] {
  return [
    buildDepartment(collections, "womens-", WOMEN_RULES, WOMEN_COLUMN_ORDER, {
      key: "women",
      label: "Women",
      rootHandle: "womens-clothing",
      feature: {
        handle: "womens-clothing",
        eyebrow: "The Spring Edit",
        title: "A study in considered dressing.",
      },
    }),
    buildDepartment(collections, "mens-", MEN_RULES, MEN_COLUMN_ORDER, {
      key: "men",
      label: "Men",
      rootHandle: "mens-clothing",
      feature: {
        handle: "mens-suits",
        eyebrow: "The Tailoring Room",
        title: "Sharp lines, quiet codes.",
      },
    }),
  ];
}

// -----------------------------------------------------------------------------
// Brands — derived from live vendor data, filtered to a luxury allowlist
// -----------------------------------------------------------------------------

/** Houses we are willing to surface in the top nav. Lower-cased for matching. */
const LUXURY_BRAND_ALLOWLIST = new Set(
  [
    "Alexander McQueen", "Alexander Wang", "Armani", "Giorgio Armani", "Emporio Armani",
    "Balenciaga", "Balmain", "Bottega Veneta", "Brunello Cucinelli", "Burberry",
    "Calvin Klein", "Cartier", "Celine", "Céline", "Chloé", "Chloe", "Christian Dior",
    "Christian Louboutin", "Dior", "Dolce & Gabbana", "Etro", "Fendi", "Ferragamo",
    "Givenchy", "Goyard", "Gucci", "Hermès", "Hermes", "Jimmy Choo", "Lanvin",
    "Loewe", "Loro Piana", "Maison Margiela", "MM6 Maison Margiela", "Marni",
    "Missoni", "Miu Miu", "Moncler", "Moschino", "Off-White", "Philipp Plein",
    "Prada", "Saint Laurent", "Yves Saint Laurent", "Salvatore Ferragamo",
    "Stella McCartney", "The Row", "Tom Ford", "Tory Burch", "Valentino",
    "Versace", "Versace Jeans",
  ].map((s) => s.toLowerCase()),
);

export type BrandEntry = { vendor: string; count: number };

/** Filter a vendor-with-count list to the luxury allowlist, sorted alphabetically. */
export function buildBrandList(vendors: BrandEntry[]): BrandEntry[] {
  return vendors
    .filter((v) => LUXURY_BRAND_ALLOWLIST.has(v.vendor.toLowerCase()))
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

