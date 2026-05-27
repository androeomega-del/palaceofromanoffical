import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useInfiniteQuery } from "@tanstack/react-query";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";
import { useMemo, useState, useEffect } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import {
  fetchSearchFiltered,
  fetchCollectionFiltered,
  type StorefrontFilterValue,
} from "@/lib/shopify";
import { ProductCard } from "@/components/product-card";
import {
  CatalogFilters,
  CatalogSort,
  ActiveFilterPills,
  TaxonomyFilters,
  type Selection,
  type SortValue,
} from "@/components/catalog-filters";
import {
  ClientFacets,
  ClientFacetPills,
  applyClientFacets,
  emptyClientFacetState,
  clientFacetCount,
  type ClientFacetState,
} from "@/components/client-facets";
import { findCategory, type Gender } from "@/lib/shop-taxonomy";
import { routeHead } from "@/lib/seo";

const sortValues = [
  "BEST_SELLING-false",
  "CREATED-true",
  "PRICE-false",
  "PRICE-true",
  "TITLE-false",
] as const;

const shopSearch = z.object({
  q: fallback(z.string(), "").default(""),
  title: fallback(z.string(), "").default(""),
  gender: fallback(z.enum(["Women", "Men", "Unisex"]).optional(), undefined),
  collection: fallback(z.string(), "").default(""),
  sort: fallback(z.enum(sortValues), "BEST_SELLING-false").default("BEST_SELLING-false"),
  min: fallback(z.coerce.number().int().nonnegative().optional(), undefined),
  max: fallback(z.coerce.number().int().nonnegative().optional(), undefined),
  inStock: fallback(z.coerce.boolean(), true).default(true),
});

export const Route = createFileRoute("/shop")({
  validateSearch: zodValidator(shopSearch),
  head: () => {
    const title = "Shop All — Palace of Roman";
    const desc =
      "Shop the entire Palace of Roman catalog of luxury designer fashion — filter by gender, category, brand, color, size and price.";
    const rh = routeHead({ path: "/shop", title, description: desc });
    return {
      meta: [{ title }, { name: "description", content: desc }, ...rh.meta],
      links: rh.links,
    };
  },
  component: ShopPage,
});

function mapSearchSort(sort: SortValue): { sortKey: string; reverse: boolean } {
  switch (sort) {
    case "PRICE-false": return { sortKey: "PRICE", reverse: false };
    case "PRICE-true":  return { sortKey: "PRICE", reverse: true };
    default:            return { sortKey: "RELEVANCE", reverse: false };
  }
}
function mapCollectionSort(sort: SortValue): { sortKey: string; reverse: boolean } {
  switch (sort) {
    case "PRICE-false":         return { sortKey: "PRICE", reverse: false };
    case "PRICE-true":          return { sortKey: "PRICE", reverse: true };
    case "CREATED-true":        return { sortKey: "CREATED", reverse: true };
    case "TITLE-false":         return { sortKey: "TITLE", reverse: false };
    case "BEST_SELLING-false":
    default:                    return { sortKey: "BEST_SELLING", reverse: false };
  }
}

