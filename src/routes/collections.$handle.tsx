import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { fetchCollectionFiltered, fetchCollection, type StorefrontFilterValue } from "@/lib/shopify";
import { ProductCard } from "@/components/product-card";
import { pageTitle, metaDescription, absoluteUrl, SITE_URL } from "@/lib/seo";
import {
  CatalogFilters,
  
  SortPresets,
  ActiveFilterPills,
  SORT_OPTIONS,
  type Selection,
  type SortValue,
} from "@/components/catalog-filters";

const SORT_VALUES = SORT_OPTIONS.map((o) => o.value);

// Map collections-index sort keys → per-collection sort values
const INDEX_SORT_ALIASES: Record<string, SortValue> = {
  popular: "BEST_SELLING-false",
  newest: "CREATED-true",
  alpha: "TITLE-false",
};

export const Route = createFileRoute("/collections/$handle")({
  validateSearch: (search: Record<string, unknown>): { sort: SortValue } => {
    const raw = typeof search.sort === "string" ? search.sort : "";
    if (SORT_VALUES.includes(raw as SortValue)) return { sort: raw as SortValue };
    if (raw in INDEX_SORT_ALIASES) return { sort: INDEX_SORT_ALIASES[raw] };
    return { sort: "BEST_SELLING-false" };
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
    const desc =
      metaDescription(loaderData?.description ?? "") ||
      `Shop ${title} from luxury designers at Palace of Roman. 100% authentic, worldwide shipping.`;
    const path = `/collections/${params.handle}`;
    const url = absoluteUrl(path);
    const meta = [
      { title: pageTitle(title) },
      { name: "description", content: desc },
      { property: "og:title", content: pageTitle(title) },
      { property: "og:description", content: desc },
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
            description: desc,
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
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
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

  // For /collections/high-discounts, fetch a wider window and filter client-side
  // to products that are 80–99% off (compareAtPrice vs price).
  const isHighDiscounts = handle === "high-discounts";

  const q = useQuery({
    queryKey: ["collection-filtered", handle, filterInputs, sortKey, reverse, isHighDiscounts],
    queryFn: () =>
      fetchCollectionFiltered({
        handle,
        first: isHighDiscounts ? 250 : 36,
        filters: filterInputs,
        sortKey,
        reverse,
      }),
  });

  const data = q.data;
  const filters = data?.filters ?? [];
  const rawEdges = data?.edges ?? [];
  const discountEdges = useMemo(() => {
    if (!isHighDiscounts) return rawEdges;
    return rawEdges.filter((e: any) => {
      const price = parseFloat(e.node.priceRange?.minVariantPrice?.amount ?? "0");
      const compare = parseFloat(e.node.compareAtPriceRange?.minVariantPrice?.amount ?? "0");
      if (!price || !compare || compare <= price) return false;
      const pct = ((compare - price) / compare) * 100;
      return pct >= 80 && pct <= 99;
    });
  }, [rawEdges, isHighDiscounts]);

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

  return (
    <div>
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
                extra={
                  handle !== "high-discounts" && (
                    <Link
                      to="/collections/$handle"
                      params={{ handle: "high-discounts" }}
                      className="text-[10px] uppercase tracking-[0.2em] px-3 py-2 border border-bronze/40 text-bronze hover:bg-bronze hover:text-canvas transition-colors"
                    >
                      High Discounts
                    </Link>
                  )
                }
              />
            </div>

            {/* Controls — Refine button only on mobile; desktop has the sidebar */}
            <div className="lg:hidden flex items-center justify-between gap-4 mb-6">
              <button
                onClick={() => setMobileFiltersOpen(true)}
                className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] border border-ink/15 px-3 py-2 hover:border-ink transition-colors"
              >
                <SlidersHorizontal className="h-3.5 w-3.5" /> Refine
              </button>
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

      {/* Refine drawer — available at all breakpoints */}
      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-50 flex">
          <button
            aria-label="Close filters"
            onClick={() => setMobileFiltersOpen(false)}
            className="flex-1 bg-ink/40 backdrop-blur-sm"
          />
          <div className="w-80 max-w-[85vw] bg-canvas h-full overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <span className="text-[11px] uppercase tracking-[0.25em]">Refine</span>
              <button onClick={() => setMobileFiltersOpen(false)} aria-label="Close">
                <X className="h-5 w-5" />
              </button>
            </div>
            {filters.length === 0 ? (
              <p className="text-xs text-muted-foreground leading-relaxed">
                No additional refinements available for this collection. Use sort to reorder.
              </p>
            ) : sidebar}
          </div>
        </div>
      )}
    </div>
  );
}
