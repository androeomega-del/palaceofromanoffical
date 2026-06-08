import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { adminBeforeLoad } from "@/lib/admin-route-guard";
import { supabase } from "@/integrations/supabase/client";
import {
  getSalesDiagnostic,
  type SalesDiagnostic,
  type Severity,
} from "@/lib/sales-diagnostic.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, RefreshCw, AlertTriangle, CheckCircle2, Activity, Gauge, Mail, ShoppingBag } from "lucide-react";

const WINDOWS = [
  { label: "24h", hours: 24 },
  { label: "48h", hours: 48 },
  { label: "7d", hours: 168 },
];

async function fetchDiagnostic(hours: number): Promise<SalesDiagnostic> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return getSalesDiagnostic({
    data: { hours },
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}

export const Route = createFileRoute("/admin/diagnostics")({
  ssr: false,
  beforeLoad: adminBeforeLoad,
  component: AdminDiagnostics,
  head: () => ({
    meta: [
      { title: "Sales Diagnostic Engine — Palace of Roman" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

function sevTone(s: Severity): string {
  if (s === "critical") return "border-red-500/60 bg-red-500/5 text-red-200";
  if (s === "warn") return "border-amber-500/60 bg-amber-500/5 text-amber-200";
  return "border-emerald-500/40 bg-emerald-500/5 text-emerald-200";
}

function AdminDiagnostics() {
  const [hours, setHours] = useState(24);
  const { data, isFetching, refetch } = useQuery({
    queryKey: ["sales-diagnostic", hours],
    queryFn: () => fetchDiagnostic(hours),
    refetchInterval: 60_000,
  });

  return (
    <main className="min-h-screen bg-canvas text-ink px-6 py-10">
      <div className="max-w-7xl mx-auto space-y-8">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <Link to="/admin" className="inline-flex items-center text-xs uppercase tracking-[0.3em] text-bronze hover:underline">
              <ArrowLeft className="h-3 w-3 mr-1" /> Admin
            </Link>
            <h1 className="font-serif text-4xl md:text-5xl mt-3">Sales Diagnostic Engine</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Shopify B2C — abandonment, real-user vitals, and email-channel conversion. Auto-refreshing every 60 seconds.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex rounded-md border border-border overflow-hidden">
              {WINDOWS.map((w) => (
                <button
                  key={w.hours}
                  onClick={() => setHours(w.hours)}
                  className={`px-3 py-1.5 text-xs uppercase tracking-wider transition-colors ${
                    hours === w.hours ? "bg-bronze text-canvas" : "bg-transparent hover:bg-bronze/10"
                  }`}
                >
                  {w.label}
                </button>
              ))}
            </div>
            <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
              <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isFetching ? "animate-spin" : ""}`} />
              Run Audit
            </Button>
          </div>
        </header>

        {!data ? (
          <p className="text-sm text-muted-foreground">Loading diagnostic…</p>
        ) : (
          <>
            <section>
              <h2 className="text-xs uppercase tracking-[0.3em] text-bronze mb-3">Active anomalies</h2>
              {data.anomalies.length === 0 ? (
                <Card className="p-6 border-emerald-500/30 bg-emerald-500/5">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                    <div>
                      <p className="font-serif text-lg">All triggers nominal</p>
                      <p className="text-xs text-muted-foreground">
                        No abandonment spike, no vitals regression, no email-CVR drop in the last {data.windowHours}h.
                      </p>
                    </div>
                  </div>
                </Card>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {data.anomalies.map((a) => (
                    <Card key={a.id} className={`p-5 border ${sevTone(a.severity)}`}>
                      <div className="flex items-start gap-3 mb-3">
                        <AlertTriangle className="h-5 w-5 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-[10px] uppercase tracking-[0.3em] opacity-80">{a.severity}</p>
                          <h3 className="font-serif text-lg leading-snug">{a.title}</h3>
                        </div>
                      </div>
                      <p className="text-sm mb-3">{a.headline}</p>
                      <p className="text-xs text-muted-foreground mb-4">{a.detail}</p>
                      <div className="flex items-center justify-between text-xs border-t border-current/20 pt-3 mb-4">
                        <span className="opacity-80">{a.metric.label}</span>
                        <span>
                          <span className="font-semibold">{a.metric.value}</span>
                          <span className="opacity-60"> · target {a.metric.threshold}</span>
                        </span>
                      </div>
                      <p className="text-[10px] uppercase tracking-[0.3em] opacity-80 mb-2">Recommended fixes</p>
                      <ul className="space-y-1.5 text-xs">
                        {a.fixes.map((f) => (
                          <li key={f} className="flex gap-2">
                            <span className="opacity-60">→</span>
                            <span>{f}</span>
                          </li>
                        ))}
                      </ul>
                    </Card>
                  ))}
                </div>
              )}
            </section>

            <section className="grid md:grid-cols-3 gap-4">
              <Card className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <ShoppingBag className="h-4 w-4 text-bronze" />
                  <h3 className="text-xs uppercase tracking-[0.3em]">Checkout funnel</h3>
                </div>
                <div className="space-y-2 text-sm">
                  <Row label="Add to cart" value={data.abandonment.add_to_cart} />
                  <Row label="Reached checkout" value={data.abandonment.reached_checkout} />
                  <Row label="Abandonment rate" value={`${data.abandonment.abandonment_rate}%`} />
                  <Row label="Captured emails" value={data.abandonment.abandoned_carts_with_email} />
                  <Row label="Abandoned value" value={`$${data.abandonment.abandoned_value_usd.toLocaleString()}`} />
                </div>
              </Card>

              <Card className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Gauge className="h-4 w-4 text-bronze" />
                  <h3 className="text-xs uppercase tracking-[0.3em]">Real-user Web Vitals (p75)</h3>
                </div>
                {data.vitals.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No samples yet — beacon collects on real visits.</p>
                ) : (
                  <div className="space-y-2 text-sm">
                    {data.vitals.map((v) => (
                      <Row
                        key={`${v.metric}-${v.device}`}
                        label={`${v.metric} · ${v.device}`}
                        value={
                          <span
                            className={
                              v.rating === "poor"
                                ? "text-red-400"
                                : v.rating === "needs-improvement"
                                  ? "text-amber-400"
                                  : "text-emerald-400"
                            }
                          >
                            {v.p75}
                            {v.metric === "CLS" ? "" : "ms"}
                            <span className="opacity-50 ml-1">({v.samples})</span>
                          </span>
                        }
                      />
                    ))}
                  </div>
                )}
              </Card>

              <Card className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Mail className="h-4 w-4 text-bronze" />
                  <h3 className="text-xs uppercase tracking-[0.3em]">Email-channel CVR</h3>
                </div>
                <div className="space-y-2 text-sm">
                  <Row label="This week sessions" value={data.emailCvr.this_week_sessions} />
                  <Row label="This week conversions" value={data.emailCvr.this_week_conversions} />
                  <Row label="This week CVR" value={`${data.emailCvr.this_week_cvr}%`} />
                  <Row label="Last week CVR" value={`${data.emailCvr.last_week_cvr}%`} />
                  <Row
                    label="WoW delta"
                    value={
                      <span className={data.emailCvr.delta_pct < -20 ? "text-red-400" : "text-emerald-400"}>
                        {data.emailCvr.delta_pct}%
                      </span>
                    }
                  />
                </div>
              </Card>
            </section>

            <section>
              <h2 className="text-xs uppercase tracking-[0.3em] text-bronze mb-3">Add-to-cart friction (PDPs &lt; 2% ATC)</h2>
              <Card className="p-0 overflow-hidden">
                {data.topFriction.length === 0 ? (
                  <p className="p-6 text-sm text-muted-foreground">
                    No friction signals in the window — every viewed PDP is converting above the 2% ATC floor.
                  </p>
                ) : (
                  <table className="w-full text-sm">
                    <thead className="bg-bronze/10 text-[10px] uppercase tracking-[0.25em]">
                      <tr>
                        <th className="text-left px-4 py-2">Product</th>
                        <th className="text-right px-4 py-2">Views</th>
                        <th className="text-right px-4 py-2">Adds</th>
                        <th className="text-right px-4 py-2">ATC rate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.topFriction.map((p) => (
                        <tr key={p.handle} className="border-t border-border">
                          <td className="px-4 py-2">
                            <Link to="/product/$handle" params={{ handle: p.handle }} className="hover:underline">
                              {p.title ?? p.handle}
                            </Link>
                            <p className="text-[10px] text-muted-foreground">{p.handle}</p>
                          </td>
                          <td className="px-4 py-2 text-right">{p.views}</td>
                          <td className="px-4 py-2 text-right">{p.adds}</td>
                          <td className="px-4 py-2 text-right text-amber-400">{p.atc_rate}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </Card>
            </section>

            <footer className="flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
              <Activity className="h-3 w-3" />
              Generated {new Date(data.generatedAt).toLocaleTimeString()} · window {data.windowHours}h
            </footer>
          </>
        )}
      </div>
    </main>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between border-b border-border/40 pb-1.5">
      <span className="text-muted-foreground text-xs uppercase tracking-wider">{label}</span>
      <span className="font-medium tabular-nums">{value}</span>
    </div>
  );
}
