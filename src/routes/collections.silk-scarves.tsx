import { createFileRoute } from "@tanstack/react-router";
import {
  LandingCollectionPage,
  faqJsonLd,
  breadcrumbJsonLd,
  type LandingFAQ,
} from "@/components/landing-collection-page";
import { routeHead, SITE_NAME, SITE_URL } from "@/lib/seo";

const PATH = "/collections/silk-scarves";
const H1 = "Designer Silk Scarves";
const TITLE = `${H1} — Twill, Foulard & Stoles`;
const DESC =
  "Designer silk scarves and stoles from Versace, Givenchy, Burberry and Missoni. Twill squares, long foulards and printed wraps — authentic, shipped from Europe.";

const FAQS: LandingFAQ[] = [
  {
    q: "What weight of silk should I look for?",
    a: "Most designer silk squares are knitted in 14-momme twill — heavy enough to hold a knot, light enough to drape. Pocket squares and lighter wraps come in 8–10 momme chiffon. The momme number is a silk weight measurement; higher means denser, more substantial cloth.",
  },
  {
    q: "How should I tie a silk scarf?",
    a: "Three standard ways. (1) The neck knot: fold into a triangle, wrap once, knot to the side. (2) The bandeau: fold into a thin band, tie around the hair or the bag handle. (3) The shawl: open flat, drape over the shoulders, secured at the front. The same square can do all three.",
  },
  {
    q: "How do I wash a silk scarf?",
    a: "Hand-wash, cold, with a few drops of pH-neutral silk wash — never bleach, never wring. Roll in a towel to absorb water, lay flat to dry away from direct sunlight (which fades dyes), then iron on the silk setting from the back with a thin cotton cloth between iron and silk. Most maisons recommend professional dry cleaning for printed pieces.",
  },
  {
    q: "Are the prints original to the maison?",
    a: "Yes — every scarf here is the maison's own artwork, screen-printed in Como (Italian silk) or Lyon (French silk) using the original colour separations. Versace's Greca and barocco, Burberry's check, Missoni's space-dye zigzag — all sourced from the houses that designed them.",
  },
  {
    q: "Do you ship internationally?",
    a: "Yes — worldwide, tracked and insured, with full duty paid in most destinations. Lead times appear on each product page and on the Shipping & Returns page.",
  },
];

export const Route = createFileRoute("/collections/silk-scarves")({
  head: () => {
    const rh = routeHead({ path: PATH, title: TITLE, description: DESC, type: "website" });
    return {
      meta: [{ title: TITLE }, { name: "description", content: DESC }, ...rh.meta],
      links: rh.links,
      scripts: [
        { type: "application/ld+json", children: JSON.stringify(faqJsonLd(FAQS)) },
        { type: "application/ld+json", children: JSON.stringify(breadcrumbJsonLd(SITE_URL, PATH, H1)) },
      ],
    };
  },
  component: Page,
});

function Page() {
  return (
    <LandingCollectionPage
      eyebrow={SITE_NAME}
      h1={H1}
      intro="Twill squares, long foulards and printed stoles — designer silk scarves from the maisons whose archives read like art history."
      body={
        <>
          <p>
            A silk scarf is the most underestimated piece in a luxury wardrobe: small, weightless, and capable of
            re-anchoring an entire outfit. The pieces below come from houses with serious print archives — Versace's
            Greca and barocco, Burberry's house check, Givenchy's 4G monogram, Missoni's space-dye zigzag woven on
            warp-knitted looms in Sumirago.
          </p>
          <h2>The formats worth knowing</h2>
          <p>
            <strong>Square</strong> — 90 cm; the classic neck and bag-handle scarf. <strong>Mini square</strong> — 45
            cm; a pocket square or hair tie. <strong>Long foulard</strong> — 180 cm by 50 cm; the airport scarf, doubles
            as a light shawl. <strong>Stole</strong> — 200 cm by 70 cm in a heavier silk-cashmere or modal blend; the
            evening wrap.
          </p>
          <h2>What separates a designer silk from a mass-market silk</h2>
          <p>
            The weave first — proper twill has a diagonal rib that gives knot retention. The hem second — rolled and
            hand-stitched on the high-end pieces, machine-overlocked on the cheap ones. The print third — screen-printed
            with the original colour separations, registered exactly, with no bleed at the colour boundaries. The
            colours should be as saturated on the reverse as on the front.
          </p>
          <h2>Authenticity and provenance</h2>
          <p>
            Every scarf is sourced through our authorised European distribution network. Country of origin (typically
            Italy or France) appears on the maison's woven label at the corner of the square.
          </p>
        </>
      }
      shopifyQuery="scarf"
      faqs={FAQS}
      relatedGuides={[
        { to: "/editorial/accessories", label: "The Accessories Edit" },
        { to: "/journal/craftsmanship/made-in-italy-vs-designed-in-italy", label: "Made in Italy vs Designed in Italy" },
      ]}
    />
  );
}
