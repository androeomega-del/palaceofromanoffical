import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { fetchCollections, type ShopifyCollection } from "@/lib/shopify";
import { collectionImage } from "@/lib/collection-image";
import { routeHead } from "@/lib/seo";
import { canonicalCollectionHandle as canonicalHandle } from "@/lib/collection-canonical";

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

// Curated list of "main" category collections shown on the index.
// Brand collections (gucci, prada, etc.) and deep sub-categories are excluded —
// they remain reachable from inside their parent collection / brand pages.
const MAIN_HANDLE_ALLOWLIST = new Set<string>([
  "women", "men",
  "women-clothing", "womens-clothing",
  "women-shoes", "womens-shoes",
  "women-bags", "womens-bags",
  "women-accessories", "womens-accessories", "womens-accessories-1",
  "men-clothing", "mens-clothing",
  "men-shoes", "mens-shoes",
  "men-bags", "mens-bags", "mens-wallets",
  "men-accessories", "mens-accessories",
  "accessories", "bags", "clothing", "shoes",
  "handbags", "backpacks", "boots", "loafers",
  "clutch-bags", "crossbody-bags", "shoulder-bags", "tote-bags",
  "hats", "gloves", "scarves", "belts", "wallets",
  "watches", "jewelry", "jewellery", "sunglasses", "necklaces",
  "shirts", "skirts", "suits", "swimwear", "sleepwear", "dresses",
  "other-accessories",
  "new-arrivals", "best-sellers", "best-selling-brands", "high-discounts", "sale", "on-sale",
]);

function isMainCollection(c: ShopifyCollection): boolean {
  return MAIN_HANDLE_ALLOWLIST.has(c.handle.toLowerCase());
}

function dedupeByCanonical(list: ShopifyCollection[]): ShopifyCollection[] {
  const seen = new Set<string>();
  const out: ShopifyCollection[] = [];
  for (const c of list) {
    const key = canonicalHandle(c.handle);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(c);
  }
  return out;
}

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
  head: () => {
    const title = "All Collections — Palace of Roman";
    const desc = "Browse every curated collection at Palace of Roman — women's, men's, designer edits and seasonal capsules.";
    const rh = routeHead({ path: "/collections", title, description: desc });
    return {
      meta: [{ title }, { name: "description", content: desc }, ...rh.meta],
      links: rh.links,
    };
  },
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
  return sorted;
}

// Editorial layout slot definitions — cycle of 5 per section.
// Slot 0: large feature (cols-7, 16:11)
// Slot 1: side offset (cols-5, 4:5, top-padded)
// Slot 2: 3-up (cols-4, 3:4)
// Slot 3: 3-up offset (cols-4, 3:4, top-padded)
// Slot 4: 3-up (cols-4, 3:4)
type SlotKind = "feature" | "side" | "trio" | "trio-offset";
const SLOT_PATTERN: SlotKind[] = ["feature", "side", "trio", "trio-offset", "trio"];

function slotFor(index: number): SlotKind {
  return SLOT_PATTERN[index % SLOT_PATTERN.length];
}

