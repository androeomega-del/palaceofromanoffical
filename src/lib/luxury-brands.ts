// Curated index of luxury houses we feature.
// SYNCED FROM SHOPIFY VENDOR DATA - matches actual store inventory
// Used by megamenus, search trending chips, brand directory boosts,
// and the homepage "Top Brands" tiered section.

export type BrandEntry = { name: string; slug: string };

const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[''.]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const make = (names: string[]): BrandEntry[] =>
  names.map((n) => ({ name: n, slug: slug(n) }));

// TIER 1: Most prominent/frequent in catalog
export const TIER_1_WORLD_LEADERS = make([
  "Dolce & Gabbana",
  "Gucci",
  "Prada",
  "Louis Vuitton",
  "Chanel",
  "Saint Laurent",
  "Dior",
  "Hermès",
  "Fendi",
  "Valentino",
]);

// TIER 2: High demand/frequently stocked
export const TIER_2_HIGH_DEMAND = make([
  "Balenciaga",
  "Bottega Veneta",
  "Burberry",
  "Celine",
  "Coach",
  "Loewe",
  "Miu Miu",
  "Versace",
  "Alexander McQueen",
  "Givenchy",
  "Tom Ford",
  "Giorgio Armani",
  "The Row",
  "Balmain",
  "Cartier",
  "Bvlgari",
  "Van Cleef & Arpels",
  "Alaïa",
  "Ralph Lauren",
  "Tory Burch",
]);

// TIER 3: Heritage/established houses
export const TIER_3_HERITAGE = make([
  "Brunello Cucinelli",
  "Ermenegildo Zegna",
  "Christian Louboutin",
  "Vivienne Westwood",
  "Ferragamo",
  "Chloé",
  "Goyard",
  "Thom Browne",
  "Brioni",
  "Longchamp",
  "Michael Kors",
  "Stella McCartney",
  "Marc Jacobs",
  "Jimmy Choo",
  "Manolo Blahnik",
  "Rimowa",
  "Maison Margiela",
  "Jacquemus",
  "Rolex",
  "Moncler",
]);

// TIER 4: Contemporary/vanguard designers
export const TIER_4_VANGUARDS = make([
  "Acne Studios",
  "Rick Owens",
  "Khaite",
  "Dries Van Noten",
  "Comme des Garçons",
  "Off-White",
  "Kenzo",
  "Issey Miyake",
  "Jil Sander",
  "Sacai",
  "Calvin Klein",
  "Moschino",
  "Schiaparelli",
  "Marni",
  "Lanvin",
  "Yeezy",
  "Fear of God",
  "Ami Paris",
  "Diesel",
  "Simone Rocha",
  "Maison Kitsuné",
  "Proenza Schouler",
  "Casablanca",
  "Dunhill",
  "Bally",
]);

// TIER 5: Niche/specialized luxury
export const TIER_5_NICHE_HARD_LUXURY = make([
  "Patek Philippe",
  "Audemars Piguet",
  "Omega",
  "TAG Heuer",
  "Jaeger-LeCoultre",
  "Graff",
  "Chopard",
  "Messika",
  "Canada Goose",
  "Mackage",
  "Barbour",
  "Canali",
  "Loro Piana",
  "Mulberry",
  "Kate Spade",
  "MCM",
  "Jean Paul Gaultier",
  "Roberto Cavalli",
  "Missoni",
  "Coperni",
  "Mugler",
  "JW Anderson",
  "Peter Do",
  "Ludovic de Saint Sernin",
]);

export const LUXURY_TIERS = [
  { id: "tier-1", label: "World Leaders", brands: TIER_1_WORLD_LEADERS },
  { id: "tier-2", label: "High-Demand Elite", brands: TIER_2_HIGH_DEMAND },
  { id: "tier-3", label: "Heritage & Tailoring", brands: TIER_3_HERITAGE },
  { id: "tier-4", label: "Modern Vanguards", brands: TIER_4_VANGUARDS },
  { id: "tier-5", label: "Niche & Hard Luxury", brands: TIER_5_NICHE_HARD_LUXURY },
] as const;

export const ALL_LUXURY_BRANDS: BrandEntry[] = LUXURY_TIERS.flatMap((t) => t.brands);

// Curated 12 most-searched houses for the search overlay "Trending Brands" chips.
export const TRENDING_BRANDS: BrandEntry[] = make([
  "Dolce & Gabbana",
  "Gucci",
  "Prada",
  "Louis Vuitton",
  "Chanel",
  "Saint Laurent",
  "Dior",
  "Hermès",
  "Fendi",
  "Valentino",
  "Balenciaga",
  "Bottega Veneta",
]);
