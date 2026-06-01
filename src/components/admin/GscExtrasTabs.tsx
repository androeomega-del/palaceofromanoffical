import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { RefreshCw, Trash2 } from "lucide-react";
import { callAdminServerFn } from "@/lib/admin-server-call";
import {
  syncSitemapNow,
  getMonitoredUrls,
  listThresholds,
  saveThreshold,
  removeThreshold,
  runRedirectAuditNow,
  getRedirectAudit,
  captureInspection,
  listInspections,
} from "@/lib/gsc-extras.functions";

export function GscExtrasTabs() {
  return (
    <Tabs defaultValue="sitemap" className="mt-10">
      <TabsList>
        <TabsTrigger value="sitemap">Sitemap URLs</TabsTrigger>
        <TabsTrigger value="thresholds">Alert thresholds</TabsTrigger>
        <TabsTrigger value="redirects">Redirect audit</TabsTrigger>
        <TabsTrigger value="inspect">URL inspection</TabsTrigger>
      </TabsList>

      <TabsContent value="sitemap" className="mt-4"><SitemapPanel /></TabsContent>
      <TabsContent value="thresholds" className="mt-4"><ThresholdsPanel /></TabsContent>
      <TabsContent value="redirects" className="mt-4"><RedirectsPanel /></TabsContent>
      <TabsContent value="inspect" className="mt-4"><InspectPanel /></TabsContent>
    </Tabs>
  );
}

