import { createFileRoute, Link, useNavigate, redirect } from "@tanstack/react-router";
import { canonicalCollectionHandle } from "@/lib/collection-canonical";
import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { useMemo, useState, useEffect, useRef, useCallback } from "react";
import { useServerFn } from "@tanstack/react-start";

import { fetchCollectionFiltered, fetchCollection, type StorefrontFilterValue } from "@/lib/shopify";
import { fetchCollectionTotal } from "@/lib/collection-count.functions";
import { fetchCollectionCategoryCounts } from "@/lib/collection-category-counts.functions";
import { CATEGORY_BUCKETS, bucketProduct, type CategoryBucketLabel } from "@/lib/category-buckets";
import { ProductCard } from "@/components/product-card";
import { absoluteUrl, SITE_URL } from "@/lib/seo";
import { collectionSeo } from "@/lib/collection-seo";
import {
  CatalogFilters,
  CatalogSort,
  ActiveFilterPills,
  SORT_OPTIONS,
  type Selection,
  type SortValue,
} from "@/components/catalog-filters";

// Curated handles that receive the Nordstrom-style editorial hero +
// featured-three row + roomier grid. Adding a handle here is the only
// change needed to opt another collection in.
const EDITORIAL_HERO_COPY: Record<string, { eyebrow: string; tagline: string }> = {
  "best-sellers": {
    eyebrow: "Most-Loved at Palace of Roman",
    tagline:
      "The pieces our clients return for — runway-grade silhouettes from Gucci, Prada, Saint Laurent and the houses defining this season. Sourced through our authorised distributor network, shipped worldwide.",
  },
  "polo-shirts": {
    eyebrow: "The Polo, Properly Considered",
    tagline:
      "Piqué cottons, fine knits, and the houses that have spent decades perfecting the collar that bridges sportswear and tailoring.",
  },
  "long-sleeve-tees": {
    eyebrow: "The Shoulder-Season Essential",
    tagline:
      "Heavy jerseys, fine cottons, and the long-sleeve cuts that work alone or layered beneath everything else.",
  },
  "hoodies": {
    eyebrow: "Soft Architecture",
    tagline:
      "Brushed cottons, heavyweight loopbacks, and the kind of hoods that hold their shape — off-duty luxury from the houses that taught the category how to behave.",
  },
};

const SORT_VALUES = SORT_OPTIONS.map((o) => o.value);

// Map collections-index sort keys → per-collection sort values
const INDEX_SORT_ALIASES: Record<string, SortValue> = {
  popular: "BEST_SELLING-false",
  newest: "CREATED-true",
  alpha: "TITLE-false",
};

export const Route = createFileRoute("/collections/$handle")({
  beforeLoad: ({ params, search }) => {
    const canonical = canonicalCollectionHandle(params.handle);
    if (canonical !== params.handle.toLowerCase()) {
      throw redirect({
        to: "/collections/$handle",
        params: { handle: canonical },
        search,
        replace: true,
      });
    }
  },
  validateSearch: (search: Record<string, unknown>): { sort: SortValue } => {
    const raw = typeof search.sort === "string" ? search.sort : "";
    let sort: SortValue;
    if (SORT_VALUES.includes(raw as SortValue)) sort = raw as SortValue;
    else if (raw in INDEX_SORT_ALIASES) sort = INDEX_SORT_ALIASES[raw];
    else sort = "BEST_SELLING-false";
    return { sort };
  },
  loader: async ({ params }) => {
    try {
      const c = await fetchCollection(params.handle, 1);
      return {
        title: c?.title ?? titleizeHandle(params.handle),
        description: c?.description ?? "",
        image: c?.image?.url ?? null,
      };
    } catch {
      return { title: titleizeHandle(params.handle), description: "", image: null };
    }
  },
  head: ({ params, loaderData }) => {
    const title = loaderData?.title ?? titleizeHandle(params.handle);
    const seo = collectionSeo({
      handle: params.handle,
      title,
      description: loaderData?.description ?? null,
    });
    const path = `/collections/${params.handle}`;
    const url = absoluteUrl(path);
    const meta = [
      { title: seo.title },
      { name: "description", content: seo.description },
      { property: "og:title", content: seo.title },
      { property: "og:description", content: seo.description },
      { property: "og:url", content: url },
      { property: "og:type", content: "website" },
    ];
    if (loaderData?.image) {
      meta.push({ property: "og:image", content: loaderData.image });
      meta.push({ name: "twitter:image", content: loaderData.image });
    }
    return {
      meta,
      links: [{ rel: "canonical", href: url }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL + "/" },
              { "@type": "ListItem", position: 2, name: "Collections", item: SITE_URL + "/collections" },
              { "@type": "ListItem", position: 3, name: title, item: url },
            ],
          }),
        },
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: title,
            description: seo.description,
            url,
            isPartOf: { "@type": "WebSite", name: "Palace of Roman", url: SITE_URL },
          }),
        },
      ],
    };
  },
  component: CollectionPage,
});

