import { Link } from "@tanstack/react-router";
import { NewThisWeekRail } from "@/components/sections/new-this-week-rail";

export type CityFAQ = { q: string; a: string };

export type CityLandingProps = {
  city: string;            // "New York"
  metroLabel: string;      // "New York City Metro Area"
  neighborhoods: string;   // editorial line, e.g. "Manhattan to Tribeca"
  intro: string;           // 1–2 sentences
  faqs: CityFAQ[];
};

/**
 * Conversion-oriented city landing page for paid-social / geo-targeted PPC
 * traffic from our four priority metros (NYC, LA, Miami, SF). Built per the
 * audience playbook at mem://business/audience-icp:
 *
 *  • Hits all 5 audience objections (counterfeit, price, try-on, delivery,
 *    personalization) above the fold or in the FAQ.
 *  • No fabricated showrooms, ateliers, in-person services, or staff
 *    (founder-identity constraint).
 *  • Never names the sourcing partner — uses the public framing
 *    "global network of authorised boutiques and distributors".
 *  • Reuses the existing New-In rails so the page SSRs without a new
 *    data layer; nothing about cart/checkout/Shopify is touched.
 */
export function CityLandingPage({
  city,
  metroLabel,
  neighborhoods,
  intro,
  faqs,
}: CityLandingProps) {
  return (
    <main className="bg-canvas text-ink">
      {/* ─── Hero ─── */}
      <section className="border-b border-ink/10">
        <div className="max-w-screen-xl mx-auto px-6 py-20 md:py-28">
          <p className="text-[10px] uppercase tracking-[0.3em] text-ink/60 mb-6">
            Palace of Roman · {metroLabel}
          </p>
          <h1 className="font-serif text-4xl md:text-6xl leading-[1.05] mb-8 max-w-[18ch]">
            Authentic Designer Fashion, Delivered to {city}
          </h1>
          <p className="text-base md:text-lg text-ink/75 max-w-[58ch] leading-relaxed">
            {intro}
          </p>
          <div className="flex flex-wrap gap-3 mt-10">
            <Link
              to="/women"
              className="inline-flex items-center justify-center h-11 px-6 bg-ink text-canvas text-[11px] uppercase tracking-[0.25em] hover:opacity-90 transition-opacity"
            >
              Shop Women
            </Link>
            <Link
              to="/men"
              className="inline-flex items-center justify-center h-11 px-6 border border-ink/30 text-ink text-[11px] uppercase tracking-[0.25em] hover:bg-ink hover:text-canvas transition-colors"
            >
              Shop Men
            </Link>
            <Link
              to="/brands"
              className="inline-flex items-center justify-center h-11 px-6 border border-ink/30 text-ink text-[11px] uppercase tracking-[0.25em] hover:bg-ink hover:text-canvas transition-colors"
            >
              Designers A–Z
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Trust strip (objections 1 + 4 + 5) ─── */}
      <section className="border-b border-ink/10 bg-ink/[0.02]">
        <div className="max-w-screen-xl mx-auto px-6 py-12 grid grid-cols-1 md:grid-cols-3 gap-10">
          <div>
            <h3 className="text-[11px] uppercase tracking-[0.25em] mb-3">Authenticity Guaranteed</h3>
            <p className="text-sm text-ink/70 leading-relaxed">
              Every piece is new, sealed, and sourced through our global network of
              authorised boutiques and distributors. Country of origin and serial
              stamps appear on every product page.
            </p>
          </div>
          <div>
            <h3 className="text-[11px] uppercase tracking-[0.25em] mb-3">Express to {city}</h3>
            <p className="text-sm text-ink/70 leading-relaxed">
              Tracked, insured, duty-paid express delivery to {metroLabel}.
              Complimentary on orders over $250. Lead time on every PDP.
            </p>
          </div>
          <div>
            <h3 className="text-[11px] uppercase tracking-[0.25em] mb-3">Personal Concierge</h3>
            <p className="text-sm text-ink/70 leading-relaxed">
              Sourcing requests, sizing, and styling — direct via{" "}
              <Link to="/contact" className="underline underline-offset-4">our concierge line</Link>,
              replies within 24 hours, Monday to Saturday.
            </p>
          </div>
        </div>
      </section>

      {/* ─── Editorial body ─── */}
      <section className="border-b border-ink/10">
        <div className="max-w-screen-md mx-auto px-6 py-20 prose prose-neutral max-w-none">
          <h2 className="font-serif text-2xl md:text-3xl mb-6">A curated edit for {city}</h2>
          <p className="text-ink/80 leading-relaxed mb-6">
            {city} dresses with intention. From {neighborhoods}, our clients move
            between dinners, openings, and travel that demands a wardrobe built
            to outlast the season. Palace of Roman is the curated multi-brand
            boutique they reach for when they want a single piece — not a closet
            — delivered with the provenance and finish they expect.
          </p>
          <p className="text-ink/80 leading-relaxed mb-6">
            We work with a global network of authorised boutiques and distributors
            across Italy, France, the Netherlands, and Germany. Every Versace
            shirt, Prada bag, Gucci loafer, Dolce &amp; Gabbana dress, Bottega
            knit, and Cucinelli cashmere piece is current-season, new, and
            authenticated — never grey-market, never deadstock represented as
            new. Where a piece is archival, we say so.
          </p>
          <h2 className="font-serif text-2xl md:text-3xl mb-6 mt-12">Why {city} clients choose Palace of Roman</h2>
          <ul className="space-y-3 text-ink/80 leading-relaxed">
            <li><strong>Authenticated provenance.</strong> Every order ships with brand packaging, serials intact, and a country-of-origin record.</li>
            <li><strong>Express worldwide delivery.</strong> Most {city} orders arrive in 3–6 business days, tracked end-to-end and insured against loss.</li>
            <li><strong>14-day returns.</strong> Unworn, tags attached, picked up by our courier — no restocking fees.</li>
            <li><strong>One curatorial point of view.</strong> Around 100 maisons, edited tightly. We don't carry everything, only what we'd wear ourselves.</li>
            <li><strong>Concierge sourcing.</strong> Looking for a specific colourway, size, or archive piece? Message the concierge and we'll source it through the network.</li>
          </ul>
        </div>
      </section>

      {/* ─── New In rail (real Shopify data) ─── */}
      <section className="border-b border-ink/10 py-16">
        <div className="max-w-screen-2xl mx-auto px-6 mb-8">
          <p className="text-[10px] uppercase tracking-[0.3em] text-ink/60 mb-3">New In · Shipping to {city}</p>
          <h2 className="font-serif text-2xl md:text-3xl">This week's arrivals</h2>
        </div>
        <NewThisWeekRail dept="Women" />
        <div className="h-12" />
        <NewThisWeekRail dept="Men" />
      </section>

      {/* ─── FAQ (objections 1–5) ─── */}
      <section className="border-b border-ink/10">
        <div className="max-w-screen-md mx-auto px-6 py-20">
          <h2 className="font-serif text-2xl md:text-3xl mb-10">Questions from {city} clients</h2>
          <dl className="space-y-8">
            {faqs.map((f) => (
              <div key={f.q}>
                <dt className="text-base font-semibold mb-2">{f.q}</dt>
                <dd className="text-sm text-ink/75 leading-relaxed">{f.a}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ─── CTA strip ─── */}
      <section className="py-20">
        <div className="max-w-screen-md mx-auto px-6 text-center">
          <h2 className="font-serif text-2xl md:text-3xl mb-4">Start the edit</h2>
          <p className="text-ink/70 leading-relaxed mb-8 max-w-[48ch] mx-auto">
            Browse the women's and men's edits, or speak with the concierge
            for a piece sourced specifically for you.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link to="/women" className="inline-flex items-center justify-center h-11 px-6 bg-ink text-canvas text-[11px] uppercase tracking-[0.25em] hover:opacity-90 transition-opacity">Women</Link>
            <Link to="/men" className="inline-flex items-center justify-center h-11 px-6 border border-ink/30 text-[11px] uppercase tracking-[0.25em] hover:bg-ink hover:text-canvas transition-colors">Men</Link>
            <Link to="/contact" className="inline-flex items-center justify-center h-11 px-6 border border-ink/30 text-[11px] uppercase tracking-[0.25em] hover:bg-ink hover:text-canvas transition-colors">Concierge</Link>
          </div>
        </div>
      </section>
    </main>
  );
}

/** Shared FAQ + Breadcrumb JSON-LD builders so each route emits valid schema. */
export function cityFaqJsonLd(faqs: CityFAQ[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
}

export function cityBreadcrumbJsonLd(path: string, label: string) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Palace of Roman", item: "https://palaceofromanofficial.com/" },
      { "@type": "ListItem", position: 2, name: label, item: `https://palaceofromanofficial.com${path}` },
    ],
  };
}

export function cityStoreJsonLd(city: string, metro: string, path: string) {
  return {
    "@context": "https://schema.org",
    "@type": "OnlineStore",
    name: "Palace of Roman",
    url: `https://palaceofromanofficial.com${path}`,
    description: `Authenticated luxury designer fashion shipped to ${metro}.`,
    areaServed: { "@type": "City", name: city },
    paymentAccepted: "Visa, Mastercard, Amex, Apple Pay, Shop Pay, Klarna",
    currenciesAccepted: "USD",
  };
}
