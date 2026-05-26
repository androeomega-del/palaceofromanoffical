import { createFileRoute } from "@tanstack/react-router";
import {
  LandingCollectionPage,
  faqJsonLd,
  breadcrumbJsonLd,
  type LandingFAQ,
} from "@/components/landing-collection-page";
import { routeHead, SITE_NAME, SITE_URL } from "@/lib/seo";

const PATH = "/collections/designer-mens-shirts";
const H1 = "Designer Men's Shirts";
const TITLE = `${H1} — Italian Cotton, Linen & Poplin`;
const DESC =
  "Designer men's shirts from Versace, Prada, Roberto Cavalli, Jil Sander and Thom Browne. Dress, casual, and short-sleeve cuts. Authentic, shipped from Europe.";

const FAQS: LandingFAQ[] = [
  {
    q: "What's the difference between a designer shirt and a department-store one?",
    a: "Three things: the cloth (a designer shirt uses two-ply Italian cotton, fine linen, or silk poplin rather than blended cotton), the construction (single-needle side seams, mother-of-pearl buttons, hand-set collars), and the cut (a closer body line through the waist, smaller armhole, more tailored sleeve). The fit difference alone is usually visible from across a room.",
  },
  {
    q: "Are these slim, regular, or oversize fits?",
    a: "All three are represented across the maisons we work with. Each product page lists the maison's own fit terminology (Slim, Regular, Oversize, Drop-shoulder). Italian houses tend to cut slimmer than American ones; size up if you usually find European sizing tight.",
  },
  {
    q: "What's the right shirt for a black-tie evening?",
    a: "A white cotton or marcella-fronted dress shirt with a turn-down or wing collar, French cuffs, and a hidden placket. Look for the Dress Shirt tag in the edit below, or filter by Roberto Cavalli and Tom Ford for formal cuts.",
  },
  {
    q: "How should I care for an Italian cotton shirt?",
    a: "Cold wash, gentle cycle, hang dry, and iron damp. Never tumble dry — the high heat sets creases and shortens the lifespan of the fabric by half. For high-cotton or linen shirts, take them to a steam press once a season rather than ironing them yourself; the difference in collar shape is worth it.",
  },
  {
    q: "Will my shirt ship from Italy?",
    a: "From Europe — Italy, the Netherlands, or Germany depending on the maison's distribution agreement. Tracked and insured worldwide, with full duty paid in most regions.",
  },
];

export const Route = createFileRoute("/collections/designer-mens-shirts")({
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
      intro="Dress, casual, and short-sleeve cuts from the houses defining contemporary menswear. Two-ply Italian cotton, fine linen, silk poplin — finished with mother-of-pearl buttons and single-needle side seams."
      body={
        <>
          <p>
            A shirt is the article of menswear that gets the most use and the least thought. That's the wrong ratio. A
            properly-cut Italian dress shirt — two-ply cotton, hand-set collar, French seams down the side — sets the
            line of the entire outfit. Get it wrong and the jacket above it never quite hangs correctly.
          </p>
          <h2>The maisons in this edit</h2>
          <p>
            The shirts below come from the houses we trust most for body cut and cloth quality: Versace and Versace Jeans
            for sharper, more contemporary lines; Jil Sander for the minimal architecture; Roberto Cavalli for the
            classical Italian dress shirt; Thom Browne for the proportionally short, schoolboy cut; and a rotation of
            Prada and Loro Piana pieces as the seasons turn.
          </p>
          <h2>What to look for in a shirt</h2>
          <p>
            Look at the collar first — a properly-constructed collar stands on its own when laid flat and rolls cleanly
            under a tie. Then look at the side seam: single-needle stitching (one straight line of thread, not the
            zigzag overlock you see on cheap shirts) is the marker of a maison-grade garment. Buttons should be cool to
            the touch — mother-of-pearl, not plastic — and sewn with cross-stitching, not the X-shaped quick-pattern
            machines use.
          </p>
          <h2>Authenticity and shipping</h2>
          <p>
            Every shirt on this page is sourced through our authorised distribution network and ships from a European
            warehouse, tracked and insured. Country of origin and fabric composition appear on each product page.
          </p>
        </>
      }
      shopifyQuery="shirt AND tag:Men"
      faqs={FAQS}
      relatedGuides={[
        { to: "/journal/craftsmanship/made-in-italy-vs-designed-in-italy", label: "Made in Italy vs Designed in Italy" },
        { to: "/journal/craftsmanship/caring-for-fine-leather", label: "Caring for fine leather" },
      ]}
    />
  );
}
