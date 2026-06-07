import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { adminBeforeLoad } from "@/lib/admin-route-guard";
import { getBackfillStatus, type BackfillStatus } from "@/lib/backfill-status.functions";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { RefreshCw, CheckCircle2, XCircle, Loader2, Circle } from "lucide-react";

export const Route = createFileRoute("/admin/backfill-status")({
  ssr: false,
  beforeLoad: adminBeforeLoad,
  component: AdminBackfillStatus,
  head: () => ({
    meta: [
      { title: "Catalog Backfill — Palace of Roman" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

function fmt(n: number) {
  return new Intl.NumberFormat("en-US").format(n);
}

function formatDuration(ms: number) {
  const s = Math.max(0, Math.round(ms / 1000));
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ${s % 60}s`;
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60}m`;
}

function StatusBadge({ status }: { status: BackfillStatus["status"] }) {
  const map = {
    running: { Icon: Loader2, label: "Running", cls: "text-amber-600 bg-amber-50 border-amber-200", spin: true },
    done: { Icon: CheckCircle2, label: "Complete", cls: "text-emerald-700 bg-emerald-50 border-emerald-200", spin: false },
    error: { Icon: XCircle, label: "Error", cls: "text-destructive bg-destructive/10 border-destructive/30", spin: false },
    idle: { Icon: Circle, label: "Idle", cls: "text-muted-foreground bg-muted border-border", spin: false },
  } as const;
  const { Icon, label, cls, spin } = map[status] ?? map.idle;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${cls}`}>
      <Icon className={`h-3 w-3 ${spin ? "animate-spin" : ""}`} />
      {label}
    </span>
  );
}

function Stat({ label, value, hint, tone }: { label: string; value: string; hint?: string; tone?: "good" | "bad" }) {
  const toneCls = tone === "good" ? "text-emerald-700" : tone === "bad" ? "text-destructive" : "";
  return (
    <Card className="p-6">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={`mt-2 font-serif text-3xl tabular-nums ${toneCls}`}>{value}</div>
      {hint ? <div className="mt-1 text-xs text-muted-foreground">{hint}</div> : null}
    </Card>
  );
}

function AdminBackfillStatus() {
  // Tick every second so duration / ETA stay live between server polls.
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: ["admin", "backfill-status"],
    queryFn: () => getBackfillStatus(),
    refetchInterval: (q) => {
      const s = (q.state.data as BackfillStatus | null)?.status;
      return s === "running" ? 3_000 : 10_000;
    },
    staleTime: 1_000,
  });

  const s = data ?? null;
  const total = s?.total_products ?? 0;
  const seen = s?.total_seen ?? 0;
  const pct = total > 0 ? Math.min(100, (seen / total) * 100) : 0;

  let etaMs = 0;
  let elapsedMs = 0;
  if (s?.started_at) {
    elapsedMs = Date.now() - new Date(s.started_at).getTime();
    if (s.status === "running" && seen > 0 && total > seen) {
      const perItem = elapsedMs / seen;
      etaMs = perItem * (total - seen);
    }
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <header className="mb-8 flex items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl">Catalog Backfill</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Shopify product types + EAN-13 barcodes. Auto-refreshes every 3 seconds while running.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
          <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </header>

      {error ? (
        <Card className="mb-6 border-destructive p-6 text-sm text-destructive">{(error as Error).message}</Card>
      ) : null}

      {isLoading ? (
        <div className="text-sm text-muted-foreground">Loading…</div>
      ) : !s ? (
        <Card className="p-8 text-center">
          <Circle className="mx-auto h-8 w-8 text-muted-foreground" />
          <h2 className="mt-3 font-serif text-xl">No backfill recorded yet</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Run <code className="rounded bg-muted px-1.5 py-0.5">node scripts/shopify/backfill-types-barcodes.mjs</code> to start.
          </p>
        </Card>
      ) : (
        <div className="space-y-6">
          <Card className="p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <StatusBadge status={s.status} />
                <span className="text-sm text-muted-foreground tabular-nums">
                  Elapsed {formatDuration(elapsedMs)}
                  {s.status === "running" && etaMs > 0 ? <> · ETA {formatDuration(etaMs)}</> : null}
                </span>
              </div>
              <div className="text-sm tabular-nums text-muted-foreground">
                {fmt(seen)} / {fmt(total)} products
              </div>
            </div>
            <div className="mt-4">
              <div className="mb-1.5 flex items-baseline justify-between text-xs text-muted-foreground">
                <span>Progress</span>
                <span className="tabular-nums">{pct.toFixed(1)}%</span>
              </div>
              <Progress value={pct} className="h-2" />
            </div>
            {s.last_error ? (
              <div className="mt-4 rounded border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                {s.last_error}
              </div>
            ) : null}
          </Card>

          <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <Stat label="Products seen" value={fmt(seen)} hint="Iterated this run" />
            <Stat label="Types set" value={fmt(s.products_type_updated)} hint="product_type filled" tone="good" />
            <Stat label="Barcodes added" value={fmt(s.variants_barcoded)} hint="EAN-13 written" tone="good" />
            <Stat label="Errors" value={fmt(s.errors)} tone={s.errors > 0 ? "bad" : undefined} />
          </section>

          <Card className="p-6">
            <div className="grid gap-4 text-sm md:grid-cols-2">
              <div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground">Started</div>
                <div className="mt-1 tabular-nums">
                  {s.started_at ? new Date(s.started_at).toLocaleString() : "—"}
                </div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground">Last update</div>
                <div className="mt-1 tabular-nums">{new Date(s.updated_at).toLocaleString()}</div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground">Finished</div>
                <div className="mt-1 tabular-nums">
                  {s.finished_at ? new Date(s.finished_at).toLocaleString() : "—"}
                </div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground">Cursor</div>
                <div className="mt-1 truncate font-mono text-xs text-muted-foreground" title={s.cursor ?? ""}>
                  {s.cursor ?? "—"}
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}
    </main>
  );
}
