import { createServerFn } from "@tanstack/react-start";
import { requireAdmin } from "@/lib/admin-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export interface AnalyticsBucket {
  date: string;
  add_to_cart: number;
  remove_from_cart: number;
  checkout_started: number;
  reached_checkout: number;
}

export interface TopProduct {
  product_handle: string;
  product_title: string | null;
  adds: number;
  checkouts: number;
  reached: number;
}

export interface CartAnalytics {
  totals: {
    add_to_cart: number;
    remove_from_cart: number;
    checkout_started: number;
    reached_checkout: number;
    unique_sessions: number;
    estimated_gmv: number;
  };
  buckets: AnalyticsBucket[];
  top_products: TopProduct[];
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
    };
    const sessions = new Set<string>();
    const byDay = new Map<string, AnalyticsBucket>();
    const byProduct = new Map<string, TopProduct>();

    for (const r of rows ?? []) {
      const type = r.event_type as keyof typeof totals;
      if (type in totals) (totals as Record<string, number>)[type]++;
      if (r.session_id) sessions.add(r.session_id);
      if (r.event_type === "reached_checkout") {
        totals.estimated_gmv += Number(r.price_usd ?? 0) * (r.quantity ?? 1);
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
      byDay.set(day, b);

      if (
        r.product_handle &&
        (r.event_type === "add_to_cart" ||
          r.event_type === "checkout_started" ||
          r.event_type === "reached_checkout")
      ) {
        const p = byProduct.get(r.product_handle) ?? {
          product_handle: r.product_handle,
          product_title: r.product_title,
          adds: 0,
          checkouts: 0,
          reached: 0,
        };
        if (r.event_type === "add_to_cart") p.adds++;
        else if (r.event_type === "checkout_started") p.checkouts++;
        else p.reached++;
        if (!p.product_title && r.product_title) p.product_title = r.product_title;
        byProduct.set(r.product_handle, p);
      }
    }

    totals.unique_sessions = sessions.size;

    const buckets: AnalyticsBucket[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setUTCDate(d.getUTCDate() - i);
      const key = d.toISOString().slice(0, 10);
      buckets.push(byDay.get(key) ?? emptyBucket(key));
    }

    const score = (p: TopProduct) => p.adds + p.checkouts * 2 + p.reached * 4;
    const top_products = [...byProduct.values()]
      .sort((a, b) => score(b) - score(a))
      .slice(0, 15);

    const recent = (rows ?? []).slice(0, 25).map((r) => ({
      id: r.id,
      event_type: r.event_type,
      product_handle: r.product_handle,
      product_title: r.product_title,
      price_usd: r.price_usd != null ? Number(r.price_usd) : null,
      quantity: r.quantity,
      created_at: r.created_at,
    }));

    return { totals, buckets, top_products, recent };
  });
