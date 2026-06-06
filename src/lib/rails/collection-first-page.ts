/**
 * Collection first-page SSR cache.
 *
 * Primes the EXACT cache key + shape that `useInfiniteQuery` on
 * /collections/$handle reads for page 1 with no filters, so the streamed
 * HTML carries real /product/$handle anchors on cold loads.
 *
 * Scope is intentionally narrow:
 *  - filters: always [] (combinatorial filter state stays client-only)
 *  - cursor: always null (only page 1)
 *  - keyed by handle + sort + reverse + market so SWR stays correct
 *
 * The Storefront fetch is wrapped in a 60s server-only in-memory cache
 * via `ssrCached`. On the browser, TanStack Query already owns freshness
 * so we pass through to `fetch` directly.
 *
 * Shape: returns `infiniteQueryOptions` so the route loader can call
 * `ensureInfiniteQueryData(...)` and prime the same InfiniteData entry
 * the component subscribes to via `useInfiniteQuery`.
 */
import { infiniteQueryOptions } from "@tanstack/react-query";
import { fetchCollectionFiltered, fetchProductsPage } from "@/lib/shopify";
import { useMarketStore } from "@/stores/market-store";
import { cached } from "@/lib/server-cache";

function marketKey() {
  const m = useMarketStore.getState().market;
  return `${m.country}-${m.language}`;
}

function ssrCached<T>(key: string, ttlMs: number, loader: () => Promise<T>): Promise<T> {
  if (typeof window !== "undefined") return loader();
  return cached(key, loader, ttlMs);
}

export const collectionFirstPageQueryOptions = (args: {
  handle: string;
  sortKey: string;
  reverse: boolean;
}) => {
  const { handle, sortKey, reverse } = args;
  const mk = marketKey();
  const key = `collection-first-page:${handle}:${sortKey}:${reverse}:${mk}`;
  // MUST match the shape useInfiniteQuery uses for page 1 with no filters:
  //   ["collection-filtered", handle, [], sortKey, reverse]
  return infiniteQueryOptions({
    queryKey: ["collection-filtered", handle, [] as object[], sortKey, reverse] as const,
    initialPageParam: null as string | null,
    getNextPageParam: (last: { pageInfo?: { hasNextPage?: boolean; endCursor?: string | null } }) =>
      last?.pageInfo?.hasNextPage ? last.pageInfo.endCursor : undefined,
    queryFn: ({ pageParam }) =>
      ssrCached(key, 60_000, async () => {
        if (handle === "new-arrivals") {
          const page = await fetchProductsPage({
            first: 48,
            after: pageParam as string | null,
            sortKey: sortKey === "CREATED" ? "CREATED_AT" : sortKey,
            reverse,
          });
          return {
            collection: {
              id: "virtual-new-arrivals",
              title: "New Arrivals",
              handle: "new-arrivals",
              description: "",
              image: page.edges[0]?.node.images?.edges?.[0]?.node ?? null,
              updatedAt: new Date(0).toISOString(),
            },
            filters: [] as unknown[],
            edges: page.edges,
            pageInfo: page.pageInfo,
          };
        }
        return fetchCollectionFiltered({
          handle,
          first: 48,
          after: pageParam as string | null,
          filters: [],
          sortKey,
          reverse,
        });
      }),
    staleTime: 60_000,
  });
};
