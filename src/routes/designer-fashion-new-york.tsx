import { createFileRoute } from "@tanstack/react-router";
import {
  CityLandingPage,
  cityFaqJsonLd,
  cityBreadcrumbJsonLd,
  cityStoreJsonLd,
  type CityFAQ,
} from "@/components/city-landing-page";

const PATH = "/designer-fashion-new-york";
const URL = `https://palaceofromanofficial.com${PATH}`;
const TITLE = "Designer Fashion New York | Authentic Luxury, Express Delivery";
const DESC =
  "Authenticated designer fashion delivered across New York — Versace, Prada, Gucci, Dolce & Gabbana and the maisons that matter. Express, tracked, duty-paid.";

const FAQS: CityFAQ[] = [
  { q: "How do I know the pieces are authentic?", a: "Every order is new, sealed, and sourced through our global network of authorised boutiques and distributors. Country of origin, serial stamps, and brand packaging arrive intact — and we'll share the source paperwork on request." },
  { q: "How fast does shipping reach New York?", a: "Most New York Metro orders arrive within 3–6 business days via express courier, fully tracked and insured. Delivery is complimentary on orders over $250 and duty-paid in the US." },
  { q: "What if it doesn't fit?", a: "Return any unworn piece with tags attached within 14 days of delivery. Our courier collects from your address — no restocking fees, no shipping deductions on EU-origin items." },
  { q: "Can I get help choosing or sourcing a specific piece?", a: "Yes — message our concierge with the piece, size, or colour you're after and we'll source it through the boutique network. Replies within 24 hours, Monday to Saturday." },
  { q: "Why is the price what it is?", a: "These are current-season luxury pieces from the maison's authorised distribution. We don't carry counterfeits, super-fakes, or grey-market goods — and our pricing reflects the same European retail bands you'd see at the maison's own boutique, minus the on-the-ground markup." },
];

export const Route = createFileRoute(PATH)({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:url", content: URL },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: URL }],
    scripts: [
      { type: "application/ld+json", children: JSON.stringify(cityFaqJsonLd(FAQS)) },
      { type: "application/ld+json", children: JSON.stringify(cityBreadcrumbJsonLd(PATH, "Designer Fashion in New York")) },
      { type: "application/ld+json", children: JSON.stringify(cityStoreJsonLd("New York", "the New York City Metro Area", PATH)) },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <CityLandingPage
      city="New York"
      metroLabel="the New York City Metro Area"
      neighborhoods="Manhattan and Tribeca to Brooklyn Heights and the Hamptons"
      intro="A curated multi-brand boutique for New York clients who want authenticated luxury fashion shipped fast — express, tracked, duty-paid, and returnable within 14 days."
      faqs={FAQS}
    />
  );
}
