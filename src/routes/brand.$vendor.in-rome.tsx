// /brand/$vendor/in-rome — SEO landing pages targeting "[brand] rome" long-tail.
// Whitelisted to the 10 brands with live stock and meaningful Rome search intent.
// Pulls products from the live Shopify catalog (vendor:"...") — never hardcoded.

import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { fetchProductsPage } from "@/lib/shopify";
import { ProductCard } from "@/components/product-card";
import { routeHead, absoluteUrl, SITE_NAME } from "@/lib/seo";
import { romeBrandFor, ROME_BRANDS } from "@/lib/rome-brands";
import { heritageFor } from "@/lib/brand-heritage";
import { cdnImage } from "@/lib/cdn-image";

export const Route = createFileRoute("/brand/$vendor/in-rome")({
  beforeLoad: ({ params }) => {
    if (!romeBrandFor(params.vendor)) throw notFound();
  },
  head: ({ params }) => {
    const brand = romeBrandFor(params.vendor);
    if (!brand) return { meta: [] };
    const path = `/brand/${brand.slug}/in-rome`;
    const title = `${brand.name} in Rome — Authentic Pieces, Tracked Worldwide Shipping`;
    const desc = `Shop authentic ${brand.name} in Rome at ${SITE_NAME}. ${brand.tagline} 100% genuine, sourced through the brand's authorised European distribution, with tracked worldwide shipping from Italy.`;
    const keywords = `${brand.name} rome, ${brand.name.toLowerCase()} rome, buy ${brand.name} rome, ${brand.name} italy, ${brand.searchedFor.map((s) => s.toLowerCase()).join(", ")}`;
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
            "@type": "CollectionPage",
            name: `${brand.name} in Rome`,
            description: desc,
            url: absoluteUrl(path),
            isPartOf: { "@type": "WebSite", name: SITE_NAME, url: absoluteUrl("/") },
            about: {
              "@type": "Brand",
              name: brand.name,
            },
            contentLocation: {
              "@type": "City",
              name: "Rome",
              address: {
                "@type": "PostalAddress",
                addressLocality: "Rome",
                addressCountry: "IT",
              },
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
              { "@type": "ListItem", position: 2, name: "Brands", item: absoluteUrl("/brands") },
              { "@type": "ListItem", position: 3, name: brand.name, item: absoluteUrl(`/brand/${brand.slug}`) },
              { "@type": "ListItem", position: 4, name: "In Rome", item: absoluteUrl(path) },
            ],
          }),
        },
      ],
    };
  },
  component: BrandInRomePage,
});