function ShopPage() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/shop" });

  // Local search input (debounced into URL)
  const [queryDraft, setQueryDraft] = useState(search.q ?? "");
  useEffect(() => { setQueryDraft(search.q ?? ""); }, [search.q]);

  // Dynamic facet selections — kept in component state (encoded JSON inputs)
  const [selections, setSelections] = useState<Selection[]>([]);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Reset facet selections whenever scope changes (gender/collection/q)
  useEffect(() => {
    setSelections([]);
  }, [search.gender, search.collection, search.q]);

  const priceRange = useMemo(
    () =>
      search.min != null && search.max != null
        ? { min: search.min, max: search.max }
        : null,
    [search.min, search.max],
  );

  const category = findCategory(search.collection || undefined) ?? null;
  const gender: Gender | null = search.gender ?? null;

  // Build filter inputs (dynamic facet selections + price)
  const filterInputs = useMemo(() => {
    const arr: object[] = selections.map((s) => JSON.parse(s.input));
    if (priceRange) arr.push({ price: { min: priceRange.min, max: priceRange.max } });
    return arr;
  }, [selections, priceRange]);

  // Branch fetcher: collection-scoped vs storefront search
  const useCollection = !!category;
  const queryKey = useCollection
    ? ["shop-collection", category!.handle, filterInputs, search.sort, search.inStock]
    : ["shop-search", search.q || "*", search.gender ?? "any", filterInputs, search.sort, search.inStock];

  const q = useInfiniteQuery({
    queryKey,
    initialPageParam: null as string | null,
    queryFn: ({ pageParam }) => {
      if (useCollection) {
        const { sortKey, reverse } = mapCollectionSort(search.sort);
        return fetchCollectionFiltered({
          handle: category!.handle,
          first: 36,
          after: pageParam,
          filters: [
            ...filterInputs,
            ...(search.inStock ? [{ available: true }] : []),
            ...(gender ? [{ tag: gender }] : []),
          ],
          sortKey,
          reverse,
        }).then((r) => r ?? { collection: null, filters: [], edges: [], pageInfo: { hasNextPage: false, endCursor: null } });
      }
      const { sortKey, reverse } = mapSearchSort(search.sort);
      const composed = [search.q, gender ? `tag:"${gender}"` : ""]
        .filter(Boolean)
        .join(" ")
        .trim() || "*";
      return fetchSearchFiltered({
        query: composed,
        first: 36,
        after: pageParam,
        filters: filterInputs,
        sortKey,
        reverse,
        available: search.inStock,
      });
    },
    getNextPageParam: (last) => (last.pageInfo.hasNextPage ? last.pageInfo.endCursor : undefined),
  });

  const filters = q.data?.pages?.[0]?.filters ?? [];
  const edges = useMemo(() => q.data?.pages.flatMap((p) => p.edges) ?? [], [q.data]);
  const selectedInputs = useMemo(() => new Set(selections.map((s) => s.input)), [selections]);

  // URL helpers
  const update = (patch: Partial<typeof search>) =>
    navigate({ search: { ...search, ...patch }, replace: true });

  const toggle = (filterId: string, v: StorefrontFilterValue) => {
    setSelections((curr) =>
      curr.some((s) => s.input === v.input)
        ? curr.filter((s) => s.input !== v.input)
        : [...curr, { id: v.id, label: v.label, input: v.input, filterId }],
    );
  };
  const removeOne = (input: string) =>
    setSelections((c) => c.filter((s) => s.input !== input));
  const clearAll = () => {
    setSelections([]);
    update({ gender: undefined, collection: "", min: undefined, max: undefined });
  };

  const setPriceRange = (range: { min: number; max: number } | null) =>
    update({ min: range?.min, max: range?.max });

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    update({ q: queryDraft.trim() });
  };

  const headerTitle =
    search.title ||
    category?.label ||
    (gender ? `${gender}'s Boutique` : "The Boutique");

  const sidebar = (
    <aside className="w-full lg:w-64 lg:flex-shrink-0">
      <h2 className="text-[11px] uppercase tracking-[0.25em] mb-3 pb-3 border-b border-ink/10">
        Refine
      </h2>
      <TaxonomyFilters
        gender={gender}
        category={search.collection || null}
        onGenderChange={(g) => update({ gender: g ?? undefined })}
        onCategoryChange={(h) => update({ collection: h ?? "" })}
      />
      <CatalogFilters
        filters={filters}
        selectedInputs={selectedInputs}
        priceRange={priceRange}
        onToggle={toggle}
        onPriceChange={setPriceRange}
      />
    </aside>
  );

  return (
    <div>
      <section className="px-6 pt-12 pb-8 border-b border-ink/5">
        <div className="max-w-screen-2xl mx-auto">
          <p className="text-[10px] uppercase tracking-[0.25em] text-bronze mb-3">
            {search.q ? `Results for "${search.q}"` : "Shop All"}
          </p>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <h1 className="text-4xl md:text-6xl font-serif">{headerTitle}</h1>
              <p className="mt-2 text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                {search.inStock ? "In stock now" : "Full archive"}
              </p>
            </div>
            <form onSubmit={submitSearch} className="md:w-80 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                value={queryDraft}
                onChange={(e) => setQueryDraft(e.target.value)}
                placeholder="Search the maison, piece, mood…"
                aria-label="Search products"
                className="w-full pl-10 pr-10 py-3 text-xs uppercase tracking-[0.2em] bg-transparent border border-ink/20 focus:border-ink focus:outline-none"
              />
              {queryDraft && (
                <button
                  type="button"
                  onClick={() => { setQueryDraft(""); update({ q: "" }); }}
                  aria-label="Clear search"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-ink"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </form>
          </div>
          <p className="mt-4 text-xs uppercase tracking-[0.2em] text-muted-foreground">
            {q.isLoading ? "Loading…" : `${edges.length}${q.hasNextPage ? "+" : ""} Pieces`}
          </p>
        </div>
      </section>

      <section className="px-6 py-12">
        <div className="max-w-screen-2xl mx-auto flex gap-10">
          <div className="hidden lg:block">{sidebar}</div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setMobileFiltersOpen(true)}
                  className="lg:hidden inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] border border-ink/15 px-3 py-2"
                >
                  <SlidersHorizontal className="h-3.5 w-3.5" /> Filters
                </button>
                <button
                  onClick={() => update({ inStock: !search.inStock })}
                  aria-pressed={search.inStock}
                  className={
                    "inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] border px-3 py-2 transition-colors " +
                    (search.inStock
                      ? "bg-ink text-canvas border-ink"
                      : "border-ink/20 hover:border-ink")
                  }
                >
                  <span className={"h-1.5 w-1.5 rounded-full " + (search.inStock ? "bg-canvas" : "bg-ink/40")} />
                  In Stock Only
                </button>
              </div>
              <CatalogSort value={search.sort} onChange={(s) => update({ sort: s })} />
            </div>

            <ActiveFilterPills
              selections={selections}
              priceRange={priceRange}
              gender={gender}
              category={category}
              onRemove={removeOne}
              onClearPrice={() => update({ min: undefined, max: undefined })}
              onClearGender={() => update({ gender: undefined })}
              onClearCategory={() => update({ collection: "" })}
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
                <p className="text-sm text-muted-foreground mb-6">No pieces match the current filters.</p>
                {(selections.length > 0 || priceRange || gender || category) && (
                  <button onClick={clearAll} className="text-[11px] uppercase tracking-[0.25em] border-b border-ink pb-1 hover:text-bronze hover:border-bronze">
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
          </div>
        </div>
      </section>

      {mobileFiltersOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <button aria-label="Close filters" onClick={() => setMobileFiltersOpen(false)} className="flex-1 bg-ink/40 backdrop-blur-sm" />
          <div className="w-80 max-w-[85vw] bg-canvas h-full overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <span className="text-[11px] uppercase tracking-[0.25em]">Filters</span>
              <button onClick={() => setMobileFiltersOpen(false)}><X className="h-5 w-5" /></button>
            </div>
            {sidebar}
          </div>
        </div>
      )}
    </div>
  );
}
