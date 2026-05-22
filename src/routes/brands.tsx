import { createFileRoute, Link } from "@tanstack/react-router";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { fetchProductsPage } from "@/lib/shopify";
import { routeHead, absoluteUrl, SITE_NAME } from "@/lib/seo";
import { img } from "@/lib/editorial-library";
import { isAllowedLuxuryBrand } from "@/lib/nav-config";

const BRANDS_TITLE = "Brands — Palace of Roman";
const BRANDS_DESC =
  "Browse the houses we carry at Palace of Roman — an A–Z directory of luxury designers stocked through our official BrandsGateway partnership, with worldwide tracked shipping.";

export const Route = createFileRoute("/brands")({
  head: () => {
    const rh = routeHead({
      path: "/brands",
      title: BRANDS_TITLE,
      description: BRANDS_DESC,
      image: img(11),
    });
    return {
      meta: [{ title: BRANDS_TITLE }, { name: "description", content: BRANDS_DESC }, ...rh.meta],
      links: rh.links,
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: BRANDS_TITLE,
            description: BRANDS_DESC,
            url: absoluteUrl("/brands"),
            isPartOf: { "@type": "WebSite", name: SITE_NAME, url: absoluteUrl("/") },
          }),
        },
      ],
    };
  },
  component: BrandsPage,
});

function BrandsPage() {
  // Scan the catalog in pages to extract vendors. Storefront API has no vendor index,
  // so we walk products and dedupe. User can "Scan more" to keep going.
  const sampleQ = useInfiniteQuery({
    queryKey: ["brands-sample"],
    initialPageParam: null as string | null,
    queryFn: ({ pageParam }) =>
      fetchProductsPage({ first: 250, after: pageParam, sortKey: "BEST_SELLING" }),
    getNextPageParam: (last) => (last.pageInfo.hasNextPage ? last.pageInfo.endCursor : undefined),
  });

  const allEdges = useMemo(
    () => sampleQ.data?.pages.flatMap((p) => p.edges) ?? [],
    [sampleQ.data],
  );

  const grouped = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of allEdges) {
      const v = e.node.vendor?.trim();
      if (!v) continue;
      map.set(v, (map.get(v) ?? 0) + 1);
    }
    const list = Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
    const byLetter = new Map<string, Array<{ vendor: string; count: number }>>();
    for (const [vendor, count] of list) {
      const letter = vendor[0]?.toUpperCase() ?? "#";
      const key = /[A-Z]/.test(letter) ? letter : "#";
      if (!byLetter.has(key)) byLetter.set(key, []);
      byLetter.get(key)!.push({ vendor, count });
    }
    return Array.from(byLetter.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [allEdges]);

  return (
    <div className="px-6 py-16">
      <div className="max-w-screen-2xl mx-auto">
        <Link to="/" className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground hover:text-ink">
          ← Boutique
        </Link>
        <div className="mt-8 mb-20 max-w-[60ch]">
          <span className="text-xs uppercase tracking-[0.25em] text-bronze mb-4 block">Index</span>
          <h1 className="text-5xl md:text-7xl font-serif text-balance mb-6">The Houses</h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            A curated edit of the world's most significant designers — from legacy maisons to contemporary ateliers,
            each represented through carefully selected silhouettes.
          </p>
        </div>

        {sampleQ.isLoading ? (
          <p className="text-sm text-muted-foreground">Loading brand index…</p>
        ) : grouped.length === 0 ? (
          <p className="text-sm text-muted-foreground">No brands found.</p>
        ) : (
          <div className="space-y-16">
            {grouped.map(([letter, vendors]) => (
              <section key={letter} className="grid grid-cols-12 gap-6 border-t border-ink/10 pt-10">
                <div className="col-span-12 md:col-span-2">
                  <p className="text-5xl font-serif text-bronze">{letter}</p>
                </div>
                <div className="col-span-12 md:col-span-10 grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-3">
                  {vendors.map(({ vendor, count }) => (
                    <Link
                      key={vendor}
                      to="/brand/$vendor"
                      params={{ vendor: vendor.toLowerCase().replace(/\s+/g, "-") }}
                      className="group flex items-baseline justify-between border-b border-ink/5 py-2 hover:border-ink transition-colors"
                    >
                      <span className="text-sm group-hover:text-bronze transition-colors">{vendor}</span>
                      <span className="text-[10px] uppercase tracking-widest text-muted-foreground">{count}</span>
                    </Link>
                  ))}
                </div>
              </section>
            ))}
            {sampleQ.hasNextPage && (
              <div className="pt-10 text-center">
                <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-4">
                  {allEdges.length.toLocaleString()} pieces scanned · {grouped.reduce((n, [, v]) => n + v.length, 0)} houses found
                </p>
                <button
                  onClick={() => sampleQ.fetchNextPage()}
                  disabled={sampleQ.isFetchingNextPage}
                  className="px-10 py-3.5 ring-1 ring-ink text-[11px] uppercase tracking-[0.25em] hover:bg-ink hover:text-canvas transition-colors disabled:opacity-50"
                >
                  {sampleQ.isFetchingNextPage ? "Scanning…" : "Scan more of the catalog"}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
