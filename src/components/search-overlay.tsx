import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Search, X, Loader2 } from "lucide-react";
import { fetchCollections, fetchProductsPage, formatPrice, type ShopifyProduct, type ShopifyCollection } from "@/lib/shopify";
import { TRENDING_BRANDS } from "@/lib/luxury-brands";
import { AiSearchBar } from "@/components/ai-search-bar";
import { supabase } from "@/integrations/supabase/client";

type Props = { open: boolean; onOpenChange: (v: boolean) => void };

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
  const debounced = useDebounced(q.trim(), 200);
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

  // Cache collections (cheap, low-cardinality) and filter client-side.
  const collectionsQ = useQuery({
    queryKey: ["all-collections-for-search"],
    queryFn: () => fetchCollections(500),
    staleTime: 1000 * 60 * 10,
    enabled: open,
  });

  const matchedCollections = useMemo<ShopifyCollection[]>(() => {
    if (!debounced) return [];
    const needle = debounced.toLowerCase();
    return (collectionsQ.data ?? [])
      .filter((c) => c.title.toLowerCase().includes(needle) || c.handle.toLowerCase().includes(needle))
      .slice(0, 6);
  }, [debounced, collectionsQ.data]);

  // Live product search via Storefront API.
  const productsQ = useQuery({
    queryKey: ["search-products", debounced],
    queryFn: () => fetchProductsPage({ first: 8, query: debounced, sortKey: "RELEVANCE" }),
    enabled: open && debounced.length >= 2,
    staleTime: 1000 * 30,
  });

  const products: ShopifyProduct[] = productsQ.data?.edges ?? [];

  // Log every settled search so the UGC recommender can surface high-intent
  // queries that returned nothing. Fire-and-forget; RLS allows anon inserts.
  useEffect(() => {
    if (!debounced || debounced.length < 2 || productsQ.isFetching || !productsQ.isFetched) return;
    void supabase.from("search_queries").insert({
      query: debounced.slice(0, 200),
      result_count: products.length,
      page_path: typeof window !== "undefined" ? window.location.pathname.slice(0, 500) : null,
      user_agent: typeof navigator !== "undefined" ? navigator.userAgent.slice(0, 500) : null,
    });
  }, [debounced, productsQ.isFetched, productsQ.isFetching, products.length]);

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
            {productsQ.isFetching && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
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

            {debounced && (
              <div className="grid md:grid-cols-[260px_1fr] gap-10">
                {/* Collections column */}
                <div>
                  <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground mb-3">Collections</p>
                  {collectionsQ.isLoading ? (
                    <p className="text-sm text-muted-foreground">Loading…</p>
                  ) : matchedCollections.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No matches.</p>
                  ) : (
                    <ul className="space-y-2">
                      {matchedCollections.map((c) => (
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
                  )}
                </div>

                {/* Products column */}
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

                  {debounced.length < 2 ? (
                    <p className="text-sm text-muted-foreground">Keep typing…</p>
                  ) : productsQ.isLoading ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="animate-pulse">
                          <div className="aspect-[4/5] bg-muted mb-2" />
                          <div className="h-2 w-3/4 bg-muted" />
                        </div>
                      ))}
                    </div>
                  ) : products.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No products found for "{debounced}".</p>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {products.map((p) => {
                        const img = p.node.images.edges[0]?.node;
                        return (
                          <Link
                            key={p.node.id}
                            to="/product/$handle"
                            params={{ handle: p.node.handle }}
                            onClick={() => onOpenChange(false)}
                            className="group"
                          >
                            <div className="aspect-[4/5] bg-muted overflow-hidden mb-2">
                              {img && (
                                <img
                                  src={img.url}
                                  alt={img.altText ?? p.node.title}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                  loading="lazy"
                                />
                              )}
                            </div>
                            <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground truncate">
                              {p.node.vendor}
                            </p>
                            <p className="text-xs mt-0.5 truncate group-hover:text-bronze transition-colors">
                              {p.node.title}
                            </p>
                            <p className="text-xs mt-0.5 text-muted-foreground">
                              {formatPrice(p.node.priceRange.minVariantPrice)}
                            </p>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