function BrandInRomePage() {
  const { vendor } = Route.useParams();
  const brand = romeBrandFor(vendor)!;
  const heritage = heritageFor(brand.name);

  const q = useInfiniteQuery({
    queryKey: ["brand-in-rome", vendor],
    initialPageParam: null as string | null,
    queryFn: ({ pageParam }) =>
      fetchProductsPage({
        first: 24,
        after: pageParam,
        query: `vendor:"${brand.name}"`,
        sortKey: "BEST_SELLING",
        reverse: false,
      }),
    getNextPageParam: (last) => (last.pageInfo.hasNextPage ? last.pageInfo.endCursor : undefined),
  });

  const edges = useMemo(() => q.data?.pages.flatMap((p) => p.edges) ?? [], [q.data]);
  const heroImage = edges[0]?.node.images?.edges?.[0]?.node;

  const siblings = ROME_BRANDS.filter((b) => b.slug !== brand.slug).slice(0, 9);

  return (
    <div data-testid={`brand-in-rome-${vendor}`}>
      {/* Hero — H1 contains both brand and Rome for the long-tail target. */}
      <section className="border-b border-ink/10 bg-canvas">
        <div className="max-w-screen-2xl mx-auto px-6 md:px-10 py-10 md:py-16">
          <nav
            aria-label="Breadcrumb"
            className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground"
          >
            <Link to="/brands" className="hover:text-ink">All Houses</Link>
            <span className="mx-2 text-ink/30">/</span>
            <Link to="/brand/$vendor" params={{ vendor: brand.slug }} className="hover:text-ink">
              {brand.name}
            </Link>
            <span className="mx-2 text-ink/30">/</span>
            <span className="text-ink/70">In Rome</span>
          </nav>

          <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-end">
            <div className="lg:col-span-6">
              <p className="text-[11px] uppercase tracking-[0.3em] text-bronze mb-4">
                {heritage.meta} · Sourced through authorised European distribution
              </p>
              <h1 className="text-5xl md:text-7xl font-serif text-balance mb-5">
                {brand.name} in Rome
              </h1>
              <p className="text-base md:text-lg font-serif italic text-ink/80 max-w-[42ch] mb-6">
                {brand.tagline}
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-[58ch] mb-8">
                {brand.romeContext}
              </p>
              <Link
                to="/brand/$vendor"
                params={{ vendor: brand.slug }}
                className="inline-block text-[11px] uppercase tracking-[0.25em] border-b border-ink/30 hover:border-ink pb-1"
              >
                Browse the full {brand.name} archive →
              </Link>
            </div>

            <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-[1fr_0.8fr] gap-5 items-end">
              <div className="relative aspect-[3/4] bg-secondary overflow-hidden">
                {heroImage ? (
                  <img
                    src={cdnImage(heroImage.url, { width: 900 })}
                    alt={heroImage.altText ?? `${brand.name} in Rome — ${SITE_NAME}`}
                    loading="eager"
                    className="absolute inset-0 h-full w-full object-contain p-8"
                  />
                ) : (
                  <div className="absolute inset-0 por-shimmer" aria-hidden="true" />
                )}
              </div>
              <div className="border-t border-ink/10 pt-5 sm:border-t-0 sm:border-l sm:pl-6 sm:border-ink/10">
                <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground mb-4">
                  Most-searched in Rome
                </p>
                <ul className="space-y-2.5">
                  {brand.searchedFor.map((s) => (
                    <li
                      key={s}
                      className="text-sm border-b border-ink/5 pb-2.5 flex items-center gap-3"
                    >
                      <span className="text-bronze text-xs">◆</span>
                      {s}
                    </li>
                  ))}
                </ul>
                {edges.length > 0 && (
                  <p className="mt-8 text-xs uppercase tracking-[0.2em] text-muted-foreground">
                    {edges.length}
                    {q.hasNextPage ? "+" : ""} {edges.length === 1 ? "Piece" : "Pieces"} in stock
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Live catalog — vendor-filtered, never hardcoded. */}
      <section className="px-6 py-20">
        <div className="max-w-screen-2xl mx-auto">
          <div className="mb-12 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <p className="text-[10px] uppercase tracking-[0.3em] text-bronze mb-3">
                The Edit
              </p>
              <h2 className="text-2xl md:text-3xl font-serif">
                {brand.name} pieces shipping from Rome
              </h2>
              <p className="text-sm text-muted-foreground mt-2">
                {brand.pieceLead}. Tracked worldwide shipping with duties pre-cleared for the EU and US.
              </p>
            </div>
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
            <div className="py-32 text-center">
              <p className="text-sm text-muted-foreground">
                No {brand.name} pieces currently in stock. The buyers refresh weekly —
                check back, or browse the{" "}
                <Link
                  to="/brand/$vendor"
                  params={{ vendor: brand.slug }}
                  className="underline hover:text-bronze"
                >
                  full {brand.name} archive
                </Link>
                .
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 2xl:grid-cols-5 gap-x-5 md:gap-x-6 gap-y-14">
                {edges.map((e) => (
                  <ProductCard key={e.node.id} product={e} />
                ))}
              </div>
              {q.hasNextPage && (
                <div className="mt-20 text-center">
                  <button
                    onClick={() => q.fetchNextPage()}
                    disabled={q.isFetchingNextPage}
                    className="px-10 py-3.5 ring-1 ring-ink text-[11px] uppercase tracking-[0.25em] hover:bg-ink hover:text-canvas transition-colors disabled:opacity-50"
                  >
                    {q.isFetchingNextPage ? "Loading…" : "Load More"}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* Sibling Rome pages — internal linking for crawl + topical authority. */}
      <section className="border-t border-ink/10 bg-canvas">
        <div className="max-w-screen-2xl mx-auto px-6 md:px-10 py-16">
          <p className="text-[10px] uppercase tracking-[0.3em] text-bronze mb-4">
            Also searched in Rome
          </p>
          <h2 className="text-2xl md:text-3xl font-serif mb-8">
            Other Maisons available in Rome
          </h2>
          <ul className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-x-6 gap-y-4">
            {siblings.map((b) => (
              <li key={b.slug}>
                <Link
                  to="/brand/$vendor/in-rome"
                  params={{ vendor: b.slug }}
                  className="text-sm border-b border-ink/10 pb-2 block hover:text-bronze hover:border-bronze transition-colors"
                >
                  {b.name} in Rome →
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
