import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { fetchProductByHandle, type ShopifyProductNode } from "@/lib/shopify";

/**
 * Trending handles, computed from real shopper behaviour in the last
 * 14 days. Blends `interaction_events` (impressions / hovers / clicks /
 * PDP views / wishlist / cart) with `cart_events` (add_to_cart through
 * reached_checkout) using a weighted score. Below a minimum-signal
 * threshold the server returns no handles, and the homepage rail falls
 * back to a curated "New Arrivals" rendering instead of shipping an
 * empty/biased trending edit.
 */

const WINDOW_DAYS = 14;
const MIN_TOTAL_EVENTS = 30;
const TOP_N = 8;
const ROW_LIMIT = 5000;

// Stronger than the local-only scoring weights — cart-side events carry
// more intent and only flow into this aggregation (not the local store).
const WEIGHTS: Record<string, number> = {
  impression: 0.1,
  hover: 0.5,
  click: 1,
  pdp_view: 2,
  wishlist: 3,
  cart: 5,
  add_to_cart: 5,
  remove_from_cart: -2,
  checkout_started: 8,
  reached_checkout: 10,
};

export type TrendingResult =
  | {
      ok: true;
      products: Array<{ node: ShopifyProductNode }>;
      handles: string[];
      totalEvents: number;
      windowDays: number;
    }
  | { ok: false; error: string };

export const getTrendingHandles = createServerFn({ method: "GET" }).handler(
  async (): Promise<TrendingResult> => {
    try {
      const since = new Date(
        Date.now() - WINDOW_DAYS * 86_400_000,
      ).toISOString();

      const [ie, ce] = await Promise.all([
        supabaseAdmin
          .from("interaction_events")
          .select("handle,event_type")
          .gte("created_at", since)
          .limit(ROW_LIMIT),
        supabaseAdmin
          .from("cart_events")
          .select("product_handle,event_type")
          .gte("created_at", since)
          .limit(ROW_LIMIT),
      ]);

      if (ie.error) console.error("[trending] interaction_events:", ie.error.message);
      if (ce.error) console.error("[trending] cart_events:", ce.error.message);

      const scores = new Map<string, number>();
      let total = 0;

      for (const row of ie.data ?? []) {
        const handle = row.handle as string | null;
        const w = WEIGHTS[row.event_type as string] ?? 0;
        if (!handle || !w) continue;
        scores.set(handle, (scores.get(handle) ?? 0) + w);
        total += 1;
      }

      for (const row of ce.data ?? []) {
        const handle = row.product_handle as string | null;
        const w = WEIGHTS[row.event_type as string] ?? 0;
        if (!handle || !w) continue;
        scores.set(handle, (scores.get(handle) ?? 0) + w);
        total += 1;
      }

      if (total < MIN_TOTAL_EVENTS) {
        return {
          ok: true,
          products: [],
          handles: [],
          totalEvents: total,
          windowDays: WINDOW_DAYS,
        };
      }

      const ranked = Array.from(scores.entries())
        .filter(([, score]) => score > 0)
        .sort((a, b) => b[1] - a[1])
        .slice(0, TOP_N)
        .map(([h]) => h);

      const fetched = await Promise.all(
        ranked.map((h) => fetchProductByHandle(h).catch(() => null)),
      );

      const products = fetched
        .map((node, idx) => ({ node, handle: ranked[idx] }))
        .filter(
          (x): x is { node: ShopifyProductNode; handle: string } =>
            x.node !== null,
        )
        .map(({ node }) => ({ node }));

      return {
        ok: true,
        products,
        handles: products.map((p) => p.node.handle),
        totalEvents: total,
        windowDays: WINDOW_DAYS,
      };
    } catch (error) {
      console.error("[trending] handler failed:", error);
      return { ok: false, error: "Trending unavailable" };
    }
  },
);
