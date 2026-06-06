/**
 * Product Detail Page (PDP) SSR cache.
 *
 * Wraps the three Storefront API reads the PDP depends on in the same
 * 60s in-memory server cache used by the rails. Cache keys are scoped
 * by market so currency / @inContext switches don't pollute each other.
 *
 * QueryKeys are intentionally identical to the ones already used by
 * useQuery in src/routes/product.$handle.tsx — when the loader calls
 * ensureQueryData / prefetchQuery with these factories, the existing
 * client queries hydrate from cache on first paint (no waterfall).
 *
 * Failures are NOT cached (see server-cache.ts).
 */
import { queryOptions } from "@tanstack/react-query";
import {
  fetchProductByHandle,
  fetchProductRecommendations,
  fetchProducts,
} from "@/lib/shopify";
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

/**
 * Primary product fetch — queryKey matches the existing client useQuery
 * in product.$handle.tsx (`["product", handle]`) so loader prefetch and
 * post-hydration reads share a single cache entry.
 */
export const productByHandleQueryOptions = (handle: string) => {
  const key = `product-detail:${handle}:${marketKey()}`;
  return queryOptions({
    queryKey: ["product", handle] as const,
    queryFn: () => ssrCached(key, 60_000, () => fetchProductByHandle(handle)),
    staleTime: 60_000,
  });
};

/**
 * Vendor-related rail — same queryKey as the in-component `relatedQ`
 * (`["related", vendor, handle]`).
 */
export const productRelatedByVendorQueryOptions = (vendor: string, handle: string) => {
  const key = `product-related:${vendor}:${handle}:${marketKey()}`;
  return queryOptions({
    queryKey: ["related", vendor, handle] as const,
    queryFn: () =>
      ssrCached(key, 60_000, () =>
        fetchProducts({ first: 8, query: `vendor:${vendor}` }),
      ),
    staleTime: 60_000,
  });
};

/**
 * Shopify COMPLEMENTARY recommendations — same queryKey as the
 * in-component `autoRecsQ` (`["auto-look-recs", productId]`).
 */
export const productAutoLookRecsQueryOptions = (productId: string) => {
  const key = `product-auto-recs:${productId}:${marketKey()}`;
  return queryOptions({
    queryKey: ["auto-look-recs", productId] as const,
    queryFn: () =>
      ssrCached(key, 60_000, () =>
        fetchProductRecommendations(productId, "COMPLEMENTARY"),
      ),
    staleTime: 60_000,
  });
};
