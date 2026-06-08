/**
 * Preloved (pre-owned) inventory query options.
 *
 * Wraps a Storefront `products` query filtered to our pre-owned tag matrix
 * (`Preloved`, `Pristine`, `Excellent`) and primes the exact TanStack Query
 * cache the page components read.
 *
 * Server reads are cached for 60s via `cached()` so high-frequency crawl
 * passes share a single upstream Storefront request per market.
 *
 * Browser reads bypass the server cache and defer freshness to TanStack
 * Query, exactly mirroring `collection-first-page.ts`.
 */
import { queryOptions } from "@tanstack/react-query";
import { fetchProductsPage, type ShopifyProductNode } from "@/lib/shopify";
import { useMarketStore } from "@/stores/market-store";
import { cached } from "@/lib/server-cache";

export type PrelovedCondition = "pristine" | "excellent";

export const PRELOVED_CONDITIONS: PrelovedCondition[] = [
  "pristine",
  "excellent",
];

export const PRELOVED_CONDITION_LABEL: Record<PrelovedCondition, string> = {
  pristine: "Pristine",
  excellent: "Excellent",
};

/** All tags participating in the pre-owned merchandising matrix. */
const ALL_PRELOVED_TAGS = ["Preloved", "Pristine", "Excellent"];

function marketKey() {
  const m = useMarketStore.getState().market;
  return `${m.country}-${m.language}`;
}

function ssrCached<T>(key: string, ttlMs: number, loader: () => Promise<T>): Promise<T> {
  if (typeof window !== "undefined") return loader();
  return cached(key, loader, ttlMs);
}

/**
 * Build a Shopify Storefront search query for a single condition tag, or
 * for the union of all pre-owned tags when `condition` is undefined.
 * Tag values containing spaces must be wrapped in single quotes per
 * Shopify search syntax.
 */
function buildPrelovedQuery(condition?: PrelovedCondition): string {
  if (!condition) {
    const parts = ALL_PRELOVED_TAGS.map((t) =>
      t.includes(" ") ? `tag:'${t}'` : `tag:${t}`,
    );
    return `(${parts.join(" OR ")})`;
  }
  // Per-condition page: must carry BOTH the umbrella `Preloved` tag AND
  // the specific condition tag, so live, non-resale catalog items don't
  // leak in if a colour tag happens to collide.
  const label = PRELOVED_CONDITION_LABEL[condition];
  const right = label.includes(" ") ? `tag:'${label}'` : `tag:${label}`;
  return `(tag:Preloved AND ${right})`;
}

export type PrelovedPage = {
  edges: Array<{ node: ShopifyProductNode }>;
  pageInfo: { hasNextPage: boolean; endCursor: string | null };
};

export const prelovedHubQueryOptions = () => {
  const mk = marketKey();
  const key = `preloved-hub:${mk}`;
  return queryOptions({
    queryKey: ["preloved-hub", mk] as const,
    queryFn: () =>
      ssrCached<PrelovedPage>(key, 60_000, () =>
        fetchProductsPage({
          first: 48,
          query: buildPrelovedQuery(),
          sortKey: "CREATED_AT",
          reverse: true,
        }),
      ),
    staleTime: 60_000,
  });
};

export const prelovedConditionQueryOptions = (condition: PrelovedCondition) => {
  const mk = marketKey();
  const key = `preloved-condition:${condition}:${mk}`;
  return queryOptions({
    queryKey: ["preloved-condition", condition, mk] as const,
    queryFn: () =>
      ssrCached<PrelovedPage>(key, 60_000, () =>
        fetchProductsPage({
          first: 48,
          query: buildPrelovedQuery(condition),
          sortKey: "CREATED_AT",
          reverse: true,
        }),
      ),
    staleTime: 60_000,
  });
};
