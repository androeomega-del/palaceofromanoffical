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

export type Dept = "Women" | "Men";

function marketKey() {
  const m = useMarketStore.getState().market;
  return `${m.country}-${m.language}`;
}

export const newThisWeekQueryOptions = (dept: Dept) =>
  queryOptions({
    queryKey: ["rail-new-this-week", dept, marketKey()] as const,
    queryFn: () =>
      fetchProducts({
        first: 4,
        query: `tag:${dept}`,
        sortKey: "CREATED_AT",
        reverse: true,
      }),
    staleTime: 5 * 60_000,
  });

export const bestSellersQueryOptions = (dept: Dept) =>
  queryOptions({
    queryKey: ["rail-best-sellers", dept, marketKey()] as const,
    queryFn: () =>
      fetchProducts({
        first: 4,
        query: `tag:${dept}`,
        sortKey: "BEST_SELLING",
      }),
    staleTime: 10 * 60_000,
  });