function titleizeHandle(handle: string) {
  return handle
    .replace(/-/g, " ")
    .replace(/\bs\b/g, "'s")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function CollectionPage() {
  const { handle } = Route.useParams();
  const { sort } = Route.useSearch();
  const navigate = useNavigate({ from: "/collections/$handle" });
  const setSort = (v: SortValue) =>
    navigate({ search: (prev: { sort: SortValue }) => ({ ...prev, sort: v }), replace: true });

  const [selections, setSelections] = useState<Selection[]>([]);
  const [priceRange, setPriceRange] = useState<{ min: number; max: number } | null>(null);

  // Active category chip (single-select, mutually exclusive).
  // For most collections, this is one of CATEGORY_BUCKETS labels (driven
  // by Admin-API aggregation across the entire collection). For the
  // virtual "layering-edit" handle, we keep a bespoke title-regex chip
  // set that better describes the layering taxonomy.
  const [typeFilter, setTypeFilter] = useState<string | null>(null);

  // The layering-edit handle uses a bespoke local pattern set; every
  // other handle uses the curated 10-bucket whitelist via the server-
  // side aggregation. `isLayering` is the branch switch.
  const isLayering = handle === "layering-edit";

  const LAYERING_PATTERNS: { label: string; test: RegExp }[] = [
    { label: "Polos",        test: /\bpolo\b/i },
    { label: "Long Sleeves", test: /\b(long[\s-]?sleeve|longsleeve|l\/s)\b/i },
    { label: "Turtlenecks",  test: /\b(turtleneck|roll[\s-]?neck|mock[\s-]?neck)\b/i },
    { label: "Cardigans",    test: /\bcardigan\b/i },
    { label: "Hoodies",      test: /\b(hoodie|hooded)\b/i },
    { label: "Sweatshirts",  test: /\b(sweatshirt|crewneck|crew[\s-]?neck)\b/i },
  ];

  function inferLayeringType(title: string): string | null {
    for (const p of LAYERING_PATTERNS) if (p.test.test(title)) return p.label;
    return null;
  }

  // Build Shopify filters arg from selections + price
  const filterInputs = useMemo(() => {
    const arr: object[] = selections.map((s) => JSON.parse(s.input));
    if (priceRange) arr.push({ price: { min: priceRange.min, max: priceRange.max } });
    return arr;
  }, [selections, priceRange]);

  const [sortKey, reverseStr] = sort.split("-");
  const reverse = reverseStr === "true";

  const q = useInfiniteQuery({
    queryKey: ["collection-filtered", handle, filterInputs, sortKey, reverse],
    queryFn: async ({ pageParam }) => {
      return fetchCollectionFiltered({
        handle,
        first: 48,
        after: pageParam as string | null,
        filters: filterInputs,
        sortKey,
        reverse,
      });
    },
    initialPageParam: null as string | null,
    getNextPageParam: (last) =>
      last?.pageInfo?.hasNextPage ? last.pageInfo.endCursor : undefined,
  });

  // True total from Shopify Admin API — used for "Showing X of N" and to
  // know whether infinite scroll has surfaced every active listing.
  const fetchTotal = useServerFn(fetchCollectionTotal);
  const totalQ = useQuery({
    queryKey: ["collection-total", handle],
    queryFn: () => fetchTotal({ data: { handle } }),
    staleTime: 5 * 60_000,
  });
  const total = totalQ.data?.total ?? null;

  // True per-bucket counts via Admin-API walk of the entire collection.
  // Disabled for the bespoke layering-edit chip set (no aggregation
  // needed — that branch uses the loaded-batch counts).
  const fetchCatCounts = useServerFn(fetchCollectionCategoryCounts);
  const categoryCountsQ = useQuery({
    queryKey: ["collection-category-counts", handle],
    queryFn: () => fetchCatCounts({ data: { handle } }),
    staleTime: 10 * 60_000,
    enabled: !isLayering,
  });
  const categoryCounts = categoryCountsQ.data?.counts ?? null;

  // IntersectionObserver sentinel — fetches the next cursor page as soon as
  // the user scrolls within ~800px of the bottom. Continues until
  // hasNextPage === false (Rule 3: zero artificial limits).
  //
  // Implementation note: we use a *callback ref* (not useRef + useEffect) so
  // the observer is attached the moment the sentinel DOM node mounts, and
  // reads the latest query state via `qRef` to avoid stale-closure churn
  // (the `q` object identity changes on every render, which previously made
  // the effect tear down/rebuild the observer constantly — occasionally
  // missing the intersection callback and capping the grid at the first 48).
  const qRef = useRef(q);
  qRef.current = q;
  const ioRef = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useCallback((el: HTMLDivElement | null) => {
    if (ioRef.current) {
      ioRef.current.disconnect();
      ioRef.current = null;
    }
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting) return;
        const cur = qRef.current;
        if (cur.hasNextPage && !cur.isFetchingNextPage) {
          cur.fetchNextPage();
        }
      },
      { rootMargin: "800px 0px" },
    );
    io.observe(el);
    ioRef.current = io;
  }, []);
  useEffect(() => () => ioRef.current?.disconnect(), []);

  // When a category chip is active, auto-exhaust the cursor so client-
  // side bucketing surfaces every matching product across the entire
  // collection — not just whatever was lazy-loaded by scroll. This is
  // what makes "Dresses 47" actually render 47 items, not just the
  // dresses present in the first batch.
  useEffect(() => {
    if (!typeFilter) return;
    if (q.hasNextPage && !q.isFetchingNextPage) {
      q.fetchNextPage();
    }
  }, [typeFilter, q.hasNextPage, q.isFetchingNextPage, q.fetchNextPage, q.data?.pages.length]);

  const pages = q.data?.pages ?? [];
  const data = pages[0] ?? null;
  const filters = data?.filters ?? [];
  const rawEdges = useMemo(() => pages.flatMap((p) => p?.edges ?? []), [pages]);
  const discountEdges = rawEdges;

  // Match a loaded product to the active chip. For layering-edit we use
  // title-regex; for everything else we use the shared bucketProduct
  // helper that the server-side aggregation also uses.
  function matchesActiveType(
    node: { title?: string | null; tags?: string[] | null },
    label: string,
  ): boolean {
    if (isLayering) return inferLayeringType(node.title ?? "") === label;
    return (
      bucketProduct({
        title: node.title ?? "",
        tags: Array.isArray(node.tags) ? node.tags : [],
      }) === label
    );
  }

  // Chip definitions for the current collection.
  type Chip = { label: string; count: number };
  const chips: Chip[] = useMemo(() => {
    if (isLayering) {
      // Local count from loaded batch — layering catalog is small.
      const c: Record<string, number> = {};
      for (const e of discountEdges) {
        const t = inferLayeringType(e.node.title ?? "");
        if (t) c[t] = (c[t] ?? 0) + 1;
      }
      return LAYERING_PATTERNS.map((p) => ({ label: p.label, count: c[p.label] ?? 0 })).filter(
        (chip) => chip.count > 0,
      );
    }
    if (!categoryCounts) return [];
    return CATEGORY_BUCKETS.map((b) => ({
      label: b.label as string,
      count: categoryCounts[b.label as CategoryBucketLabel] ?? 0,
    })).filter((chip) => chip.count > 0);
  }, [isLayering, discountEdges, categoryCounts]);

  const edges = useMemo(() => {
    if (!typeFilter) return discountEdges;
    return discountEdges.filter((e) => matchesActiveType(e.node as { title?: string | null; tags?: string[] | null }, typeFilter));
  }, [discountEdges, typeFilter, isLayering]);


  const title = data?.collection?.title ?? titleizeHandle(handle);
  const description = data?.collection?.description;

  // Header count — reflects the active filter/sort state, not the raw
  // collection size. When a category chip is active and we have the
  // Admin-aggregated count for that bucket, that count is the true
  // master total. Otherwise we fall back to the loaded-count + "+"
  // pattern while the cursor is still draining, and to the absolute
  // Admin productsCount when no filter is active.
  const loadedCount = edges.length;
  const filtersActive =
    Boolean(typeFilter) || selections.length > 0 || Boolean(priceRange);
  const noun = (n: number) => (n === 1 ? "Piece" : "Pieces");
  const activeBucketTrueCount: number | null =
    typeFilter && !isLayering && categoryCounts
      ? categoryCounts[typeFilter as CategoryBucketLabel] ?? null
      : null;
  let countLabel: string;
  if (q.isLoading) {
    countLabel = "Loading…";
  } else if (typeFilter && activeBucketTrueCount != null && selections.length === 0 && !priceRange) {
    // Pure category-chip filter: show the true Admin-aggregated total
    // for that bucket immediately (e.g. "47 Pieces"), regardless of how
    // many have surfaced via the cursor so far.
    countLabel = `${activeBucketTrueCount} ${noun(activeBucketTrueCount)}`;
  } else if (filtersActive) {
    countLabel = q.hasNextPage
      ? `Showing ${loadedCount}+ ${noun(loadedCount)}`
      : `${loadedCount} ${noun(loadedCount)}`;
  } else if (total != null) {
    countLabel =
      loadedCount < total
        ? `Showing ${loadedCount} of ${total} ${noun(total)}`
        : `${total} ${noun(total)}`;
  } else {
    countLabel = `${loadedCount} ${noun(loadedCount)}`;
  }



  const selectedInputs = useMemo(() => new Set(selections.map((s) => s.input)), [selections]);

  const toggle = (filterId: string, v: StorefrontFilterValue) => {
    setSelections((curr) => {
      if (curr.some((s) => s.input === v.input)) {
        return curr.filter((s) => s.input !== v.input);
      }
      return [...curr, { id: v.id, label: v.label, input: v.input, filterId }];
    });
  };

  const removeOne = (input: string) =>
    setSelections((c) => c.filter((s) => s.input !== input));

  const clearAll = () => {
    setSelections([]);
    setPriceRange(null);
  };

  const sidebar = (
    <CatalogFilters
      filters={filters}
      selectedInputs={selectedInputs}
      priceRange={priceRange}
      onToggle={toggle}
      onPriceChange={setPriceRange}
    />
  );

  const heroImage = data?.collection?.image ?? null;
  const heroSrc = heroImage?.url ?? "";
  const heroAlt = heroImage?.altText ?? `${title} collection at Palace of Roman`;
  const heroFocal = "50% 50%";

  const parsedFocal = (() => {
    const m = heroFocal.match(/(-?\d+(?:\.\d+)?)%\s+(-?\d+(?:\.\d+)?)%/);
    return m ? { x: parseFloat(m[1]), y: parseFloat(m[2]) } : { x: 50, y: 40 };
  })();
  const renderedFocal = parsedFocal;

  const editorialCopy = EDITORIAL_HERO_COPY[handle];
  const isEditorial = Boolean(editorialCopy);

  // Curated "Featured" trio for editorial handles — top three best-sellers
  // from the same collection, independent of the user's current sort.
  const featuredQ = useQuery({
    queryKey: ["collection-featured", handle],
    queryFn: () =>
      fetchCollectionFiltered({
        handle,
        first: 3,
        filters: [],
        sortKey: "BEST_SELLING",
        reverse: false,
      }).then((r) => r?.edges ?? []),
    enabled: isEditorial,
  });
  const featuredIds = useMemo(
    () => new Set((featuredQ.data ?? []).map((e) => e.node.id)),
    [featuredQ.data],
  );
  const gridEdges = isEditorial
    ? edges.filter((e) => !featuredIds.has(e.node.id))
    : edges;
  const gridGap = isEditorial ? "gap-x-10 gap-y-20" : "gap-x-6 gap-y-16";

  return (
    <div>
      {isEditorial ? (
        <section
          className="relative h-[58vh] min-h-[420px] max-h-[680px] w-full overflow-hidden bg-ink"
          data-testid="collection-hero"
          data-handle={handle.toLowerCase()}
        >
          {heroSrc && (
            <img
              src={heroSrc}
              alt={heroAlt}
              loading="eager"
              fetchPriority="high"
              decoding="async"
              className="absolute inset-0 h-full w-full object-cover opacity-90"
              style={{ objectPosition: `${renderedFocal.x}% ${renderedFocal.y}%` }}
              data-testid="collection-hero-img"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-ink/30 via-ink/20 to-ink/70" />
          <div className="relative h-full flex items-end">
            <div className="max-w-screen-2xl mx-auto w-full px-6 pb-14 md:pb-20">
              <Link
                to="/"
                className="text-[10px] uppercase tracking-[0.3em] text-canvas/70 hover:text-canvas inline-block mb-8"
              >
                ← Boutique
              </Link>
              <span className="block text-[10px] md:text-[11px] uppercase tracking-[0.4em] text-bronze mb-5">
                {editorialCopy!.eyebrow}
              </span>
              <h1 className="font-serif text-5xl md:text-7xl lg:text-8xl leading-[0.95] text-canvas text-balance max-w-4xl">
                {title}
              </h1>
              <p className="mt-7 max-w-xl text-sm md:text-base text-canvas/80 leading-relaxed text-pretty">
                {editorialCopy!.tagline}
              </p>
              <p className="mt-8 text-[10px] uppercase tracking-[0.3em] text-canvas/60">
                {countLabel}
              </p>
            </div>
          </div>
        </section>
      ) : (
        <>
          <section
            className="relative h-[42vh] min-h-[280px] max-h-[520px] w-full overflow-hidden bg-ink/5"
            data-testid="collection-hero"
            data-handle={handle.toLowerCase()}
          >
            {heroSrc && (
              <img
                src={heroSrc}
                alt={heroAlt}
                loading="eager"
                fetchPriority="high"
                decoding="async"
                className="absolute inset-0 h-full w-full object-cover"
                style={{ objectPosition: `${renderedFocal.x}% ${renderedFocal.y}%` }}
                data-testid="collection-hero-img"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-canvas via-canvas/40 to-transparent" />
          </section>

          <section className="px-6 pt-12 pb-8 border-b border-ink/5">
            <div className="max-w-screen-2xl mx-auto">
              <Link to="/" className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground hover:text-ink">
                ← Boutique
              </Link>
              <div className="mt-6 flex flex-col md:flex-row md:items-end justify-between gap-6">
                <h1 className="text-4xl md:text-6xl font-serif text-balance">{title}</h1>
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  {countLabel}
                </p>
              </div>
              {description && (
                <p className="mt-6 max-w-[64ch] text-sm text-muted-foreground leading-relaxed">{description}</p>
              )}
            </div>
          </section>
        </>
      )}

      {isEditorial && (featuredQ.data?.length ?? 0) > 0 && (
        <section className="px-6 pt-16 pb-4">
          <div className="max-w-screen-2xl mx-auto">
            <div className="flex items-end justify-between mb-10">
              <div>
                <span className="text-[10px] uppercase tracking-[0.3em] text-bronze mb-3 block">
                  The Edit
                </span>
                <h2 className="font-serif text-2xl md:text-3xl">Featured this season</h2>
              </div>
              <p className="hidden md:block text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                A curated three
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-10 gap-y-12">
              {featuredQ.data!.map((e) => (
                <ProductCard key={e.node.id} product={e} />
              ))}
            </div>
            <div className="mt-16 border-t border-ink/10" />
          </div>
        </section>
      )}


      <section className="px-6 py-12">
        <div className="max-w-screen-2xl mx-auto flex gap-10">
          {/* Desktop sidebar */}
          <div className="hidden lg:block">{sidebar}</div>

          {/* Main column */}
          <div className="flex-1 min-w-0">
            {/* Sort dropdown — same menu on every catalog surface */}
            <div className="mb-5 flex flex-wrap items-center justify-end gap-4">
              <CatalogSort value={sort} onChange={setSort} />
            </div>



            {/* Category chips — Admin-API aggregated counts across the
                entire collection (curated 10-bucket whitelist).
                Single-select; "All" clears. Hidden if only one chip
                would render (nothing to choose between). */}
            {chips.length > 1 && (
              <div className="mb-6 pt-5 border-t border-ink/5 flex flex-wrap items-center gap-2">
                <span className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground mr-2">
                  Category
                </span>
                <button
                  onClick={() => setTypeFilter(null)}
                  className={`text-[10px] uppercase tracking-[0.2em] px-3 py-1.5 border rounded-full transition-colors ${
                    typeFilter === null
                      ? "bg-ink text-canvas border-ink"
                      : "border-ink/15 text-muted-foreground hover:border-ink hover:text-ink"
                  }`}
                >
                  All
                </button>
                {chips.map((chip) => (
                  <button
                    key={chip.label}
                    onClick={() => setTypeFilter(typeFilter === chip.label ? null : chip.label)}
                    className={`text-[10px] uppercase tracking-[0.2em] px-3 py-1.5 border rounded-full transition-colors ${
                      typeFilter === chip.label
                        ? "bg-ink text-canvas border-ink"
                        : "border-ink/15 text-muted-foreground hover:border-ink hover:text-ink"
                    }`}
                  >
                    {chip.label}
                    <span className="ml-2 opacity-60">{chip.count}</span>
                  </button>
                ))}
              </div>
            )}




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
                <div className={`grid grid-cols-2 lg:grid-cols-3 ${gridGap}`}>
                  {gridEdges.map((e) => (
                    <ProductCard key={e.node.id} product={e} />
                  ))}
                </div>
                {/* IntersectionObserver sentinel — drives infinite scroll */}
                <div ref={sentinelRef} aria-hidden className="h-px w-full" />
                {(q.hasNextPage || q.isFetchingNextPage) && (
                  <div className="mt-16 flex justify-center">
                    <span className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                      Loading more…
                    </span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </section>

    </div>
  );
}
