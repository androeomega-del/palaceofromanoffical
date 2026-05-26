import { createFileRoute } from "@tanstack/react-router";
import {
  LandingCollectionPage,
  faqJsonLd,
  breadcrumbJsonLd,
  type LandingFAQ,
} from "@/components/landing-collection-page";
import { routeHead, SITE_NAME, SITE_URL } from "@/lib/seo";

const PATH = "/collections/designer-sunglasses";
const H1 = "Designer Sunglasses";
const TITLE = `${H1} — Aviator, Cat-Eye & Wayfarer`;
const DESC =
  "Designer sunglasses from Versace, Gucci, Prada, Burberry, Givenchy and Zegna. Aviator, cat-eye, wayfarer and shield — authentic, with case and cleaning cloth, shipped from Europe.";

const FAQS: LandingFAQ[] = [
  {
    q: "Are the lenses UV-protective?",
    a: "Yes. Every pair on this page carries the maison's standard UV400 treatment — full protection against UVA and UVB up to 400 nanometres, which is the threshold optometrists recommend for everyday wear. The exact lens technology (polarisation, gradient, mirror coating) is listed on each product page.",
  },
  {
    q: "What frame shape suits my face?",
    a: "The shorthand: round and oval faces take square or rectangular frames (Versace Greca, Prada PR-series); square and angular faces take round, oval or cat-eye frames (Gucci GG-series, Givenchy GV-series); heart-shaped faces take aviators or low-set frames. Frame width should match — or be slightly wider than — the broadest part of your face.",
  },
  {
    q: "Do these come with the original case?",
    a: "Yes — every pair ships in the maison's branded hard case with a microfibre cleaning cloth, plus the authenticity card and warranty booklet where supplied by the manufacturer.",
  },
  {
    q: "Can I have prescription lenses fitted?",
    a: "Yes, by your local optician once the frames arrive. Most luxury sunglass frames accept standard prescription lens replacement; your optician will quote the lens cost separately. Keep the original lenses — they're part of the resale value.",
  },
  {
    q: "Do you ship internationally?",
    a: "Yes — worldwide, tracked and insured, with full duty paid in most destinations. Lead times appear on each product page and on the Shipping & Returns page.",
  },
];

export const Route = createFileRoute("/collections/designer-sunglasses")({
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
      intro="Aviator, cat-eye, wayfarer and shield — designer sunglasses from the houses that turned eyewear into a signature."
      body={
        <>
          <p>
            Designer sunglasses are the most quietly powerful accessory in the luxury wardrobe: small, expensive,
            instantly read. The pairs below are drawn from the houses with the strongest archives in eyewear —
            Versace's Greca temples, Gucci's GG horsebit detailing, Prada's architectural acetates, Burberry's
            check-lined arms, Givenchy's 4G hardware, and Zegna's understated tailoring frames.
          </p>
          <h2>Frame shapes, briefly</h2>
          <p>
            <strong>Aviator</strong> — teardrop, metal, classic; flatters most faces. <strong>Wayfarer</strong> —
            trapezoidal acetate, the everyday workhorse. <strong>Cat-eye</strong> — upswept outer corners; the most
            editorial shape on the page. <strong>Round</strong> — small, intellectual; works best on angular faces.
            <strong> Square</strong> — bold, oversized; for softer face shapes. <strong>Shield</strong> — single
            wraparound lens; the runway and sport silhouette.
          </p>
          <h2>Lens technology worth understanding</h2>
          <p>
            <strong>Polarised</strong> lenses cut horizontal glare from water, snow and roads — essential for driving
            and the coast. <strong>Gradient</strong> lenses are darker at the top, clearer at the bottom; designed for
            city wear where you need to read a menu without lifting the frames. <strong>Mirror</strong> coatings reflect
            additional light and are typical of high-altitude and beach wear. UV400 protection is standard across every
            pair here.
          </p>
          <h2>Authenticity and provenance</h2>
          <p>
            Every pair is sourced through our authorised European distribution network. Country of origin and the
            maison's serial number appear on the inside of the temple arm — checkable against the brand's own
            authentication tools.
          </p>
        </>
      }
      shopifyQuery="sunglasses"
      faqs={FAQS}
      relatedGuides={[
        { to: "/editorial/accessories", label: "The Accessories Edit" },
        { to: "/journal/craftsmanship/made-in-italy-vs-designed-in-italy", label: "Made in Italy vs Designed in Italy" },
      ]}
    />
  );
}
