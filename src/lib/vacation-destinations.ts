/**
 * Vacation Stylist — destination dataset + server fn.
 *
 * Curated, editorially-written set of holiday destinations the stylist supports
 * with dedicated landing pages. Stored as a typed module (not Supabase) so the
 * data is shippable today without a migration; we can promote to a
 * `vacation_destinations` table later without changing the route contract.
 */
import { createServerFn } from "@tanstack/react-start";
import { notFound } from "@tanstack/react-router";
import { z } from "zod";

export type VacationVibe =
  | "beach-club"
  | "yacht-marina"
  | "resort-evening"
  | "city-escape"
  | "desert-retreat"
  | "alpine-getaway";

export type VacationDestination = {
  slug: string;
  name: string;
  region: string;
  climate: string;
  seasonalNotes: string;
  styleTags: string[];
  editorialSummary: string;
  defaultVibe: VacationVibe;
};

const DESTINATIONS: Record<string, VacationDestination> = {
  capri: {
    slug: "capri",
    name: "Capri",
    region: "Tyrrhenian Coast, Italy",
    climate:
      "Mediterranean summers, dry and warm from late May through September with mid-80s°F (29°C) afternoons cooled by sea breeze.",
    seasonalNotes:
      "Peak season runs June–September. Evenings in the Piazzetta call for a light layer; mornings at the Marina Piccola stay temperate well into October.",
    styleTags: ["linen", "silk", "leather sandal", "raffia", "ivory"],
    editorialSummary:
      "Capri rewards restraint. The island's aesthetic was set by a generation of editors and heiresses who lived in tailored linen by day and slim silk by night. A Palace of Roman capsule for Capri leans on cream, bone, and faded denim — softened with a single statement: a sculpted leather sandal, a goldsmith's cuff, a hand-finished raffia tote. Nothing arrives by accident.",
    defaultVibe: "resort-evening",
  },
  mykonos: {
    slug: "mykonos",
    name: "Mykonos",
    region: "Cyclades, Greece",
    climate:
      "Arid Aegean summers with high sun, low humidity, and the Meltemi wind that lifts kaftans and tempers the heat into October.",
    seasonalNotes:
      "Beach club season peaks late June through early September. Pack for sand-to-table transitions and warm, windswept nights along Little Venice.",
    styleTags: ["kaftan", "swim", "crochet", "metallic sandal", "sun-bleached"],
    editorialSummary:
      "Mykonos is theatre. The capsule resists the urge to over-pack and instead invests in two or three precise gestures: a fluid silk kaftan that reads as both cover-up and dinner dress, a tonal swim set in a sculptural shape, a flat metallic sandal that travels from sun lounger to taverna. The palette is whitewash, bronze, and the deep blue of the Aegean at dusk.",
    defaultVibe: "beach-club",
  },
  "saint-tropez": {
    slug: "saint-tropez",
    name: "Saint-Tropez",
    region: "Côte d'Azur, France",
    climate:
      "Provençal summer — warm, dry afternoons in the high 80s°F (30°C) with sea-cooled evenings and reliable July–August sun.",
    seasonalNotes:
      "Pampelonne lunches and Place des Lices evenings move on different clocks; pack for both. Shoulder season (late May, September) is the connoisseur's window.",
    styleTags: ["nautical", "navy", "broderie anglaise", "espadrille", "gold"],
    editorialSummary:
      "Saint-Tropez has always belonged to the people who arrive by sea. The dress code is studied ease: a navy-and-cream wardrobe punctuated by a single, deliberate object — a sculpted gold chain, an architectural sandal, a Bardot-shouldered top. The capsule favours pieces that read as effortless from a distance and as quietly extraordinary at the table.",
    defaultVibe: "yacht-marina",
  },
  "st-barths": {
    slug: "st-barths",
    name: "St. Barths",
    region: "French West Indies",
    climate:
      "Tropical Caribbean — consistent low-80s°F (28°C), trade-wind cooled, with the driest, clearest stretch from December through April.",
    seasonalNotes:
      "High season is the Christmas–New Year window and February. Pack for sustained heat, brief rain showers, and dinners that begin well after dark.",
    styleTags: ["resort", "silk", "swim", "gold cuff", "barefoot luxury"],
    editorialSummary:
      "St. Barths is the original quiet-luxury island. The wardrobe is light, white, and unimpeachably finished: silk camisoles that double for dinner at Bonito, a swim wardrobe edited to two pieces, leather sandals worn until the soles bleach. Investment-grade jewellery does the rest of the talking.",
    defaultVibe: "beach-club",
  },
  aspen: {
    slug: "aspen",
    name: "Aspen",
    region: "Rocky Mountains, Colorado",
    climate:
      "Alpine continental — sub-zero overnight temperatures (around 10°F / -12°C) in peak winter, with high-altitude sun and dry, bright afternoons.",
    seasonalNotes:
      "Holiday week and the long February stretch are the dress-up calendar. Plan for piste-to-fireside transitions and dinners at Element 47 or Bosq.",
    styleTags: ["cashmere", "shearling", "snow boot", "après-ski", "cream knit"],
    editorialSummary:
      "Aspen rewards a vertical wardrobe — layers that move from gondola to lunch at Cloud Nine to a fur-collared walk down East Hyman. The capsule leans on heavyweight cashmere, a sculptural shearling, and a single piece of high jewellery worn against bare collarbone after the snowsuit comes off. Cream, camel, and the deep brown of broken-in leather.",
    defaultVibe: "alpine-getaway",
  },
  marrakech: {
    slug: "marrakech",
    name: "Marrakech",
    region: "Atlas Foothills, Morocco",
    climate:
      "High-desert climate — hot, dry days reaching 95°F (35°C) in spring and autumn, with sharp temperature drops once the sun sets behind the Atlas.",
    seasonalNotes:
      "October–April is the connoisseur's window. Pack for medina-to-riad transitions, with a long-sleeved cover for the souks and a layer for cool desert nights.",
    styleTags: ["kaftan", "leather", "embroidered", "ochre", "amber"],
    editorialSummary:
      "Marrakech calls for a slower wardrobe — long lines, hand-finished embroidery, leather that ages into the palette of the city itself. The capsule moves between the Jardin Majorelle's cobalt shade and a candlelit dinner at the Royal Mansour: a fluid kaftan, an architectural sandal, a single piece of antiqued gold worn against sun-warmed skin.",
    defaultVibe: "desert-retreat",
  },
  dubai: {
    slug: "dubai",
    name: "Dubai",
    region: "Arabian Gulf, UAE",
    climate:
      "Desert coastal — winter highs in the mid-70s°F (24°C), summer extremes above 105°F (40°C) with air-conditioned interiors at every transition.",
    seasonalNotes:
      "October–April is the dress-up calendar. Plan for a sharp split between the Gulf sun and aggressively cooled restaurants, ballrooms, and boutiques.",
    styleTags: ["silk", "evening", "gold", "structured tailoring", "statement heel"],
    editorialSummary:
      "Dubai rewards precision. The capsule leans on sculpted tailoring, fluid silk, and evening pieces that read at scale across a ballroom at the Burj Al Arab or the courtyard at Bvlgari Resort. A wardrobe of architectural shapes, restrained palette, and one piece of high jewellery that does the talking.",
    defaultVibe: "city-escape",
  },
};

export function listVacationDestinations(): VacationDestination[] {
  return Object.values(DESTINATIONS);
}

const Input = z.object({
  slug: z
    .string()
    .trim()
    .min(1)
    .max(80)
    .regex(/^[a-z0-9-]+$/),
});

export const getVacationDestination = createServerFn({ method: "GET" })
  .inputValidator((data: { slug: string }) => Input.parse(data))
  .handler(async ({ data }) => {
    const dest = DESTINATIONS[data.slug];
    if (!dest) throw notFound();
    return dest;
  });
