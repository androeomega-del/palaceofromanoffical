/**
 * Static hotspot fallback registry.
 *
 * Centralised list of every (surface_kind, surface_slug) pair whose page
 * renders an `EditorialHotspotsBySurface` (or equivalent) with a literal
 * fallback hotspot array baked into the code. The admin "Seed all static
 * surfaces" tool walks this registry and inserts any missing image +
 * hotspot rows into `lookbook_images` / `lookbook_hotspots`, so the
 * storefront overlay can be edited from the admin without a redeploy.
 *
 * Dynamically-computed hotspots (e.g. swim.tsx's `lookbookSpots`, which
 * are derived from fetched product data) are intentionally excluded —
 * there's nothing fixed to seed.
 *
 * To add a new static surface:
 *   1. Add the matching `<EditorialHotspotsBySurface>` to the page.
 *   2. Append an entry below referencing the same surface_kind/slug,
 *      its source image import, alt text, and the literal hotspot array.
 *   3. Import `STATIC_HOTSPOT_SURFACES[i].fallbackHotspots` on the page
 *      so the registry stays the single source of truth.
 */

import editorialHero from "@/assets/editorial/may-2026/1.webp";
import mensDetail2 from "@/assets/mens-swim-detail-2.jpg";

export type StaticHotspot = {
  x: number;
  y: number;
  handle: string;
  label?: string;
  sublabel?: string;
};

export type StaticHotspotSurface = {
  surface_kind: string;
  surface_slug: string;
  image_url: string;
  alt_text: string;
  /** Human label for the admin UI; not persisted. */
  source: string;
  fallbackHotspots: StaticHotspot[];
};

export const STATIC_HOTSPOT_SURFACES: StaticHotspotSurface[] = [
  {
    surface_kind: "editorial",
    surface_slug: "may-2026-hero",
    image_url: editorialHero,
    alt_text: "May 2026 Editorial — Quiet authority",
    source: "src/components/default-edition-body.tsx",
    fallbackHotspots: [
      {
        x: 80,
        y: 11,
        label: "Eyewear",
        sublabel: "Alexander McQueen Acetate Sunglasses",
        handle: "alexander-mcqueen-black-acetate-sunglasses",
      },
      {
        x: 47,
        y: 56,
        label: "Handbag",
        sublabel: "Alexander McQueen Bos Taurus Shoulder Bag",
        handle:
          "alexander-mcqueen-black-calf-leather-bos-taurus-shoulder-bag",
      },
      {
        x: 22,
        y: 88,
        label: "Footwear",
        sublabel: "Alexander McQueen Chunky Sneakers",
        handle:
          "alexander-mcqueen-beige-calf-leather-bos-taurus-chunky-sneakers",
      },
    ],
  },
  {
    surface_kind: "campaign",
    surface_slug: "mens-swim-deck-flatlay",
    image_url: mensDetail2,
    alt_text: "Men's Resort 2026 deck flatlay",
    source: "src/routes/campaign.mens-swim.tsx",
    fallbackHotspots: [
      { x: 28, y: 22, handle: "black-polyamide-swim-shorts", label: "Black Swim Shorts" },
      { x: 72, y: 22, handle: "blue-cotton-shirt", label: "Blue Cotton Shirt" },
      { x: 45, y: 46, handle: "gold-metal-sunglasses-9", label: "Wraparound Sunglasses" },
      { x: 22, y: 70, handle: "green-polyamide-swim-shorts", label: "Cassette-Print Swim Shorts" },
      { x: 68, y: 62, handle: "brown-calf-leather-bos-taurus-flat-sandals", label: "FF Monogram Slides" },
    ],
  },
];

export function findStaticHotspotSurface(
  surface_kind: string,
  surface_slug: string,
): StaticHotspotSurface | undefined {
  return STATIC_HOTSPOT_SURFACES.find(
    (s) => s.surface_kind === surface_kind && s.surface_slug === surface_slug,
  );
}
