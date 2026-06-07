/**
 * EditorialLinksRail — internal-linking surface for the homepage and PLPs.
 *
 * Purpose
 * -------
 * SEO: gives crawlers a dense, contextually-relevant set of internal links
 * from high-authority pages (home, collection PLPs) into the editorial,
 * edits, and journal pages. Strengthens topical clusters (e.g. the cashmere
 * PLP links the cashmere field guide + Cucinelli edit) and shortens the
 * click-path from any product surface to long-form content.
 *
 * Voice
 * -----
 * Curatorial, restrained. No "blog" framing — these are editorial features.
 *
 * Visuals are sourced from the editorial library via `imgForKey` so the
 * rail stays stable across renders without bundling new hero assets.
 */
import { imgForKey } from "@/lib/editorial-library";

export type EditorialLink = {
  /** Absolute path, e.g. "/editorial/resort-2026". Plain anchor — avoids
   *  the typed-Route surface so this works for editorial, edits, and
   *  journal subtrees uniformly. */
  href: string;
  kicker: string;
  title: string;
  dek: string;
  /** Optional explicit image. Falls back to a deterministic library pick. */
  image?: string;
};

/* ──────────────────────────────────────────────────────────────────────── */
/*  Canonical editorial entries                                             */
/* ──────────────────────────────────────────────────────────────────────── */

const E = {
  resort: {
    href: "/editorial/resort-2026",
    kicker: "The Resort Edit",
    title: "The Mediterranean, rendered in cloth",
    dek: "Sun-bleached linens and sea-soaked silks from the houses that know the difference between dressing for warmth and dressing for light.",
  },
  cucinelli: {
    href: "/edits/the-cucinelli-edit",
    kicker: "The Cucinelli Edit",
    title: "Quiet luxury, in cashmere",
    dek: "The Umbrian house that turned restraint into a discipline. Knitwear, tailoring and the colour of stone.",
  },
  bagVault: {
    href: "/edits/the-bag-vault",
    kicker: "The Bag Vault",
    title: "Investment leathers, archived",
    dek: "The pieces that hold their shape, their value, and a season's worth of meaning.",
  },
  prada: {
    href: "/edits/the-prada-effect",
    kicker: "The Prada Effect",
    title: "Intellect, in nylon and saffiano",
    dek: "Re-Nylon, triangle hardware, and the codes that turned a Milanese house into a generational shorthand.",
  },
  dolce: {
    href: "/edits/dolce-romana",
    kicker: "Dolce Romana",
    title: "Roman holiday, by way of Sicily",
    dek: "Black lace, gold filigree, and the unapologetic Italianità that only Dolce & Gabbana can cut.",
  },
  newEvening: {
    href: "/editorial/the-new-evening",
    kicker: "After Dark",
    title: "The new evening",
    dek: "Tailoring after sundown — when a single piece does the talking and the rest of the room listens.",
  },
  shoreline: {
    href: "/editorial/shoreline-perspective",
    kicker: "Shoreline Perspective",
    title: "Resort tailoring, sea-light",
    dek: "Linens and silks photographed against the salt and stone of the Italian coast.",
  },
  yacht: {
    href: "/edits/yacht-edit",
    kicker: "The Yacht Edit",
    title: "Deck-to-dinner, in three chapters",
    dek: "What to wear from the morning anchor to the captain's table — three chapters of summer dressing.",
  },
  charter: {
    href: "/edits/charter-capsule",
    kicker: "The Charter Capsule",
    title: "A week, packed in one carry-on",
    dek: "The capsule for the seven-day charter — and every short luxury trip after it.",
  },
  cashmere: {
    href: "/journal/style/the-cashmere-field-guide",
    kicker: "Field Guide",
    title: "The cashmere field guide",
    dek: "Grades, ply counts, and how to tell a piece you'll keep from one you'll regret. With Loro Piana and Cucinelli as the reference.",
  },
  sunglasses: {
    href: "/journal/style/the-investment-sunglasses-edit",
    kicker: "Field Guide",
    title: "Investment sunglasses",
    dek: "The frames that outlast trends — acetate, optical-grade lenses, and the houses that get them right.",
  },
  sneakers: {
    href: "/journal/style/luxury-sneakers-as-modern-tailoring",
    kicker: "Style Notes",
    title: "Luxury sneakers as modern tailoring",
    dek: "Why the right pair has quietly replaced the loafer as the most-worn shoe in a considered wardrobe.",
  },
  leatherCare: {
    href: "/journal/craftsmanship/caring-for-fine-leather",
    kicker: "Craftsmanship",
    title: "Caring for fine leather",
    dek: "How to keep calfskin, saffiano and exotic skins looking the way they did on day one.",
  },
  spotLeather: {
    href: "/journal/craftsmanship/spot-real-italian-leather",
    kicker: "Craftsmanship",
    title: "How to spot real Italian leather",
    dek: "Grain, edge-paint, stitch density — the small signals that separate a Florentine workshop from a factory line.",
  },
  madeIn: {
    href: "/journal/craftsmanship/made-in-italy-vs-designed-in-italy",
    kicker: "Craftsmanship",
    title: "Made in Italy vs. designed in Italy",
    dek: "Two phrases that sound alike, mean different things, and quietly explain a large slice of the luxury market.",
  },
  versace: {
    href: "/editorial/versace-now",
    kicker: "Versace Now",
    title: "Medusa, recoded",
    dek: "The Milanese house at its most assured — baroque, exact, and unmistakably itself.",
  },
  mens: {
    href: "/editorial/mens-edit",
    kicker: "The Men's Edit",
    title: "A wardrobe for the considered man",
    dek: "Tailoring, knitwear and the accessories that quietly do the work — assembled from the houses worth wearing.",
  },
  womens: {
    href: "/editorial/womens-edit",
    kicker: "The Women's Edit",
    title: "Pieces that hold their line",
    dek: "Cuts, fabrics and houses curated for a wardrobe built to last more than a season.",
  },
  may2026: {
    href: "/editorial/may-2026",
    kicker: "May 2026",
    title: "The month, in seven pieces",
    dek: "What's quietly defining the season — across menswear, womenswear and accessories.",
  },
  pucci: {
    href: "/trends/pucci-eyewear",
    kicker: "Trend",
    title: "Pucci Eyewear",
    dek: "The Italian house that turned print into eyewear architecture — colour, curve, and unmistakable attitude.",
  },
  tomFord: {
    href: "/trends/tom-ford-essentials",
    kicker: "Trend",
    title: "Tom Ford Essentials",
    dek: "The codes that made Tom Ford a reference point for modern luxury — cut, hardware, and quiet confidence.",
  },
  dgIcons: {
    href: "/trends/dolce-gabbana-icons",
    kicker: "Trend",
    title: "Dolce & Gabbana Icons",
    dek: "The prints, the lace, the gold — the pieces that define the house and return every season.",
  },
} as const;

