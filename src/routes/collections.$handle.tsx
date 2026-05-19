import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { fetchCollectionFiltered, type StorefrontFilterValue } from "@/lib/shopify";
import { ProductCard } from "@/components/product-card";
import {
  CatalogFilters,
  CatalogSort,
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
  head: ({ params }) => {
    const title = titleizeHandle(params.handle);
    return {
      meta: [
        { title: `${title} — Palace of Roman` },
        { name: "description", content: `Shop ${title} from luxury designers at Palace of Roman.` },
        { property: "og:title", content: `${title} — Palace of Roman` },
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
    queryFn: () =>
      fetchCollectionFiltered({
        handle,
        first: 36,
        filters: filterInputs,
        sortKey,
        reverse,
      }),
  });

  const data = q.data;
  const filters = data?.filters ?? [];
  const edges = data?.edges ?? [];
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
            {/* Controls */}
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
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-16">
                {edges.map((e) => (
                  <ProductCard key={e.node.id} product={e} />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Mobile filters drawer */}
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
