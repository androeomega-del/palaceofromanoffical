import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { adminBeforeLoad } from "@/lib/admin-route-guard";
import { callAdminServerFn } from "@/lib/admin-server-call";
import {
  getGscDashboardData,
  runGscMonitorNow,
  runGscWeeklyReviewNow,
  resolveGscAlert,
} from "@/lib/gsc-monitor.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, RefreshCw, AlertTriangle, CheckCircle2, Calendar } from "lucide-react";

export const Route = createFileRoute("/admin/gsc-monitor")({
  ssr: false,
  beforeLoad: adminBeforeLoad,
  component: AdminGscMonitor,
  head: () => ({
    meta: [
      { title: "GSC Monitor — Palace of Roman" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

function AdminGscMonitor() {
  const [busy, setBusy] = useState<string | null>(null);
  const q = useQuery({
    queryKey: ["gsc-dashboard"],
    queryFn: () => callAdminServerFn(getGscDashboardData),
  });

  const run = async (which: "daily" | "weekly") => {
    setBusy(which);
    try {
      if (which === "daily") await callAdminServerFn(runGscMonitorNow);
      else await callAdminServerFn(runGscWeeklyReviewNow);
      await q.refetch();
    } catch (e) {
      alert(`Run failed: ${e instanceof Error ? e.message : "Unknown"}`);
    } finally {
      setBusy(null);
    }
  };

  const resolve = async (id: string) => {
    await callAdminServerFn(resolveGscAlert, { data: { id } });
    await q.refetch();
  };

  const data = q.data;
  const openAlerts = (data?.alerts ?? []).filter((a) => !a.resolved_at);
  const latest = data?.snapshots[0];

  return (
    <div className="min-h-screen bg-background p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <Link to="/admin" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to admin
        </Link>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled={busy !== null} onClick={() => run("daily")}>
            <RefreshCw className={`h-4 w-4 mr-2 ${busy === "daily" ? "animate-spin" : ""}`} />
            Run daily snapshot
          </Button>
          <Button variant="outline" size="sm" disabled={busy !== null} onClick={() => run("weekly")}>
            <Calendar className={`h-4 w-4 mr-2 ${busy === "weekly" ? "animate-spin" : ""}`} />
            Run weekly review
          </Button>
        </div>
      </div>

      <h1 className="text-2xl font-semibold mb-1">Google Search Console Monitor</h1>
      <p className="text-sm text-muted-foreground mb-6">
        Daily snapshots at 14:00 UTC · weekly review every Monday 14:30 UTC · alerts emailed to notify@palaceofromanofficial.com
      </p>

      {q.isLoading && <p>Loading…</p>}

      {latest && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Stat label="Clicks (latest)" value={String(latest.clicks)} />
          <Stat label="Impressions (latest)" value={String(latest.impressions)} />
          <Stat label="Avg position" value={(Math.round(latest.position * 10) / 10).toString()} />
          <Stat label="CTR" value={`${(latest.ctr * 100).toFixed(2)}%`} />
        </div>
      )}

      {/* Active alerts */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" /> Open alerts ({openAlerts.length})
        </h2>
        {openAlerts.length === 0 ? (
          <Card className="p-4 text-sm text-muted-foreground flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-600" /> No open alerts.
          </Card>
        ) : (
          <div className="space-y-2">
            {openAlerts.map((a) => (
              <Card key={a.id} className="p-4 flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`text-xs px-2 py-0.5 rounded ${
                        a.severity === "critical"
                          ? "bg-red-100 text-red-800"
                          : a.severity === "warning"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {a.severity.toUpperCase()}
                    </span>
                    <span className="font-medium">{a.title}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{a.message}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(a.created_at).toLocaleString()}
                    {a.emailed ? " · emailed" : ""}
                  </p>
                </div>
                <Button size="sm" variant="ghost" onClick={() => resolve(a.id)}>
                  Resolve
                </Button>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Weekly reviews */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3">Weekly reviews</h2>
        {(data?.weeklyReviews ?? []).length === 0 ? (
          <Card className="p-4 text-sm text-muted-foreground">
            No reviews yet — click "Run weekly review" to generate the first one.
          </Card>
        ) : (
          <div className="space-y-3">
            {data!.weeklyReviews.map((w) => (
              <Card key={w.id} className="p-4">
                <div className="flex items-baseline justify-between mb-2">
                  <h3 className="font-medium">Week of {w.week_start}</h3>
                  <span className="text-xs text-muted-foreground">
                    {new Date(w.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mb-3">{w.summary}</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mb-3">
                  <div>
                    <span className="text-muted-foreground">Clicks:</span> {w.clicks}
                    {w.clicks_wow_pct !== null && (
                      <span className={w.clicks_wow_pct >= 0 ? "text-green-700 ml-1" : "text-red-700 ml-1"}>
                        ({w.clicks_wow_pct >= 0 ? "+" : ""}
                        {w.clicks_wow_pct}%)
                      </span>
                    )}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Impressions:</span> {w.impressions}
                    {w.impressions_wow_pct !== null && (
                      <span className={w.impressions_wow_pct >= 0 ? "text-green-700 ml-1" : "text-red-700 ml-1"}>
                        ({w.impressions_wow_pct >= 0 ? "+" : ""}
                        {w.impressions_wow_pct}%)
                      </span>
                    )}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Position:</span>{" "}
                    {Math.round(w.position * 10) / 10}
                  </div>
                  <div>
                    <span className="text-muted-foreground">CTR:</span>{" "}
                    {(w.ctr * 100).toFixed(2)}%
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-1">Action list</h4>
                  <ol className="list-decimal pl-5 text-sm space-y-1">
                    {(w.action_items ?? []).map((a, i) => (
                      <li key={i}>{a}</li>
                    ))}
                  </ol>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Daily snapshots table */}
      <section>
        <h2 className="text-lg font-semibold mb-3">Daily snapshots (last 60d)</h2>
        <Card className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-2">Date</th>
                <th className="text-right p-2">Clicks</th>
                <th className="text-right p-2">Impressions</th>
                <th className="text-right p-2">CTR</th>
                <th className="text-right p-2">Position</th>
                <th className="text-right p-2">Sitemap err/warn</th>
              </tr>
            </thead>
            <tbody>
              {(data?.snapshots ?? []).map((s) => (
                <tr key={s.snapshot_date} className="border-t">
                  <td className="p-2">{s.snapshot_date}</td>
                  <td className="p-2 text-right">{s.clicks}</td>
                  <td className="p-2 text-right">{s.impressions}</td>
                  <td className="p-2 text-right">{(s.ctr * 100).toFixed(2)}%</td>
                  <td className="p-2 text-right">{Math.round(s.position * 10) / 10}</td>
                  <td className="p-2 text-right">
                    {s.sitemap_errors}/{s.sitemap_warnings}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card className="p-4">
      <div className="text-xs text-muted-foreground uppercase tracking-wide">{label}</div>
      <div className="text-2xl font-semibold mt-1">{value}</div>
    </Card>
  );
}
