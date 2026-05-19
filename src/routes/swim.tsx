import { createFileRoute, Link } from "@tanstack/react-router";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { fetchSearchFiltered, type StorefrontFilterValue } from "@/lib/shopify";
import { ProductCard } from "@/components/product-card";
import {
  CatalogFilters,
  CatalogSort,
  ActiveFilterPills,
  type Selection,
  type SortValue,
} from "@/components/catalog-filters";
import { routeHead } from "@/lib/seo";
import swimHero from "@/assets/marketing-swim-summer.jpg";
import lookbook1 from "@/assets/marketing-swim-summer.jpg";
import lookbook2 from "@/assets/lookbook-swim-2.jpg";
import lookbook3 from "@/assets/lookbook-swim-3.jpg";
import swimCampaignVideo from "@/assets/swim-campaign.mp4.asset.json";
import sizeGuideImg from "@/assets/swim-size-guide-hero.jpg";
import { CampaignVideo } from "@/components/campaign-video";
import { EditorialHotspots, type Hotspot } from "@/components/editorial-hotspots";

export const Route = createFileRoute("/swim")({
  head: () => {
    const title = "Swim & Beachwear — The Resort Edit | Palace of Roman";
    const desc =
      "Designer swimwear, bikinis and beachwear from Dolce & Gabbana and the world's leading maisons. 100% authentic, sourced from authorised distributors. Worldwide shipping.";
    const rh = routeHead({ path: "/swim", title, description: desc });
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:image", content: `https://palaceofroman.com${swimHero}` },
        { name: "twitter:image", content: `https://palaceofroman.com${swimHero}` },
        ...rh.meta,
      ],
      links: rh.links,
    };
  },
  component: SwimPage,
});

/* -------------------- Category sub-filter chips -------------------- */

type SwimCategory = {
  key: string;
  label: string;
  query: string;
};

const SWIM_CATEGORIES: SwimCategory[] = [
  { key: "all", label: "All Swim", query: "tag:Swimwear OR tag:Beachwear" },
  { key: "bikini-tops", label: "Bikini Tops", query: "title:'bikini top'" },
  { key: "bikini-bottoms", label: "Bikini Bottoms", query: "title:'bikini bottom'" },
  { key: "one-piece", label: "One-Piece", query: "title:swimsuit OR title:'one piece' OR title:'one-piece'" },
  { key: "beachwear", label: "Beachwear", query: "tag:Beachwear" },
];

function mapSort(sort: SortValue): { sortKey: string; reverse: boolean } {
  switch (sort) {
    case "PRICE-false": return { sortKey: "PRICE", reverse: false };
    case "PRICE-true":  return { sortKey: "PRICE", reverse: true };
    default:            return { sortKey: "RELEVANCE", reverse: false };
  }
}

