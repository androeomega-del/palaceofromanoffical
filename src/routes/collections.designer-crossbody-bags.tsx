import { createFileRoute } from "@tanstack/react-router";
import {
  LandingCollectionPage,
  faqJsonLd,
  breadcrumbJsonLd,
  type LandingFAQ,
} from "@/components/landing-collection-page";
import { routeHead, SITE_NAME, SITE_URL } from "@/lib/seo";

const PATH = "/collections/designer-crossbody-bags";
const H1 = "Designer Crossbody Bags";
const TITLE = `${H1} — Italian Leather Mini, Camera & Saddle`;
const DESC =
  "Designer crossbody bags from Bottega Veneta, Versace, Prada, Bally, Chloé and Burberry. Mini, camera and saddle silhouettes in Italian leather — authentic, shipped from Europe.";

const FAQS: LandingFAQ[] = [
  {
    q: "How do crossbody bags fit — strap length and capacity?",
    a: "Most designer crossbody straps are adjustable between 110 cm and 140 cm — long enough to wear across the body on most heights, short enough to shorten into a shoulder bag. Capacity sits between a phone-and-cards minaudière (mini crossbody) and a small day bag that fits a passport, sunglasses case and a thin wallet (camera or saddle silhouettes).",
  },
  {
    q: "What's the difference between a crossbody and a shoulder bag?",
    a: "A crossbody has an adjustable strap designed to be worn diagonally across the body (strap on one shoulder, bag at the opposite hip); a shoulder bag has a shorter, often fixed strap meant to hang from one shoulder. Many luxury bags are convertible — a longer adjustable strap plus a shorter top handle or shoulder strap.",
  },
  {
    q: "Is the strap leather or webbing?",
    a: "Both are represented. Leather straps (Bottega, Prada Re-Edition, Bally) read more formal and age beautifully; canvas or webbing straps (Versace, Burberry Lola) are typically removable and let you switch silhouettes. The hardware attachment is the wear point on either — solid metal D-rings and clip closures are the marker of a serious bag.",
  },
  {
    q: "Can I dress one up for evening?",
    a: "Yes — the mini-crossbody is the easiest evening bag in the modern wardrobe. Look for smooth leather (not pebbled), polished hardware, and a strap short enough to sit at the hip rather than the thigh. Chain straps (Versace, Bally) read as the most formal option.",
  },
  {
    q: "Do you ship internationally?",
    a: "Yes — worldwide, tracked and insured, with full duty paid in most destinations. Lead times appear on each product page and on the Shipping & Returns page.",
  },
];

export const Route = createFileRoute("/collections/designer-crossbody-bags")({
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
      intro="Mini, camera and saddle silhouettes in Italian leather — designer crossbody bags from the maisons that perfected the form."
      body={
        <>
          <p>
            The crossbody is the most-used bag silhouette of the last decade — small enough to be unobtrusive, secure
            enough to wear travelling, formal enough to take into the evening. The bags below come from the houses
            with the strongest archives in the form: Bottega Veneta's intrecciato Cassette, Versace's Greca and
            Medusa-detailed mini-bags, Prada's Re-Edition nylon, Bally's Swiss-Italian saddle bags, Chloé's softer
            architectures, and Burberry's TB and Lola lineages.
          </p>
          <h2>The silhouettes worth understanding</h2>
          <p>
            <strong>Mini crossbody</strong> — fits a phone, cards, a key; the evening and weekend piece.
            <strong> Camera bag</strong> — boxy, slightly larger, fits a phone, sunglasses case, slim wallet; the
            day-to-night workhorse. <strong>Saddle bag</strong> — curved bottom, single-flap closure, originally
            equestrian; the editorial silhouette. <strong>Convertible</strong> — top handle plus long adjustable
            strap; the most versatile choice.
          </p>
          <h2>What separates a crossbody worth keeping</h2>
          <p>
            Leather grade first — full-grain calf or nappa that develops a soft patina, not coated split leather.
            Hardware second — solid metal D-rings, clip closures and chain links, plated to the maison's standard
            finish. Strap construction third — leather straps should be edge-painted in multiple coats; webbing straps
            should be jacquard-woven, not screen-printed. Interior lining and a single zipped pocket complete the
            piece.
          </p>
          <h2>Authenticity and provenance</h2>
          <p>
            Every bag is sourced through our authorised European distribution network. Country of origin and the
            maison's serial number appear inside the bag — checkable against the brand's own authentication tools.
          </p>
        </>
      }
      shopifyQuery="crossbody"
      faqs={FAQS}
      relatedGuides={[
        { to: "/collections/italian-leather-handbags", label: "Italian Leather Handbags" },
        { to: "/journal/craftsmanship/caring-for-fine-leather", label: "Caring for fine leather" },
        { to: "/editorial/womens-edit", label: "The Women's Edit" },
      ]}
    />
  );
}
