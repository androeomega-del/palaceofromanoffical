/**
 * Landing-collection SSR cache.
 *
 * Server function that primes the product grid rendered by
 * `<LandingCollectionPage queryOptions={...} />` so cold loads ship the
 * editorial landing routes (cashmere-sweaters, designer-belts,
 * designer-sunglasses) with real /product/$handle anchors in the streamed
 * HTML instead of a client-hydrated skeleton.
 *
 * The Storefront fetch is wrapped in the 60s in-memory `cached()` engine,
 * keyed by `landing:${query}:${first}`.
 */
import { createServerFn } from "@tanstack/react-start";
import { queryOptions } from "@tanstack/react-query";
import { z } from "zod";
import { fetchProducts, type ShopifyProduct } from "@/lib/shopify";
import { cached } from "@/lib/server-cache";

const InputSchema = z.object({
  query: z.string().min(1).max(255),
  first: z.number().int().min(1).max(50).optional(),
});

export const getLandingCollectionProducts = createServerFn({ method: "GET" })
  .inputValidator((data) => InputSchema.parse(data))
  .handler(async ({ data }): Promise<ShopifyProduct[]> => {
    const first = data.first ?? 12;
    const key = `landing:${data.query}:${first}`;
    // 10-minute in-memory cache; cold edge hits race a 6s timeout so SSR
    // never hangs if Shopify Storefront is slow — empty array hydrates and
    // the next request refreshes.
    return cached(
      key,
      async () => {
        const fetchP = fetchProducts({
          first,
          query: data.query,
          sortKey: "BEST_SELLING",
        }) as Promise<ShopifyProduct[]>;
        const timeoutP = new Promise<ShopifyProduct[]>((resolve) =>
          setTimeout(() => resolve([]), 6_000),
        );
        return Promise.race([fetchP, timeoutP]);
      },
      10 * 60_000,
    );
  });

export const landingCollectionQueryOptions = (args: { query: string; first?: number }) => {
  const first = args.first ?? 12;
  return queryOptions({
    queryKey: ["landing", args.query, first] as const,
    queryFn: () => getLandingCollectionProducts({ data: { query: args.query, first } }),
    staleTime: 10 * 60_000,
  });
};
