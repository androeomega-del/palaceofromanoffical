/**
 * Brands index SSR cache.
 *
 * Server function that primes the FIRST page of the `["brands-sample"]`
 * infinite query rendered by /brands. Wrapping `fetchProductsPage` in the
 * 60s in-memory `cached()` engine (key: `brands-index:page-1`) so cold
 * loads stream the designer link grid inside the initial HTML — subsequent
 * "Scan more" pages stay client-side via useInfiniteQuery.
 */
import { createServerFn } from "@tanstack/react-start";
import { infiniteQueryOptions } from "@tanstack/react-query";
import { fetchProductsPage } from "@/lib/shopify";
import { cached } from "@/lib/server-cache";

type BrandsPage = Awaited<ReturnType<typeof fetchProductsPage>>;

export const getBrandsIndexPage1 = createServerFn({ method: "GET" }).handler(
  async (): Promise<BrandsPage> =>
    cached(
      "brands-index:page-1",
      () => fetchProductsPage({ first: 250, after: null, sortKey: "BEST_SELLING" }),
      60_000,
    ),
);

export const brandsSampleInfiniteQueryOptions = () =>
  infiniteQueryOptions({
    queryKey: ["brands-sample"] as const,
    initialPageParam: null as string | null,
    queryFn: ({ pageParam }) => {
      // Page 1 → server-cached fn (SSR primes this exact path).
      if (pageParam === null) return getBrandsIndexPage1();
      // Subsequent pages → direct Storefront fetch on the client.
      return fetchProductsPage({ first: 250, after: pageParam, sortKey: "BEST_SELLING" });
    },
    getNextPageParam: (last: BrandsPage) =>
      last.pageInfo.hasNextPage ? last.pageInfo.endCursor : undefined,
    staleTime: 60_000,
  });
