// /maison/$slug — long-form editorial heritage page.
// Storytelling-first: founder origin, atelier philosophy, signature codes,
// craft pillars, FAQ. Ties into the shoppable /brand/$vendor catalog grid.
// Imagery is pulled live from the Shopify catalog (vendor:"...") so every
// visual is brand-accurate per memory (no generic editorial filler).

import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { fetchProductsPage } from "@/lib/shopify";
import { ProductCard } from "@/components/product-card";
import { routeHead, absoluteUrl, SITE_NAME } from "@/lib/seo";
import { maisonFor } from "@/lib/maisons";
import { cdnImage } from "@/lib/cdn-image";

export const Route = createFileRoute("/maison/$slug")({
  beforeLoad: ({ params }) => {
    if (!maisonFor(params.slug)) throw notFound();
  },
  head: ({ params }) => {
    const m = maisonFor(params.slug);
    if (!m) return { meta: [] };
    const path = `/maison/${m.slug}`;
    const title = `${m.brand} — Maison Heritage, Atelier & Signature Codes | ${SITE_NAME}`;
    const desc = m.metaDescription;
    const keywords = `${m.brand}, ${m.brand} heritage, what is ${m.brand} known for, ${m.brand} history, ${m.brand} signatures, buy ${m.brand}, authentic ${m.brand}`;
    const rh = routeHead({ path, title, description: desc });
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { name: "keywords", content: keywords },
        ...rh.meta,
      ],
      links: rh.links,
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            headline: `${m.brand} — Maison Heritage & Signature Codes`,
            description: desc,
            url: absoluteUrl(path),
            mainEntityOfPage: { "@type": "WebPage", "@id": absoluteUrl(path) },
            about: {
              "@type": "Brand",
              name: m.brand,
              description: m.origin,
              foundingDate: m.founded,
              foundingLocation: m.country,
            },
            publisher: {
              "@type": "Organization",
              name: SITE_NAME,
              url: absoluteUrl("/"),
            },
          }),
        },
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: m.faqs.map((f) => ({
              "@type": "Question",
              name: f.q,
              acceptedAnswer: { "@type": "Answer", text: f.a },
            })),
          }),
        },
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Boutique", item: absoluteUrl("/") },
              { "@type": "ListItem", position: 2, name: "Maisons", item: absoluteUrl("/maison") },
              { "@type": "ListItem", position: 3, name: m.brand, item: absoluteUrl(path) },
            ],
          }),
        },
      ],
    };
  },
  component: MaisonPage,
});

