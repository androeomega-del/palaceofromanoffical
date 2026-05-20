import { createFileRoute, redirect } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ensureAdmin } from "@/lib/admin-guard.functions";
import {
  getInventorySyncDashboard,
  type InventorySyncRun,
} from "@/lib/inventory-sync.functions";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { RefreshCw, CheckCircle2, XCircle, Loader2, Circle } from "lucide-react";

export const Route = createFileRoute("/admin/inventory-sync")({
  beforeLoad: async () => {
    try {
      await ensureAdmin();
    } catch {
      throw redirect({ to: "/authentication" });
    }
  },
  component: AdminInventorySync,
  head: () => ({
    meta: [
      { title: "Inventory Sync — Palace of Roman" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

function formatNum(n: number) {
  return new Intl.NumberFormat("en-US").format(n);
}

function formatTime(iso: string | null) {
  if (!iso) return "Never";
  const d = new Date(iso);
  const diffMs = Date.now() - d.getTime();
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return d.toLocaleString();
}

function formatDuration(start: string, end: string | null) {
  const startMs = new Date(start).getTime();
  const endMs = end ? new Date(end).getTime() : Date.now();
  const s = Math.max(0, Math.round((endMs - startMs) / 1000));
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const rs = s % 60;
  if (m < 60) return `${m}m ${rs}s`;
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60}m`;
}

function StatusBadge({ status }: { status: InventorySyncRun["status"] }) {
  const map = {
    running: {
      Icon: Loader2,
      label: "Running",
      cls: "text-amber-600 bg-amber-50 border-amber-200",
      spin: true,
    },
    success: {
      Icon: CheckCircle2,
      label: "Success",
      cls: "text-emerald-700 bg-emerald-50 border-emerald-200",
      spin: false,
    },
    error: {
      Icon: XCircle,
      label: "Error",
      cls: "text-destructive bg-destructive/10 border-destructive/30",
      spin: false,
    },
  } as const;
  const { Icon, label, cls, spin } = map[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${cls}`}
    >
      <Icon className={`h-3 w-3 ${spin ? "animate-spin" : ""}`} />
      {label}
    </span>
  );
}

function Stat({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "default" | "good" | "bad";
}) {
  const toneCls =
    tone === "good"
      ? "text-emerald-700"
      : tone === "bad"
        ? "text-destructive"
        : "";
  return (
    <Card className="p-6">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className={`mt-2 font-serif text-3xl tabular-nums ${toneCls}`}>
        {value}
      </div>
      {hint ? (
        <div className="mt-1 text-xs text-muted-foreground">{hint}</div>
      ) : null}
    </Card>
  );
}

function AdminInventorySync() {
  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: ["admin", "inventory-sync-dashboard"],
    queryFn: () => getInventorySyncDashboard(),
    refetchInterval: 5_000,
    staleTime: 2_000,
  });

  const headline = data?.current ?? data?.last ?? null;
  const isRunning = !!data?.current;
  const progressPct =
    headline && headline.total > 0
      ? Math.min(100, Math.round((headline.processed / headline.total) * 1000) / 10)
      : 0;

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <header className="mb-8 flex items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl">Inventory Sync</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            BG quantities → Shopify on-hand. Updates every 5 seconds while a run
            is in progress.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isFetching}
        >
          <RefreshCw
            className={`mr-2 h-4 w-4 ${isFetching ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </header>

      {error ? (
        <Card className="border-destructive p-6 text-sm text-destructive">
          {(error as Error).message}
        </Card>
      ) : null}

      {isLoading || !data ? (
        <div className="text-sm text-muted-foreground">Loading…</div>
      ) : !headline ? (
        <Card className="p-8 text-center">
          <Circle className="mx-auto h-8 w-8 text-muted-foreground" />
          <h2 className="mt-3 font-serif text-xl">No syncs recorded yet</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Run{" "}
            <code className="rounded bg-muted px-1.5 py-0.5">
              node scripts/shopify/sync-inventory.mjs
            </code>{" "}
            to push BG quantities to Shopify. Each run will appear here.
          </p>
        </Card>
      ) : (
        <div className="space-y-8">
          {/* Headline run card */}
          <section>
            <div className="mb-3 flex items-baseline justify-between">
              <h2 className="text-sm uppercase tracking-wider text-muted-foreground">
                {isRunning ? "Current run" : "Last run"}
              </h2>
              <span className="text-xs text-muted-foreground">
                Started {formatTime(headline.started_at)}
                {!isRunning && headline.finished_at
                  ? ` · finished ${formatTime(headline.finished_at)}`
                  : ""}
              </span>
            </div>
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <StatusBadge status={headline.status} />
                  <span className="text-sm text-muted-foreground">
                    Duration{" "}
                    <span className="tabular-nums">
                      {formatDuration(headline.started_at, headline.finished_at)}
                    </span>
                  </span>
                </div>
                <div className="text-sm tabular-nums text-muted-foreground">
                  {formatNum(headline.processed)} / {formatNum(headline.total)}{" "}
                  variants
                </div>
              </div>

              <div className="mt-4">
                <div className="mb-1.5 flex items-baseline justify-between text-xs text-muted-foreground">
                  <span>Progress</span>
                  <span className="tabular-nums">{progressPct.toFixed(1)}%</span>
                </div>
                <Progress value={progressPct} className="h-2" />
              </div>

              {headline.error_message ? (
                <div className="mt-4 rounded border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                  {headline.error_message}
                </div>
              ) : null}
            </Card>
          </section>

          {/* Per-run totals */}
          <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <Stat
              label="Updated"
              value={formatNum(headline.updated)}
              hint="Quantities set"
              tone="good"
            />
            <Stat
              label="Activated"
              value={formatNum(headline.activated)}
              hint="Newly stocked at location"
            />
            <Stat
              label="Failed"
              value={formatNum(headline.failed)}
              hint="Errors during this run"
              tone={headline.failed > 0 ? "bad" : "default"}
            />
            <Stat
              label="Availability flips"
              value={formatNum(headline.flipped)}
              hint="In-stock ↔ out-of-stock changes"
            />
          </section>

          {/* Recent runs table */}
          <section>
            <h2 className="mb-3 text-sm uppercase tracking-wider text-muted-foreground">
              Recent runs
            </h2>
            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium">Started</th>
                      <th className="px-4 py-3 font-medium">Duration</th>
                      <th className="px-4 py-3 text-right font-medium">Processed</th>
                      <th className="px-4 py-3 text-right font-medium">Updated</th>
                      <th className="px-4 py-3 text-right font-medium">Activated</th>
                      <th className="px-4 py-3 text-right font-medium">Failed</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {data.recent.map((r) => (
                      <tr key={r.id} className="hover:bg-muted/30">
                        <td className="px-4 py-3">
                          <StatusBadge status={r.status} />
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {formatTime(r.started_at)}
                        </td>
                        <td className="px-4 py-3 tabular-nums text-muted-foreground">
                          {formatDuration(r.started_at, r.finished_at)}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums">
                          {formatNum(r.processed)}
                          <span className="text-muted-foreground">
                            {" / "}
                            {formatNum(r.total)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums text-emerald-700">
                          {formatNum(r.updated)}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums">
                          {formatNum(r.activated)}
                        </td>
                        <td
                          className={`px-4 py-3 text-right tabular-nums ${
                            r.failed > 0 ? "text-destructive" : ""
                          }`}
                        >
                          {formatNum(r.failed)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </section>
        </div>
      )}
    </main>
  );
}
