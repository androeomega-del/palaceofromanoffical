import { createFileRoute, ErrorComponent } from "@tanstack/react-router";
import {
  LandingCollectionPage,
  faqJsonLd,
  breadcrumbJsonLd,
  type LandingFAQ,
} from "@/components/landing-collection-page";
import { landingCollectionQueryOptions } from "@/lib/landing-collection.functions";
import { routeHead, SITE_NAME, SITE_URL } from "@/lib/seo";

const SHOPIFY_QUERY = "belt";
const LANDING_QO = landingCollectionQueryOptions({ query: SHOPIFY_QUERY, first: 12 });


const PATH = "/collections/designer-belts";
const H1 = "Designer Belts";
const TITLE = `${H1} — Italian Leather, Logo & Reversible`;
const DESC =
  "Designer belts from Versace, Gucci, Burberry, Bally and Givenchy. Italian calfskin, reversible and logo-buckle belts for men and women — authentic, shipped from Europe.";

const FAQS: LandingFAQ[] = [
  {
    q: "How do I choose belt size?",
    a: "Order one size up from your trouser waist — so a 32-inch trouser takes an 85 cm belt (size 85), a 34-inch takes 90 cm. The middle hole should sit on your natural waist when buckled comfortably. Italian belts are measured at the middle hole, not the tip.",
  },
  {
    q: "What's the difference between a dress belt and a casual belt?",
    a: "A dress belt is narrower (typically 30–32 mm), in smooth calfskin, with a slim, polished buckle; pairs with tailoring. A casual belt is wider (35–40 mm), often in grained or saffiano leather, with a heavier or branded buckle (Versace Medusa, Gucci GG, Givenchy 4G); pairs with denim and chinos. Most wardrobes need one of each, in matching leather colour.",
  },
  {
    q: "Is the buckle real metal?",
    a: "Yes. Every belt here ships with a solid metal buckle — brass, palladium or gold-plated — to the maison's standard finish. The buckle is the most-touched part of the belt and the first place to show wear on a counterfeit; weight in the hand and a clean tooled relief are the giveaways.",
  },
  {
    q: "Reversible belts — are they two belts in one?",
    a: "Effectively, yes. A reversible belt has two different leathers laminated back-to-back (typically black on one side, brown on the other) with a rotating buckle. Practical for travel and for the man who wants one belt to cover both his black and brown shoe wardrobe.",
  },
  {
    q: "Do you ship internationally?",
    a: "Yes — worldwide, tracked and insured, with full duty paid in most destinations. Lead times appear on each product page and on the Shipping & Returns page.",
  },
];

export const Route = createFileRoute("/collections/designer-belts")({
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
  loader: ({ context }) => (context.queryClient.prefetchQuery(LANDING_QO), undefined),
  errorComponent: ErrorComponent,
  notFoundComponent: () => <div className="p-12 text-center text-ink/70">Collection not found.</div>,
  component: Page,
});

function Page() {
  return (
    <LandingCollectionPage
      eyebrow={SITE_NAME}
      h1={H1}
      intro="Italian calfskin, reversible and logo-buckle belts — designer belts from the maisons that turned the buckle into a signature."
      body={
        <>
          <p>
            The belt is the smallest and most-photographed accessory in the wardrobe: a single visible inch of leather
            and a buckle that the eye reads instantly. The belts below come from houses with the strongest archives
            in leather and hardware — Versace's Medusa, Gucci's GG and horsebit, Burberry's TB monogram, Bally's
            century-old Swiss buckle craft, Givenchy's 4G.
          </p>
          <h2>The categories worth understanding</h2>
          <p>
            <strong>Dress belt</strong> — 30–32 mm wide, smooth calfskin, slim buckle; paired with tailoring.
            <strong> Casual belt</strong> — 35–40 mm wide, grained or saffiano, statement buckle; paired with denim
            and chinos. <strong>Reversible belt</strong> — black and brown back-to-back with a rotating buckle; the
            travel solution. <strong>Logo-buckle belt</strong> — the signature piece, designed to be seen.
          </p>
          <h2>What makes a belt last a decade</h2>
          <p>
            Full-grain calfskin (not split or coated leather), edge-painted by hand in 3–5 coats, finished with
            beeswax. Solid metal buckle, plated, with a tooled relief — not stamped sheet metal. Reinforced stitching
            around the buckle attachment, the part that takes all the daily strain. A well-made belt outlasts most
            wardrobes; we recommend rotating between two belts to let the leather rest.
          </p>
          <h2>Authenticity and provenance</h2>
          <p>
            Every belt is sourced through our authorised European distribution network. Country of origin appears on
            the back of the leather strap, alongside the maison's serial stamp.
          </p>
        </>
      }
      shopifyQuery={SHOPIFY_QUERY}
      queryOptions={LANDING_QO}
      faqs={FAQS}
      relatedGuides={[
        { to: "/journal/craftsmanship/caring-for-fine-leather", label: "Caring for fine leather" },
        { to: "/editorial/accessories", label: "The Accessories Edit" },
      ]}
    />
  );
}
