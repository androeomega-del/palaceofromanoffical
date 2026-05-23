import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Search, X, Loader2 } from "lucide-react";
import { storefrontApiRequest, formatPrice, type Money } from "@/lib/shopify";
import { TRENDING_BRANDS } from "@/lib/luxury-brands";
import { AiSearchBar } from "@/components/ai-search-bar";
import { supabase } from "@/integrations/supabase/client";

type Props = { open: boolean; onOpenChange: (v: boolean) => void };

// ─── Predictive Search (Shopify Storefront API) ──────────────────────────────
// One round-trip returns products, collections, and pages. No client-side
// flat-list filtering — all matching is server-side, capped by per-type
// limits and ordered by Shopify's BEST_MATCH ranking.

type PredictiveProduct = {
  id: string;
  handle: string;
  title: string;
  vendor: string | null;
  priceRange: { minVariantPrice: Money };
  images: { edges: Array<{ node: { url: string; altText: string | null } }> };
};
type PredictiveCollection = { id: string; handle: string; title: string };

type PredictiveSearchResult = {
  products: PredictiveProduct[];
  collections: PredictiveCollection[];
};

// Targeted predictiveSearch — products + collections only. Pages are
// intentionally excluded: this storefront has no /pages/$handle route, so
// surfacing them would produce dead links.
const PREDICTIVE_SEARCH_QUERY = /* GraphQL */ `
  query PredictiveSearch($query: String!) {
    predictiveSearch(
      query: $query
      limitScope: EACH
      limit: 8
      types: [PRODUCT, COLLECTION]
    ) {
      products {
        id
        handle
        title
        vendor
        priceRange { minVariantPrice { amount currencyCode } }
        images(first: 1) { edges { node { url altText } } }
      }
      collections { id handle title }
    }
  }
`;

async function predictiveSearch(query: string): Promise<PredictiveSearchResult> {
  const empty: PredictiveSearchResult = { products: [], collections: [] };
  if (!query) return empty;
  const res = await storefrontApiRequest<{ predictiveSearch: PredictiveSearchResult }>(
    PREDICTIVE_SEARCH_QUERY,
    { query },
  );
  return res?.data?.predictiveSearch ?? empty;
}

function useDebounced<T>(value: T, ms: number): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

