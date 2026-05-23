// Admin-only urgency-conversion funnel.
// Aggregates the `interaction_events` table for the last 30 days to surface:
//   scarcity_view → scarcity_click → scarcity_cart
// plus the implied CTR and cart-conversion rate.
//
// All events are inserted by the public-facing scarcity tracking layer
// (see src/stores/interaction-store.ts + src/lib/interaction-flush.ts).

import { createServerFn } from "@tanstack/react-start";
import { requireAdmin } from "@/lib/admin-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export interface UrgencyFunnel {
  windowDays: number;
  views: number;
  clicks: number;
  carts: number;
  ctrPct: number; // clicks / views
  cartRatePct: number; // carts / clicks
  conversionPct: number; // carts / views
  topHandles: Array<{ handle: string; views: number; clicks: number; carts: number }>;
}

export const getUrgencyFunnel = createServerFn({ method: "GET" })
  .middleware([requireAdmin])
  .handler(async (): Promise<UrgencyFunnel> => {
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabaseAdmin
      .from("interaction_events")
      .select("event_type, handle")
      .in("event_type", ["scarcity_view", "scarcity_click", "scarcity_cart"])
      .gte("created_at", since)
      .limit(50_000);

    if (error) {
      console.error("[urgency-funnel] query failed:", error.message);
      throw new Error("Could not load urgency funnel.");
    }

    let views = 0;
    let clicks = 0;
    let carts = 0;
    const perHandle = new Map<string, { views: number; clicks: number; carts: number }>();

    for (const row of data ?? []) {
      const bucket =
        perHandle.get(row.handle) ?? { views: 0, clicks: 0, carts: 0 };
      if (row.event_type === "scarcity_view") {
        views++;
        bucket.views++;
      } else if (row.event_type === "scarcity_click") {
        clicks++;
        bucket.clicks++;
      } else if (row.event_type === "scarcity_cart") {
        carts++;
        bucket.carts++;
      }
      perHandle.set(row.handle, bucket);
    }

    const pct = (num: number, denom: number) =>
      denom > 0 ? Math.round((num / denom) * 1000) / 10 : 0;

    const topHandles = Array.from(perHandle.entries())
      .map(([handle, c]) => ({ handle, ...c }))
      .sort((a, b) => b.views + b.clicks * 2 + b.carts * 5 - (a.views + a.clicks * 2 + a.carts * 5))
      .slice(0, 10);

    return {
      windowDays: 30,
      views,
      clicks,
      carts,
      ctrPct: pct(clicks, views),
      cartRatePct: pct(carts, clicks),
      conversionPct: pct(carts, views),
      topHandles,
    };
  });
