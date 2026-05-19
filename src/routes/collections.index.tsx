import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { fetchCollections, type ShopifyCollection } from "@/lib/shopify";

type FilterKey = "all" | "women" | "men" | "clothing" | "shoes" | "luxury";

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "women", label: "Women" },
  { key: "men", label: "Men" },
  { key: "clothing", label: "Clothing" },
  { key: "shoes", label: "Shoes" },
  { key: "luxury", label: "Luxury" },
];

const FILTER_KEYS: FilterKey[] = FILTERS.map((f) => f.key);

type SortKey = "popular" | "newest" | "alpha";
const SORTS: { key: SortKey; label: string }[] = [
  { key: "popular", label: "Popularity" },
  { key: "newest", label: "Newest" },
  { key: "alpha", label: "A–Z" },
];
const SORT_KEYS: SortKey[] = SORTS.map((s) => s.key);

export const Route = createFileRoute("/collections/")({
  validateSearch: (search: Record<string, unknown>): { filter: FilterKey; sort: SortKey } => {
    const rawFilter = typeof search.filter === "string" ? (search.filter as FilterKey) : "all";
    const rawSort = typeof search.sort === "string" ? (search.sort as SortKey) : "popular";
    return {
      filter: FILTER_KEYS.includes(rawFilter) ? rawFilter : "all",
      sort: SORT_KEYS.includes(rawSort) ? rawSort : "popular",
    };
  },
  head: () => ({
    meta: [
      { title: "All Collections — Palace of Roman" },
      { name: "description", content: "Browse every curated collection at Palace of Roman — women's, men's, designer edits and seasonal capsules." },
      { property: "og:title", content: "All Collections — Palace of Roman" },
    ],
  }),
  component: CollectionsIndexPage,
});

function matchesFilter(c: ShopifyCollection, filter: FilterKey): boolean {
  if (filter === "all") return true;
  const hay = `${c.title} ${c.handle} ${c.description ?? ""}`.toLowerCase();
  switch (filter) {
    case "women":
      return /\b(women|woman|womens|women's|ladies|female)\b/.test(hay);
    case "men":
      return /\b(men|mens|men's|male)\b/.test(hay) && !/\b(women|woman|womens)\b/.test(hay);
    case "clothing":
      return /(clothing|apparel|dress|tops|outerwear|jacket|coat|knit|tailoring|suit|skirt|pants|trouser|shirt|blouse|ready[- ]?to[- ]?wear)/.test(hay);
    case "shoes":
      return /(shoe|shoes|footwear|sneaker|boot|heel|pump|sandal|loafer|mule|stiletto)/.test(hay);
    case "luxury":
      return /(luxury|designer|premium|haute|couture|maison)/.test(hay);
  }
}

export function sortCollections(list: ShopifyCollection[], sort: SortKey): ShopifyCollection[] {
  const sorted = [...list];
  if (sort === "alpha") {
    sorted.sort((a, b) => a.title.localeCompare(b.title));
  } else if (sort === "newest") {
    sorted.sort((a, b) => (b.updatedAt ?? "").localeCompare(a.updatedAt ?? ""));
  }
  // "popular" preserves Shopify's storefront order (manual/best-seller curated)
  return sorted;
}

function CollectionsIndexPage() {
  const { filter, sort } = Route.useSearch();
  const navigate = useNavigate({ from: "/collections" });

  const q = useQuery({
    queryKey: ["collections-all"],
    queryFn: () => fetchCollections(100),
  });

  const all = q.data ?? [];
  const collections = useMemo(
    () => sortCollections(all.filter((c) => matchesFilter(c, filter)), sort),
    [all, filter, sort],
  );

  const counts = useMemo(() => {
    const result: Record<FilterKey, number> = { all: 0, women: 0, men: 0, clothing: 0, shoes: 0, luxury: 0 };
    for (const c of all) {
      for (const f of FILTER_KEYS) if (matchesFilter(c, f)) result[f]++;
    }
    return result;
  }, [all]);

  return (
    <div>
      <section className="px-6 pt-12 pb-8 border-b border-ink/5">
        <div className="max-w-screen-2xl mx-auto">
          <p className="text-[10px] uppercase tracking-[0.25em] text-bronze mb-3">The Index</p>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <h1 className="text-4xl md:text-6xl font-serif">All Collections</h1>
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              {q.isLoading
                ? "Loading…"
                : `${collections.length} of ${all.length} ${all.length === 1 ? "Collection" : "Collections"}`}
            </p>
          </div>
        </div>
      </section>

      <section className="px-6 pt-8 pb-6 border-b border-ink/5">
        <div className="max-w-screen-2xl mx-auto flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="flex flex-wrap gap-2 md:gap-3">
            {FILTERS.map((f) => {
              const active = filter === f.key;
              const count = counts[f.key];
              const disabled = !q.isLoading && count === 0 && f.key !== "all";
              return (
                <button
                  key={f.key}
                  disabled={disabled}
                  onClick={() =>
                    navigate({
                      search: (prev: { filter: FilterKey; sort: SortKey }) => ({ ...prev, filter: f.key }),
                      replace: true,
                    })
                  }
                  className={`text-[11px] uppercase tracking-[0.25em] px-4 py-2.5 border transition-colors ${
                    active
                      ? "bg-ink text-canvas border-ink"
                      : "border-ink/15 hover:border-ink hover:text-bronze"
                  } ${disabled ? "opacity-30 cursor-not-allowed hover:border-ink/15 hover:text-inherit" : ""}`}
                >
                  {f.label}
                  {!q.isLoading && f.key !== "all" && (
                    <span className="ml-2 opacity-60">({count})</span>
                  )}
                </button>
              );
            })}
          </div>

          <label className="flex items-center gap-3 text-[11px] uppercase tracking-[0.25em] text-muted-foreground self-start lg:self-auto">
            Sort
            <select
              value={sort}
              onChange={(e) =>
                navigate({
                  search: (prev: { filter: FilterKey; sort: SortKey }) => ({
                    ...prev,
                    sort: e.target.value as SortKey,
                  }),
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


      <section className="px-6 py-16">
        <div className="max-w-screen-2xl mx-auto">
          {q.isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-12">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="w-full aspect-[3/4] bg-muted mb-5" />
                  <div className="h-3 w-3/4 bg-muted" />
                </div>
              ))}
            </div>
          ) : collections.length === 0 ? (
            <div className="py-24 text-center">
              <p className="text-sm text-muted-foreground mb-6">No collections match this filter.</p>
              <button
                onClick={() => navigate({ search: { filter: "all", sort }, replace: true })}
                className="text-[11px] uppercase tracking-[0.25em] border-b border-ink pb-1 hover:text-bronze hover:border-bronze"
              >
                View All Collections
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-14">
              {collections.map((c) => (
                <Link
                  key={c.id}
                  to="/collections/$handle"
                  params={{ handle: c.handle }}
                  className="group block"
                >
                  <div className="w-full aspect-[3/4] bg-muted overflow-hidden mb-5 relative">
                    {c.image ? (
                      <img
                        src={c.image.url}
                        alt={c.image.altText ?? c.title}
                        loading="lazy"
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                      />
                    ) : (
                      <div className="absolute inset-0 grid place-items-center">
                        <span className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
                          {c.title}
                        </span>
                      </div>
                    )}
                  </div>
                  <h2 className="text-base md:text-lg font-serif group-hover:text-bronze transition-colors">
                    {c.title}
                  </h2>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
