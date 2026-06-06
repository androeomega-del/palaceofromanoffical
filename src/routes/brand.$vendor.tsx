import { createFileRoute, Link, useNavigate, stripSearchParams } from "@tanstack/react-router";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { fetchProductsPage } from "@/lib/shopify";
import { ProductCard } from "@/components/product-card";
import { routeHead, absoluteUrl, SITE_NAME } from "@/lib/seo";
import { CatalogSort, SORT_OPTIONS, type SortValue } from "@/components/catalog-filters";
import { brandFromSlug, heritageFor } from "@/lib/brand-heritage";
import { spotlightFor } from "@/lib/brand-seo-categories";
import { buildBrandFaq } from "@/lib/brand-faq";
import { BrandCategorySpotlight } from "@/components/sections/brand-category-spotlight";
import { cdnImage } from "@/lib/cdn-image";

type SortKey = SortValue;
const SORT_KEYS: SortKey[] = SORT_OPTIONS.map((o) => o.value);
const DEFAULT_BRAND_SEARCH = { sort: "BEST_SELLING-false" as SortKey };

export const Route = createFileRoute("/brand/$vendor")({
  validateSearch: (search: Record<string, unknown>): { sort: SortKey } => {
    const raw = typeof search.sort === "string" ? (search.sort as SortKey) : "BEST_SELLING-false";
    return { sort: SORT_KEYS.includes(raw) ? raw : "BEST_SELLING-false" };
  },
  // SEO: strip default sort from the URL so bare /brand/<vendor> doesn't 307
  // redirect to /brand/<vendor>?sort=BEST_SELLING-false (wasted crawl budget).
  search: { middlewares: [stripSearchParams(DEFAULT_BRAND_SEARCH)] },
  // SSR loader — fetches a shallow slice of the brand's catalog so head() can
  // inject an ItemList schema with real product names, prices, availability,
  // and per-item URLs. Keyed on params only (not sort) so the schema baseline
  // stays stable for crawlers regardless of the visitor's chosen sort.
  loader: async ({ params }) => {
    const name = brandFromSlug(params.vendor) ?? unslug(params.vendor);
    try {
      const page = await fetchProductsPage({
        first: 20,
        query: `vendor:"${name}"`,
        sortKey: "BEST_SELLING",
        reverse: false,
      });
      const items = page.edges.map(({ node }) => {
        const money = node.priceRange?.minVariantPrice;
        const image = node.images?.edges?.[0]?.node?.url;
        const available = node.variants?.edges?.some((v) => v.node.availableForSale) ?? false;
        return {
          handle: node.handle,
          title: node.title,
          price: money?.amount ?? null,
          currency: money?.currencyCode ?? "USD",
          available,
          image: image ?? null,
        };
      });

      return { items };
    } catch {
      return { items: [] as Array<{ handle: string; title: string; price: string | null; currency: string; available: boolean; image: string | null }> };
    }
  },
  head: ({ params, loaderData }) => {

    // Prefer the canonical brand name from the curated 100; fall back to slug.
    const canonical = brandFromSlug(params.vendor);
    const name = canonical ?? unslug(params.vendor);
    const heritage = heritageFor(name);
    const path = `/brand/${params.vendor}`;
    const spotlight = spotlightFor(name);
    const title = spotlight
      ? `${spotlight.h2} — Authentic ${name} | ${SITE_NAME}`
      : `${name} — Authentic ${heritage.signatures[0] ?? "Luxury"} | ${SITE_NAME}`;
    const desc = spotlight
      ? `Shop authentic ${spotlight.h2.toLowerCase()} at ${SITE_NAME}. ${spotlight.intro} 100% genuine, sourced from the brand or its authorised distributors.`
      : `Shop authentic ${name} at ${SITE_NAME}. ${heritage.tagline} 100% genuine, sourced from the brand or its authorised distributors, with worldwide tracked shipping.`;
    const keywords = spotlight
      ? `${spotlight.keyword}, ${name}, ${heritage.signatures.join(", ")}, authentic ${name}, buy ${name} online`
      : `${name}, ${heritage.signatures.join(", ")}, authentic ${name}, buy ${name} online`;
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
            name: `${name} at ${SITE_NAME}`,
            description: desc,
            url: absoluteUrl(path),
            isPartOf: { "@type": "WebSite", name: SITE_NAME, url: absoluteUrl("/") },
            about: {
              "@type": "Brand",
              name,
              description: heritage.description,
              foundingDate: heritage.founded !== "—" ? heritage.founded : undefined,
              foundingLocation: heritage.country !== "—" ? heritage.country : undefined,
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
              { "@type": "ListItem", position: 3, name, item: absoluteUrl(path) },
            ],
          }),
        },
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: buildBrandFaq(name).map((qa) => ({
              "@type": "Question",
              name: qa.q,
              acceptedAnswer: { "@type": "Answer", text: qa.a },
            })),
          }),
        },
      ],
    };
  },
  component: BrandPage,
});

