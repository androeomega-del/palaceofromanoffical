import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { fetchProductsPage } from "@/lib/shopify";
import { ProductCard } from "@/components/product-card";
import { routeHead, absoluteUrl, SITE_NAME } from "@/lib/seo";
import { CatalogSort, SORT_OPTIONS, type SortValue } from "@/components/catalog-filters";

type SortKey = SortValue;
const SORT_KEYS: SortKey[] = SORT_OPTIONS.map((o) => o.value);

export const Route = createFileRoute("/brand/$vendor")({
  validateSearch: (search: Record<string, unknown>): { sort: SortKey } => {
    const raw = typeof search.sort === "string" ? (search.sort as SortKey) : "BEST_SELLING-false";
    return { sort: SORT_KEYS.includes(raw) ? raw : "BEST_SELLING-false" };
  },
  head: ({ params }) => {
    const name = unslug(params.vendor);
    const path = `/brand/${params.vendor}`;
    const title = `${name} — Palace of Roman`;
    const desc = `Shop the curated ${name} edit at Palace of Roman. 100% authentic luxury pieces, sourced from the brands or their authorised distributors, with worldwide tracked shipping.`;
    const rh = routeHead({ path, title, description: desc });
    return {
      meta: [{ title }, { name: "description", content: desc }, ...rh.meta],
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
            about: { "@type": "Brand", name },
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
  const name = unslug(vendor);

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

  return (
    <div>
      <section className="px-6 pt-16 pb-12 border-b border-ink/5">
        <div className="max-w-screen-2xl mx-auto">
          <Link to="/brands" className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground hover:text-ink">
            ← All Brands
          </Link>
          <div className="mt-6 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <h1 className="text-5xl md:text-7xl font-serif">{name}</h1>
            {edges.length > 0 && (
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                {edges.length}{q.hasNextPage ? "+" : ""} {edges.length === 1 ? "Piece" : "Pieces"}
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="px-6 py-6 border-b border-ink/5">
        <div className="max-w-screen-2xl mx-auto flex items-center justify-end">
          <label className="flex items-center gap-3 text-[11px] uppercase tracking-[0.25em] text-muted-foreground">
            Sort
            <select
              value={sort}
              onChange={(e) =>
                navigate({
                  search: () => ({ sort: e.target.value as SortKey }),
                  replace: true,
                })
              }
              className="bg-transparent border-b border-ink/30 focus:border-ink py-1 pr-6 text-[11px] uppercase tracking-[0.2em] text-ink focus:outline-none cursor-pointer"
            >
              {SORTS.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
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
              <p className="text-sm text-muted-foreground">No pieces currently available from {name}.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-16">
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
