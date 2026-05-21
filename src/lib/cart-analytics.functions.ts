import { createServerFn } from "@tanstack/react-start";
import { requireAdmin } from "@/lib/admin-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export interface AnalyticsBucket {
  date: string;
  add_to_cart: number;
  remove_from_cart: number;
  checkout_started: number;
  reached_checkout: number;
  revenue: number;
}

export interface TopProduct {
  product_handle: string;
  product_title: string | null;
  adds: number;
  checkouts: number;
  reached: number;
  removes: number;
  revenue: number;
}

export interface CartAnalytics {
  totals: {
    add_to_cart: number;
    remove_from_cart: number;
    checkout_started: number;
    reached_checkout: number;
    unique_sessions: number;
    estimated_gmv: number;
    avg_order_value: number;
    abandonment_rate: number;
    cart_to_checkout_rate: number;
    checkout_to_reached_rate: number;
    overall_conversion_rate: number;
  };
  buckets: AnalyticsBucket[];
  top_products: TopProduct[];
  top_removed: TopProduct[];
  recent: Array<{
    id: string;
    event_type: string;
    product_handle: string | null;
    product_title: string | null;
    price_usd: number | null;
    quantity: number;
    created_at: string;
  }>;
}

const emptyBucket = (date: string): AnalyticsBucket => ({
  date,
  add_to_cart: 0,
  remove_from_cart: 0,
  checkout_started: 0,
  reached_checkout: 0,
  revenue: 0,
});

export const getCartAnalytics = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .handler(async (): Promise<CartAnalytics> => {
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const { data: rows, error } = await supabaseAdmin
      .from("cart_events")
      .select("id,event_type,product_handle,product_title,price_usd,quantity,session_id,created_at")
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(5000);

    if (error) throw new Error(error.message);

    const totals = {
      add_to_cart: 0,
      remove_from_cart: 0,
      checkout_started: 0,
      reached_checkout: 0,
      unique_sessions: 0,
      estimated_gmv: 0,
      avg_order_value: 0,
      abandonment_rate: 0,
      cart_to_checkout_rate: 0,
      checkout_to_reached_rate: 0,
      overall_conversion_rate: 0,
    };
    const sessions = new Set<string>();
    const byDay = new Map<string, AnalyticsBucket>();
    const byProduct = new Map<string, TopProduct>();

    const getProduct = (handle: string, title: string | null): TopProduct => {
      const p = byProduct.get(handle) ?? {
        product_handle: handle,
        product_title: title,
        adds: 0,
        checkouts: 0,
        reached: 0,
        removes: 0,
        revenue: 0,
      };
      if (!p.product_title && title) p.product_title = title;
      byProduct.set(handle, p);
      return p;
    };

    for (const r of rows ?? []) {
      const type = r.event_type as keyof typeof totals;
      if (type in totals && typeof (totals as Record<string, number>)[type] === "number") {
        (totals as Record<string, number>)[type]++;
      }
      if (r.session_id) sessions.add(r.session_id);

      const line = Number(r.price_usd ?? 0) * (r.quantity ?? 1);
      if (r.event_type === "reached_checkout") {
        totals.estimated_gmv += line;
      }

      const day = r.created_at.slice(0, 10);
      const b = byDay.get(day) ?? emptyBucket(day);
      if (
        type === "add_to_cart" ||
        type === "remove_from_cart" ||
        type === "checkout_started" ||
        type === "reached_checkout"
      ) {
        b[type]++;
      }
      if (r.event_type === "reached_checkout") b.revenue += line;
      byDay.set(day, b);

      if (r.product_handle) {
        const p = getProduct(r.product_handle, r.product_title);
        if (r.event_type === "add_to_cart") p.adds++;
        else if (r.event_type === "checkout_started") p.checkouts++;
        else if (r.event_type === "reached_checkout") {
          p.reached++;
          p.revenue += line;
        } else if (r.event_type === "remove_from_cart") p.removes++;
      }
    }

    totals.unique_sessions = sessions.size;
    totals.avg_order_value =
      totals.reached_checkout > 0 ? totals.estimated_gmv / totals.reached_checkout : 0;
    totals.abandonment_rate =
      totals.add_to_cart > 0
        ? Math.round(((totals.add_to_cart - totals.reached_checkout) / totals.add_to_cart) * 100)
        : 0;
    totals.cart_to_checkout_rate =
      totals.add_to_cart > 0
        ? Math.round((totals.checkout_started / totals.add_to_cart) * 100)
        : 0;
    totals.checkout_to_reached_rate =
      totals.checkout_started > 0
        ? Math.round((totals.reached_checkout / totals.checkout_started) * 100)
        : 0;
    totals.overall_conversion_rate =
      totals.add_to_cart > 0
        ? Math.round((totals.reached_checkout / totals.add_to_cart) * 100)
        : 0;

    const buckets: AnalyticsBucket[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setUTCDate(d.getUTCDate() - i);
      const key = d.toISOString().slice(0, 10);
      buckets.push(byDay.get(key) ?? emptyBucket(key));
    }

    const score = (p: TopProduct) => p.adds + p.checkouts * 2 + p.reached * 4;
    const products = [...byProduct.values()];
    const top_products = products
      .filter((p) => p.adds + p.checkouts + p.reached > 0)
      .sort((a, b) => score(b) - score(a))
      .slice(0, 15);
    const top_removed = products
      .filter((p) => p.removes > 0)
      .sort((a, b) => b.removes - a.removes)
      .slice(0, 10);

    const recent = (rows ?? []).slice(0, 25).map((r) => ({
      id: r.id,
      event_type: r.event_type,
      product_handle: r.product_handle,
      product_title: r.product_title,
      price_usd: r.price_usd != null ? Number(r.price_usd) : null,
      quantity: r.quantity,
      created_at: r.created_at,
    }));

    return { totals, buckets, top_products, top_removed, recent };
  });
