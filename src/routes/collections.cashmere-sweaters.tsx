import { createFileRoute, ErrorComponent } from "@tanstack/react-router";
import {
  LandingCollectionPage,
  faqJsonLd,
  breadcrumbJsonLd,
  type LandingFAQ,
} from "@/components/landing-collection-page";
import { landingCollectionQueryOptions } from "@/lib/landing-collection.functions";
import { routeHead, SITE_NAME, SITE_URL } from "@/lib/seo";

const SHOPIFY_QUERY = "cashmere";
const LANDING_QO = landingCollectionQueryOptions({ query: SHOPIFY_QUERY, first: 12 });


const PATH = "/collections/cashmere-sweaters";
const H1 = "Cashmere Sweaters";
const TITLE = `${H1} — Italian-Knitted Crew, V-Neck & Roll-Neck`;
const DESC =
  "Italian-knitted cashmere sweaters from Brunello Cucinelli, Zegna, Burberry and Versace. Crew, V-neck, roll-neck and cardigan — authentic, shipped from Europe.";

const FAQS: LandingFAQ[] = [
  {
    q: "What grade of cashmere is this?",
    a: "Every sweater on this page is knitted from grade-A Mongolian or Inner Mongolian cashmere — the longest, finest, whitest underfleece, combed (not sheared) from the goats in early spring. The maisons we carry use 2-ply yarn for everyday weights and 4-ply for the heaviest knits.",
  },
  {
    q: "How do I wash cashmere?",
    a: "Hand-wash, cold, with a few drops of a specialist wool wash (Soak, The Laundress, Eucalan). Never wring — press water out, lay flat on a towel, reshape, and air-dry away from sunlight. Some maisons (Brunello Cucinelli, Zegna) approve their pieces for gentle machine washes on a wool cycle in a mesh bag.",
  },
  {
    q: "Does cashmere pill?",
    a: "Yes — every cashmere pills slightly in the first few wears as the loose surface fibres rub off. This is normal and expected; a cashmere comb or a soft pumice removes the pills and the garment is permanently smoother afterwards. Heavy pilling after a few months usually means the yarn is short-staple — not the case with the maisons we carry.",
  },
  {
    q: "How should I store cashmere off-season?",
    a: "Washed, folded (never hung — the shoulders distort), in a breathable cotton bag with cedar blocks or lavender sachets to deter moths. Vacuum-sealed bags are convenient but compress the fibres; we don't recommend them for the long term.",
  },
  {
    q: "Do you ship internationally?",
    a: "Yes — worldwide, tracked and insured, with full duty paid in most destinations. Lead times appear on each product page and on the Shipping & Returns page.",
  },
];

export const Route = createFileRoute("/collections/cashmere-sweaters")({
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
  loader: ({ context }) => context.queryClient.ensureQueryData(LANDING_QO),
  errorComponent: ErrorComponent,
  notFoundComponent: () => <div className="p-12 text-center text-ink/70">Collection not found.</div>,
  component: Page,
});


function Page() {
  return (
    <LandingCollectionPage
      eyebrow={SITE_NAME}
      h1={H1}
      intro="Italian-knitted cashmere — crew, V-neck, roll-neck and cardigan — from the houses that built their reputations on the loom."
      body={
        <>
          <p>
            Cashmere is the warmest, lightest, most expensive everyday fibre in the wardrobe — and the easiest to do
            badly. The sweaters below come from houses that knit their own cashmere in Italy (or have done so for
            decades through dedicated partners in Umbria, Biella and Como): Brunello Cucinelli, Zegna, Burberry and
            Versace's house line.
          </p>
          <h2>The pieces worth understanding</h2>
          <p>
            <strong>Crew-neck</strong> — the foundation; pairs with a shirt under, or worn alone over jeans.
            <strong> V-neck</strong> — designed to frame a shirt collar and tie; the more formal cousin.
            <strong> Roll-neck (turtle-neck)</strong> — the autumn-winter statement piece; works under a blazer or
            unstructured jacket. <strong>Cardigan</strong> — the unstructured-tailoring move; cucinelli-style with
            shawl collar, or a slimmer V-neck button-front.
          </p>
          <h2>What makes a cashmere sweater worth the price</h2>
          <p>
            Fibre length first — the longer the underfleece, the less it pills and the longer it lasts. Knit density
            second — a tightly-knitted 12-gauge holds its shape decade after decade; a loose 7-gauge feels luxurious
            but sags. Finish third — properly linked seams (not overlocked), reinforced shoulders, and a clean ribbed
            cuff and hem that don't curl after washing.
          </p>
          <h2>Authenticity and provenance</h2>
          <p>
            Every sweater is sourced through our authorised European distribution network. Country of origin and the
            fibre content (typically "100% cashmere" or a wool/cashmere blend) appear on the interior label.
          </p>
        </>
      }
      shopifyQuery="cashmere"
      faqs={FAQS}
      relatedGuides={[
        { to: "/journal/craftsmanship/made-in-italy-vs-designed-in-italy", label: "Made in Italy vs Designed in Italy" },
        { to: "/editorial/mens-edit", label: "The Men's Edit" },
        { to: "/editorial/womens-edit", label: "The Women's Edit" },
      ]}
    />
  );
}
