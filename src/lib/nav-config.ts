// Navigation structure — STATIC, verified-handles only.
//
// Restructured 2026-06-09: every collection handle below is live and verified
// in Shopify. Vacation and Brands are surfaced inside each department panel
// per the navigation spec. Items with a `to` field route to non-collection
// destinations (/vacation-stylist, /brands); all others resolve to
// `/collections/$handle`.

import { LUXURY_TIERS } from "@/lib/luxury-brands";

export type MegaItem = {
  /** Collection handle for `/collections/$handle` links. */
  handle?: string;
  /** Explicit route override; takes precedence over `handle`. */
  to?: string;
  label: string;
};
export type MegaColumn = { heading: string; items: MegaItem[] };
export type MegaFeature = {
  handle: string;
  eyebrow: string;
  title: string;
};
export type MegaDepartment = {
  key: "women" | "men";
  label: string;
  rootHandle: string;
  columns: MegaColumn[];
  feature: MegaFeature;
};

// -----------------------------------------------------------------------------
// Static department structure — verified handles only.
// -----------------------------------------------------------------------------

const WOMEN_DEPARTMENT: MegaDepartment = {
  key: "women",
  label: "Women",
  rootHandle: "womens-clothing",
  columns: [
    { heading: "New In", items: [{ handle: "new-arrivals", label: "New Arrivals" }] },
    { heading: "Vacation", items: [{ to: "/vacation-stylist", label: "Vacation Stylist" }] },
    { heading: "Brands", items: [{ to: "/brands", label: "All Brands" }] },
    {
      heading: "Apparel",
      items: [
        { handle: "womens-clothing", label: "All Apparel" },
        { handle: "womens-dresses", label: "Dresses" },
        { handle: "womens-swim", label: "Swim" },
      ],
    },
    { heading: "Shoes", items: [{ handle: "womens-shoes", label: "All Shoes" }] },
    { heading: "Carry", items: [{ handle: "womens-bags", label: "Bags" }] },
    {
      heading: "Fine Accessories",
      items: [{ handle: "womens-accessories", label: "All Accessories" }],
    },
  ],
  feature: {
    handle: "womens-clothing",
    eyebrow: "The Spring Edit",
    title: "A study in considered dressing.",
  },
};

const MEN_DEPARTMENT: MegaDepartment = {
  key: "men",
  label: "Men",
  rootHandle: "mens-clothing",
  columns: [
    { heading: "New In", items: [{ handle: "new-arrivals", label: "New Arrivals" }] },
    { heading: "Vacation", items: [{ to: "/vacation-stylist", label: "Vacation Stylist" }] },
    { heading: "Brands", items: [{ to: "/brands", label: "All Brands" }] },
    {
      heading: "Apparel",
      items: [
        { handle: "mens-clothing", label: "All Apparel" },
        { handle: "mens-shirts", label: "Shirts" },
        { handle: "mens-polos", label: "Polos" },
        { handle: "mens-t-shirts", label: "T-Shirts" },
        { handle: "suits", label: "Tailoring" },
      ],
    },
    {
      heading: "Coastal",
      items: [
        { handle: "the-riviera-edit", label: "The Riviera Edit" },
        { handle: "coastal-essentials", label: "Coastal Essentials" },
      ],
    },
    {
      heading: "Shoes",
      items: [
        { handle: "mens-shoes", label: "All Shoes" },
        { handle: "mens-sneakers", label: "Sneakers" },
        { handle: "mens-loafers", label: "Loafers" },
      ],
    },
    { heading: "Carry", items: [{ handle: "mens-bags", label: "Bags" }] },
    {
      heading: "Accessories",
      items: [{ handle: "mens-accessories", label: "All Accessories" }],
    },
  ],
  feature: {
    handle: "mens-clothing",
    eyebrow: "The Riviera Edit",
    title: "Sharp lines, quiet codes.",
  },
};

/**
 * Returns the static department structure. The `collections` arg is accepted
 * for backwards-compat with the previous live-built signature but is ignored
 * — every handle in the returned structure is hand-verified.
 */
export function buildDepartments(_collections?: unknown): MegaDepartment[] {
  return [WOMEN_DEPARTMENT, MEN_DEPARTMENT];
}

// -----------------------------------------------------------------------------
// Brands — verified live brand allowlist (23 houses, 2026-06-09).
// Every former overflow brand whose Shopify collection was deleted has been
// removed. Adding a brand here without a live `/collections/<slug>` page WILL
// produce a 404 link — verify in Shopify Admin first.
// -----------------------------------------------------------------------------

export type BrandEntry = { vendor: string; count: number };

/** Live, customer-facing brand names. Slug = lowercase, spaces → hyphens. */
export const VERIFIED_LIVE_BRANDS: string[] = [
  "Brunello Cucinelli",
  "Dolce & Gabbana",
  "Saint Laurent",
  "Versace",
  "Balenciaga",
  "Gucci",
  "Fendi",
  "Prada",
  "Burberry",
  "Tom Ford",
  "Givenchy",
  "Chloé",
  "Ferragamo",
  "Jacquemus",
  "Balmain",
  "Alexander McQueen",
  "Maison Margiela",
  "Off-White",
  "Moschino",
  "Jimmy Choo",
  "Kenzo",
  "Moncler",
  "Valentino",
];

