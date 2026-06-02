// Whitelist + Rome-context editorial copy for the "[Brand] in Rome" SEO pages.
// Targets long-tail intent ("gucci rome", "prada rome store", etc.) — verified
// in Semrush as low-difficulty (KDI 14–27) with measurable monthly volume.
//
// All 10 brands are present in the live Shopify catalog (verified via storefront
// API). Slugs match the existing /brand/$vendor route convention.

export type RomeBrand = {
  /** Canonical brand name (matches Shopify vendor exactly). */
  name: string;
  /** URL slug for /brand/$vendor and /brand/$vendor/in-rome. */
  slug: string;
  /** Short headline shown under the H1. */
  tagline: string;
  /** 2–3 sentence editorial paragraph grounding the brand in Rome. */
  romeContext: string;
  /** What Rome shoppers most often search this brand for — drives the chips. */
  searchedFor: string[];
  /** Editorial sub-heading for the products section. */
  pieceLead: string;
};

export const ROME_BRANDS: RomeBrand[] = [
  {
    name: "Dolce & Gabbana",
    slug: "dolce-gabbana",
    tagline: "The Mediterranean wardrobe — Sicilian baroque, tailored on Via Condotti.",
    romeContext:
      "Domenico Dolce and Stefano Gabbana built a Roman following with their Sicilian-baroque tailoring, leopard prints, and lace eveningwear that feel native to the city's piazzas. Tourists searching for Dolce & Gabbana in Rome come for the Sicily-leather totes, embellished sneakers, and the printed silk shirts that walk straight off Via dei Condotti.",
    searchedFor: [
      "Sicily Bag",
      "Embellished Sneakers",
      "Printed Silk Shirts",
      "Lace Dresses",
      "Logo Belts",
    ],
    pieceLead: "Currently in stock at Palace of Roman",
  },
  {
    name: "Brunello Cucinelli",
    slug: "brunello-cucinelli",
    tagline: "Solomeo cashmere — quiet luxury sized for a Roman summer.",
    romeContext:
      "Brunello Cucinelli's Umbrian atelier sits a short drive north of Rome, and the house's washed cashmere, panama linens, and unstructured tailoring have become the unofficial uniform of Rome's quiet-luxury set. Shoppers searching for Cucinelli in the city want the cardigans, monili-collared knits, and washed linen separates that translate from Trastevere lunches to Amalfi weekends.",
    searchedFor: [
      "Cashmere Cardigans",
      "Linen Trousers",
      "Monili Knits",
      "Suede Sneakers",
      "Panama Hats",
    ],
    pieceLead: "Currently in stock at Palace of Roman",
  },
  {
    name: "Prada",
    slug: "prada",
    tagline: "Milanese intellect on the Spanish Steps — re-nylon, Galleria, Cleo.",
    romeContext:
      "The Prada flagship anchors Via dei Condotti, and the house's Re-Nylon shoulder bags, triangle-logo loafers, and pressed cotton shirting are among the most searched luxury items in Rome. Visitors looking for Prada at street level — without the queues at the Condotti boutique — find the same Galleria, Cleo, and Re-Edition pieces here.",
    searchedFor: [
      "Re-Nylon Bag",
      "Galleria",
      "Cleo Shoulder Bag",
      "Triangle Loafers",
      "Pressed Cotton Shirts",
    ],
    pieceLead: "Currently in stock at Palace of Roman",
  },
  {
    name: "Versace",
    slug: "versace",
    tagline: "Medusa-marked Roman maximalism — silk, gold, and Greca everywhere.",
    romeContext:
      "Versace is the most photographed luxury façade in Rome — the Via Bocca di Leone boutique sits a five-minute walk from the Trevi Fountain, and tourists actively search for the Medusa-buckle belts, baroque silk shirts, and Greca chain bags that read instantly on Instagram. The Roman wardrobe leans into the loud Versace codes rather than away from them.",
    searchedFor: [
      "Medusa Belts",
      "Baroque Silk Shirts",
      "Greca Bags",
      "La Greca Sneakers",
      "Printed Swimwear",
    ],
    pieceLead: "Currently in stock at Palace of Roman",
  },
  {
    name: "Ferragamo",
    slug: "ferragamo",
    tagline: "Florentine shoemaking with a Roman audience — Vara, Gancini, Hug.",
    romeContext:
      "Salvatore Ferragamo built the Italian luxury shoe canon in Florence, and the house's Vara bows, Gancini horsebit loafers, and Hug shoulder bags are perennial Rome searches — equally for the Roman wardrobe and as a duty-free gift on the way home. Pieces shown here are the contemporary cuts, sourced through the brand's authorised European distribution.",
    searchedFor: [
      "Vara Pumps",
      "Gancini Loafers",
      "Hug Shoulder Bag",
      "Studio Bag",
      "Leather Belts",
    ],
    pieceLead: "Currently in stock at Palace of Roman",
  },
  {
    name: "Tom Ford",
    slug: "tom-ford",
    tagline: "Glamour in graphite — the suit, the shade, the after-hours edit.",
    romeContext:
      "Tom Ford's Roman following has always been the evening crowd — the peak-lapel tuxedos, sculpted satin shirts, and oversized eyewear that read across the candlelit terraces of Trastevere. Shoppers searching Tom Ford in Rome are after the same pieces that anchor a Sala Grande dinner: the suiting, the sunglasses, the silk.",
    searchedFor: [
      "Tom Ford Sunglasses",
      "Peak-Lapel Tuxedos",
      "Satin Shirts",
      "Velvet Slippers",
      "Leather Belts",
    ],
    pieceLead: "Currently in stock at Palace of Roman",
  },
  {
    name: "Jacquemus",
    slug: "jacquemus",
    tagline: "Marseille minimalism that travels well from the Riviera to Rome.",
    romeContext:
      "Simon Porte Jacquemus dresses the post-Riviera Roman summer — the Le Chiquito and Le Bambino bags, sculptural mules, and resort-cut linens land in stories from Anzio to the Pamphilj gardens. The Rome search for Jacquemus is overwhelmingly the micro-bags and the linen tailoring; both are in stock here.",
    searchedFor: [
      "Le Chiquito",
      "Le Bambino",
      "Sculptural Mules",
      "Linen Co-ords",
      "Cropped Knits",
    ],
    pieceLead: "Currently in stock at Palace of Roman",
  },
  {
    name: "Gucci",
    slug: "gucci",
    tagline: "Florentine flagship, Roman wardrobe — Horsebit, Jackie, GG Marmont.",
    romeContext:
      "Gucci's Via Condotti boutique is one of the most-searched luxury addresses in Rome, but the queue rarely matches the inventory. Pieces shown here are the heritage codes Rome shoppers actively look for: the Horsebit 1955, the Jackie 1961, GG Marmont quilted bags, and the Princetown loafer — all sourced through the brand's authorised European distribution.",
    searchedFor: [
      "Horsebit 1955",
      "Jackie 1961",
      "GG Marmont",
      "Princetown Loafers",
      "Ace Sneakers",
    ],
    pieceLead: "Currently in stock at Palace of Roman",
  },
  {
    name: "Moncler",
    slug: "moncler",
    tagline: "Alpine outerwear for the Roman shoulder season — Maya, Bady, Genius.",
    romeContext:
      "Rome's October-through-March wardrobe runs on Moncler. The Maya, Bady, and Hermine puffers, the Genius Grenoble cuts, and the lightweight Italian-down vests dominate the search around the Spanish Steps from autumn onward. Sizes shown here are the live, in-stock European cuts.",
    searchedFor: [
      "Maya Puffer",
      "Bady Jacket",
      "Hermine",
      "Genius Grenoble",
      "Down Vests",
    ],
    pieceLead: "Currently in stock at Palace of Roman",
  },
  {
    name: "ZEGNA",
    slug: "zegna",
    tagline: "Trivero tailoring on a Roman cut — Oasi cashmere, Triple Stitch sneakers.",
    romeContext:
      "ZEGNA cuts the Roman businessman's suit — the Trivero-milled wools, the Oasi cashmere knits, and the Triple Stitch sneakers that have replaced the loafer in many of the city's quieter circles. The Rome search for Zegna is the suiting and the cashmere; both are in stock through the brand's authorised European distribution.",
    searchedFor: [
      "Triple Stitch Sneakers",
      "Oasi Cashmere",
      "Trivero Wool Suits",
      "Cotton Shirts",
      "Silk Ties",
    ],
    pieceLead: "Currently in stock at Palace of Roman",
  },
];

export const ROME_BRAND_SLUGS = new Set(ROME_BRANDS.map((b) => b.slug));

export function romeBrandFor(slug: string): RomeBrand | null {
  return ROME_BRANDS.find((b) => b.slug === slug) ?? null;
}
