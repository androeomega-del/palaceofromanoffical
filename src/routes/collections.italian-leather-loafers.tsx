import { createFileRoute } from "@tanstack/react-router";
import {
  LandingCollectionPage,
  faqJsonLd,
  breadcrumbJsonLd,
  type LandingFAQ,
} from "@/components/landing-collection-page";
import { routeHead, SITE_NAME, SITE_URL } from "@/lib/seo";

const PATH = "/collections/italian-leather-loafers";
const H1 = "Italian Leather Loafers";
const TITLE = `${H1} — Designer Slip-Ons & Moccasins`;
const DESC =
  "Italian leather loafers from Prada, Tod's, Bally, Dior and Versace. Bit, penny, tassel, and Belgian shapes. 100% authentic, shipped from Europe.";

const FAQS: LandingFAQ[] = [
  {
    q: "What counts as an Italian leather loafer?",
    a: "A slip-on shoe with leather upper, leather or rubber sole, and no laces. The Italian tradition spans the bit loafer (a Gucci invention from 1953), the penny loafer, the tassel, and the more elongated Venetian moccasin. Every pair on this page uses full-grain calfskin or suede, finished in Italy or by an authorised European production partner.",
  },
  {
    q: "Are these for men or women?",
    a: "Both. Each product card shows the gender the maison originally cut the pair for. Sizing conventions vary by house — refer to the size guide on each PDP or use the conversion table in our Shipping & Returns page.",
  },
  {
    q: "Do leather-soled loafers wear out quickly?",
    a: "No, if you rest them. A leather sole that gets 24 hours between wears, kept on cedar trees, will run for two to three years before the first resole. After that a good cobbler can return the same pair to you another twice. See our Caring for Fine Leather guide for the full routine.",
  },
  {
    q: "Will my pair ship from Italy?",
    a: "From Europe — usually Italy, sometimes the Netherlands depending on the maison's distribution agreement. Tracked and insured worldwide.",
  },
  {
    q: "How should an Italian loafer fit?",
    a: "Tight in the heel, snug across the instep, with a little room in the toe box. Italian lasts run slightly narrower than American ones; if you are between sizes and have a wider foot, take the larger one and let the leather break in.",
  },
];

export const Route = createFileRoute("/collections/italian-leather-loafers")({
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
      intro="Bit, penny, tassel, Belgian, and the slim Venetian moccasin — the loafer in its Italian forms. Calfskin and suede uppers, leather and lugged rubber soles, from the houses that taught the shape how to behave."
      body={
        <>
          <p>
            The loafer is the shoe that decides whether the rest of an outfit reads as considered or as accidental. The
            Italians took the form from Norwegian fishermen in the 1930s, refined it through fifty years of Milanese
            tailoring, and turned it into the single most versatile piece of menswear of the second half of the twentieth
            century. The pairs in this edit sit in that lineage.
          </p>
          <h2>The shapes worth knowing</h2>
          <p>
            <strong>Bit loafer</strong> — the gold horsebit Gucci introduced in 1953; still the most recognisable slip-on
            silhouette in fashion. <strong>Penny loafer</strong> — the slot across the saddle, originally for a one-cent
            coin. <strong>Tassel</strong> — heavier, more formal, with a small tassel where the lacing would otherwise
            sit. <strong>Belgian loafer</strong> — soft, slipper-thin, the dress shoe disguised as house wear.
          </p>
          <h2>Why Italian last shapes matter</h2>
          <p>
            An Italian last is cut to a narrower waist and a slightly more pronounced arch than an American or British
            one. The result is a shoe that hugs the instep, doesn't slip at the heel, and reads as elegant in profile.
            Brands cut on Italian lasts include Prada, Tod's, Bally, Ferragamo, and most of the Florentine ateliers.
            English shoes — and many American — are cut wider; both traditions are correct, but they aren't interchangeable.
          </p>
          <h2>How we curate</h2>
          <p>
            Every pair on this page is sourced through our authorised distribution network in Europe. Country of origin
            is declared on each product page. We don't list pairs without verified provenance.
          </p>
        </>
      }
      shopifyQuery="loafer OR moccassin"
      faqs={FAQS}
      relatedGuides={[
        { to: "/journal/craftsmanship/caring-for-fine-leather", label: "Caring for fine leather" },
        { to: "/journal/craftsmanship/spot-real-italian-leather", label: "Spot real Italian leather — 6 tests" },
      ]}
    />
  );
}
