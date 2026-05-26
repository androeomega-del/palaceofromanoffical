import { createFileRoute } from "@tanstack/react-router";
import {
  LandingCollectionPage,
  faqJsonLd,
  breadcrumbJsonLd,
  type LandingFAQ,
} from "@/components/landing-collection-page";
import { routeHead, SITE_NAME, SITE_URL } from "@/lib/seo";

const PATH = "/collections/italian-leather-handbags";
const H1 = "Italian Leather Handbags";
const TITLE = `${H1} — Designer Shoulder, Tote & Crossbody`;
const DESC =
  "Italian leather handbags from Bottega Veneta, Prada, Chloé, Bally, Balenciaga and Valentino. Shoulder, tote, crossbody, and clutch — authentic, shipped from Europe.";

const FAQS: LandingFAQ[] = [
  {
    q: "Are these handbags 100% authentic?",
    a: "Yes. Every handbag on this page is sourced through our authorised distribution network in Europe — the same supply chain that services brick-and-mortar boutiques. Pieces ship with the maison's original packaging, including dust bag and authenticity card where supplied by the manufacturer.",
  },
  {
    q: "What shapes are represented?",
    a: "Tote, shoulder bag, crossbody, top-handle, clutch, and the occasional structured bowler. The grid below filters across these silhouettes — use the catalog filters above the product list to narrow further by maison or colour.",
  },
  {
    q: "Will the leather darken or change over time?",
    a: "Vegetable-tanned Italian leathers (you'll see this on Bottega's older Cabat bags or on Hermès-adjacent maisons) develop a deeper patina with light exposure and oils from the skin — many collectors consider this the most beautiful phase of the bag's life. Chrome-tanned smooth calfskin holds its original colour with minimal change.",
  },
  {
    q: "How should I store a handbag I'm not using?",
    a: "Lightly stuffed with acid-free tissue to hold the panels, in its cotton dust bag, standing upright in a wardrobe with airflow. Never in plastic. See our Caring for Fine Leather guide for the full routine.",
  },
  {
    q: "Do you ship internationally?",
    a: "Yes — worldwide, tracked and insured, with full duty paid in most destinations. Lead times and any region-specific restrictions are listed on each product page and on the Shipping & Returns page.",
  },
];

export const Route = createFileRoute("/collections/italian-leather-handbags")({
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
      intro="Tote, shoulder, crossbody and clutch — the Italian handbag in its grown-up forms. Calfskin, exotic, and woven intrecciato leathers from the houses that turned the form into an heirloom."
      body={
        <>
          <p>
            A serious leather handbag is the rare modern object designed to outlast the woman who first carried it. The
            bags below are drawn from the houses that have spent decades — in some cases centuries — perfecting that
            longevity: Bottega Veneta's intrecciato weave, Chloé's softer architectures, Bally's century-old Swiss-Italian
            craftsmanship, Valentino's editorial geometry, and the occasional exotic piece from Balenciaga's archive.
          </p>
          <h2>The categories worth understanding</h2>
          <p>
            <strong>Tote</strong> — large, open, structured; the office and weekend bag. <strong>Shoulder bag</strong> —
            medium, with a single longer strap; the daytime workhorse. <strong>Crossbody</strong> — smaller, with an
            adjustable strap worn across the body; the travel and evening solution. <strong>Top-handle</strong> — the
            formal version of the shoulder bag, often with detachable longer straps for versatility. <strong>Clutch</strong>{" "}
            — minimal, hand-held, the evening piece.
          </p>
          <h2>What makes a handbag worth the price</h2>
          <p>
            Three things, in order: the quality of the leather, the precision of the hardware, and the standard of the
            interior. The leather should pass the six tests in our buyer's guide. The hardware — clasps, feet, ring
            attachments — should be solid metal, plated, with a satisfying weight and a clean tooled finish. The interior
            should be lined in a smooth fabric (often suede leather or jacquard), the seams should be invisible, and any
            interior compartments should be reinforced with leather edging, not raw fabric.
          </p>
          <h2>Authenticity and provenance</h2>
          <p>
            Every bag here is sourced through our authorised distribution network in Europe. Country of origin appears
            on each product page, alongside the manufacturer's material declaration.
          </p>
        </>
      }
      shopifyQuery="handbag OR (tag:Handbags-Bags) OR (tag:Shoulder-Bags-Bags)"
      faqs={FAQS}
      relatedGuides={[
        { to: "/journal/craftsmanship/spot-real-italian-leather", label: "Spot real Italian leather — 6 tests" },
        { to: "/journal/craftsmanship/caring-for-fine-leather", label: "Caring for fine leather" },
        { to: "/journal/craftsmanship/made-in-italy-vs-designed-in-italy", label: "Made in Italy vs Designed in Italy" },
      ]}
    />
  );
}