function CollectionsIndexPage() {
  const { filter, sort } = Route.useSearch();
  const navigate = useNavigate({ from: "/collections" });

  const q = useQuery({
    queryKey: ["collections-all"],
    queryFn: () => fetchCollections(500),
  });

  // Show every collection that has a main image set in Shopify
  // (deduped by canonical handle). Collections without an image are hidden
  // so the editorial grid never renders a placeholder card.
  const all = useMemo(
    () => dedupeByCanonical((q.data ?? []).filter((c) => !!c.image?.url)),
    [q.data],
  );
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
    <div className="bg-canvas text-ink">
      {/* Editorial header — oversized display + tracked-out chrome */}
      <header className="px-6 md:px-12 lg:px-20 pt-16 md:pt-24 pb-12">
        <div className="max-w-[1600px] mx-auto">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-10 border-b border-ink/10 pb-12">
            <div className="max-w-3xl">
              <span className="block text-[10px] tracking-[0.4em] uppercase text-ink/50 mb-6">
                The Index
              </span>
              <h1 className="font-serif font-light leading-[0.85] tracking-tight text-6xl md:text-8xl lg:text-9xl">
                All Collections
              </h1>
            </div>

            <div className="flex flex-col lg:items-end gap-6">
              <span className="text-[11px] tracking-[0.25em] uppercase text-ink/40 italic">
                {q.isLoading
                  ? "Loading curated series…"
                  : `${collections.length} of ${all.length} curated series`}
              </span>

              {/* Refined typographic filter chrome */}
              <nav className="flex flex-wrap gap-x-8 gap-y-4">
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
                      className={`relative text-[11px] tracking-[0.25em] uppercase transition-opacity ${
                        active
                          ? "font-semibold opacity-100"
                          : "opacity-40 hover:opacity-100"
                      } ${disabled ? "opacity-20 cursor-not-allowed hover:opacity-20" : ""}`}
                    >
                      <span className="flex items-center gap-1.5">
                        {f.label}
                        {!q.isLoading && f.key !== "all" && (
                          <span className="text-[9px] opacity-60">({count})</span>
                        )}
                      </span>
                      {active && (
                        <span className="absolute -bottom-1.5 left-0 w-full h-px bg-bronze" />
                      )}
                    </button>
                  );
                })}

                <span className="hidden lg:block h-4 w-px bg-ink/10 self-center" />

                <label className="flex items-center gap-2">
                  <span className="text-[10px] tracking-[0.25em] uppercase opacity-40">Sort by</span>
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
                    className="bg-transparent text-[11px] tracking-[0.25em] uppercase font-medium outline-none cursor-pointer"
                  >
                    {SORTS.map((s) => (
                      <option key={s.key} value={s.key}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </label>
              </nav>
            </div>
          </div>
        </div>
      </header>

      {/* Editorial asymmetric grid */}
      <main className="px-6 md:px-12 lg:px-20 pb-24">
        <div className="max-w-[1600px] mx-auto">
          {q.isLoading ? (
            <EditorialSkeleton />
          ) : collections.length === 0 ? (
            <div className="py-32 text-center">
              <p className="text-sm text-ink/60 mb-6">No collections match this filter.</p>
              <button
                onClick={() => navigate({ search: { filter: "all", sort }, replace: true })}
                className="text-[11px] uppercase tracking-[0.3em] border-b border-ink pb-1 hover:text-bronze hover:border-bronze transition-colors"
              >
                View All Collections
              </button>
            </div>
          ) : (
            <div
              className="grid grid-cols-1 md:grid-cols-12 gap-x-8 gap-y-20 md:gap-y-24 items-start"
              data-testid="collection-grid"
            >
              {collections.map((c, i) => (
                <CollectionCard
                  key={c.id}
                  collection={c}
                  slot={slotFor(i)}
                  index={i}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function CollectionCard({
  collection: c,
  slot,
  index,
}: {
  collection: ShopifyCollection;
  slot: SlotKind;
  index: number;
}) {
  const shopifyImg = c.image;
  const fallbackUrl = collectionImage({ title: c.title, handle: c.handle, description: c.description });
  const imgUrl = shopifyImg?.url ?? fallbackUrl;
  const imgWidth = shopifyImg?.width ?? 1200;
  const imgHeight = shopifyImg?.height ?? 1500;
  const objectPosition = "50% 50%";
  const alt = shopifyImg?.altText ?? `${c.title} collection at Palace of Roman`;

  const wrapperClass =
    slot === "feature"
      ? "md:col-span-7 group cursor-pointer"
      : slot === "side"
        ? "md:col-span-5 md:pt-32 lg:pt-40 group cursor-pointer"
        : slot === "trio-offset"
          ? "md:col-span-4 md:pt-16 lg:pt-20 group cursor-pointer"
          : "md:col-span-4 group cursor-pointer";

  const aspectClass =
    slot === "feature"
      ? "aspect-[4/5] md:aspect-[16/11]"
      : slot === "side"
        ? "aspect-[4/5]"
        : "aspect-[3/4]";

  const titleClass =
    slot === "feature"
      ? "text-5xl md:text-6xl lg:text-7xl"
      : slot === "side"
        ? "text-4xl md:text-5xl"
        : "text-2xl md:text-3xl";

  const numLabel = String(index + 1).padStart(2, "0");

  return (
    <Link
      to="/collections/$handle"
      params={{ handle: c.handle }}
      className={wrapperClass}
      data-testid="collection-card"
      data-handle={c.handle}
    >
      <div className={`relative ${aspectClass} mb-7 overflow-hidden bg-canvas-raised`}>
        <img
          src={imgUrl}
          alt={alt}
          loading={index < 2 ? "eager" : "lazy"}
          decoding="async"
          width={imgWidth}
          height={imgHeight}
          style={{ objectPosition }}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-[1500ms] ease-out group-hover:scale-[1.05]"
        />

        {slot === "feature" ? (
          <>
            <div className="absolute inset-0 bg-ink/5 group-hover:bg-transparent transition-colors duration-700" />
            <div className="absolute inset-0 bg-gradient-to-t from-ink/55 via-ink/10 to-transparent" />
            <div className="absolute bottom-8 left-8 md:bottom-14 md:left-14 max-w-[80%]">
              <span className="block text-[10px] tracking-[0.4em] uppercase text-canvas/85 mb-3">
                The Edit
              </span>
              <h2 className={`font-serif font-light text-canvas leading-[0.9] text-balance ${titleClass}`}>
                {c.title}
              </h2>
            </div>
          </>
        ) : (
          <div className="absolute inset-0 border-0 group-hover:border-[12px] border-canvas/10 transition-all duration-700" />
        )}

        {/* Subtle index numeral as editorial mark */}
        <span className="absolute top-5 right-5 text-[10px] tracking-[0.3em] text-canvas/70 mix-blend-difference">
          {numLabel}
        </span>
      </div>

      {slot === "feature" ? (
        <div className="flex flex-col md:flex-row justify-between gap-4 md:gap-6 px-1">
          <p className="text-[12px] leading-relaxed text-ink/60 max-w-sm">
            A rigorous selection of {c.title.toLowerCase()} — curated for the modern eye.
          </p>
          <span className="text-[11px] tracking-[0.3em] uppercase font-medium border-b border-bronze pb-1 group-hover:text-bronze transition-colors whitespace-nowrap self-start">
            Shop the series —
          </span>
        </div>
      ) : (
        <div className="px-1">
          <span className="block text-[10px] tracking-[0.4em] uppercase text-ink/50 mb-2">
            The Edit
          </span>
          <h2 className={`font-serif font-light mb-5 leading-tight text-balance ${titleClass}`}>
            {c.title}
          </h2>
          <span className="text-[11px] tracking-[0.3em] uppercase text-ink/70 group-hover:text-bronze transition-colors">
            Shop {c.title} →
          </span>
        </div>
      )}
    </Link>
  );
}

function EditorialSkeleton() {
  const slots = Array.from({ length: 10 }).map((_, i) => slotFor(i));
  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-x-8 gap-y-24 items-start">
      {slots.map((slot, i) => {
        const wrap =
          slot === "feature"
            ? "md:col-span-7"
            : slot === "side"
              ? "md:col-span-5 md:pt-40"
              : slot === "trio-offset"
                ? "md:col-span-4 md:pt-20"
                : "md:col-span-4";
        const aspect =
          slot === "feature"
            ? "aspect-[16/11]"
            : slot === "side"
              ? "aspect-[4/5]"
              : "aspect-[3/4]";
        return (
          <div key={i} className={`${wrap} animate-pulse`}>
            <div className={`w-full ${aspect} bg-canvas-raised mb-6`} />
            <div className="h-3 w-1/3 bg-canvas-raised mb-3" />
            <div className="h-5 w-2/3 bg-canvas-raised" />
          </div>
        );
      })}
    </div>
  );
}