function SwimPage() {
  const [category, setCategory] = useState<SwimCategory>(SWIM_CATEGORIES[0]);
  const [selections, setSelections] = useState<Selection[]>([]);
  const [priceRange, setPriceRange] = useState<{ min: number; max: number } | null>(null);
  const [sort, setSort] = useState<SortValue>("BEST_SELLING-false");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const filterInputs = useMemo(() => {
    const arr: object[] = selections.map((s) => JSON.parse(s.input));
    if (priceRange) arr.push({ price: { min: priceRange.min, max: priceRange.max } });
    return arr;
  }, [selections, priceRange]);

  const { sortKey, reverse } = mapSort(sort);

  const q = useInfiniteQuery({
    queryKey: ["swim-search", category.key, filterInputs, sortKey, reverse],
    initialPageParam: null as string | null,
    queryFn: ({ pageParam }) =>
      fetchSearchFiltered({
        query: category.query,
        first: 36,
        after: pageParam,
        filters: filterInputs,
        sortKey,
        reverse,
      }),
    getNextPageParam: (last) => (last.pageInfo.hasNextPage ? last.pageInfo.endCursor : undefined),
  });

  const filters = q.data?.pages?.[0]?.filters ?? [];
  const edges = useMemo(() => q.data?.pages.flatMap((p) => p.edges) ?? [], [q.data]);
  const selectedInputs = useMemo(() => new Set(selections.map((s) => s.input)), [selections]);

  const toggle = (filterId: string, v: StorefrontFilterValue) => {
    setSelections((curr) =>
      curr.some((s) => s.input === v.input)
        ? curr.filter((s) => s.input !== v.input)
        : [...curr, { id: v.id, label: v.label, input: v.input, filterId }]
    );
  };
  const removeOne = (input: string) => setSelections((c) => c.filter((s) => s.input !== input));
  const clearAll = () => { setSelections([]); setPriceRange(null); };

  const sidebar = (
    <CatalogFilters
      filters={filters}
      selectedInputs={selectedInputs}
      priceRange={priceRange}
      onToggle={toggle}
      onPriceChange={setPriceRange}
    />
  );

  return (
    <div>
      {/* ============ HERO ============ */}
      <section className="relative h-[82vh] min-h-[600px] overflow-hidden bg-ink">
        <CampaignVideo
          src={swimCampaignVideo.url}
          poster={swimHero}
          className="absolute inset-0 w-full h-full object-cover"
          label="Play the Resort 2026 swim film"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/15 to-transparent pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-r from-ink/40 via-transparent to-transparent pointer-events-none" />
        <div className="relative h-full flex items-end">
          <div className="max-w-screen-2xl mx-auto px-6 md:px-10 pb-16 md:pb-24 w-full">
            <span className="block text-[10px] md:text-xs uppercase tracking-[0.4em] text-canvas/90 mb-4">
              Resort 2026 — The Swim Edit
            </span>
            <h1 className="font-serif text-canvas text-5xl md:text-7xl lg:text-8xl leading-[0.95] max-w-3xl text-balance">
              Sun, Sand
              <span className="block italic font-light md:ml-12">&amp; Salt</span>
            </h1>
            <p className="mt-6 max-w-lg text-canvas/85 text-sm md:text-base leading-relaxed">
              Designer bikinis, swimsuits and beachwear from the world's leading maisons —
              100% authentic, sourced from authorised distributors and shipped worldwide.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="#shop"
                className="px-8 py-3.5 bg-canvas text-ink text-[10px] uppercase tracking-[0.3em] font-medium hover:bg-[var(--sea)] hover:text-canvas transition-colors"
              >
                Shop the Look
              </a>
              <a
                href="#lookbook"
                className="px-8 py-3.5 border border-canvas/60 text-canvas text-[10px] uppercase tracking-[0.3em] font-medium hover:bg-canvas hover:text-ink transition-colors"
              >
                View Lookbook
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ============ LOOKBOOK ============ */}
      <section id="lookbook" className="px-6 md:px-10 py-20 md:py-28 bg-canvas scroll-mt-20">
        <div className="max-w-screen-2xl mx-auto">
          <div className="flex items-end justify-between mb-10 md:mb-14">
            <div>
              <span className="text-[10px] uppercase tracking-[0.3em] text-[var(--sea)] mb-3 block">
                The Lookbook
              </span>
              <h2 className="font-serif text-3xl md:text-5xl">A Day on the Riviera</h2>
            </div>
            <span className="hidden md:block text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
              Resort 2026 — Three Frames
            </span>
          </div>

          <div className="grid grid-cols-12 auto-rows-[200px] md:auto-rows-[240px] gap-4">
            {/* Frame 1 — large portrait */}
            <figure className="col-span-12 md:col-span-7 row-span-3 relative overflow-hidden group">
              <EditorialHotspots
                src={lookbook1}
                alt="Pool lounger with infinity Mediterranean view"
                aspect="4/5"
                hotspots={lookbookSpots.frame1}
              />
              <figcaption className="absolute bottom-6 left-6 right-6 text-canvas font-serif italic text-2xl md:text-3xl pointer-events-none drop-shadow-lg">
                The Infinity Hour
              </figcaption>
            </figure>

            {/* Frame 2 — close-up */}
            <figure className="col-span-6 md:col-span-5 row-span-2 relative overflow-hidden group">
              <EditorialHotspots
                src={lookbook2}
                alt="Designer white bikini and gold jewellery, golden hour"
                aspect="4/5"
                hotspots={lookbookSpots.frame2}
              />
              <figcaption className="absolute bottom-5 left-5 text-canvas font-serif italic text-xl md:text-2xl pointer-events-none drop-shadow-lg">
                In the Shade
              </figcaption>
            </figure>

            {/* Frame 3 — flatlay */}
            <figure className="col-span-6 md:col-span-5 row-span-1 relative overflow-hidden group">
              <EditorialHotspots
                src={lookbook3}
                alt="Beach essentials flat lay on white sand"
                aspect="4/5"
                hotspots={lookbookSpots.frame3}
              />
              <figcaption className="absolute bottom-4 left-5 text-canvas font-serif italic text-lg md:text-xl pointer-events-none drop-shadow-lg">
                The Essentials
              </figcaption>
            </figure>
          </div>

          <p className="mt-6 text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
            Tap the white markers on any frame to shop the piece.
          </p>
        </div>
      </section>

      {/* ============ FEATURED CAMPAIGN + SIZE GUIDE STRIP ============ */}
      <section className="px-6 md:px-10 py-6 border-y border-ink/5 bg-ink text-canvas">
        <div className="max-w-screen-2xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-baseline gap-3">
            <span className="text-[10px] uppercase tracking-[0.3em] text-[var(--sea)]">Featured</span>
            <p className="font-serif italic text-lg md:text-xl">Dolce &amp; Gabbana at the water's edge.</p>
          </div>
          <div className="flex gap-3">
            <Link
              to="/campaign/dolce-gabbana-swim"
              className="px-6 py-2.5 bg-canvas text-ink text-[10px] uppercase tracking-[0.3em] hover:bg-[var(--sea)] hover:text-canvas transition-colors"
            >
              View the Campaign
            </Link>
            <Link
              to="/swim/size-guide"
              className="px-6 py-2.5 border border-canvas/60 text-canvas text-[10px] uppercase tracking-[0.3em] hover:bg-canvas hover:text-ink transition-colors"
            >
              Size Guide
            </Link>
          </div>
        </div>
      </section>

      {/* ============ CATEGORY CHIPS ============ */}
      <section id="shop" className="px-6 md:px-10 pt-16 pb-6 border-t border-ink/5 bg-canvas-raised/50 scroll-mt-20">
        <div className="max-w-screen-2xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
            <div>
              <span className="text-[10px] uppercase tracking-[0.3em] text-bronze mb-3 block">
                Shop the Edit
              </span>
              <h2 className="font-serif text-3xl md:text-5xl">Swim &amp; Beachwear</h2>
            </div>
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              {q.isLoading ? "Loading…" : `${edges.length}${q.hasNextPage ? "+" : ""} Pieces`}
            </p>
          </div>

          <div className="flex flex-wrap gap-2 md:gap-3">
            {SWIM_CATEGORIES.map((c) => {
              const active = c.key === category.key;
              return (
                <button
                  key={c.key}
                  onClick={() => { setCategory(c); clearAll(); }}
                  className={
                    "px-4 md:px-5 py-2 md:py-2.5 text-[10px] md:text-[11px] uppercase tracking-[0.25em] border transition-colors " +
                    (active
                      ? "bg-ink text-canvas border-ink"
                      : "bg-canvas text-ink border-ink/15 hover:border-ink hover:bg-ink hover:text-canvas")
                  }
                >
                  {c.label}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============ GRID + FILTERS ============ */}
      <section className="px-6 md:px-10 py-12">
        <div className="max-w-screen-2xl mx-auto flex gap-10">
          <div className="hidden lg:block">{sidebar}</div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-4 mb-6">
              <button
                onClick={() => setMobileFiltersOpen(true)}
                className="lg:hidden inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] border border-ink/15 px-3 py-2"
              >
                <SlidersHorizontal className="h-3.5 w-3.5" /> Filters
              </button>
              <div className="hidden lg:block" />
              <CatalogSort value={sort} onChange={setSort} />
            </div>

            <ActiveFilterPills
              selections={selections}
              priceRange={priceRange}
              onRemove={removeOne}
              onClearPrice={() => setPriceRange(null)}
              onClearAll={clearAll}
            />

            {q.isLoading ? (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-12">
                {Array.from({ length: 9 }).map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="w-full aspect-[4/5] bg-muted mb-5" />
                    <div className="h-2 w-16 bg-muted mb-2" />
                    <div className="h-3 w-3/4 bg-muted" />
                  </div>
                ))}
              </div>
            ) : edges.length === 0 ? (
              <div className="py-32 text-center">
                <p className="text-sm text-muted-foreground mb-6">
                  No pieces match the current filters.
                </p>
                {(selections.length > 0 || priceRange) && (
                  <button
                    onClick={clearAll}
                    className="text-[11px] uppercase tracking-[0.25em] border-b border-ink pb-1 hover:text-bronze hover:border-bronze"
                  >
                    Clear All Filters
                  </button>
                )}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-16">
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

            <div className="mt-16 text-center">
              <Link
                to="/shop"
                search={{ q: "tag:Swimwear OR tag:Beachwear", title: "Swim & Beachwear" }}
                className="text-[10px] uppercase tracking-[0.3em] border-b border-ink pb-1 hover:text-bronze hover:border-bronze"
              >
                Open in Full Catalog →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Mobile filter drawer */}
      {mobileFiltersOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <button
            aria-label="Close filters"
            onClick={() => setMobileFiltersOpen(false)}
            className="flex-1 bg-ink/40 backdrop-blur-sm"
          />
          <div className="w-80 max-w-[85vw] bg-canvas h-full overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <span className="text-[11px] uppercase tracking-[0.25em]">Filters</span>
              <button onClick={() => setMobileFiltersOpen(false)}>
                <X className="h-5 w-5" />
              </button>
            </div>
            {sidebar}
          </div>
        </div>
      )}
    </div>
  );
}
