/**
 * Rail query factories — idiomatic TanStack `queryOptions` per surface.
 *
 * Each factory returns a stable `queryOptions` object so callers can:
 *   - feed it to <ProductRail queryOptions={...}/> on the client
 *   - prefetch it from a route loader via context.queryClient.ensureQueryData
 *
 * All rails scope by the current department (Women / Men) so behaviour stays
 * consistent under the global dept toggle. Best-Sellers is dept-scoped on
 * purpose: store-wide best-sellers on a dept-anchored surface is a product
 * error, not just a UX quirk.
 *
 * Market scoping: the active Shopify Markets country/language is baked into
 * the queryKey so flipping the country selector instantly re-fetches the
 * rail with the localised currency + (where configured) tax-inclusive
 * pricing. The fetch itself injects @inContext automatically inside
 * `storefrontApiRequest`, so we only need the key to vary here.
 */
import { queryOptions } from "@tanstack/react-query";
import { fetchProducts } from "@/lib/shopify";
import { useMarketStore } from "@/stores/market-store";
import { cached } from "@/lib/server-cache";

export type Dept = "Women" | "Men";

function marketKey() {
  const m = useMarketStore.getState().market;
  return `${m.country}-${m.language}`;
}

/**
 * Server-side read-through cache for rail queries.
 *
 * Only activates during SSR / route-loader prefetch (`typeof window ===
 * "undefined"`). On the client the rail still fetches through `fetchProducts`
 * normally — a per-browser cache would be both useless (one shopper) and
 * harmful (stale state across market/dept toggles isn't shared with the
 * TanStack Query cache that already owns client-side staleness).
 *
 * Cache key intentionally mirrors the React Query key so cache scope and
 * dedup behaviour stay aligned.
 */
function railCached<T>(key: string, ttlMs: number, loader: () => Promise<T>): Promise<T> {
  if (typeof window !== "undefined") return loader();
  return cached(key, loader, ttlMs);
}

export const newThisWeekQueryOptions = (dept: Dept) => {
  const key = `rail-new-this-week:${dept}:${marketKey()}`;
  return queryOptions({
    queryKey: ["rail-new-this-week", dept, marketKey()] as const,
    queryFn: () =>
      railCached(key, 60_000, () =>
        fetchProducts({
          first: 6,
          query: `tag:${dept}`,
          sortKey: "CREATED_AT",
          reverse: true,
        }),
      ),
    staleTime: 5 * 60_000,
  });
};

export const bestSellersQueryOptions = (dept: Dept) => {
  const key = `rail-best-sellers:${dept}:${marketKey()}`;
  return queryOptions({
    queryKey: ["rail-best-sellers", dept, marketKey()] as const,
    queryFn: () =>
      railCached(key, 60_000, () =>
        fetchProducts({
          first: 4,
          query: `tag:${dept}`,
          sortKey: "BEST_SELLING",
        }),
      ),
    staleTime: 10 * 60_000,
  });
};

/**
 * Shopify "Home page" collection — populated by the merchant in Shopify
 * admin (Collections → Home page). We query via `collection:home-page`
 * search syntax rather than `collection.products` so unpublished-to-
 * storefront-channel collections still surface their products on the
 * homepage. Sorted BEST_SELLING for an editorial-feeling hand-picked feel.
 */
export const homePageCollectionQueryOptions = () => {
  const key = `rail-home-page-collection:${marketKey()}`;
  return queryOptions({
    queryKey: ["rail-home-page-collection", marketKey()] as const,
    queryFn: () =>
      railCached(key, 60_000, () =>
        fetchProducts({
          first: 8,
          query: "collection:home-page",
          sortKey: "BEST_SELLING",
        }),
      ),
    staleTime: 5 * 60_000,
  });
};
