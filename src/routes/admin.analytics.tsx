import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { adminBeforeLoad } from "@/lib/admin-route-guard";
import { getAnalyticsDashboard, type AnalyticsDashboard } from "@/lib/analytics-dashboard.functions";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, RefreshCw, Activity } from "lucide-react";

const RANGES = [
  { label: "1D", days: 1 },
  { label: "7D", days: 7 },
  { label: "30D", days: 30 },
  { label: "90D", days: 90 },
  { label: "1Y", days: 365 },
];

async function fetchDashboard(days: number): Promise<AnalyticsDashboard> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return getAnalyticsDashboard({
    data: { days },
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}

export const Route = createFileRoute("/admin/analytics")({
  ssr: false,
  beforeLoad: adminBeforeLoad,
  component: AdminAnalytics,
  head: () => ({
    meta: [
      { title: "Live Analytics — Palace of Roman" },
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

function Stat({
  label,
  value,
  hint,
  accent,
}: {
  label: string;
  value: string;
  hint?: string;
  accent?: boolean;
}) {
  return (
    <Card className={`p-5 ${accent ? "border-bronze/40 bg-bronze/[0.03]" : ""}`}>
      <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">{label}</div>
      <div className="mt-2 font-serif text-2xl md:text-3xl tabular-nums">{value}</div>
      {hint ? <div className="mt-1 text-[11px] text-muted-foreground">{hint}</div> : null}
    </Card>
  );
}

function SectionTitle({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return (
    <div className="mb-4">
      <h2 className="font-serif text-xl tracking-tight">{children}</h2>
      {hint ? <p className="text-xs text-muted-foreground mt-0.5">{hint}</p> : null}
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

/**
 * Subscribes to realtime inserts on pageviews/cart_events and bumps a
 * counter the dashboard can use to pulse a "Live" badge + refetch.
 */
function useLivePulse(onTick: () => void) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    // Poll every 15s instead of subscribing to realtime — the source
    // tables (pageviews, cart_events) are no longer published to
    // Realtime to avoid broadcasting visitor session data.
    const id = setInterval(() => {
      setCount((c) => c + 1);
      onTick();
    }, 15_000);
    return () => clearInterval(id);
  }, [onTick]);
  return count;
}


function AdminAnalytics() {
  const sessionReady = useSessionReady();
  const [days, setDays] = useState(30);

  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: ["admin", "analytics-dashboard", days],
    queryFn: () => fetchDashboard(days),
    enabled: sessionReady,
    refetchInterval: 30_000,
    staleTime: 15_000,
    retry: (n, err) => {
      const msg = (err as Error)?.message ?? "";
      if (/unauthor|forbidden|401|403/i.test(msg)) return false;
      return n < 3;
    },
  });

  // Throttle realtime-triggered refetches to once every 5s
  const [lastLive, setLastLive] = useState(0);
  const tick = useMemo(
    () => () => {
      const now = Date.now();
      if (now - lastLive > 5000) {
        setLastLive(now);
        refetch();
      }
    },
    [lastLive, refetch],
  );
  const liveCount = useLivePulse(tick);

  return (
    <main className="min-h-screen bg-canvas px-4 md:px-6 py-8 md:py-12">
      <div className="max-w-7xl mx-auto">
        {/* Top bar */}
        <div className="flex items-end justify-between mb-8 gap-4 flex-wrap">
          <div>
            <Link
              to="/admin"
              className="inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.3em] text-muted-foreground hover:text-bronze mb-3"
            >
              <ArrowLeft className="h-3 w-3" />
              Admin
            </Link>
            <h1 className="font-serif text-3xl md:text-5xl">Live Analytics</h1>
            <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <Activity className="h-3 w-3 text-emerald-600 animate-pulse" />
                Realtime · {fmt(liveCount)} events this session
              </span>
              <span>·</span>
              <span>Auto-refresh 30s</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="inline-flex rounded-md border border-border overflow-hidden">
              {RANGES.map((r) => (
                <button
                  key={r.days}
                  onClick={() => setDays(r.days)}
                  className={`px-3 py-1.5 text-xs uppercase tracking-[0.18em] transition-colors ${
                    days === r.days
                      ? "bg-ink text-canvas"
                      : "bg-transparent text-muted-foreground hover:bg-ink/5"
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
            <Button size="sm" variant="outline" onClick={() => refetch()} disabled={isFetching}>
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
          <Card className="p-10 text-center text-sm text-muted-foreground">Loading analytics…</Card>
        ) : (
          <DashboardBody data={data} />
        )}
      </div>
    </main>
  );
}

function DashboardBody({ data }: { data: AnalyticsDashboard }) {
  const { kpis } = data;
  return (
    <div className="space-y-10">
      {/* ===== KPIs ===== */}
      <section>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          <Stat label="Pageviews" value={fmt(kpis.pageviews)} accent />
          <Stat label="Visitors" value={fmt(kpis.visitors)} accent />
          <Stat label="Add to Cart" value={fmt(kpis.add_to_cart)} hint={`${kpis.atc_rate}% of visitors`} />
          <Stat
            label="Reached Checkout"
            value={fmt(kpis.reached_checkout)}
            hint={`${kpis.conversion_rate}% conv.`}
          />
          <Stat label="Est. GMV" value={usd(kpis.estimated_gmv)} hint="At-cart value" />
          <Stat
            label="Abandonment"
            value={`${kpis.abandonment_rate}%`}
            hint={`${fmt(kpis.add_to_cart - kpis.reached_checkout)} lost carts`}
          />
        </div>
      </section>

      {/* ===== Traffic + Conversions chart ===== */}
      <section>
        <SectionTitle hint="Daily pageviews and unique visitors over the selected window.">
          Traffic
        </SectionTitle>
        <Card className="p-4">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.daily}>
                <defs>
                  <linearGradient id="g-pv" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--bronze, 30 40% 45%))" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="hsl(var(--bronze, 30 40% 45%))" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="g-v" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0f766e" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#0f766e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(v) => v.slice(5)} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="pageviews"
                  stroke="hsl(var(--bronze, 30 40% 45%))"
                  fill="url(#g-pv)"
                  strokeWidth={2}
                  name="Pageviews"
                />
                <Area
                  type="monotone"
                  dataKey="visitors"
                  stroke="#0f766e"
                  fill="url(#g-v)"
                  strokeWidth={2}
                  name="Visitors"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </section>

      {/* ===== Funnel + Landing pages ===== */}
      <section className="grid lg:grid-cols-2 gap-6">
        <Card className="p-5">
          <SectionTitle hint="From first visit through reaching the Shopify checkout.">
            Conversion Funnel
          </SectionTitle>
          <div className="space-y-4">
            {data.funnel.map((f) => (
              <div key={f.stage}>
                <div className="flex items-baseline justify-between text-xs mb-1.5">
                  <span className="uppercase tracking-[0.2em] text-muted-foreground">{f.stage}</span>
                  <span className="tabular-nums">
                    {fmt(f.count)} <span className="text-muted-foreground">· {f.pct}%</span>
                  </span>
                </div>
                <div className="h-3 rounded-sm bg-ink/5 overflow-hidden">
                  <div
                    className="h-full bg-bronze transition-all"
                    style={{ width: `${Math.max(2, f.pct)}%` }}
                  />
                </div>
                {f.dropoff > 0 ? (
                  <div className="text-[10px] text-muted-foreground mt-1">
                    −{f.dropoff}% drop-off from previous stage
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <SectionTitle hint="Most-viewed URLs in the selected window.">Top Landing Pages</SectionTitle>
          {data.topLandingPages.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              No pageview data yet — the beacon starts logging from now.
            </p>
          ) : (
            <div className="space-y-2">
              {data.topLandingPages.slice(0, 10).map((p) => {
                const max = data.topLandingPages[0].pageviews || 1;
                const pct = (p.pageviews / max) * 100;
                return (
                  <div key={p.path}>
                    <div className="flex items-baseline justify-between text-xs gap-3">
                      <span className="truncate font-mono">{p.path}</span>
                      <span className="tabular-nums shrink-0">
                        {fmt(p.pageviews)} <span className="text-muted-foreground">· {fmt(p.visitors)}u</span>
                      </span>
                    </div>
                    <div className="h-1.5 mt-1 rounded-sm bg-ink/5 overflow-hidden">
                      <div className="h-full bg-ink/40" style={{ width: `${Math.max(2, pct)}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </section>

      {/* ===== Cart activity chart ===== */}
      <section>
        <SectionTitle hint="Add-to-cart, checkout starts, and checkouts reached per day.">
          Cart Activity
        </SectionTitle>
        <Card className="p-4">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.daily}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(v) => v.slice(5)} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="add_to_cart" fill="#b08968" name="Add to Cart" />
                <Bar dataKey="checkout_started" fill="#7c6f57" name="Checkout Started" />
                <Bar dataKey="reached_checkout" fill="#0f766e" name="Reached Checkout" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </section>

      {/* ===== Email engagement ===== */}
      <section>
        <SectionTitle hint="Sends, opens and clicks across all transactional + marketing templates.">
          Email & Campaigns
        </SectionTitle>
        <div className="grid md:grid-cols-4 gap-3 mb-4">
          <Stat label="Sent" value={fmt(data.email.sent)} hint={`${fmt(data.email.failed)} failed`} />
          <Stat label="Opens" value={fmt(data.email.opened)} hint={`${data.email.open_rate}% open rate`} />
          <Stat
            label="Clicks"
            value={fmt(data.email.clicked)}
            hint={`${data.email.click_rate}% click rate`}
          />
          <Stat label="CTOR" value={`${data.email.ctor}%`} hint="Clicks ÷ Opens" />
        </div>
        <div className="grid lg:grid-cols-3 gap-6">
          <Card className="p-4 lg:col-span-2">
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.email.daily}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(v) => v.slice(5)} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="sent" stroke="#7c6f57" strokeWidth={2} dot={false} name="Sent" />
                  <Line
                    type="monotone"
                    dataKey="opened"
                    stroke="#b08968"
                    strokeWidth={2}
                    dot={false}
                    name="Opened"
                  />
                  <Line
                    type="monotone"
                    dataKey="clicked"
                    stroke="#0f766e"
                    strokeWidth={2}
                    dot={false}
                    name="Clicked"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
          <Card className="p-5">
            <SectionTitle>By Template</SectionTitle>
            {data.email.byTemplate.length === 0 ? (
              <p className="text-xs text-muted-foreground">No email activity in this window.</p>
            ) : (
              <div className="space-y-2 text-xs">
                {data.email.byTemplate.slice(0, 8).map((t) => (
                  <div key={t.template} className="flex items-baseline justify-between gap-3">
                    <span className="truncate font-mono">{t.template}</span>
                    <span className="tabular-nums text-muted-foreground shrink-0">
                      {fmt(t.sent)}s · {fmt(t.opened)}o · {fmt(t.clicked)}c
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </section>

      {/* ===== Subscribers + Referrers ===== */}
      <section className="grid lg:grid-cols-2 gap-6">
        <Card className="p-5">
          <SectionTitle hint={`${fmt(data.subscribers.new_in_window)} new in this window`}>
            Newsletter Growth
          </SectionTitle>
          <div className="grid grid-cols-3 gap-3 mb-3">
            <Stat label="Total" value={fmt(data.subscribers.total)} />
            <Stat label="Opted In" value={fmt(data.subscribers.opted_in)} hint={`${data.subscribers.opt_in_rate}%`} />
            <Stat label="New" value={fmt(data.subscribers.new_in_window)} />
          </div>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.subscribers.daily}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(v) => v.slice(5)} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="subs"
                  stroke="#0f766e"
                  fill="#0f766e"
                  fillOpacity={0.2}
                  strokeWidth={2}
                  name="New subscribers"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5">
          <SectionTitle hint="Where visitors arrived from (excluding direct).">Top Referrers</SectionTitle>
          {data.topReferrers.length === 0 ? (
            <p className="text-xs text-muted-foreground">No external referrers logged yet.</p>
          ) : (
            <div className="space-y-2">
              {data.topReferrers.map((r) => {
                const max = data.topReferrers[0].count || 1;
                const pct = (r.count / max) * 100;
                return (
                  <div key={r.referrer}>
                    <div className="flex items-baseline justify-between text-xs">
                      <span className="truncate">{r.referrer}</span>
                      <span className="tabular-nums">{fmt(r.count)}</span>
                    </div>
                    <div className="h-1.5 mt-1 rounded-sm bg-ink/5 overflow-hidden">
                      <div className="h-full bg-ink/40" style={{ width: `${Math.max(2, pct)}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </section>

      <p className="text-[10px] text-muted-foreground text-center pt-4">
        Generated {new Date(data.generatedAt).toLocaleString()} · window: {data.windowDays} day
        {data.windowDays === 1 ? "" : "s"}
      </p>
    </div>
  );
}
