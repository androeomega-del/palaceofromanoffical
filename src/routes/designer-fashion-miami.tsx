import { createFileRoute } from "@tanstack/react-router";
import {
  CityLandingPage,
  cityFaqJsonLd,
  cityBreadcrumbJsonLd,
  cityStoreJsonLd,
  type CityFAQ,
} from "@/components/city-landing-page";

const PATH = "/designer-fashion-miami";
const URL = `https://palaceofromanofficial.com${PATH}`;
const TITLE = "Designer Fashion Miami | Authentic Luxury, Express Delivery";
const DESC =
  "Authenticated designer fashion delivered across Miami — Versace, Dolce & Gabbana, Gucci, Roberto Cavalli, Prada and the maisons that matter. Express, tracked, duty-paid.";

const FAQS: CityFAQ[] = [
  { q: "How do I know it's authentic?", a: "Every order is new, sealed, and sourced through our global network of authorised boutiques and distributors. Brand packaging, serials, and country-of-origin marks arrive intact." },
  { q: "Delivery time to Miami?", a: "Most Miami Metro orders arrive in 4–7 business days via express courier, fully tracked and insured. Complimentary on orders over $250 and duty-paid in the US." },
  { q: "Returns?", a: "14-day returns on any unworn piece with tags. Courier collection from your address, no restocking fees." },
  { q: "Do you carry resort and swim pieces?", a: "Yes — see the Resort 2026 editorial and the Men's Swim Campaign. We carry seasonal capsule pieces from Versace, Dolce & Gabbana, Roberto Cavalli and others that suit the Miami climate." },
  { q: "Concierge service?", a: "Yes — message the concierge for sourcing, sizing, or styling. Replies within 24 hours, Monday to Saturday." },
];

export const Route = createFileRoute("/designer-fashion-miami")({
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
      { type: "application/ld+json", children: JSON.stringify(cityBreadcrumbJsonLd(PATH, "Designer Fashion in Miami")) },
      { type: "application/ld+json", children: JSON.stringify(cityStoreJsonLd("Miami", "the Miami Metro Area", PATH)) },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <CityLandingPage
      city="Miami"
      metroLabel="the Miami Metro Area"
      neighborhoods="the Design District and South Beach to Coral Gables and Bal Harbour"
      intro="A curated multi-brand boutique for Miami clients who want authenticated luxury fashion delivered fast — express, tracked, duty-paid, and returnable within 14 days."
      faqs={FAQS}
    />
  );
}
