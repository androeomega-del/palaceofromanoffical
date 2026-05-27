import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { adminBeforeLoad } from "@/lib/admin-route-guard";
import { getCartAnalytics } from "@/lib/cart-analytics.functions";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, ArrowLeft } from "lucide-react";

// Explicitly attach the bearer token to bypass any cold-load race in the
// global attachSupabaseAuth middleware (seen on mobile Safari where the
// Supabase client hasn't restored the session from storage before useQuery
// fires its first RPC, causing "Unauthorized: No authorization header").
async function fetchCartAnalytics() {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return getCartAnalytics({
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}

/**
 * Render local-timezone time only after hydration to avoid React #418
 * (server worker is UTC, client is the user's TZ → text mismatch).
 */
function LocalTime({ iso }: { iso: string }) {
  const [text, setText] = useState<string>("");
  useEffect(() => {
    setText(new Date(iso).toLocaleTimeString());
  }, [iso]);
  return <span suppressHydrationWarning>{text}</span>;
}

export const Route = createFileRoute("/admin/analytics")({
  // Admin-only, auth-gated page — skip SSR entirely so server and client
  // can never diverge (no prerender of a logged-out shell, no hydration
  // mismatch from session/timezone/data state).
  ssr: false,
  beforeLoad: adminBeforeLoad,
  component: AdminAnalytics,
  head: () => ({
    meta: [
      { title: "Cart Analytics — Palace of Roman" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

const fmt = (n: number) => new Intl.NumberFormat("en-US").format(n);
const usd = (n: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
const usd2 = (n: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(n);

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <Card className="p-6">
      <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">{label}</div>
      <div className="mt-3 font-serif text-3xl md:text-4xl tabular-nums">{value}</div>
      {hint ? <div className="mt-1 text-xs text-muted-foreground">{hint}</div> : null}
    </Card>
  );
}

function FunnelBar({
  label,
  count,
  pct,
  dropoff,
}: {
  label: string;
  count: number;
  pct: number;
  dropoff?: number;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between text-xs mb-1.5">
        <span className="uppercase tracking-[0.2em] text-muted-foreground">{label}</span>
        <span className="tabular-nums">
          {fmt(count)} <span className="text-muted-foreground">· {pct}%</span>
        </span>
      </div>
      <div className="h-3 rounded-sm bg-ink/5 overflow-hidden">
        <div
          className="h-full bg-bronze transition-all"
          style={{ width: `${Math.max(2, pct)}%` }}
        />
      </div>
      {dropoff !== undefined && dropoff > 0 ? (
        <div className="text-[10px] text-muted-foreground mt-1">
          −{dropoff}% drop-off from previous stage
        </div>
      ) : null}
    </div>
  );
}

function useSessionReady() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let cancelled = false;
    supabase.auth.getSession().then(({ data }) => {
      if (!cancelled && data.session?.access_token) setReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session?.access_token) setReady(true);
    });
    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);
  return ready;
}

function AdminAnalytics() {
  const sessionReady = useSessionReady();
  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: ["admin", "cart-analytics"],
    queryFn: fetchCartAnalytics,
    // Gate the query until the Supabase session is fully restored — prevents
    // the cold-load 401 on mobile Safari before storage hydrates.
    enabled: sessionReady,
    refetchInterval: 30_000,
    staleTime: 15_000,
    retry: (failureCount, err) => {
      const msg = (err as Error)?.message ?? "";
      if (/unauthor|forbidden|401|403/i.test(msg)) return false;
      return failureCount < 4;
    },
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 15_000),
  });

  const maxActivity = Math.max(
    1,
    ...(data?.buckets ?? []).map(
      (b) => b.add_to_cart + b.remove_from_cart + b.checkout_started + b.reached_checkout,
    ),
  );
  const maxRevenue = Math.max(1, ...(data?.buckets ?? []).map((b) => b.revenue));

  const funnel = data
    ? (() => {
        const adds = data.totals.add_to_cart;
        const co = data.totals.checkout_started;
        const reached = data.totals.reached_checkout;
        const base = Math.max(adds, 1);
        const addsPct = 100;
        const coPct = Math.round((co / base) * 100);
        const reachedPct = Math.round((reached / base) * 100);
        return {
          stages: [
            { label: "Add to Cart", count: adds, pct: addsPct, dropoff: 0 },
            { label: "Checkout Started", count: co, pct: coPct, dropoff: addsPct - coPct },
            { label: "Reached Checkout", count: reached, pct: reachedPct, dropoff: coPct - reachedPct },
          ],
        };
      })()
    : null;

  return (
    <main className="min-h-screen bg-canvas px-6 py-12 md:py-16">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-end justify-between mb-10 gap-4 flex-wrap">
          <div>
            <Link
              to="/admin"
              className="inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.3em] text-muted-foreground hover:text-bronze mb-3"
            >
              <ArrowLeft className="h-3 w-3" />
              Admin
            </Link>
            <h1 className="font-serif text-4xl md:text-5xl">Cart Analytics</h1>
            <p className="mt-2 text-sm text-muted-foreground">Last 30 days · refreshes every 30s</p>
          </div>
          <div className="flex gap-3">
            <Button size="sm" onClick={() => refetch()} disabled={isFetching}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>

        {error ? (
          <Card className="p-6 border-destructive/40">
            <p className="text-sm text-destructive">
              Failed to load analytics: {(error as Error).message}
            </p>
          </Card>
        ) : isLoading || !data ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : (
          <>
            {/* Headline KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-10">
              <Stat label="Est. Revenue" value={usd(data.totals.estimated_gmv)} hint="reached checkout" />
              <Stat
                label="Avg Order Value"
                value={usd2(data.totals.avg_order_value)}
                hint={`${fmt(data.totals.reached_checkout)} orders`}
              />
              <Stat
                label="Conversion"
                value={`${data.totals.overall_conversion_rate}%`}
                hint="reached / adds"
              />
              <Stat
                label="Abandonment"
                value={`${data.totals.abandonment_rate}%`}
                hint="adds without reach"
              />
              <Stat label="Add to Cart" value={fmt(data.totals.add_to_cart)} />
              <Stat label="Checkout Clicks" value={fmt(data.totals.checkout_started)} />
              <Stat label="Reached Checkout" value={fmt(data.totals.reached_checkout)} />
              <Stat label="Sessions" value={fmt(data.totals.unique_sessions)} hint="unique with cart" />
            </div>

            {/* Funnel */}
            <Card className="p-6 mb-10">
              <h2 className="text-xs uppercase tracking-[0.3em] text-muted-foreground mb-6">
                Conversion Funnel
              </h2>
              <div className="space-y-5">
                {funnel?.stages.map((s) => (
                  <FunnelBar key={s.label} {...s} />
                ))}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-8 pt-6 border-t border-ink/5">
                <div>
                  <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
                    Cart → Checkout
                  </div>
                  <div className="font-serif text-2xl tabular-nums mt-1">
                    {data.totals.cart_to_checkout_rate}%
                  </div>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
                    Checkout → Reached
                  </div>
                  <div className="font-serif text-2xl tabular-nums mt-1">
                    {data.totals.checkout_to_reached_rate}%
                  </div>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
                    Removed from Cart
                  </div>
                  <div className="font-serif text-2xl tabular-nums mt-1">
                    {fmt(data.totals.remove_from_cart)}
                  </div>
                </div>
              </div>
            </Card>

            {/* Daily revenue */}
            <Card className="p-6 mb-10">
              <div className="flex items-baseline justify-between mb-6">
                <h2 className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                  Daily Revenue
                </h2>
                <span className="text-xs text-muted-foreground">
                  Peak: {usd(maxRevenue)}
                </span>
              </div>
              <div className="flex items-end gap-1 h-40">
                {data.buckets.map((b) => {
                  const h = (b.revenue / maxRevenue) * 100;
                  return (
                    <div
                      key={b.date}
                      className="flex-1 flex flex-col items-center justify-end"
                      title={`${b.date}: ${usd(b.revenue)}`}
                    >
                      <div
                        className="w-full bg-bronze/80 hover:bg-bronze transition-colors rounded-sm min-h-[2px]"
                        style={{ height: `${h}%` }}
                      />
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between text-[10px] text-muted-foreground mt-2">
                <span>{data.buckets[0]?.date}</span>
                <span>{data.buckets[data.buckets.length - 1]?.date}</span>
              </div>
            </Card>

            {/* Daily activity */}
            <Card className="p-6 mb-10">
              <h2 className="text-xs uppercase tracking-[0.3em] text-muted-foreground mb-6">
                Daily Activity
              </h2>
              <div className="flex items-end gap-1 h-40">
                {data.buckets.map((b) => {
                  const total =
                    b.add_to_cart + b.remove_from_cart + b.checkout_started + b.reached_checkout;
                  const h = (total / maxActivity) * 100;
                  return (
                    <div
                      key={b.date}
                      className="flex-1 flex flex-col items-center justify-end"
                      title={`${b.date}\nAdds: ${b.add_to_cart}\nRemoves: ${b.remove_from_cart}\nCheckout clicks: ${b.checkout_started}\nReached checkout: ${b.reached_checkout}`}
                    >
                      <div
                        className="w-full bg-ink/70 hover:bg-ink transition-colors rounded-sm min-h-[2px]"
                        style={{ height: `${h}%` }}
                      />
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between text-[10px] text-muted-foreground mt-2">
                <span>{data.buckets[0]?.date}</span>
                <span>{data.buckets[data.buckets.length - 1]?.date}</span>
              </div>
            </Card>

            {/* Top products + Top removed */}
            <div className="grid lg:grid-cols-2 gap-6 mb-10">
              <Card className="p-6">
                <h2 className="text-xs uppercase tracking-[0.3em] text-muted-foreground mb-4">
                  Top Products
                </h2>
                {data.top_products.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No add-to-cart events yet.</p>
                ) : (
                  <table className="w-full text-sm">
                    <thead className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                      <tr>
                        <th className="text-left font-medium py-2">Product</th>
                        <th className="text-right font-medium py-2">Adds</th>
                        <th className="text-right font-medium py-2">Reached</th>
                        <th className="text-right font-medium py-2">Revenue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.top_products.map((p) => (
                        <tr key={p.product_handle} className="border-t border-ink/5">
                          <td className="py-3 pr-3">
                            <a
                              href={`/product/${p.product_handle}`}
                              className="hover:text-bronze line-clamp-1"
                              target="_blank"
                              rel="noreferrer"
                            >
                              {p.product_title || p.product_handle}
                            </a>
                          </td>
                          <td className="py-3 text-right tabular-nums">{p.adds}</td>
                          <td className="py-3 text-right tabular-nums text-bronze">{p.reached}</td>
                          <td className="py-3 text-right tabular-nums">{usd(p.revenue)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </Card>

              <Card className="p-6">
                <h2 className="text-xs uppercase tracking-[0.3em] text-muted-foreground mb-4">
                  Top Removed
                </h2>
                {data.top_removed.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No removals yet.</p>
                ) : (
                  <table className="w-full text-sm">
                    <thead className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                      <tr>
                        <th className="text-left font-medium py-2">Product</th>
                        <th className="text-right font-medium py-2">Removes</th>
                        <th className="text-right font-medium py-2">Adds</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.top_removed.map((p) => (
                        <tr key={p.product_handle} className="border-t border-ink/5">
                          <td className="py-3 pr-3">
                            <a
                              href={`/product/${p.product_handle}`}
                              className="hover:text-bronze line-clamp-1"
                              target="_blank"
                              rel="noreferrer"
                            >
                              {p.product_title || p.product_handle}
                            </a>
                          </td>
                          <td className="py-3 text-right tabular-nums text-destructive">
                            {p.removes}
                          </td>
                          <td className="py-3 text-right tabular-nums text-muted-foreground">
                            {p.adds}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </Card>
            </div>

            {/* Recent events */}
            <Card className="p-6">
              <h2 className="text-xs uppercase tracking-[0.3em] text-muted-foreground mb-4">
                Recent Events
              </h2>
              {data.recent.length === 0 ? (
                <p className="text-sm text-muted-foreground">No events yet.</p>
              ) : (
                <ul className="space-y-3 text-sm">
                  {data.recent.map((r) => (
                    <li
                      key={r.id}
                      className="flex items-center justify-between gap-3 border-b border-ink/5 pb-2 last:border-0"
                    >
                      <div className="min-w-0">
                        <span
                          className={`inline-block text-[9px] uppercase tracking-[0.2em] px-2 py-0.5 rounded mr-2 ${
                            r.event_type === "reached_checkout"
                              ? "bg-bronze/25 text-bronze"
                              : r.event_type === "checkout_started"
                              ? "bg-bronze/10 text-bronze"
                              : r.event_type === "add_to_cart"
                              ? "bg-ink/5 text-ink"
                              : "bg-destructive/10 text-destructive"
                          }`}
                        >
                          {r.event_type.replace(/_/g, " ")}
                        </span>
                        <span className="text-ink/80 truncate">
                          {r.product_title || r.product_handle || "—"}
                        </span>
                      </div>
                      <div className="text-[11px] text-muted-foreground tabular-nums whitespace-nowrap">
                        {r.price_usd != null ? usd2(r.price_usd) : ""} ·{" "}
                        <LocalTime iso={r.created_at} />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </>
        )}
      </div>
    </main>
  );
}