export function SearchOverlay({ open, onOpenChange }: Props) {
  const [q, setQ] = useState("");
  // 300ms debounce — prevents Storefront API spam on rapid typing.
  const debounced = useDebounced(q.trim(), 300);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Lock body + focus input + reset query on open/close
  useEffect(() => {
    if (!open) {
      setQ("");
      return;
    }
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const t = setTimeout(() => inputRef.current?.focus(), 30);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onOpenChange(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      clearTimeout(t);
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onOpenChange]);

  const searchQ = useQuery({
    queryKey: ["predictive-search", debounced],
    queryFn: () => predictiveSearch(debounced),
    enabled: open && debounced.length >= 2,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
  });

  const products = searchQ.data?.products ?? [];
  const collections = searchQ.data?.collections ?? [];
  const pages = searchQ.data?.pages ?? [];
  const isEmpty =
    searchQ.isFetched &&
    !searchQ.isFetching &&
    products.length === 0 &&
    collections.length === 0 &&
    pages.length === 0;

  // Log every settled search so the UGC recommender can surface high-intent
  // queries that returned nothing. Fire-and-forget; RLS allows anon inserts.
  useEffect(() => {
    if (!debounced || debounced.length < 2 || searchQ.isFetching || !searchQ.isFetched) return;
    void supabase.from("search_queries").insert({
      query: debounced.slice(0, 200),
      result_count: products.length + collections.length + pages.length,
      page_path: typeof window !== "undefined" ? window.location.pathname.slice(0, 500) : null,
      user_agent: typeof navigator !== "undefined" ? navigator.userAgent.slice(0, 500) : null,
    });
  }, [debounced, searchQ.isFetched, searchQ.isFetching, products.length, collections.length, pages.length]);

  function submitFullSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!debounced) return;
    navigate({ to: "/shop", search: { q: debounced } as never });
    onOpenChange(false);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70]">
      <div
        className="absolute inset-0 bg-ink/50 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
        aria-hidden="true"
      />
      <div className="relative bg-canvas border-b border-ink/10 shadow-2xl">
        <div className="max-w-screen-2xl mx-auto px-6 py-6">
          <form onSubmit={submitFullSearch} className="flex items-center gap-4 border-b border-ink/15 pb-4">
            <Search className="w-5 h-5 text-muted-foreground" strokeWidth={1.25} />
            <input
              ref={inputRef}
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search products, brands, collections…"
              className="flex-1 bg-transparent outline-none text-lg md:text-2xl font-serif placeholder:text-muted-foreground/60"
              aria-label="Search the boutique"
            />
            {searchQ.isFetching && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              aria-label="Close search"
              className="hover:text-bronze transition-colors"
            >
              <X className="w-5 h-5" strokeWidth={1.25} />
            </button>
          </form>

          <div className="mt-6 max-h-[70vh] overflow-y-auto">
            {!debounced && (
              <div>
                <AiSearchBar
                  onComplete={() => onOpenChange(false)}
                  className="mb-10"
                />
                <p className="text-[10px] uppercase tracking-[0.3em] text-bronze mb-5">
                  Trending Brands
                </p>
                <div className="flex flex-wrap gap-2.5 mb-10">
                  {TRENDING_BRANDS.map((b) => (
                    <Link
                      key={b.slug}
                      to="/brand/$vendor"
                      params={{ vendor: b.slug }}
                      onClick={() => onOpenChange(false)}
                      className="px-4 py-2 border border-ink/15 text-[11px] uppercase tracking-[0.2em] hover:border-ink hover:bg-ink hover:text-canvas transition-colors"
                    >
                      {b.name}
                    </Link>
                  ))}
                </div>
                <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground mb-3">
                  Quick Edits
                </p>
                <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
                  <Link onClick={() => onOpenChange(false)} to="/collections/$handle" params={{ handle: "new-arrivals" }} className="hover:text-bronze transition-colors">New Arrivals</Link>
                  <Link onClick={() => onOpenChange(false)} to="/collections/$handle" params={{ handle: "best-sellers" }} className="hover:text-bronze transition-colors">Best Sellers</Link>
                  <Link onClick={() => onOpenChange(false)} to="/swim" className="hover:text-bronze transition-colors">Swim & Resort</Link>
                  <Link onClick={() => onOpenChange(false)} to="/brands" className="hover:text-bronze transition-colors">All Designers</Link>
                </div>
                <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground mt-10">
                  Or type at least two characters to search the catalog.
                </p>
              </div>
            )}

            {debounced && debounced.length < 2 && (
              <p className="text-sm text-muted-foreground">Keep typing…</p>
            )}

            {debounced && debounced.length >= 2 && (
              <>
                {/* Loading skeleton — only on first load when there's no cached data yet */}
                {searchQ.isLoading && (
                  <div className="grid md:grid-cols-[260px_1fr] gap-10">
                    <div className="space-y-2">
                      {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="h-3 w-3/4 bg-muted animate-pulse" />
                      ))}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="animate-pulse">
                          <div className="aspect-[4/5] bg-muted mb-2" />
                          <div className="h-2 w-3/4 bg-muted" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Empty state — every type returned zero matches */}
                {!searchQ.isLoading && isEmpty && (
                  <div className="py-10 text-center">
                    <p className="text-sm text-ink">
                      No results found for{" "}
                      <span className="font-medium">"{debounced}"</span>.
                    </p>
                    <p className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground mt-2">
                      Try a designer, category, or piece — e.g. "Gucci loafers".
                    </p>
                  </div>
                )}

                {/* Results — collections / pages on the left, products on the right */}
                {!searchQ.isLoading && !isEmpty && (
                  <div className="grid md:grid-cols-[260px_1fr] gap-10">
                    <div className="space-y-8">
                      {collections.length > 0 && (
                        <div>
                          <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground mb-3">Collections</p>
                          <ul className="space-y-2">
                            {collections.map((c) => (
                              <li key={c.id}>
                                <Link
                                  to="/collections/$handle"
                                  params={{ handle: c.handle }}
                                  onClick={() => onOpenChange(false)}
                                  className="block py-1.5 text-sm hover:text-bronze transition-colors"
                                >
                                  {c.title}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {pages.length > 0 && (
                        <div>
                          <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground mb-3">Pages</p>
                          <ul className="space-y-2">
                            {pages.map((pg) => (
                              <li key={pg.id}>
                                <Link
                                  to="/pages/$handle"
                                  params={{ handle: pg.handle }}
                                  onClick={() => onOpenChange(false)}
                                  className="block py-1.5 text-sm hover:text-bronze transition-colors"
                                >
                                  {pg.title}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    <div>
                      <div className="flex items-baseline justify-between mb-3">
                        <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Products</p>
                        {products.length > 0 && (
                          <button
                            onClick={(e) => submitFullSearch(e as never)}
                            className="text-[10px] uppercase tracking-[0.25em] text-bronze hover:underline"
                          >
                            See all results →
                          </button>
                        )}
                      </div>

                      {products.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No products matched. Try a related collection.</p>
                      ) : (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {products.map((p) => {
                            const img = p.images.edges[0]?.node;
                            return (
                              <Link
                                key={p.id}
                                to="/product/$handle"
                                params={{ handle: p.handle }}
                                onClick={() => onOpenChange(false)}
                                className="group"
                              >
                                <div className="aspect-[4/5] bg-muted overflow-hidden mb-2">
                                  {img && (
                                    <img
                                      src={img.url}
                                      alt={img.altText ?? p.title}
                                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                      loading="lazy"
                                    />
                                  )}
                                </div>
                                <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground truncate">
                                  {p.vendor}
                                </p>
                                <p className="text-xs mt-0.5 truncate group-hover:text-bronze transition-colors">
                                  {p.title}
                                </p>
                                <p className="text-xs mt-0.5 text-muted-foreground">
                                  {formatPrice(p.priceRange.minVariantPrice)}
                                </p>
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
