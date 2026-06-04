/**
 * Global market change → query cache invalidation bridge.
 *
 * When the shopper picks a new country/region in the header `CountrySelector`,
 * every Shopify Storefront query needs to re-run with the new @inContext
 * directive so prices, currency, and tax-inclusive amounts refresh on
 * screen without a full page reload.
 *
 * Rails already include the market in their queryKey (see
 * `src/lib/rails/queries.ts`) — those re-fetch automatically. This bridge
 * catches everything else (PDP, collection, search, recommendations) by
 * invalidating the entire query cache on each market change. Cheap, safe,
 * and keeps the storefront in lockstep with the selected market.
 */
import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useMarketStore } from "@/stores/market-store";

export function MarketQuerySync() {
  const queryClient = useQueryClient();
  const initial = useRef(true);
  const marketKey = useMarketStore(
    (s) => `${s.market.country}-${s.market.language}`,
  );

  useEffect(() => {
    if (initial.current) {
      initial.current = false;
      return;
    }
    void queryClient.invalidateQueries();
  }, [marketKey, queryClient]);

  return null;
}
