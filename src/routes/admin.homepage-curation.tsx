import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { adminBeforeLoad } from "@/lib/admin-route-guard";
import { supabase } from "@/integrations/supabase/client";
import {
  getHomepageCuration,
  updateHomepageLayoutJson,
  activateHomepageLayout,
  forceRefreshHomepage,
  forcePublishLatest,
  generateHomepagePreview,
  diagnoseHomepage,
  getHomepageLayoutAudit,
  getHomepageEditionById,
} from "@/lib/admin-management.functions";
import { getShopifyCollectionDiff } from "@/lib/shopify-collection-diff.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { HomepageLayoutPreview } from "@/components/admin/homepage-layout-preview";
import type { HomepageLayout } from "@/lib/homepage-layout-schema";
import {
  ArrowLeft,
  RefreshCw,
  Save,
  Power,
  Zap,
  Eye,
  CheckCircle2,
  ExternalLink,
  AlertTriangle,
  Info,
  XCircle,
  Stethoscope,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/homepage-curation")({
  beforeLoad: adminBeforeLoad,
  component: AdminHomepageCuration,
  head: () => ({
    meta: [
      { title: "Homepage Curation — Palace of Roman" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

function fmtWhen(iso?: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function AdminHomepageCuration() {
  const qc = useQueryClient();
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    let alive = true;
    supabase.auth.getUser().then(({ data, error }) => {
      if (alive) setAuthReady(!error && !!data.user);
    });
    return () => {
      alive = false;
    };
  }, []);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "homepage-curation"],
    queryFn: () => getHomepageCuration(),
    refetchInterval: 30_000,
    enabled: authReady,
  });
  const { data: diag, refetch: refetchDiag } = useQuery({
    queryKey: ["admin", "homepage-diagnose"],
    queryFn: () => diagnoseHomepage(),
    refetchInterval: 30_000,
    enabled: authReady,
  });

  const [draft, setDraft] = useState<string>("");
  const [draftId, setDraftId] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [liveSync, setLiveSync] = useState<{
    at: string;
    action: string;
    layoutId?: string;
    blocks?: number;
  } | null>(null);

  useEffect(() => {
    if (data?.active && data.active.id !== draftId) {
      setDraft(JSON.stringify(data.active.layout_json, null, 2));
      setDraftId(data.active.id);
      setErr(null);
    }
  }, [data?.active, draftId]);

  const saveMut = useMutation({
    mutationFn: async () => {
      if (!data?.active) throw new Error("No active layout");
      let parsed: unknown;
      try {
        parsed = JSON.parse(draft);
      } catch {
        throw new Error("Invalid JSON");
      }
      await updateHomepageLayoutJson({
        data: { id: data.active.id, layout_json: parsed },
      });
    },
    onSuccess: () => {
      toast.success("Layout saved");
      qc.invalidateQueries({ queryKey: ["admin", "homepage-curation"] });
      qc.invalidateQueries({ queryKey: ["admin", "homepage-diagnose"] });
    },
    onError: (e: Error) => {
      setErr(e.message);
      toast.error(e.message);
    },
  });

  const refreshMut = useMutation({
    mutationFn: () => forceRefreshHomepage(),
    onSuccess: (res) => {
      const body = (res?.body ?? {}) as {
        action?: string;
        new_layout_id?: string;
        layout_id?: string;
        block_count?: number;
      };
      const action = body.action ?? "ok";
      setLiveSync({
        at: new Date().toISOString(),
        action,
        layoutId: body.new_layout_id ?? body.layout_id,
        blocks: body.block_count,
      });
      toast.success(`Live update completed — ${action}`);
      qc.invalidateQueries({ queryKey: ["admin", "homepage-curation"] });
      qc.invalidateQueries({ queryKey: ["admin", "homepage-diagnose"] });
      qc.invalidateQueries({ queryKey: ["homepage-daily-layout"] });
      qc.invalidateQueries({ queryKey: ["home"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const previewMut = useMutation({
    mutationFn: () => generateHomepagePreview(),
    onSuccess: (res) => {
      const body = res?.body as { new_layout_id?: string } | undefined;
      toast.success(
        body?.new_layout_id
          ? `Preview edition created (${body.new_layout_id.slice(0, 8)}). Re-activate it below to view.`
          : "Preview edition created",
      );
      qc.invalidateQueries({ queryKey: ["admin", "homepage-curation"] });
      qc.invalidateQueries({ queryKey: ["admin", "homepage-diagnose"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const activateMut = useMutation({
    mutationFn: (id: string) => activateHomepageLayout({ data: { id } }),
    onSuccess: () => {
      toast.success("Activated");
      qc.invalidateQueries({ queryKey: ["admin", "homepage-curation"] });
      qc.invalidateQueries({ queryKey: ["admin", "homepage-diagnose"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const forcePublishMut = useMutation({
    mutationFn: () => forcePublishLatest(),
    onSuccess: (res) => {
      setLiveSync({
        at: new Date().toISOString(),
        action: "force_published",
        layoutId: res?.layout_id,
      });
      toast.success("Latest edition published live");
      qc.invalidateQueries({ queryKey: ["admin", "homepage-curation"] });
      qc.invalidateQueries({ queryKey: ["admin", "homepage-diagnose"] });
      qc.invalidateQueries({ queryKey: ["homepage-daily-layout"] });
      qc.invalidateQueries({ queryKey: ["home"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });


  const layout = data?.active?.layout_json as
    | { blocks?: Array<{ type: string; heading?: string; hotspots?: unknown[] }>; source?: string }
    | undefined;

  return (
    <main className="min-h-screen bg-canvas px-6 py-12 md:py-16">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8 flex items-start justify-between gap-4 flex-wrap">
          <div>
            <Link
              to="/admin"
              className="text-xs uppercase tracking-[0.3em] text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
            >
              <ArrowLeft className="h-3 w-3" /> Admin
            </Link>
            <h1 className="font-serif text-3xl md:text-4xl mt-3">Homepage Curation</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Daily layout, hotspots, and the 48-hour refresh cycle.
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button
              onClick={() => previewMut.mutate()}
              disabled={previewMut.isPending}
              variant="outline"
            >
              <Eye className={`h-4 w-4 mr-2 ${previewMut.isPending ? "animate-pulse" : ""}`} />
              Generate preview
            </Button>
            <Button
              onClick={() => forcePublishMut.mutate()}
              disabled={forcePublishMut.isPending}
              variant="secondary"
              title="Republish the latest edition immediately, bypassing the 48-hour cooldown and the cron generator."
            >
              <Zap className={`h-4 w-4 mr-2 ${forcePublishMut.isPending ? "animate-pulse" : ""}`} />
              Force publish latest
            </Button>
            <Button
              onClick={() => refreshMut.mutate()}
              disabled={refreshMut.isPending}
              variant="default"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshMut.isPending ? "animate-spin" : ""}`} />
              Force refresh now
            </Button>

          </div>
        </div>

        {liveSync ? (
          <div className="mb-6 rounded-md border border-emerald-600/30 bg-emerald-50 text-emerald-900 px-4 py-3 flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 mt-0.5 text-emerald-600 shrink-0" />
              <div className="text-sm">
                <div className="font-medium">
                  Live update completed — {liveSync.action}
                </div>
                <div className="text-xs text-emerald-800/80 mt-0.5">
                  {fmtWhen(liveSync.at)}
                  {liveSync.layoutId
                    ? ` · edition ${liveSync.layoutId.slice(0, 8)}`
                    : ""}
                  {typeof liveSync.blocks === "number"
                    ? ` · ${liveSync.blocks} blocks`
                    : ""}
                  {" · visitor caches auto-invalidated"}
                </div>
              </div>
            </div>
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-medium inline-flex items-center gap-1 hover:underline"
            >
              View live site <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        ) : null}

        <DiagnosticsPanel
          diag={diag}
          onRefetch={() => refetchDiag()}
        />




        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : !data?.active ? (
          <Card className="p-6">
            <p className="text-sm">
              No active layout. Click <span className="font-semibold">Force refresh now</span> to
              generate one.
            </p>
          </Card>
        ) : (
          <div className="grid lg:grid-cols-3 gap-6">
            <Card className="p-5 lg:col-span-3">
              <div className="flex items-baseline justify-between gap-3 mb-4 flex-wrap">
                <div>
                  <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                    Visual preview
                  </div>
                  <h2 className="font-serif text-lg mt-1">
                    What the live homepage will look like
                  </h2>
                  <p className="text-xs text-muted-foreground mt-1">
                    Renders the layout JSON below in real time. Product rails show handles
                    (the live site fetches Shopify cards). Edit the JSON to see changes
                    instantly — nothing is saved or published until you click Save / Re-activate /
                    Force publish.
                  </p>
                </div>
                {(() => {
                  let parsed: HomepageLayout | null = null;
                  try {
                    parsed = JSON.parse(draft) as HomepageLayout;
                  } catch {
                    /* shown below */
                  }
                  return (
                    <span className="text-[11px] text-muted-foreground">
                      {parsed?.blocks?.length ?? 0} blocks · source{" "}
                      <span className="font-mono">{parsed?.source ?? "—"}</span>
                    </span>
                  );
                })()}
              </div>
              {(() => {
                let parsed: HomepageLayout | null = null;
                let parseErr: string | null = null;
                try {
                  parsed = JSON.parse(draft) as HomepageLayout;
                } catch (e) {
                  parseErr = (e as Error).message;
                }
                if (parseErr) {
                  return (
                    <div className="rounded border border-red-600/30 bg-red-50 text-red-900 px-3 py-2 text-xs">
                      Cannot render preview — JSON parse error: {parseErr}
                    </div>
                  );
                }
                return <HomepageLayoutPreview layout={parsed} />;
              })()}
            </Card>

            <Card className="p-5 lg:col-span-1">
              <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                Active edition
              </div>

              <div className="font-serif text-lg mt-2 break-all">{data.active.id.slice(0, 8)}…</div>
              <dl className="mt-4 text-xs space-y-2">
                <div className="flex justify-between gap-2">
                  <dt className="text-muted-foreground">Generated</dt>
                  <dd>{fmtWhen(data.active.generated_at)}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-muted-foreground">Source</dt>
                  <dd>{layout?.source ?? "—"}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-muted-foreground">Blocks</dt>
                  <dd>{layout?.blocks?.length ?? 0}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-muted-foreground">Hotspots</dt>
                  <dd>
                    {(layout?.blocks ?? []).reduce(
                      (n, b) => n + ((b.hotspots as unknown[] | undefined)?.length ?? 0),
                      0,
                    )}
                  </dd>
                </div>
              </dl>
              <div className="mt-5 space-y-2">
                <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                  Blocks
                </p>
                <ul className="text-xs space-y-1">
                  {(layout?.blocks ?? []).map((b, i) => (
                    <li key={i} className="flex justify-between gap-2 border-b border-border/40 pb-1">
                      <span>{b.type}</span>
                      <span className="text-muted-foreground truncate max-w-[60%]">
                        {b.heading ?? "—"}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </Card>

            <Card className="p-5 lg:col-span-2">
              <div className="flex items-center justify-between mb-3">
                <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                  Layout JSON
                </div>
                <Button
                  size="sm"
                  onClick={() => saveMut.mutate()}
                  disabled={saveMut.isPending}
                >
                  <Save className="h-3.5 w-3.5 mr-1.5" />
                  Save
                </Button>
              </div>
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                className="w-full h-[560px] font-mono text-xs bg-muted/40 border border-border rounded p-3 leading-relaxed"
                spellCheck={false}
              />
              {err ? <p className="text-xs text-red-700 mt-2">{err}</p> : null}
              <p className="text-[11px] text-muted-foreground mt-2">
                Validated against <code>homepageLayoutSchema</code>. Includes hotspot coordinates on
                editorial banners (x/y as 0–100% of the image).
              </p>
            </Card>

            <Card className="p-5 lg:col-span-3">
              <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground mb-3">
                Recent editions
              </div>
              <div className="space-y-2">
                {data.recent.map((r: any) => (
                  <RecentEditionRow
                    key={r.id}
                    row={r}
                    onActivate={() => activateMut.mutate(r.id)}
                    activating={activateMut.isPending}
                  />
                ))}
              </div>
            </Card>
          </div>
        )}

        <AuditLogPanel enabled={authReady} />
        <PendingCollectionsPanel enabled={authReady} />
      </div>
    </main>
  );
}

function AuditLogPanel({ enabled }: { enabled: boolean }) {
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "homepage-audit"],
    queryFn: () => getHomepageLayoutAudit(),
    enabled,
    refetchInterval: 30_000,
  });
  return (
    <Card className="p-5">
      <h2 className="font-serif text-lg mb-3">Audit log</h2>
      <p className="text-xs text-muted-foreground mb-4">
        Last 50 homepage edition events (generate, activate, archive, force refresh, failures).
      </p>
      {isLoading ? (
        <p className="text-xs text-muted-foreground">Loading…</p>
      ) : !data || data.length === 0 ? (
        <p className="text-xs text-muted-foreground">No events yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="text-left text-muted-foreground border-b border-border">
              <tr>
                <th className="py-1.5 pr-3 font-medium">When</th>
                <th className="py-1.5 pr-3 font-medium">Action</th>
                <th className="py-1.5 pr-3 font-medium">Actor</th>
                <th className="py-1.5 pr-3 font-medium">Edition</th>
                <th className="py-1.5 font-medium">Details</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row: any) => (
                <tr key={row.id} className="border-b border-border/40 align-top">
                  <td className="py-1.5 pr-3 whitespace-nowrap">{fmtWhen(row.created_at)}</td>
                  <td className="py-1.5 pr-3 font-mono">{row.action}</td>
                  <td className="py-1.5 pr-3">{row.actor ?? "—"}</td>
                  <td className="py-1.5 pr-3 font-mono">
                    {row.edition_id ? row.edition_id.slice(0, 8) : "—"}
                  </td>
                  <td className="py-1.5 font-mono text-[10px] text-muted-foreground break-all">
                    {row.details && Object.keys(row.details).length > 0
                      ? JSON.stringify(row.details)
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}


type Issue = {
  severity: "ok" | "info" | "warning" | "error";
  code: string;
  title: string;
  detail: string;
  action?: string;
};

type Diagnosis = {
  active_id: string | null;
  active_generated_at: string | null;
  active_age_hours: number | null;
  next_cron_eligible_at: string | null;
  source: string | null;
  block_count: number;
  pending_preview_count: number;
  issues: Issue[];
};

function severityStyles(s: Issue["severity"]) {
  switch (s) {
    case "ok":
      return {
        wrap: "border-emerald-600/30 bg-emerald-50 text-emerald-900",
        icon: <CheckCircle2 className="h-4 w-4 text-emerald-600" />,
      };
    case "error":
      return {
        wrap: "border-red-600/30 bg-red-50 text-red-900",
        icon: <XCircle className="h-4 w-4 text-red-600" />,
      };
    case "warning":
      return {
        wrap: "border-amber-600/30 bg-amber-50 text-amber-900",
        icon: <AlertTriangle className="h-4 w-4 text-amber-600" />,
      };
    case "info":
    default:
      return {
        wrap: "border-border bg-muted/40 text-foreground",
        icon: <Info className="h-4 w-4 text-muted-foreground" />,
      };
  }
}

function DiagnosticsPanel({
  diag,
  onRefetch,
}: {
  diag: Diagnosis | undefined;
  onRefetch: () => void;
}) {
  if (!diag) return null;
  const worst = diag.issues.some((i) => i.severity === "error")
    ? "error"
    : diag.issues.some((i) => i.severity === "warning")
      ? "warning"
      : "ok";
  return (
    <Card className="p-5 mb-6">
      <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
        <div className="flex items-start gap-3">
          <Stethoscope className="h-5 w-5 mt-0.5 text-muted-foreground" />
          <div>
            <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
              Troubleshooting
            </div>
            <h2 className="font-serif text-lg mt-1">
              Why hasn't the live homepage changed yet?
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              Snapshot of the curation pipeline. Updates every 30s.{" "}
              <span className="font-medium">
                Overall:{" "}
                {worst === "ok"
                  ? "healthy"
                  : worst === "warning"
                    ? "needs attention"
                    : "blocked"}
                .
              </span>
            </p>
          </div>
        </div>
        <Button size="sm" variant="outline" onClick={onRefetch}>
          <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
          Re-check
        </Button>
      </div>

      <dl className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs mb-4">
        <div>
          <dt className="text-muted-foreground">Source</dt>
          <dd className="font-mono">{diag.source ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Age</dt>
          <dd className="font-mono">
            {diag.active_age_hours !== null
              ? `${diag.active_age_hours.toFixed(1)}h`
              : "—"}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Blocks</dt>
          <dd className="font-mono">{diag.block_count}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Pending previews</dt>
          <dd className="font-mono">{diag.pending_preview_count}</dd>
        </div>
      </dl>

      <ul className="space-y-2">
        {diag.issues.map((i) => {
          const s = severityStyles(i.severity);
          return (
            <li
              key={i.code}
              className={`border rounded px-3 py-2.5 text-xs ${s.wrap}`}
            >
              <div className="flex items-start gap-2">
                <span className="mt-0.5">{s.icon}</span>
                <div className="flex-1">
                  <div className="font-medium">{i.title}</div>
                  <div className="opacity-80 mt-0.5 leading-relaxed">
                    {i.detail}
                  </div>
                  {i.action ? (
                    <div className="mt-1 text-[11px] opacity-90">
                      <span className="font-medium">Fix:</span> {i.action}
                    </div>
                  ) : null}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

function RecentEditionRow({
  row,
  onActivate,
  activating,
}: {
  row: {
    id: string;
    generated_at: string;
    status: string;
    is_active: boolean;
    source: string | null;
    block_count: number;
  };
  onActivate: () => void;
  activating: boolean;
}) {
  const [peekOpen, setPeekOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const { data: peek, isLoading: peekLoading } = useQuery({
    queryKey: ["admin", "homepage-edition", row.id],
    queryFn: () => getHomepageEditionById({ data: { id: row.id } }),
    enabled: peekOpen,
  });
  const sourceLabel =
    row.source === "cold_start_fallback"
      ? "fallback"
      : row.source === "claude"
        ? "AI"
        : row.source === "manual"
          ? "manual"
          : "—";
  return (
    <div className="flex items-center justify-between text-xs border-b border-border/40 py-2 gap-3">
      <span className="font-mono">{row.id.slice(0, 8)}</span>
      <span className="text-muted-foreground flex-1">{fmtWhen(row.generated_at)}</span>
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
        {sourceLabel} · {row.block_count}b
      </span>
      <Badge variant={row.is_active ? "default" : "secondary"}>
        {row.is_active ? "active" : row.status}
      </Badge>
      <Button size="sm" variant="ghost" onClick={() => setPeekOpen(true)}>
        <Eye className="h-3 w-3 mr-1" />
        Peek
      </Button>
      {!row.is_active ? (
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setConfirmOpen(true)}
          disabled={activating}
        >
          <Power className="h-3 w-3 mr-1" />
          Re-activate
        </Button>
      ) : (
        <span className="w-[100px]" />
      )}

      <Dialog open={peekOpen} onOpenChange={setPeekOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="font-mono text-sm">Edition {row.id.slice(0, 8)}</DialogTitle>
            <DialogDescription>
              {fmtWhen(row.generated_at)} · source: {sourceLabel} · {row.block_count} blocks
            </DialogDescription>
          </DialogHeader>
          {peekLoading ? (
            <p className="text-xs text-muted-foreground">Loading…</p>
          ) : peek?.layout_json ? (
            <pre className="text-[11px] font-mono bg-muted/40 border border-border rounded p-3 max-h-[60vh] overflow-auto">
              {JSON.stringify(peek.layout_json, null, 2)}
            </pre>
          ) : (
            <p className="text-xs text-muted-foreground">No layout data.</p>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Re-activate this edition?</AlertDialogTitle>
            <AlertDialogDescription>
              The currently active homepage will be archived and edition{" "}
              <span className="font-mono">{row.id.slice(0, 8)}</span> ({sourceLabel},{" "}
              {row.block_count} blocks, {fmtWhen(row.generated_at)}) will go live instantly for
              all visitors.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setConfirmOpen(false);
                onActivate();
              }}
            >
              Re-activate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}