const normBrand = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "");
const ALLOWED_BRAND_KEYS = new Set(VERIFIED_LIVE_BRANDS.map(normBrand));

export function isAllowedLuxuryBrand(vendor: string): boolean {
  if (!vendor) return false;
  return ALLOWED_BRAND_KEYS.has(normBrand(vendor));
}

export function buildBrandList(vendors: BrandEntry[]): BrandEntry[] {
  return vendors
    .filter((v) => v.vendor && isAllowedLuxuryBrand(v.vendor))
    .sort((a, b) => a.vendor.localeCompare(b.vendor));
}

/**
 * Group brands into curated tiers for the megamenu panel. Only brands that
 * are BOTH in the live catalog AND in VERIFIED_LIVE_BRANDS are shown.
 */
export function groupBrandsForMenu(
  brands: BrandEntry[],
): { heading: string; items: BrandEntry[] }[] {
  if (brands.length === 0) return [];
  const liveByKey = new Map(
    brands.filter((b) => isAllowedLuxuryBrand(b.vendor)).map((b) => [normBrand(b.vendor), b]),
  );
  const used = new Set<string>();
  return LUXURY_TIERS.map((t) => {
    const items: BrandEntry[] = [];
    for (const lb of t.brands) {
      const hit = liveByKey.get(normBrand(lb.name));
      if (hit && !used.has(hit.vendor)) {
        items.push(hit);
        used.add(hit.vendor);
      }
    }
    return { heading: t.label as string, items };
  }).filter((c) => c.items.length > 0);
}

/** Vendor display name → `/brand/$vendor` URL slug. */
export function vendorSlug(name: string): string {
  return name.toLowerCase().replace(/\s+/g, "-");
}

/**
 * Vendor display name → Shopify collection handle slug (proper).
 * Strips diacritics, collapses non-alphanumerics to hyphens.
 * "Dolce & Gabbana" → "dolce-gabbana", "Chloé" → "chloe".
 */
export function brandCollectionHandle(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// -----------------------------------------------------------------------------
// Static primary navigation — per-department, verified handles only.
// Top-level rail items render flat; items with `children` render a dropdown.
// Used by both DesktopCategoryRail and MobileFarfetchMenu.
// -----------------------------------------------------------------------------

export type NavLeaf = { label: string; to: string };
export type NavNode = NavLeaf & { children?: NavLeaf[] };

export const NAV_MEN: NavNode[] = [
  { label: "New In", to: "/collections/new-arrivals" },
  { label: "Vacation", to: "/vacation-stylist" },
  { label: "Brands", to: "/brands" },
  {
    label: "Apparel",
    to: "/collections/mens-clothing",
    children: [
      { label: "Shirts", to: "/collections/mens-shirts" },
      { label: "Polos", to: "/collections/mens-polos" },
      { label: "T-Shirts", to: "/collections/mens-t-shirts" },
      { label: "Tailoring", to: "/collections/suits" },
    ],
  },
  {
    label: "Coastal",
    to: "/collections/the-riviera-edit",
    children: [
      { label: "The Riviera Edit", to: "/collections/the-riviera-edit" },
      { label: "Coastal Essentials", to: "/collections/coastal-essentials" },
    ],
  },
  {
    label: "Shoes",
    to: "/collections/mens-shoes",
    children: [
      { label: "Sneakers", to: "/collections/mens-sneakers" },
      { label: "Loafers", to: "/collections/mens-loafers" },
    ],
  },
  { label: "Carry", to: "/collections/mens-bags" },
  { label: "Accessories", to: "/collections/mens-accessories" },
];

export const NAV_WOMEN: NavNode[] = [
  { label: "New In", to: "/collections/new-arrivals" },
  { label: "Vacation", to: "/vacation-stylist" },
  { label: "Brands", to: "/brands" },
  {
    label: "Apparel",
    to: "/collections/womens-clothing",
    children: [
      { label: "Dresses", to: "/collections/womens-dresses" },
      { label: "Swim", to: "/collections/womens-swim" },
    ],
  },
  { label: "Shoes", to: "/collections/womens-shoes" },
  { label: "Carry", to: "/collections/womens-bags" },
  { label: "Fine Accessories", to: "/collections/womens-accessories" },
];

export function navForDept(dept: "men" | "women"): NavNode[] {
  return dept === "men" ? NAV_MEN : NAV_WOMEN;
}

export type HeroBrand = {
  vendor: string;
  eyebrow: string;
  title: string;
  to: string;
};

export const HERO_BRANDS: HeroBrand[] = [
  {
    vendor: "Dolce & Gabbana",
    eyebrow: "Sicilian Baroque",
    title: "Dolce & Gabbana Icons",
    to: "/brand/dolce-&-gabbana",
  },
  {
    vendor: "Saint Laurent",
    eyebrow: "Parisian Edge",
    title: "Saint Laurent Icons",
    to: "/brand/saint-laurent",
  },
];
