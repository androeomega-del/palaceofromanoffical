// Long-form Maison heritage content for /maison/$slug editorial pages.
// Each entry powers a single deep storytelling page that ties into the
// shoppable /brand/$vendor catalog grid. Built as a registry so new
// maisons can be added one-by-one and staged before nav exposure.

export type MaisonSignature = {
  /** Iconic piece / code name (e.g. "Monili Bead Cuff"). */
  name: string;
  /** 2–3 sentence editorial paragraph on why it matters. */
  body: string;
};

export type MaisonFaq = { q: string; a: string };

export type Maison = {
  /** URL slug (must match /brand/$vendor slug to link the shoppable view). */
  slug: string;
  /** Canonical brand name (must match Shopify vendor exactly). */
  brand: string;
  /** Eyebrow line — "Maison · Solomeo · Est. 1978". */
  meta: string;
  /** Short, quotable tagline shown under H1. */
  tagline: string;
  /** SEO description (used in meta + intro). */
  metaDescription: string;
  /** Founder / origin story — 1–2 paragraphs. */
  origin: string;
  /** Atelier or design philosophy — 1–2 paragraphs. */
  philosophy: string;
  /** Three to four signature codes with editorial body copy. */
  signatures: MaisonSignature[];
  /** Three craft pillars surfaced as a grid (icon-less editorial). */
  pillars: { title: string; body: string }[];
  /** FAQs — feed JSON-LD FAQPage + on-page accordion. */
  faqs: MaisonFaq[];
  /** Country (JSON-LD `Brand.foundingLocation`). */
  country: string;
  /** Year founded. */
  founded: string;
};

const MAISONS: Record<string, Maison> = {
  "brunello-cucinelli": {
    slug: "brunello-cucinelli",
    brand: "Brunello Cucinelli",
    meta: "Maison · Solomeo, Umbria · Est. 1978",
    tagline:
      "The philosopher of cashmere — humanistic luxury made slowly in a restored hamlet above the Umbrian valley.",
    metaDescription:
      "Discover Brunello Cucinelli — the Solomeo maison that redefined quiet luxury through cashmere, monili-beaded tailoring and a humanist philosophy of work. Shop the curated edit at Palace of Roman.",
    origin:
      "Brunello Cucinelli was born in 1953 in Castel Rigone, an Umbrian farming village without electricity. The son of a factory worker whose dignity he saw eroded by industrial labour, he set out in 1978 with a single, then-radical idea: dye cashmere in the colours of a Renaissance fresco. With borrowed money and a handful of pieces in pistachio, rose, and pale ochre, he built a women's knitwear company that would within a decade become the global reference for understated Italian luxury.",
    philosophy:
      "In 1985 he purchased the ruined 14th-century hamlet of Solomeo and restored it stone by stone — not as a marketing exercise, but as the seat of a working philosophy he calls 'humanistic capitalism'. The atelier sits inside a medieval village complete with a theatre, library, school of arts and crafts, and vineyards. Artisans work a measured day, lunch together at long tables, and are paid roughly 20% above industry standard. The clothes that emerge — featherweight cashmere, monili-beaded silk, hand-finished tailoring — are the visible product of an invisible ethic.",
    signatures: [
      {
        name: "Cashmere Knitwear",
        body: "The cashmere is sourced from a tightly controlled cooperative of Mongolian herders and spun in Italy to a fineness most houses cannot replicate. A signature crewneck takes a single artisan up to a full working day to finish; the resulting hand feels closer to silk than wool. Look for the unstructured shoulder, the rolled hem, and the discreet Solomeo label woven on the inside.",
      },
      {
        name: "Monili Beading",
        body: "The 'monili' — a fine chain of brass and palladium-tone beads — is the maison's quietest signature. It appears at a neckline, along a cuff, threaded through a lapel, never as a logo. Each strand is hand-applied in Solomeo and reads as jewellery rather than ornament; in person it catches the light the way a single strand of pearls would.",
      },
      {
        name: "Tailoring — The Solomeo Suit",
        body: "Cucinelli's tailoring rebuilt the Italian suit around softness: the canvas is hand-stitched, the shoulder is natural, the trouser is cut high and tapered with an inch of break. Fabric is almost always a low-twist wool, cashmere-flannel, or summer linen in the maison's palette of greiges, biscuit, ivory, and storm. It is a suit designed to be worn, not commanded.",
      },
      {
        name: "The Neutral Palette",
        body: "Sand, oat, plaster, fog, ecru, deep tobacco — the Cucinelli palette is the most copied in luxury and the hardest to copy well. Every season the colour card is built around tones drawn from Umbrian stone, olive bark, and sun-bleached linen, then dyed in small lots so each garment carries a subtle, living variation.",
      },
    ],
    pillars: [
      {
        title: "Made in Solomeo",
        body: "Every collection is cut, knit, beaded and finished in the maison's restored medieval hamlet in Umbria — a vertically integrated atelier rather than an outsourced supply chain.",
      },
      {
        title: "Humanistic Capitalism",
        body: "Cucinelli's working philosophy: fair hours, fair pay, profit reinvested into culture, art, and the village. The garments are the by-product of how the people who make them are treated.",
      },
      {
        title: "Quiet Codes, No Logos",
        body: "There is no monogram, no plaque, no visible branding. Recognition is reserved for those who recognise the silhouette, the cashmere hand, and the monili at the cuff.",
      },
    ],
    faqs: [
      {
        q: "Where is Brunello Cucinelli made?",
        a: "Every piece is produced in and around the hamlet of Solomeo in Umbria, Italy — knit, beaded, cut, and finished inside the maison's own atelier. Cashmere yarn is spun in Italy from raw fibre sourced through a controlled cooperative of Mongolian herders.",
      },
      {
        q: "Why is Brunello Cucinelli so expensive?",
        a: "The pricing reflects three things almost no other house combines: ultra-fine Italian-spun cashmere, hand-finished construction (a signature crewneck can take a full working day), and an above-industry wage paid to every artisan in Solomeo. You are paying for the ethic as much as the garment.",
      },
      {
        q: "What is the monili?",
        a: "The 'monili' is Cucinelli's signature: a fine, hand-applied strand of brass and palladium-tone beads used as discreet jewellery at the neckline, cuff, or lapel of knitwear and tailoring. It is the maison's most quietly recognisable code.",
      },
      {
        q: "How should a Cucinelli sweater fit?",
        a: "Cucinelli cuts knitwear with a relaxed but never oversized shoulder and a slightly longer body, designed to layer over a soft shirt or under a tailored jacket. Most clients take their usual size; size down only if you prefer a closer fit through the body.",
      },
      {
        q: "Is Brunello Cucinelli at Palace of Roman authentic?",
        a: "Yes. Every piece is sourced through Brunello Cucinelli or its authorised European distribution partners, shipped with full traceability and tracked worldwide delivery from Italy.",
      },
    ],
    country: "Italy",
    founded: "1978",
  },
};

const BY_SLUG = new Map<string, Maison>(Object.entries(MAISONS));

export function maisonFor(slug: string): Maison | null {
  return BY_SLUG.get(slug) ?? null;
}

export function allMaisons(): Maison[] {
  return Array.from(BY_SLUG.values());
}
