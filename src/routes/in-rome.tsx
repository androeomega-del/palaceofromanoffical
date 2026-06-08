// /in-rome — hub page for the "[brand] rome" landing pages.
// Lives at the top level so it can rank for generic "luxury shopping in rome" /
// "designer brands rome" queries and feed link equity into the 10 sub-pages.

import { createFileRoute, Link } from "@tanstack/react-router";
import { routeHead, absoluteUrl, SITE_NAME } from "@/lib/seo";
import { ROME_BRANDS } from "@/lib/rome-brands";

const PATH = "/in-rome";
const TITLE = "Luxury Designer Brands in Rome — Authentic, In Stock, Shipped";
const DESC = `Shop authentic Gucci, Prada, Dolce & Gabbana, Versace, Ferragamo and more in Rome at ${SITE_NAME}. 100% genuine, sourced through authorised European distribution, with tracked worldwide shipping from Italy.`;

export const Route = createFileRoute("/in-rome")({
  head: () => {
    const rh = routeHead({ path: PATH, title: TITLE, description: DESC });
    return {
      meta: [
        { title: TITLE },
        { name: "description", content: DESC },
        {
          name: "keywords",
          content:
            "luxury brands rome, designer shopping rome, gucci rome, prada rome, dolce gabbana rome, versace rome, ferragamo rome, tom ford rome, moncler rome, brunello cucinelli rome, jacquemus rome, zegna rome",
        },
        ...rh.meta,
      ],
      links: rh.links,
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: "Luxury Designer Brands in Rome",
            description: DESC,
            url: absoluteUrl(PATH),
            isPartOf: { "@type": "WebSite", name: SITE_NAME, url: absoluteUrl("/") },
            contentLocation: {
              "@type": "City",
              name: "Rome",
              address: {
                "@type": "PostalAddress",
                addressLocality: "Rome",
                addressCountry: "IT",
              },
            },
            mainEntity: {
              "@type": "ItemList",
              itemListElement: ROME_BRANDS.map((b, i) => ({
                "@type": "ListItem",
                position: i + 1,
                name: `${b.name} in Rome`,
                url: absoluteUrl(`/brand/${b.slug}/in-rome`),
              })),
            },
          }),
        },
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Boutique", item: absoluteUrl("/") },
              { "@type": "ListItem", position: 2, name: "In Rome", item: absoluteUrl(PATH) },
            ],
          }),
        },
      ],
    };
  },
  component: InRomeHub,
});

function InRomeHub() {
  return (
    <div data-testid="in-rome-hub">
      <section className="border-b border-ink/10 bg-canvas">
        <div className="max-w-screen-2xl mx-auto px-6 md:px-10 py-16 md:py-24">
          <p className="text-[11px] uppercase tracking-[0.3em] text-bronze mb-4">
            The Roman Edit
          </p>
          <h1 className="text-5xl md:text-7xl font-serif text-balance max-w-[18ch] mb-6">
            Luxury designer brands in Rome
          </h1>
          <p className="text-base md:text-lg font-serif italic text-ink/80 max-w-[60ch] mb-4">
            The houses Roman shoppers and visiting collectors search for most — sourced
            through the brands' authorised European distribution, shipped tracked
            worldwide.
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-[68ch]">
            Each page below is a live edit of the maison's pieces currently in stock at{" "}
            {SITE_NAME}, with the silhouettes most frequently searched alongside the
            house name in Rome. Every piece is covered by our{" "}
            <Link to="/authentication" className="underline decoration-bronze/60 underline-offset-4 hover:text-bronze">
              90-day independent-authentication policy
            </Link>; duties are pre-cleared for EU and US destinations.
          </p>
        </div>
      </section>

      <section className="px-6 md:px-10 py-16 md:py-20">
        <div className="max-w-screen-2xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-12">
            {ROME_BRANDS.map((b) => (
              <article key={b.slug} className="border-b border-ink/10 pb-10">
                <Link
                  to="/brand/$vendor/in-rome"
                  params={{ vendor: b.slug }}
                  className="group block"
                >
                  <h2 className="text-3xl md:text-4xl font-serif mb-3 group-hover:text-bronze transition-colors">
                    {b.name} in Rome
                  </h2>
                  <p className="text-base font-serif italic text-ink/80 mb-4">
                    {b.tagline}
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-5 max-w-[58ch]">
                    {b.romeContext}
                  </p>
                  <p className="text-[11px] uppercase tracking-[0.25em] text-ink border-b border-ink/30 inline-block pb-1 group-hover:border-bronze group-hover:text-bronze transition-colors">
                    See {b.name} in stock →
                  </p>
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
