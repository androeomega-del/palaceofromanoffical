import { createFileRoute, Link, useNavigate, redirect } from "@tanstack/react-router";
import { canonicalCollectionHandle } from "@/lib/collection-canonical";
import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { useMemo, useState, useEffect } from "react";

import { fetchCollectionFiltered, fetchCollection, type StorefrontFilterValue } from "@/lib/shopify";
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
  
  const [typeFilter, setTypeFilter] = useState<string | null>(null);

  // Keyword-based product type derivation. The Shopify product_type field on
  // this store is inconsistent, so we infer category from the product title.
  // Order matters — more specific patterns first (t-shirt before shirt).
  // For the curated "Layering Edit" virtual collection, swap in a layering-
  // specific pattern set so the chips read as Polo / Long Sleeve / Turtleneck /
  // Cardigan / Hoodie / Sweatshirt rather than the generic taxonomy.
  const TYPE_PATTERNS: { label: string; test: RegExp }[] = handle === "layering-edit"
    ? [
        { label: "Polos",        test: /\bpolo\b/i },
        { label: "Long Sleeves", test: /\b(long[\s-]?sleeve|longsleeve|l\/s)\b/i },
        { label: "Turtlenecks",  test: /\b(turtleneck|roll[\s-]?neck|mock[\s-]?neck)\b/i },
        { label: "Cardigans",    test: /\bcardigan\b/i },
        { label: "Hoodies",      test: /\b(hoodie|hooded)\b/i },
        { label: "Sweatshirts",  test: /\b(sweatshirt|crewneck|crew[\s-]?neck)\b/i },
      ]
    : [
        { label: "Dresses", test: /\b(dress|gown|kaftan)\b/i },
        { label: "Knitwear", test: /\b(knit|sweater|jumper|cardigan|cashmere|wool top|pullover)\b/i },
        { label: "Outerwear", test: /\b(coat|jacket|parka|trench|blazer|overcoat|puffer)\b/i },
        { label: "Tops", test: /\b(t-shirt|tee|shirt|blouse|top|tank|polo|camisole)\b/i },
        { label: "Trousers", test: /\b(trouser|pant|chino|legging|joggers)\b/i },
        { label: "Denim", test: /\b(jean|denim)\b/i },
        { label: "Skirts", test: /\b(skirt)\b/i },
        { label: "Shoes", test: /\b(shoe|sneaker|boot|loafer|sandal|heel|pump|mule|trainer|slipper)\b/i },
        { label: "Bags", test: /\b(bag|tote|clutch|backpack|crossbody|handbag|pouch|satchel)\b/i },
        { label: "Accessories", test: /\b(belt|scarf|hat|cap|glove|wallet|sunglass|jewel|necklace|ring|earring|bracelet|watch|tie)\b/i },
      ];

  function inferType(title: string): string | null {
    for (const p of TYPE_PATTERNS) if (p.test.test(title)) return p.label;
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

  const pages = q.data?.pages ?? [];
  const data = pages[0] ?? null;
  const filters = data?.filters ?? [];
  const rawEdges = useMemo(() => pages.flatMap((p) => p?.edges ?? []), [pages]);
  const discountEdges = rawEdges;

  // Derive available product types from the current result set
  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const e of discountEdges) {
      const t = inferType(e.node.title ?? "");
      if (t) counts[t] = (counts[t] ?? 0) + 1;
    }
    return counts;
  }, [discountEdges]);

  const availableTypes = useMemo(
    () => TYPE_PATTERNS.map((p) => p.label).filter((label) => (typeCounts[label] ?? 0) > 0),
    [typeCounts]
  );

  const edges = useMemo(() => {
    if (!typeFilter) return discountEdges;
    return discountEdges.filter((e: any) => inferType(e.node.title ?? "") === typeFilter);
  }, [discountEdges, typeFilter]);

  const title = data?.collection?.title ?? titleizeHandle(handle);
  const description = data?.collection?.description;


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
                {q.isLoading ? "Loading…" : `${edges.length} ${edges.length === 1 ? "Piece" : "Pieces"}`}
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
                  {q.isLoading ? "Loading…" : `${edges.length} ${edges.length === 1 ? "Piece" : "Pieces"}`}
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



            {/* Product type chips — derived from titles in the current result set */}
            {availableTypes.length > 1 && (
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
                {availableTypes.map((label) => (
                  <button
                    key={label}
                    onClick={() => setTypeFilter(typeFilter === label ? null : label)}
                    className={`text-[10px] uppercase tracking-[0.2em] px-3 py-1.5 border rounded-full transition-colors ${
                      typeFilter === label
                        ? "bg-ink text-canvas border-ink"
                        : "border-ink/15 text-muted-foreground hover:border-ink hover:text-ink"
                    }`}
                  >
                    {label}
                    <span className="ml-2 opacity-60">{typeCounts[label]}</span>
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
                {q.hasNextPage && (
                  <div className="mt-16 flex justify-center">
                    <button
                      onClick={() => q.fetchNextPage()}
                      disabled={q.isFetchingNextPage}
                      className="text-[11px] uppercase tracking-[0.25em] border border-ink px-8 py-3 hover:bg-ink hover:text-canvas transition-colors disabled:opacity-50"
                    >
                      {q.isFetchingNextPage ? "Loading…" : "Load More"}
                    </button>
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
