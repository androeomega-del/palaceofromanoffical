import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";

import { fetchCollectionFiltered, fetchCollection, type StorefrontFilterValue } from "@/lib/shopify";
import { ProductCard } from "@/components/product-card";
import { absoluteUrl, SITE_URL } from "@/lib/seo";
import { collectionSeo } from "@/lib/collection-seo";
import {
  CatalogFilters,
  SortPresets,
  ActiveFilterPills,
  SORT_OPTIONS,
  type Selection,
  type SortValue,
} from "@/components/catalog-filters";
import { HeroFocalOverlay } from "@/components/hero-focal-overlay";

const SORT_VALUES = SORT_OPTIONS.map((o) => o.value);

// Map collections-index sort keys → per-collection sort values
const INDEX_SORT_ALIASES: Record<string, SortValue> = {
  popular: "BEST_SELLING-false",
  newest: "CREATED-true",
  alpha: "TITLE-false",
};

export const Route = createFileRoute("/collections/$handle")({
  validateSearch: (search: Record<string, unknown>): { sort: SortValue; edit?: "focal" } => {
    const raw = typeof search.sort === "string" ? search.sort : "";
    const edit = search.edit === "focal" ? ("focal" as const) : undefined;
    let sort: SortValue;
    if (SORT_VALUES.includes(raw as SortValue)) sort = raw as SortValue;
    else if (raw in INDEX_SORT_ALIASES) sort = INDEX_SORT_ALIASES[raw];
    else sort = "BEST_SELLING-false";
    return edit ? { sort, edit } : { sort };
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
  const { sort, edit } = Route.useSearch();
  const navigate = useNavigate({ from: "/collections/$handle" });
  const setSort = (v: SortValue) =>
    navigate({ search: (prev: { sort: SortValue }) => ({ ...prev, sort: v }), replace: true });

  const [selections, setSelections] = useState<Selection[]>([]);
  const [priceRange, setPriceRange] = useState<{ min: number; max: number } | null>(null);
  
  const [typeFilter, setTypeFilter] = useState<string | null>(null);

  // Keyword-based product type derivation. The Shopify product_type field on
  // this store is inconsistent, so we infer category from the product title.
  // Order matters — more specific patterns first (t-shirt before shirt).
  const TYPE_PATTERNS: { label: string; test: RegExp }[] = [
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

  const q = useQuery({
    queryKey: ["collection-filtered", handle, filterInputs, sortKey, reverse],
    queryFn: async () => {
      return fetchCollectionFiltered({
        handle,
        first: 36,
        filters: filterInputs,
        sortKey,
        reverse,
      });
    },
  });

  const data = q.data;
  const filters = data?.filters ?? [];
  const rawEdges = data?.edges ?? [];
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

  const editing = edit === "focal";
  const parsedFocal = (() => {
    const m = heroFocal.match(/(-?\d+(?:\.\d+)?)%\s+(-?\d+(?:\.\d+)?)%/);
    return m ? { x: parseFloat(m[1]), y: parseFloat(m[2]) } : { x: 50, y: 40 };
  })();
  const [liveFocal, setLiveFocal] = useState<{ x: number; y: number } | null>(null);
  const renderedFocal = liveFocal ?? parsedFocal;
  const hasSavedOverride = false;

  return (
    <div>
      <section
        className="relative h-[42vh] min-h-[280px] max-h-[520px] w-full overflow-hidden bg-ink/5"
        data-testid="collection-hero"
        data-handle={handle.toLowerCase()}
      >
        {(() => {
          const r = responsiveCollectionImage(heroSrc, {
            widths: HERO_RESPONSIVE_WIDTHS,
            sizes: "100vw",
          });
          return (
            <img
              src={r.src}
              srcSet={r.srcSet}
              sizes={r.sizes}
              alt={heroAlt}
              loading="eager"
              fetchPriority="high"
              decoding="async"
              className="absolute inset-0 h-full w-full object-cover"
              style={{ objectPosition: `${renderedFocal.x}% ${renderedFocal.y}%` }}
              data-testid="collection-hero-img"
            />
          );
        })()}
        {!editing && (
          <div className="absolute inset-0 bg-gradient-to-t from-canvas via-canvas/40 to-transparent" />
        )}
        {editing && (
          <HeroFocalOverlay
            handle={handle.toLowerCase()}
            initialFocal={parsedFocal}
            hasSavedOverride={hasSavedOverride}
            onLiveChange={setLiveFocal}
            onExit={() =>
              navigate({ search: { sort }, replace: true })
            }
          />
        )}
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

      <section className="px-6 py-12">
        <div className="max-w-screen-2xl mx-auto flex gap-10">
          {/* Desktop sidebar */}
          <div className="hidden lg:block">{sidebar}</div>

          {/* Main column */}
          <div className="flex-1 min-w-0">
            {/* Quick sort presets */}
            <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
              <SortPresets
                value={sort}
                onChange={setSort}
              />
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
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-16">
                {edges.map((e) => (
                  <ProductCard key={e.node.id} product={e} />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

    </div>
  );
}
