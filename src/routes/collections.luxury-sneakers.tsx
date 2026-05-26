import { createFileRoute } from "@tanstack/react-router";
import {
  LandingCollectionPage,
  faqJsonLd,
  breadcrumbJsonLd,
  type LandingFAQ,
} from "@/components/landing-collection-page";
import { routeHead, SITE_NAME, SITE_URL } from "@/lib/seo";

const PATH = "/collections/luxury-sneakers";
const H1 = "Luxury Sneakers";
const TITLE = `${H1} — Italian Calfskin & Designer Trainers`;
const DESC =
  "Luxury sneakers from Versace, Gucci, Bally, Givenchy, Burberry and Zegna. Italian calfskin low-tops, runners and high-tops — authentic, with dust bag and box, shipped from Europe.";

const FAQS: LandingFAQ[] = [
  {
    q: "What makes a sneaker a luxury sneaker?",
    a: "Three things: full-grain calf or nappa leather uppers (not coated canvas), Italian or Portuguese construction (Blake or Strobel stitched, not glued), and a properly cushioned leather-lined footbed. The pairs on this page meet all three.",
  },
  {
    q: "How does sizing run on Italian sneakers?",
    a: "Italian sneakers in calfskin tend to run true to your EU size — the leather softens to your foot within the first week. Sock-lined runners (Versace Trigreca, Givenchy TK-MX) run slightly snug; consider half a size up. We list both EU and US sizes on every product page.",
  },
  {
    q: "How do I keep white leather sneakers white?",
    a: "Wipe down with a soft damp microfibre cloth after each wear, store in the dust bag with shoe trees, never machine wash. For deeper marks, a dedicated leather cleaner like Saphir Renovateur — applied with a horsehair brush — keeps the calfskin supple and bright without yellowing.",
  },
  {
    q: "Do they ship with the original box?",
    a: "Yes — every pair ships in the maison's original box and dust bag, with the authenticity card and any spare laces supplied by the manufacturer.",
  },
  {
    q: "Do you ship internationally?",
    a: "Yes — worldwide, tracked and insured, with full duty paid in most destinations. Lead times appear on each product page and on the Shipping & Returns page.",
  },
];

export const Route = createFileRoute("/collections/luxury-sneakers")({
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
      intro="Italian calfskin low-tops, runners and high-tops — luxury sneakers from the maisons that elevated the trainer into formalwear."
      body={
        <>
          <p>
            The luxury sneaker is the most-worn piece in the modern wardrobe — which is exactly why the construction
            matters. The pairs below are drawn from houses with a real shoemaking tradition: Versace's Greca-soled
            Trigreca, Gucci's Ace and Rhyton archives, Bally's century-old Swiss-Italian last, Givenchy's Parisian
            TK-MX runner, Burberry's archive-checked Box and Zegna's Triple Stitch.
          </p>
          <h2>The silhouettes worth understanding</h2>
          <p>
            <strong>Low-top court</strong> — clean, leather, the wardrobe staple (Gucci Ace, Bally Roller).
            <strong> Runner</strong> — sport-derived, chunkier sole, technical uppers (Versace Trigreca, Givenchy
            TK-MX). <strong>High-top</strong> — ankle coverage, more architectural (Burberry Box High). The first
            sneaker most men buy should be a low-top in white or black calfskin; the runner is the second pair.
          </p>
          <h2>What separates a €600 sneaker from a €60 sneaker</h2>
          <p>
            Material: full-grain calf or nappa, not coated split leather. Construction: Blake or Strobel stitched
            soles that can be resoled, not glued uppers that delaminate in 18 months. Lining: lambskin or pigskin,
            not foam. Footbed: anatomical, leather-lined, replaceable. Sole: rubber, often with the maison's
            signature relief — Versace's Greca, Gucci's web stripe, Bally's red-and-white stripe.
          </p>
          <h2>Authenticity and provenance</h2>
          <p>
            Every pair is sourced through our authorised European distribution network. Country of origin appears on
            the inside of the tongue and on the maison's authenticity card.
          </p>
        </>
      }
      shopifyQuery="sneaker"
      faqs={FAQS}
      relatedGuides={[
        { to: "/journal/craftsmanship/caring-for-fine-leather", label: "Caring for fine leather" },
        { to: "/journal/craftsmanship/made-in-italy-vs-designed-in-italy", label: "Made in Italy vs Designed in Italy" },
        { to: "/editorial/mens-edit", label: "The Men's Edit" },
      ]}
    />
  );
}