type Key = keyof typeof E;
const entry = (k: Key): EditorialLink => E[k];

/* ──────────────────────────────────────────────────────────────────────── */
/*  Collection → editorial map                                              */
/* ──────────────────────────────────────────────────────────────────────── */

/** Pick 3 contextually-relevant editorial features for a given PLP. */
export function editorialLinksForCollection(handle: string): EditorialLink[] {
  const map: Record<string, Key[]> = {
    "womens-clothing": ["womens", "cucinelli", "dolce"],
    "mens-clothing": ["mens", "shoreline", "sneakers"],
    "new-arrivals": ["may2026", "resort", "newEvening"],
    clothing: ["resort", "cucinelli", "newEvening"],
    "cashmere-sweaters": ["cashmere", "cucinelli", "womens"],
    "designer-belts": ["spotLeather", "leatherCare", "madeIn"],
    "designer-crossbody-bags": ["bagVault", "leatherCare", "prada"],
    "designer-mens-shirts": ["mens", "shoreline", "resort"],
    "designer-sunglasses": ["sunglasses", "shoreline", "yacht"],
    "italian-leather-handbags": ["bagVault", "spotLeather", "leatherCare"],
    "italian-leather-loafers": ["spotLeather", "leatherCare", "madeIn"],
    "italian-leather-wallets": ["spotLeather", "leatherCare", "madeIn"],
    "luxury-sneakers": ["sneakers", "mens", "yacht"],
    "silk-scarves": ["resort", "shoreline", "womens"],
    bags: ["bagVault", "leatherCare", "prada"],
    shoes: ["sneakers", "spotLeather", "madeIn"],
    sunglasses: ["sunglasses", "shoreline", "yacht"],
    accessories: ["bagVault", "leatherCare", "spotLeather"],
  };
  const keys = map[handle] ?? ["resort", "cucinelli", "may2026"];
  return keys.map(entry);
}

/** Default rail for the homepage — broad coverage across clusters. */
export const HOMEPAGE_EDITORIAL_LINKS: EditorialLink[] = [
  entry("resort"),
  entry("cucinelli"),
  entry("bagVault"),
  entry("cashmere"),
];

/* ──────────────────────────────────────────────────────────────────────── */
/*  Rail                                                                    */
/* ──────────────────────────────────────────────────────────────────────── */

export function EditorialLinksRail({
  links,
  eyebrow = "From the Editorial",
  heading = "Read, then shop",
  className = "",
}: {
  links: EditorialLink[];
  eyebrow?: string;
  heading?: string;
  className?: string;
}) {
  if (!links.length) return null;
  return (
    <section
      aria-label={heading}
      className={`bg-canvas pt-16 md:pt-24 ${className}`}
    >
      <div className="max-w-screen-2xl mx-auto px-6 md:px-10">
        <div className="mb-7 md:mb-10">
          <p className="text-eyebrow uppercase text-bronze-deep mb-2">
            {eyebrow}
          </p>
          <h2 className="font-serif text-subhead-md md:text-subhead-lg text-ink">
            {heading}
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-7">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="group block focus:outline-none focus-visible:ring-2 focus-visible:ring-bronze"
            >
              <div className="relative aspect-[4/5] bg-muted overflow-hidden mb-4">
                <img
                  src={link.image ?? imgForKey(link.href)}
                  alt={link.title}
                  loading="lazy"
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-[1.04]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink/30 via-transparent to-transparent" />
              </div>
              <p className="text-eyebrow uppercase text-bronze-deep mb-2">
                {link.kicker}
              </p>
              <h3 className="font-serif text-[20px] md:text-[22px] leading-snug text-ink mb-2 group-hover:text-bronze-deep transition-colors">
                {link.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
                {link.dek}
              </p>
              <span className="mt-3 inline-block text-cta-sm uppercase text-ink border-b border-bronze/40 pb-0.5 group-hover:text-bronze group-hover:border-bronze transition-colors">
                Read →
              </span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
