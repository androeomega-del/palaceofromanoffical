import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { adminBeforeLoad } from "@/lib/admin-route-guard";
import {
  getHomepageCuration,
  updateHomepageLayoutJson,
  activateHomepageLayout,
  forceRefreshHomepage,
  generateHomepagePreview,
} from "@/lib/admin-management.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, RefreshCw, Save, Power, Eye, CheckCircle2, ExternalLink } from "lucide-react";
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
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "homepage-curation"],
    queryFn: () => getHomepageCuration(),
    refetchInterval: 30_000,
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
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const activateMut = useMutation({
    mutationFn: (id: string) => activateHomepageLayout({ data: { id } }),
    onSuccess: () => {
      toast.success("Activated");
      qc.invalidateQueries({ queryKey: ["admin", "homepage-curation"] });
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
                {data.recent.map((r) => (
                  <div
                    key={r.id}
                    className="flex items-center justify-between text-xs border-b border-border/40 py-2 gap-3"
                  >
                    <span className="font-mono">{r.id.slice(0, 8)}</span>
                    <span className="text-muted-foreground">{fmtWhen(r.generated_at)}</span>
                    <Badge variant={r.is_active ? "default" : "secondary"}>
                      {r.is_active ? "active" : r.status}
                    </Badge>
                    {!r.is_active ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => activateMut.mutate(r.id)}
                        disabled={activateMut.isPending}
                      >
                        <Power className="h-3 w-3 mr-1" />
                        Re-activate
                      </Button>
                    ) : (
                      <span className="w-[100px]" />
                    )}
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}
      </div>
    </main>
  );
}
