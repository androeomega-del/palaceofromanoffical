import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { adminBeforeLoad } from "@/lib/admin-route-guard";
import { getEmailRecoveryDashboard } from "@/lib/email-recovery-dashboard.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, RefreshCw, AlertTriangle, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/admin/email-recovery")({
  beforeLoad: adminBeforeLoad,
  component: AdminEmailRecovery,
  head: () => ({
    meta: [
      { title: "Email Recovery — Palace of Roman" },
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
      <div className={`mt-3 font-serif text-3xl md:text-4xl tabular-nums ${toneCls}`}>
        {value}
      </div>
      {hint ? <div className="mt-1 text-xs text-muted-foreground">{hint}</div> : null}
    </Card>
  );
}

function formatWhen(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function AdminEmailRecovery() {
  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: ["admin", "email-recovery"],
    queryFn: () => getEmailRecoveryDashboard(),
    refetchInterval: 60_000,
    staleTime: 30_000,
  });

  return (
    <main className="min-h-screen bg-canvas px-6 py-12 md:py-16">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.4em] text-bronze mb-3">
              Admin · Lifecycle
            </p>
            <h1 className="font-serif text-4xl md:text-5xl">Email Recovery</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Cart recovery, opt-ins, and dispatch errors. Last 30 days.
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Link to="/admin">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-1.5" /> Admin
              </Button>
            </Link>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isFetching}
            >
              <RefreshCw
                className={`h-4 w-4 mr-1.5 ${isFetching ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
          </div>
        </div>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : error ? (
          <Card className="p-6 border-red-200">
            <p className="text-sm text-red-700">
              Failed to load dashboard:{" "}
              {error instanceof Error ? error.message : String(error)}
            </p>
          </Card>
        ) : data ? (
          <div className="space-y-12">
            {/* Cart recovery */}
            <section>
              <h2 className="font-serif text-2xl mb-4">Cart Recovery</h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Stat label="Abandoned carts" value={fmt(data.cartRecovery.totalCarts)} hint="With captured email" />
                <Stat label="Recovery emails sent" value={fmt(data.cartRecovery.emailsSent)} />
                <Stat
                  label="Recovered"
                  value={fmt(data.cartRecovery.recovered)}
                  hint={`${data.cartRecovery.recoveryRate}% of sends`}
                  tone="good"
                />
                <Stat
                  label="Recovered value"
                  value={usd(data.cartRecovery.recoveredValueUsd)}
                />
                <Stat
                  label="Eligible right now"
                  value={fmt(data.cartRecovery.eligibleNow)}
                  hint="In 1h–24h window"
                />
              </div>
            </section>

            {/* Dispatch health */}
            <section>
              <h2 className="font-serif text-2xl mb-4">Dispatch Health</h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <Stat label="Sent (30d)" value={fmt(data.dispatch.sentCount)} tone="good" />
                <Stat
                  label="Failed (30d)"
                  value={fmt(data.dispatch.failedCount)}
                  tone={data.dispatch.failedCount > 0 ? "warn" : "default"}
                />
                <Stat label="Sent (7d)" value={fmt(data.dispatch.sentLast7d)} />
                <Stat
                  label="Failed (7d)"
                  value={fmt(data.dispatch.failedLast7d)}
                  tone={data.dispatch.failedLast7d > 0 ? "warn" : "default"}
                />
              </div>

              <div className="grid lg:grid-cols-2 gap-6">
                <Card className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <AlertTriangle className="h-4 w-4 text-red-700" />
                    <h3 className="font-serif text-lg">Recent errors</h3>
                  </div>
                  {data.dispatch.recentErrors.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No dispatch errors in the last 30 days.
                    </p>
                  ) : (
                    <ul className="space-y-3">
                      {data.dispatch.recentErrors.map((e) => (
                        <li key={e.id} className="border-b border-ink/10 pb-3 last:border-0">
                          <div className="flex items-baseline justify-between gap-3">
                            <span className="text-sm font-medium truncate">
                              {e.recipient_email}
                            </span>
                            <span className="text-[10px] uppercase tracking-wider text-muted-foreground whitespace-nowrap">
                              {formatWhen(e.created_at)}
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-red-700 font-mono break-words">
                            {e.error_message ?? "Unknown error"}
                          </p>
                        </li>
                      ))}
                    </ul>
                  )}
                </Card>

                <Card className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <CheckCircle2 className="h-4 w-4 text-emerald-700" />
                    <h3 className="font-serif text-lg">Recent dispatches</h3>
                  </div>
                  {data.dispatch.recentSends.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No dispatches yet. The cron job runs every 15 minutes.
                    </p>
                  ) : (
                    <ul className="space-y-2 max-h-96 overflow-auto">
                      {data.dispatch.recentSends.map((d) => (
                        <li
                          key={d.id}
                          className="flex items-baseline justify-between gap-3 text-xs"
                        >
                          <span
                            className={`inline-block min-w-[52px] text-[10px] uppercase tracking-wider ${
                              d.status === "sent" ? "text-emerald-700" : "text-red-700"
                            }`}
                          >
                            {d.status}
                          </span>
                          <span className="inline-block min-w-[100px] text-[10px] uppercase tracking-wider text-muted-foreground">
                            {d.template_name}
                          </span>
                          <span className="flex-1 truncate font-mono">
                            {d.recipient_email}
                          </span>
                          <span className="text-muted-foreground whitespace-nowrap">
                            {formatWhen(d.created_at)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </Card>
              </div>
            </section>

            {/* Newsletter / consent */}
            <section>
              <h2 className="font-serif text-2xl mb-4">Newsletter & Consent</h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Stat label="Total subscribers" value={fmt(data.newsletter.totalSubs)} />
                <Stat
                  label="Marketing opt-in"
                  value={`${data.newsletter.optInRate}%`}
                  hint={`${fmt(data.newsletter.optedIn)} of ${fmt(data.newsletter.totalSubs)}`}
                  tone="good"
                />
                <Stat label="New (7d)" value={fmt(data.newsletter.subsLast7d)} />
                <Stat label="New (30d)" value={fmt(data.newsletter.subsLast30d)} />
              </div>
              {data.newsletter.optedOut > 0 ? (
                <p className="mt-3 text-xs text-muted-foreground">
                  {fmt(data.newsletter.optedOut)} subscribers did not opt in to marketing
                  (transactional only).
                </p>
              ) : null}
            </section>

            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Generated {formatWhen(data.generatedAt)}
            </p>
          </div>
        ) : null}
      </div>
    </main>
  );
}
