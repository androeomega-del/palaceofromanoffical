import { createFileRoute } from "@tanstack/react-router";
import {
  CityLandingPage,
  cityFaqJsonLd,
  cityBreadcrumbJsonLd,
  cityStoreJsonLd,
  type CityFAQ,
} from "@/components/city-landing-page";

const PATH = "/designer-fashion-los-angeles";
const URL = `https://palaceofromanofficial.com${PATH}`;
const TITLE = "Designer Fashion Los Angeles | Authentic Luxury, Express";
const DESC =
  "Authenticated designer fashion shipped across Los Angeles — Versace, Prada, Gucci, Dolce & Gabbana, Bottega and the maisons that matter. Express, tracked, duty-paid.";

const FAQS: CityFAQ[] = [
  { q: "Are the pieces 100% authentic?", a: "Every order is new, sealed, and sourced through our global network of authorised boutiques and distributors. Brand packaging, serials, and country-of-origin marks all arrive intact." },
  { q: "How long does delivery to Los Angeles take?", a: "Most LA Metro orders arrive in 4–7 business days via express courier, fully tracked and insured. Complimentary on orders over $250 and duty-paid in the US." },
  { q: "Can I return something if it doesn't fit?", a: "Yes — return any unworn piece with tags attached within 14 days of delivery. Our courier collects from your address with no restocking fees." },
  { q: "Do you do personal sourcing?", a: "Yes. Message the concierge with a specific piece, size, or colour and we'll source through the boutique network. Replies within 24 hours, Monday to Saturday." },
  { q: "What brands do you carry?", a: "Around one hundred maisons — including Versace, Prada, Gucci, Dolce & Gabbana, Bottega Veneta, Brunello Cucinelli, Saint Laurent, Fendi, Tom Ford, Loro Piana, Roberto Cavalli, Moncler and more. Browse the full list under Designers A–Z." },
];

export const Route = createFileRoute("/designer-fashion-los-angeles")({
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
      { type: "application/ld+json", children: JSON.stringify(cityBreadcrumbJsonLd(PATH, "Designer Fashion in Los Angeles")) },
      { type: "application/ld+json", children: JSON.stringify(cityStoreJsonLd("Los Angeles", "the Los Angeles Metro Area", PATH)) },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <CityLandingPage
      city="Los Angeles"
      metroLabel="the Los Angeles Metro Area"
      neighborhoods="Beverly Hills and West Hollywood to Malibu and Pasadena"
      intro="A curated multi-brand boutique for Los Angeles clients who want authenticated luxury fashion delivered fast — express, tracked, duty-paid, and returnable within 14 days."
      faqs={FAQS}
    />
  );
}