function MaisonPage() {
  const { slug } = Route.useParams();
  const m = maisonFor(slug)!;

  const q = useQuery({
    queryKey: ["maison-products", m.brand],
    queryFn: () =>
      fetchProductsPage({
        first: 8,
        query: `vendor:"${m.brand}"`,
        sortKey: "BEST_SELLING",
        reverse: false,
      }),
  });

  const edges = useMemo(() => q.data?.edges ?? [], [q.data]);
  const heroImage = edges[0]?.node.images?.edges?.[0]?.node;
  const secondaryImage = edges[1]?.node.images?.edges?.[0]?.node;

  return (
    <article data-testid={`maison-page-${slug}`}>
      {/* Editorial hero */}
      <section className="border-b border-ink/10 bg-canvas">
        <div className="max-w-screen-2xl mx-auto px-6 md:px-10 py-12 md:py-20">
          <Link
            to="/maison"
            className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground hover:text-ink"
          >
            ← All Maisons
          </Link>
          <div className="mt-10 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-end">
            <div className="lg:col-span-7">
              <p className="text-[11px] uppercase tracking-[0.3em] text-bronze mb-5">
                {m.meta}
              </p>
              <h1 className="text-5xl md:text-7xl font-serif text-balance mb-6">
                {m.brand}
              </h1>
              <p className="text-lg md:text-xl font-serif italic text-ink/80 max-w-[44ch]">
                {m.tagline}
              </p>
            </div>
            <div className="lg:col-span-5">
              <div className="relative aspect-[4/5] bg-secondary overflow-hidden">
                {heroImage ? (
                  <img
                    src={cdnImage(heroImage.url, { width: 900 })}
                    alt={heroImage.altText ?? `${m.brand} signature piece`}
                    loading="eager"
                    className="absolute inset-0 h-full w-full object-contain p-8"
                  />
                ) : (
                  <div className="absolute inset-0 por-shimmer" aria-hidden="true" />
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Origin + Philosophy */}
      <section className="px-6 md:px-10 py-20 md:py-28 border-b border-ink/5">
        <div className="max-w-4xl mx-auto">
          <p className="text-[10px] uppercase tracking-[0.3em] text-bronze mb-6">
            Origin
          </p>
          <h2 className="text-3xl md:text-4xl font-serif mb-8 text-balance">
            How the maison began.
          </h2>
          <p className="text-base md:text-lg leading-relaxed text-ink/85 mb-16">
            {m.origin}
          </p>

          <p className="text-[10px] uppercase tracking-[0.3em] text-bronze mb-6">
            Atelier
          </p>
          <h2 className="text-3xl md:text-4xl font-serif mb-8 text-balance">
            The philosophy of the workshop.
          </h2>
          <p className="text-base md:text-lg leading-relaxed text-ink/85">
            {m.philosophy}
          </p>
        </div>
      </section>

      {/* Signature codes */}
      <section className="px-6 md:px-10 py-20 md:py-28 border-b border-ink/5 bg-secondary/30">
        <div className="max-w-screen-2xl mx-auto">
          <div className="max-w-3xl mb-16">
            <p className="text-[10px] uppercase tracking-[0.3em] text-bronze mb-6">
              Signature Codes
            </p>
            <h2 className="text-3xl md:text-5xl font-serif text-balance">
              What you are actually buying.
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-14">
            {m.signatures.map((s, i) => (
              <div key={s.name} className="border-t border-ink/10 pt-8">
                <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground mb-3">
                  No. {String(i + 1).padStart(2, "0")}
                </p>
                <h3 className="text-2xl font-serif mb-4">{s.name}</h3>
                <p className="text-sm md:text-base leading-relaxed text-ink/80">
                  {s.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Craft pillars */}
      <section className="px-6 md:px-10 py-20 md:py-24 border-b border-ink/5">
        <div className="max-w-screen-2xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 lg:gap-16">
            {m.pillars.map((p) => (
              <div key={p.title}>
                <p className="text-[10px] uppercase tracking-[0.3em] text-bronze mb-4">
                  Pillar
                </p>
                <h3 className="text-xl md:text-2xl font-serif mb-4">{p.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {p.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Editorial accent image (second product photo for brand accuracy) */}
      {secondaryImage && (
        <section className="px-6 md:px-10 py-12 md:py-20 border-b border-ink/5 bg-canvas">
          <div className="max-w-5xl mx-auto">
            <div className="relative aspect-[16/9] bg-secondary overflow-hidden">
              <img
                src={cdnImage(secondaryImage.url, { width: 1600 })}
                alt={secondaryImage.altText ?? `${m.brand} editorial`}
                loading="lazy"
                className="absolute inset-0 h-full w-full object-contain p-10"
              />
            </div>
          </div>
        </section>
      )}

      {/* Shop the maison */}
      <section className="px-6 md:px-10 py-20 md:py-28 border-b border-ink/5">
        <div className="max-w-screen-2xl mx-auto">
          <div className="flex items-end justify-between mb-12 flex-wrap gap-6">
            <div>
              <p className="text-[10px] uppercase tracking-[0.3em] text-bronze mb-4">
                Shop the Maison
              </p>
              <h2 className="text-3xl md:text-5xl font-serif text-balance max-w-[20ch]">
                A short edit from the current floor.
              </h2>
            </div>
            <Link
              to="/brand/$vendor"
              params={{ vendor: m.slug }}
              className="text-[11px] uppercase tracking-[0.25em] underline underline-offset-4 hover:text-bronze"
            >
              View the full {m.brand} edit →
            </Link>
          </div>

          {q.isLoading ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-12">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="w-full aspect-[4/5] bg-muted mb-5" />
                  <div className="h-2 w-16 bg-muted mb-2" />
                  <div className="h-3 w-3/4 bg-muted" />
                </div>
              ))}
            </div>
          ) : edges.length === 0 ? (
            <p className="text-sm text-muted-foreground py-20 text-center">
              The {m.brand} edit is refreshing. Browse the full house catalog{" "}
              <Link
                to="/brand/$vendor"
                params={{ vendor: m.slug }}
                className="underline hover:text-bronze"
              >
                here
              </Link>
              .
            </p>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-5 md:gap-x-6 gap-y-14">
              {edges.map((e) => (
                <ProductCard key={e.node.id} product={e} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* FAQ */}
      <section className="px-6 md:px-10 py-20 md:py-28">
        <div className="max-w-3xl mx-auto">
          <p className="text-[10px] uppercase tracking-[0.3em] text-bronze mb-6">
            Frequently Asked
          </p>
          <h2 className="text-3xl md:text-4xl font-serif mb-12 text-balance">
            What clients ask about {m.brand}.
          </h2>
          <div className="divide-y divide-ink/10 border-t border-b border-ink/10">
            {m.faqs.map((f) => (
              <details key={f.q} className="group py-6">
                <summary className="cursor-pointer list-none flex items-start justify-between gap-6">
                  <span className="text-base md:text-lg font-serif text-ink">
                    {f.q}
                  </span>
                  <span className="text-bronze text-xl leading-none mt-1 transition-transform group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="mt-4 text-sm md:text-base leading-relaxed text-muted-foreground">
                  {f.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </article>
  );
}