// ─── Sitemap ────────────────────────────────────────────────────────────────
function SitemapPanel() {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const q = useQuery({
    queryKey: ["gsc-monitored-urls"],
    queryFn: () => callAdminServerFn(getMonitoredUrls),
  });

  const run = async () => {
    setBusy(true);
    setMsg(null);
    try {
      const r = await callAdminServerFn(syncSitemapNow);
      setMsg(`Synced ${r.upserted}/${r.fetched} URLs. Groups: ${JSON.stringify(r.by_group)}`);
      await q.refetch();
    } catch (e) {
      setMsg(`Sync failed: ${e instanceof Error ? e.message : "unknown"}`);
    } finally {
      setBusy(false);
    }
  };

  const data = q.data;
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-sm text-muted-foreground">
            Pulls /sitemap.xml + /sitemap-products.xml, classifies each URL by page group
            (product, legacy-products, collection, brand, journal) and locale.
          </p>
          {data && (
            <p className="text-xs text-muted-foreground mt-1">
              {data.total} URLs tracked · groups: {Object.entries(data.by_group).map(([k, v]) => `${k}=${v}`).join(", ") || "—"}
            </p>
          )}
        </div>
        <Button onClick={run} disabled={busy} size="sm">
          <RefreshCw className={`h-4 w-4 mr-2 ${busy ? "animate-spin" : ""}`} />Sync now
        </Button>
      </div>
      {msg && <Card className="p-3 mb-3 text-sm">{msg}</Card>}
      <Card className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left p-2">URL</th>
              <th className="text-left p-2">Group</th>
              <th className="text-left p-2">Locale</th>
              <th className="text-left p-2">Last sync</th>
            </tr>
          </thead>
          <tbody>
            {(data?.rows ?? []).slice(0, 100).map((r) => (
              <tr key={r.url} className="border-t">
                <td className="p-2 truncate max-w-[420px]"><a href={r.url} target="_blank" rel="noreferrer" className="hover:underline">{r.url}</a></td>
                <td className="p-2">{r.page_group}</td>
                <td className="p-2">{r.locale ?? "—"}</td>
                <td className="p-2">{new Date(r.last_synced_at).toLocaleString()}</td>
              </tr>
            ))}
            {(data?.rows ?? []).length === 0 && (
              <tr><td colSpan={4} className="p-3 text-muted-foreground text-center">No URLs yet — click "Sync now".</td></tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

// ─── Thresholds ─────────────────────────────────────────────────────────────
const GROUPS = ["product", "legacy-products", "collection", "brand", "journal", "home", "other"];
const EMPTY: {
  scope_type: "global" | "page_group";
  scope_value: string | null;
  impressions_drop_pct: number;
  clicks_drop_pct: number;
  sitemap_error_min: number;
  position_warn_above: number | null;
  min_impressions_floor: number;
  min_clicks_floor: number;
  active: boolean;
} = {
  scope_type: "page_group",
  scope_value: "product",
  impressions_drop_pct: 40,
  clicks_drop_pct: 50,
  sitemap_error_min: 1,
  position_warn_above: null,
  min_impressions_floor: 20,
  min_clicks_floor: 5,
  active: true,
};

function ThresholdsPanel() {
  const [form, setForm] = useState(EMPTY);
  const [msg, setMsg] = useState<string | null>(null);
  const q = useQuery({ queryKey: ["gsc-thresholds"], queryFn: () => callAdminServerFn(listThresholds) });

  const save = async () => {
    try {
      await callAdminServerFn(saveThreshold, { data: form });
      setMsg("Saved.");
      await q.refetch();
    } catch (e) {
      setMsg(`Save failed: ${e instanceof Error ? e.message : "unknown"}`);
    }
  };
  const del = async (id: string) => {
    await callAdminServerFn(removeThreshold, { data: { id } });
    await q.refetch();
  };

  return (
    <div className="grid md:grid-cols-2 gap-4">
      <Card className="p-4">
        <h3 className="font-medium mb-3">New / update threshold</h3>
        <div className="space-y-3 text-sm">
          <div>
            <Label>Scope</Label>
            <select className="w-full border rounded h-9 px-2 mt-1" value={form.scope_type}
              onChange={(e) => setForm({ ...form, scope_type: e.target.value as "global" | "page_group", scope_value: e.target.value === "global" ? null : "product" })}>
              <option value="global">Global</option>
              <option value="page_group">Page group</option>
            </select>
          </div>
          {form.scope_type === "page_group" && (
            <div>
              <Label>Page group</Label>
              <select className="w-full border rounded h-9 px-2 mt-1" value={form.scope_value ?? "product"}
                onChange={(e) => setForm({ ...form, scope_value: e.target.value })}>
                {GROUPS.map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
          )}
          <NumberField label="Impressions drop %" value={form.impressions_drop_pct} onChange={(v) => setForm({ ...form, impressions_drop_pct: v })} />
          <NumberField label="Clicks drop %" value={form.clicks_drop_pct} onChange={(v) => setForm({ ...form, clicks_drop_pct: v })} />
          <NumberField label="Sitemap error min" value={form.sitemap_error_min} onChange={(v) => setForm({ ...form, sitemap_error_min: v })} />
          <NumberField label="Min impressions floor" value={form.min_impressions_floor} onChange={(v) => setForm({ ...form, min_impressions_floor: v })} />
          <NumberField label="Min clicks floor" value={form.min_clicks_floor} onChange={(v) => setForm({ ...form, min_clicks_floor: v })} />
          <div className="flex items-center gap-2">
            <Switch checked={form.active} onCheckedChange={(v) => setForm({ ...form, active: v })} />
            <Label>Active</Label>
          </div>
          <Button onClick={save} size="sm">Save threshold</Button>
          {msg && <p className="text-xs text-muted-foreground">{msg}</p>}
        </div>
      </Card>
      <Card className="p-4">
        <h3 className="font-medium mb-3">Configured ({q.data?.length ?? 0})</h3>
        <div className="space-y-2 text-sm">
          {(q.data ?? []).map((t) => (
            <div key={t.id} className="flex items-center justify-between border rounded p-2">
              <div>
                <div className="font-medium">{t.scope_type === "global" ? "Global" : `${t.scope_value}`} {!t.active && <span className="text-xs text-muted-foreground">(inactive)</span>}</div>
                <div className="text-xs text-muted-foreground">
                  impr -{t.impressions_drop_pct}% · clicks -{t.clicks_drop_pct}% · sitemap≥{t.sitemap_error_min} · floor impr {t.min_impressions_floor}/clicks {t.min_clicks_floor}
                </div>
              </div>
              {t.id !== "default" && (
                <Button size="sm" variant="ghost" onClick={() => del(t.id)}><Trash2 className="h-4 w-4" /></Button>
              )}
            </div>
          ))}
          {(q.data ?? []).length === 0 && <p className="text-muted-foreground">No custom thresholds — global defaults apply.</p>}
        </div>
      </Card>
    </div>
  );
}

function NumberField({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div>
      <Label>{label}</Label>
      <Input type="number" value={value} onChange={(e) => onChange(Number(e.target.value))} className="mt-1" />
    </div>
  );
}

// ─── Redirect audit ─────────────────────────────────────────────────────────
function RedirectsPanel() {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const q = useQuery({ queryKey: ["gsc-redirect-audit"], queryFn: () => callAdminServerFn(getRedirectAudit) });

  const run = async () => {
    setBusy(true);
    setMsg(null);
    try {
      const r = await callAdminServerFn(runRedirectAuditNow, { data: { limit: 60 } });
      setMsg(`Audit complete: ${r.status_301} 301 · ${r.status_404} 404 · ${r.status_200} 200 · ${r.status_other} other (n=${r.total})`);
      await q.refetch();
    } catch (e) {
      setMsg(`Audit failed: ${e instanceof Error ? e.message : "unknown"}`);
    } finally {
      setBusy(false);
    }
  };

  const a = q.data;
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-muted-foreground">
          Samples legacy <code>/products/&#123;handle&#125;</code> and per-locale variants, HEAD-checks each.
          301 / 302 / 308 = redirect working, 404 / 200 = still broken.
        </p>
        <Button onClick={run} disabled={busy} size="sm">
          <RefreshCw className={`h-4 w-4 mr-2 ${busy ? "animate-spin" : ""}`} />Run audit
        </Button>
      </div>
      {msg && <Card className="p-3 mb-3 text-sm">{msg}</Card>}
      {a ? (
        <>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
            <Mini label="Total" value={a.total} />
            <Mini label="301/302/308" value={a.status_301} good />
            <Mini label="404" value={a.status_404} bad />
            <Mini label="200 (broken)" value={a.status_200} bad />
            <Mini label="Other" value={a.status_other} />
          </div>
          <Card className="overflow-x-auto mb-4">
            <table className="w-full text-sm">
              <thead className="bg-muted/50"><tr>
                <th className="text-left p-2">Locale</th>
                <th className="text-right p-2">Total</th>
                <th className="text-right p-2">301</th>
                <th className="text-right p-2">404</th>
                <th className="text-right p-2">200</th>
                <th className="text-right p-2">Other</th>
              </tr></thead>
              <tbody>
                {Object.entries(a.by_locale).map(([loc, b]) => (
                  <tr key={loc} className="border-t">
                    <td className="p-2 font-medium">{loc}</td>
                    <td className="p-2 text-right">{b.total}</td>
                    <td className="p-2 text-right text-green-700">{b["301"]}</td>
                    <td className="p-2 text-right text-red-700">{b["404"]}</td>
                    <td className="p-2 text-right text-red-700">{b["200"]}</td>
                    <td className="p-2 text-right">{b.other}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
          <p className="text-xs text-muted-foreground mb-1">Sample URLs (first 30):</p>
          <Card className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-muted/50"><tr>
                <th className="text-left p-2">URL</th>
                <th className="text-left p-2">Status</th>
                <th className="text-left p-2">Location</th>
              </tr></thead>
              <tbody>
                {a.results.slice(0, 30).map((r, i) => (
                  <tr key={i} className="border-t">
                    <td className="p-2 truncate max-w-[420px]">{r.url}</td>
                    <td className="p-2">{r.status}</td>
                    <td className="p-2 truncate max-w-[260px]">{r.location ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
          <p className="text-xs text-muted-foreground mt-2">Last run: {new Date(a.run_at).toLocaleString()}</p>
        </>
      ) : (
        <Card className="p-4 text-sm text-muted-foreground">No audit yet — click "Run audit".</Card>
      )}
    </div>
  );
}

function Mini({ label, value, good, bad }: { label: string; value: number; good?: boolean; bad?: boolean }) {
  return (
    <Card className="p-3">
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className={`text-xl font-semibold ${good ? "text-green-700" : bad ? "text-red-700" : ""}`}>{value}</div>
    </Card>
  );
}

// ─── URL inspection ─────────────────────────────────────────────────────────
function InspectPanel() {
  const [url, setUrl] = useState("https://palaceofromanofficial.com/product/");
  const [json, setJson] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const q = useQuery({ queryKey: ["gsc-inspections"], queryFn: () => callAdminServerFn(listInspections) });

  const submit = async () => {
    setBusy(true);
    setMsg(null);
    try {
      const r = await callAdminServerFn(captureInspection, {
        data: { url, manualResultJson: json || undefined, notes: notes || undefined },
      });
      setMsg(`Captured (${r.capture_source}). Verdict: ${r.verdict ?? "—"}`);
      setJson("");
      setNotes("");
      await q.refetch();
    } catch (e) {
      setMsg(`${e instanceof Error ? e.message : "unknown"}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid md:grid-cols-2 gap-4">
      <Card className="p-4">
        <h3 className="font-medium mb-3">Capture inspection</h3>
        <div className="space-y-3 text-sm">
          <div>
            <Label>URL to inspect</Label>
            <Input value={url} onChange={(e) => setUrl(e.target.value)} className="mt-1" />
          </div>
          <div>
            <Label>Manual JSON result (optional — paste from GSC if API fails)</Label>
            <Textarea value={json} onChange={(e) => setJson(e.target.value)} rows={6} className="mt-1 font-mono text-xs" placeholder='{"inspectionResult": {"indexStatusResult": {"verdict": "PASS", ...}}}' />
          </div>
          <div>
            <Label>Notes</Label>
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} className="mt-1" />
          </div>
          <Button onClick={submit} disabled={busy || !url} size="sm">
            <RefreshCw className={`h-4 w-4 mr-2 ${busy ? "animate-spin" : ""}`} />Capture
          </Button>
          {msg && <p className="text-xs">{msg}</p>}
        </div>
      </Card>
      <Card className="p-4">
        <h3 className="font-medium mb-3">Recent inspections ({q.data?.length ?? 0})</h3>
        <div className="space-y-2 text-sm max-h-[480px] overflow-y-auto">
          {(q.data ?? []).map((r) => (
            <div key={r.id} className="border rounded p-2">
              <div className="truncate font-medium">{r.url}</div>
              <div className="text-xs text-muted-foreground">
                {r.verdict ?? "—"} · {r.coverage_state ?? "—"} · {r.indexing_state ?? "—"} · src: {r.capture_source}
              </div>
              <div className="text-xs text-muted-foreground">
                {r.last_crawl_time ? `crawled ${new Date(r.last_crawl_time).toLocaleDateString()}` : "no crawl data"} · captured {new Date(r.captured_at).toLocaleString()}
              </div>
            </div>
          ))}
          {(q.data ?? []).length === 0 && <p className="text-muted-foreground">No inspections yet.</p>}
        </div>
      </Card>
    </div>
  );
}
