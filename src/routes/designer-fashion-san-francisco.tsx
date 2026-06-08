import { createFileRoute } from "@tanstack/react-router";
import {
  CityLandingPage,
  cityFaqJsonLd,
  cityBreadcrumbJsonLd,
  cityStoreJsonLd,
  type CityFAQ,
} from "@/components/city-landing-page";

const PATH = "/designer-fashion-san-francisco";
const URL = `https://palaceofromanofficial.com${PATH}`;
const TITLE = "Designer Fashion San Francisco | Authentic Luxury, Express";
const DESC =
  "Authenticated designer fashion delivered across the San Francisco Bay Area — Prada, Bottega Veneta, Brunello Cucinelli, The Row and the maisons that matter. Express, tracked, duty-paid.";

const FAQS: CityFAQ[] = [
  { q: "Are pieces authenticated?", a: "Every order is new, sealed, and sourced through our global network of authorised boutiques and distributors. Brand packaging, serials, and country-of-origin marks arrive intact." },
  { q: "Delivery time to the Bay Area?", a: "Most SF Bay Area orders arrive in 4–7 business days via express courier, tracked and insured. Complimentary on orders over $250 and duty-paid in the US." },
  { q: "Returns?", a: "14-day returns on any unworn piece with tags. Courier collection from your address with no restocking fees." },
  { q: "What suits the Bay Area wardrobe?", a: "Bay Area clients lean heavily into Brunello Cucinelli cashmere, Loro Piana knits, The Row's quiet tailoring, and Bottega Veneta leather. See the Cucinelli Edit and the Cashmere Field Guide for starting points." },
  { q: "Concierge?", a: "Yes — message the concierge for sourcing a specific piece, sizing, or styling. Replies within 24 hours, Monday to Saturday." },
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
      { type: "application/ld+json", children: JSON.stringify(cityBreadcrumbJsonLd(PATH, "Designer Fashion in San Francisco")) },
      { type: "application/ld+json", children: JSON.stringify(cityStoreJsonLd("San Francisco", "the San Francisco Bay Area", PATH)) },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <CityLandingPage
      city="San Francisco"
      metroLabel="the San Francisco Bay Area"
      neighborhoods="Pacific Heights and the Marina to Palo Alto and Atherton"
      intro="A curated multi-brand boutique for San Francisco Bay Area clients who want authenticated luxury fashion delivered fast — express, tracked, duty-paid, and returnable within 14 days."
      faqs={FAQS}
    />
  );
}
