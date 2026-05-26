import { createFileRoute } from "@tanstack/react-router";
import {
  LandingCollectionPage,
  faqJsonLd,
  breadcrumbJsonLd,
  type LandingFAQ,
} from "@/components/landing-collection-page";
import { routeHead, SITE_NAME, SITE_URL } from "@/lib/seo";

const PATH = "/collections/italian-leather-wallets";
const H1 = "Italian Leather Wallets";
const TITLE = `${H1} — Designer Bifold & Card Holders`;
const DESC =
  "Italian leather wallets from Ferragamo, Prada, Bottega Veneta, Loro Piana and Ralph Lauren. 100% authentic, shipped from Europe, no markdown noise.";

const FAQS: LandingFAQ[] = [
  {
    q: "Are these wallets genuine Italian leather?",
    a: "Yes. Every wallet on this page is sourced through our authorised distribution network in Europe, with the country of origin and material composition declared by the maison itself. Pieces labelled Made in Italy carry full Italian provenance — cutting, assembly, stitching, and finishing all on Italian soil.",
  },
  {
    q: "Do you sell men's and women's wallets here?",
    a: "Both. Use the filters in the edit below or visit the wider Accessories edit. Long bifolds, zip-around continental wallets, and small card holders are all represented across the maisons we work with.",
  },
  {
    q: "How long do these wallets typically last?",
    a: "A properly-conditioned full-grain Italian leather wallet will outlive a synthetic equivalent by a factor of ten or more. See our Caring for Fine Leather guide for the maintenance routine that keeps the grain alive for decades.",
  },
  {
    q: "Is everything shipped from Italy?",
    a: "From Europe — Italy, the Netherlands, or Germany depending on the maison's distribution centre. Tracked and insured worldwide. See the Shipping & Returns page for full details and lead times by region.",
  },
  {
    q: "How can I tell a real Italian leather wallet from a fake elsewhere?",
    a: "Six tests: grain irregularity, smell (woody, not chemical), the finish on the cut edges, stitch density and angle, weight, and how cleanly the leather creases on a fold. We walk through each in our Spot Real Italian Leather buyer's guide.",
  },
];

export const Route = createFileRoute("/collections/italian-leather-wallets")({
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
      intro="Full-grain Italian calfskin, bridle, and saffiano wallets from the houses that have spent decades perfecting the form. Long bifolds, continental zip-arounds, and slim card cases — every piece sourced through our authorised distribution network and shipped from Europe."
      body={
        <>
          <p>
            The Italian leather wallet is the smallest serious object most people own. It carries the day's currency, the
            cards that move money around the world, and — quietly — the impression a craftsman leaves behind. The
            difference between a properly-made one and a convincing imitation is rarely loud. It's in the density of the
            leather under the thumb, the four-coat painted edge that takes a Florentine atelier ten minutes per centimetre,
            and the small embossed maison mark stamped into a part of the wallet most owners will never look at.
          </p>
          <h2>The houses represented here</h2>
          <p>
            The edit below draws from the maisons our distribution partners work with most closely — Ferragamo,
            Bottega Veneta, Prada, Loro Piana, Ralph Lauren, and a rotation of seasonal pieces from smaller Florentine
            and Milanese ateliers. Materials lean toward vegetable-tanned vacchetta, glazed calf, and the saffiano cross-hatch
            that Prada turned into a signature in the late seventies.
          </p>
          <h2>How we curate</h2>
          <p>
            We don't sell wallets we wouldn't carry. Every piece on the page passes the six checks in our buyer's guide:
            irregular grain, woody smell, finished edge, dense even stitch, real weight, and a clean fold. If a piece
            doesn't meet that bar, it doesn't make the edit.
          </p>
          <h2>Authenticity and provenance</h2>
          <p>
            Every wallet ships with its original maison packaging where supplied by the manufacturer and is sourced
            exclusively through our authorised distribution network. Country of origin appears in each product's
            description, taken from the manufacturer's declaration to our partner. This is the only honest way to sell
            at this level.
          </p>
        </>
      }
      shopifyQuery="wallet AND tag:Wallets-Accessories OR tag:Wallets-Wallets-Accessories"
      faqs={FAQS}
      relatedGuides={[
        { to: "/journal/craftsmanship/spot-real-italian-leather", label: "Spot real Italian leather — 6 tests" },
        { to: "/journal/craftsmanship/caring-for-fine-leather", label: "Caring for fine leather" },
        { to: "/journal/craftsmanship/made-in-italy-vs-designed-in-italy", label: "Made in Italy vs Designed in Italy" },
      ]}
    />
  );
}
