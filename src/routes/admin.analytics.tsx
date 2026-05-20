import { createFileRoute, redirect, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ensureAdmin } from "@/lib/admin-guard.functions";
import { getCartAnalytics } from "@/lib/cart-analytics.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

export const Route = createFileRoute("/admin/analytics")({
  beforeLoad: async () => {
    try {
      await ensureAdmin();
    } catch {
      throw redirect({ to: "/authentication" });
    }
  },
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
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <Card className="p-6">
      <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">{label}</div>
      <div className="mt-3 font-serif text-4xl tabular-nums">{value}</div>
      {hint ? <div className="mt-1 text-xs text-muted-foreground">{hint}</div> : null}
    </Card>
  );
}

function AdminAnalytics() {
  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: ["admin", "cart-analytics"],
    queryFn: () => getCartAnalytics(),
    refetchInterval: 30_000,
    staleTime: 15_000,
  });

  const maxBucket = Math.max(
    1,
    ...(data?.buckets ?? []).map((b) => b.add_to_cart + b.remove_from_cart + b.checkout_started),
  );

  const conversionRate =
    data && data.totals.add_to_cart > 0
      ? Math.round((data.totals.checkout_started / data.totals.add_to_cart) * 100)
      : 0;

  return (
    <main className="min-h-screen bg-canvas px-6 py-12 md:py-16">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="text-[10px] uppercase tracking-[0.4em] text-bronze mb-3">Admin</p>
            <h1 className="font-serif text-4xl md:text-5xl">Cart Analytics</h1>
            <p className="mt-2 text-sm text-muted-foreground">Last 30 days · refreshes every 30s</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" size="sm" asChild>
              <Link to="/admin/shopify-sync">Shopify Sync</Link>
            </Button>
            <Button size="sm" onClick={() => refetch()} disabled={isFetching}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>

        {error ? (
          <Card className="p-6 border-destructive/40">
            <p className="text-sm text-destructive">Failed to load analytics: {(error as Error).message}</p>
          </Card>
        ) : isLoading || !data ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-12">
              <Stat label="Add to Cart" value={fmt(data.totals.add_to_cart)} />
              <Stat label="Removed" value={fmt(data.totals.remove_from_cart)} />
              <Stat label="Checkout Clicks" value={fmt(data.totals.checkout_started)} />
              <Stat label="Conversion" value={`${conversionRate}%`} hint="checkouts / adds" />
              <Stat label="Est. GMV" value={usd(data.totals.estimated_gmv)} hint={`${fmt(data.totals.unique_sessions)} sessions`} />
            </div>

            <Card className="p-6 mb-12">
              <h2 className="text-xs uppercase tracking-[0.3em] text-muted-foreground mb-6">Daily activity</h2>
              <div className="flex items-end gap-1 h-40">
                {data.buckets.map((b) => {
                  const total = b.add_to_cart + b.remove_from_cart + b.checkout_started;
                  const h = (total / maxBucket) * 100;
                  return (
                    <div
                      key={b.date}
                      className="flex-1 flex flex-col items-center justify-end gap-1"
                      title={`${b.date}\nAdds: ${b.add_to_cart}\nRemoves: ${b.remove_from_cart}\nCheckouts: ${b.checkout_started}`}
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

            <div className="grid lg:grid-cols-2 gap-6">
              <Card className="p-6">
                <h2 className="text-xs uppercase tracking-[0.3em] text-muted-foreground mb-4">Top products</h2>
                {data.top_products.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No add-to-cart events yet.</p>
                ) : (
                  <table className="w-full text-sm">
                    <thead className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                      <tr>
                        <th className="text-left font-medium py-2">Product</th>
                        <th className="text-right font-medium py-2">Adds</th>
                        <th className="text-right font-medium py-2">Checkouts</th>
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
                          <td className="py-3 text-right tabular-nums text-bronze">{p.checkouts}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </Card>

              <Card className="p-6">
                <h2 className="text-xs uppercase tracking-[0.3em] text-muted-foreground mb-4">Recent events</h2>
                {data.recent.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No events yet.</p>
                ) : (
                  <ul className="space-y-3 text-sm">
                    {data.recent.map((r) => (
                      <li key={r.id} className="flex items-center justify-between gap-3 border-b border-ink/5 pb-2 last:border-0">
                        <div className="min-w-0">
                          <span
                            className={`inline-block text-[9px] uppercase tracking-[0.2em] px-2 py-0.5 rounded mr-2 ${
                              r.event_type === "checkout_started"
                                ? "bg-bronze/15 text-bronze"
                                : r.event_type === "add_to_cart"
                                ? "bg-ink/5 text-ink"
                                : "bg-destructive/10 text-destructive"
                            }`}
                          >
                            {r.event_type.replace(/_/g, " ")}
                          </span>
                          <span className="text-ink/80 truncate">{r.product_title || r.product_handle || "—"}</span>
                        </div>
                        <div className="text-[11px] text-muted-foreground tabular-nums whitespace-nowrap">
                          {r.price_usd != null ? usd(r.price_usd) : ""} · {new Date(r.created_at).toLocaleTimeString()}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
