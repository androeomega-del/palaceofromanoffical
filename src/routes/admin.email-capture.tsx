import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { adminBeforeLoad } from "@/lib/admin-route-guard";
import { getEmailCaptureDashboard } from "@/lib/email-capture-dashboard.functions";
import { exportNewsletterCsv } from "@/lib/newsletter-export.functions";
import { syncShopifyAbandonedCheckouts } from "@/lib/shopify-abandoned-sync.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  ArrowLeft,
  RefreshCw,
  Bell,
  MailOpen,
  ShoppingBag,
  Send,
  AlertTriangle,
  CheckCircle2,
  Download,
  CloudDownload,
} from "lucide-react";

export const Route = createFileRoute("/admin/email-capture")({
  beforeLoad: adminBeforeLoad,
  component: AdminEmailCapture,
  head: () => ({
    meta: [
      { title: "Email Capture — Palace of Roman" },
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
const formatWhen = (iso: string) =>
  new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

function Stat({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "default" | "warn" | "good";
}) {
  const toneCls =
    tone === "warn"
      ? "text-red-700"
      : tone === "good"
        ? "text-emerald-700"
        : "";
  return (
    <Card className="p-6">
      <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
        {label}
      </div>
      <div
        className={`mt-3 font-serif text-3xl md:text-4xl tabular-nums ${toneCls}`}
      >
        {value}
      </div>
      {hint ? (
        <div className="mt-1 text-xs text-muted-foreground">{hint}</div>
      ) : null}
    </Card>
  );
}

function SectionHeader({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mb-4 flex items-baseline justify-between gap-3">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <h2 className="font-serif text-xl">{title}</h2>
      </div>
      {subtitle ? (
        <span className="text-xs text-muted-foreground">{subtitle}</span>
      ) : null}
    </div>
  );
}

function AdminEmailCapture() {
  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: ["admin", "email-capture"],
    queryFn: () => getEmailCaptureDashboard(),
    refetchInterval: 60_000,
    staleTime: 30_000,
  });
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await exportNewsletterCsv();
      const blob = new Blob([res.csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = res.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  };

  return (
    <main className="min-h-screen bg-canvas px-6 py-12 md:py-16">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <Link
              to="/admin"
              className="inline-flex items-center gap-1 text-xs uppercase tracking-[0.25em] text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-3 w-3" /> Admin
            </Link>
            <h1 className="mt-3 font-serif text-3xl md:text-4xl">
              Email Capture
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Restock alerts, exit-intent signups, abandoned-cart captures, and
              dispatch status.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              disabled={exporting}
            >
              <Download className={`h-3 w-3 mr-2 ${exporting ? "animate-pulse" : ""}`} />
              {exporting ? "Exporting…" : "Export CSV"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isFetching}
            >
              <RefreshCw
                className={`h-3 w-3 mr-2 ${isFetching ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
          </div>
        </div>

        {isLoading ? (
          <Card className="p-12 text-center text-sm text-muted-foreground">
            Loading…
          </Card>
        ) : error ? (
          <Card className="p-6 text-sm text-red-700">
            Failed to load: {(error as Error).message}
          </Card>
        ) : data ? (
          <div className="space-y-12">
            {/* Stock alerts */}
            <section>
              <SectionHeader
                icon={Bell}
                title="Restock alerts"
                subtitle={`${fmt(data.stockAlerts.uniqueEmails)} unique emails`}
              />
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <Stat label="Total" value={fmt(data.stockAlerts.total)} />
                <Stat label="Last 7d" value={fmt(data.stockAlerts.last7d)} />
                <Stat label="Last 30d" value={fmt(data.stockAlerts.last30d)} />
                <Stat
                  label="Notified"
                  value={fmt(data.stockAlerts.notified)}
                  hint={`${data.stockAlerts.notifyRate}% notify rate`}
                  tone="good"
                />
                <Stat
                  label="Pending"
                  value={fmt(data.stockAlerts.pending)}
                  hint="Awaiting restock"
                />
              </div>
              {data.stockAlerts.recent.length > 0 ? (
                <Card className="mt-4 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                      <tr>
                        <th className="px-4 py-2 text-left">Email</th>
                        <th className="px-4 py-2 text-left">Product</th>
                        <th className="px-4 py-2 text-left">Variant</th>
                        <th className="px-4 py-2 text-left">Created</th>
                        <th className="px-4 py-2 text-left">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.stockAlerts.recent.map((a) => (
                        <tr key={a.id} className="border-t">
                          <td className="px-4 py-2">{a.email}</td>
                          <td className="px-4 py-2">{a.product_title}</td>
                          <td className="px-4 py-2 text-muted-foreground">
                            {a.variant_title ?? "—"}
                          </td>
                          <td className="px-4 py-2 text-muted-foreground">
                            {formatWhen(a.created_at)}
                          </td>
                          <td className="px-4 py-2">
                            {a.notified_at ? (
                              <span className="inline-flex items-center gap-1 text-emerald-700">
                                <CheckCircle2 className="h-3 w-3" />
                                Notified
                              </span>
                            ) : (
                              <span className="text-muted-foreground">
                                Pending
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Card>
              ) : null}
            </section>

            {/* Exit-intent + Newsletter */}
            <section>
              <SectionHeader
                icon={MailOpen}
                title="Exit-intent & Atelier List"
                subtitle={`${data.newsletter.optInRate}% opt-in`}
              />
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <Stat
                  label="Subscribers"
                  value={fmt(data.newsletter.total)}
                />
                <Stat label="Last 7d" value={fmt(data.newsletter.last7d)} />
                <Stat label="Last 30d" value={fmt(data.newsletter.last30d)} />
                <Stat
                  label="Exit-intent"
                  value={fmt(data.newsletter.exitIntent.total)}
                  hint={`${data.newsletter.exitIntent.share}% of all signups`}
                />
                <Stat
                  label="Exit-intent 7d"
                  value={fmt(data.newsletter.exitIntent.last7d)}
                />
              </div>
              {data.newsletter.bySource.length > 0 ? (
                <Card className="mt-4 p-4">
                  <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground mb-2">
                    By source
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {data.newsletter.bySource.map((s) => (
                      <span
                        key={s.source}
                        className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs"
                      >
                        <span className="font-medium">{s.source}</span>
                        <span className="text-muted-foreground tabular-nums">
                          {fmt(s.count)}
                        </span>
                      </span>
                    ))}
                  </div>
                </Card>
              ) : null}
            </section>

            {/* Abandoned carts */}
            <section>
              <SectionHeader
                icon={ShoppingBag}
                title="Abandoned cart captures"
                subtitle={`${usd(data.abandonedCarts.recoveredValueUsd)} recovered`}
              />
              <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                <Stat label="Captured" value={fmt(data.abandonedCarts.total)} />
                <Stat
                  label="Last 7d"
                  value={fmt(data.abandonedCarts.last7d)}
                />
                <Stat
                  label="Emailed"
                  value={fmt(data.abandonedCarts.emailed)}
                  hint={`${data.abandonedCarts.captureToEmailRate}% of captures`}
                />
                <Stat
                  label="Recovered"
                  value={fmt(data.abandonedCarts.recovered)}
                  tone="good"
                  hint={`${data.abandonedCarts.recoveryRate}% of emailed`}
                />
                <Stat
                  label="Conversion"
                  value={`${data.abandonedCarts.overallConversion}%`}
                  hint="Captured → recovered"
                />
                <Stat
                  label="Eligible now"
                  value={fmt(data.abandonedCarts.eligibleNow)}
                  hint="Next dispatch window"
                />
              </div>
            </section>

            {/* Dispatch */}
            <section>
              <SectionHeader
                icon={Send}
                title="Send status (30d)"
                subtitle={`${fmt(data.dispatch.sent7d)} sent · ${fmt(
                  data.dispatch.failed7d
                )} failed in last 7d`}
              />
              {data.dispatch.byTemplate.length > 0 ? (
                <Card className="overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                      <tr>
                        <th className="px-4 py-2 text-left">Template</th>
                        <th className="px-4 py-2 text-right">Sent</th>
                        <th className="px-4 py-2 text-right">Failed</th>
                        <th className="px-4 py-2 text-right">Total</th>
                        <th className="px-4 py-2 text-right">Success rate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.dispatch.byTemplate.map((t) => {
                        const rate =
                          t.total > 0
                            ? Number(((t.sent / t.total) * 100).toFixed(1))
                            : 0;
                        return (
                          <tr key={t.template} className="border-t">
                            <td className="px-4 py-2 font-medium">
                              {t.template}
                            </td>
                            <td className="px-4 py-2 text-right tabular-nums text-emerald-700">
                              {fmt(t.sent)}
                            </td>
                            <td className="px-4 py-2 text-right tabular-nums text-red-700">
                              {fmt(t.failed)}
                            </td>
                            <td className="px-4 py-2 text-right tabular-nums">
                              {fmt(t.total)}
                            </td>
                            <td className="px-4 py-2 text-right tabular-nums">
                              {rate}%
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </Card>
              ) : (
                <Card className="p-6 text-sm text-muted-foreground">
                  No emails dispatched in the last 30 days yet.
                </Card>
              )}

              {data.dispatch.recentFailures.length > 0 ? (
                <Card className="mt-4 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle className="h-4 w-4 text-red-700" />
                    <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
                      Recent failures
                    </div>
                  </div>
                  <ul className="space-y-2 text-sm">
                    {data.dispatch.recentFailures.map((f) => (
                      <li
                        key={f.id}
                        className="rounded border border-red-100 bg-red-50 px-3 py-2"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-medium">{f.template_name}</span>
                          <span className="text-xs text-muted-foreground">
                            {formatWhen(f.created_at)}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {f.recipient_email}
                        </div>
                        {f.error_message ? (
                          <div className="mt-1 text-xs text-red-700">
                            {f.error_message}
                          </div>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                </Card>
              ) : null}
            </section>
          </div>
        ) : null}
      </div>
    </main>
  );
}