function unslug(s: string) {
  return s.split("-").map((w) => w[0]?.toUpperCase() + w.slice(1)).join(" ");
}

function BrandPage() {
  const { vendor } = Route.useParams();
  const { sort } = Route.useSearch();
  const navigate = useNavigate({ from: "/brand/$vendor" });
  const canonical = brandFromSlug(vendor);
  const name = canonical ?? unslug(vendor);
  const heritage = heritageFor(name);
  const spotlight = spotlightFor(name);

  const [sortKey, reverseStr] = sort.split("-");
  const reverse = reverseStr === "true";

  const q = useInfiniteQuery({
    queryKey: ["brand", vendor, sort],
    initialPageParam: null as string | null,
    queryFn: ({ pageParam }) =>
      fetchProductsPage({
        first: 48,
        after: pageParam,
        query: `vendor:"${name}"`,
        sortKey,
        reverse,
      }),
    getNextPageParam: (last) => (last.pageInfo.hasNextPage ? last.pageInfo.endCursor : undefined),
  });

  const edges = useMemo(() => q.data?.pages.flatMap((p) => p.edges) ?? [], [q.data]);
  const heroImage = edges[0]?.node.images?.edges?.[0]?.node;

  return (
    <div data-testid={`brand-page-${vendor}`}>
      {/* SEO-rich heritage hero — captures long-tail brand-name search intent */}
      <section className="border-b border-ink/10 bg-canvas">
        <div className="max-w-screen-2xl mx-auto px-6 md:px-10 py-10 md:py-16">
          <Link
            to="/brands"
            className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground hover:text-ink"
          >
            ← All Houses
          </Link>
          <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-end">
            <div className="lg:col-span-6">
              <p className="text-[11px] uppercase tracking-[0.3em] text-bronze mb-4">
                {heritage.meta}
              </p>
              <h1
                className="text-5xl md:text-7xl font-serif text-balance mb-5"
                data-testid="brand-hero-title"
              >
                {name}
              </h1>
              <p className="text-base md:text-lg font-serif italic text-ink/80 max-w-[42ch] mb-6">
                {heritage.tagline}
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-[58ch]">
                {heritage.description}
              </p>
            </div>
            <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-[1fr_0.8fr] gap-5 items-end">
              <div className="relative aspect-[3/4] bg-secondary overflow-hidden">
                {heroImage ? (
                  <img
                    src={cdnImage(heroImage.url, { width: 900 })}
                    alt={heroImage.altText ?? `${name} at Palace of Roman`}
                    loading="eager"
                    className="absolute inset-0 h-full w-full object-contain p-8"
                  />
                ) : (
                  <div className="absolute inset-0 por-shimmer" aria-hidden="true" />
                )}
              </div>
              <div className="border-t border-ink/10 pt-5 sm:border-t-0 sm:border-l sm:pl-6 sm:border-ink/10">
                <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground mb-4">
                  Signatures
                </p>
                <ul className="space-y-2.5">
                  {heritage.signatures.slice(0, 5).map((s) => (
                    <li key={s} className="text-sm border-b border-ink/5 pb-2.5 flex items-center gap-3">
                      <span className="text-bronze text-xs">◆</span>
                      {s}
                    </li>
                  ))}
                </ul>
                {edges.length > 0 && (
                  <p className="mt-8 text-xs uppercase tracking-[0.2em] text-muted-foreground">
                    {edges.length}{q.hasNextPage ? "+" : ""} {edges.length === 1 ? "Piece" : "Pieces"} in stock
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {spotlight && (
        <BrandCategorySpotlight vendorSlug={vendor} spotlight={spotlight} />
      )}



      <section className="px-6 py-6 border-b border-ink/5">
        <div className="max-w-screen-2xl mx-auto flex items-center justify-end">
          <CatalogSort
            value={sort}
            onChange={(v) => navigate({ search: () => ({ sort: v }), replace: true })}
          />
        </div>
      </section>

      <section className="px-6 py-20">
        <div className="max-w-screen-2xl mx-auto">
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
                No pieces currently available from {name}. The buyers refresh the {name} edit
                weekly — check back shortly or browse adjacent houses on the{" "}
                <Link to="/brands" className="underline hover:text-bronze">
                  brand index
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
    </div>
  );
}
