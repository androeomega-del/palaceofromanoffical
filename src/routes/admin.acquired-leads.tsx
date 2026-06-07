import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { adminBeforeLoad } from "@/lib/admin-route-guard";
import {
  importAcquiredLeads,
  getAcquiredLeadsStats,
} from "@/lib/acquired-leads.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ArrowLeft, Upload } from "lucide-react";

export const Route = createFileRoute("/admin/acquired-leads")({
  ssr: false,
  beforeLoad: adminBeforeLoad,
  component: AdminAcquiredLeads,
  head: () => ({
    meta: [
      { title: "Acquired Leads — Palace of Roman" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

type ParsedLead = {
  email: string;
  first_name?: string | null;
  last_name?: string | null;
  state?: string | null;
  city?: string | null;
  segment?: string | null;
  notes?: string | null;
};

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

function parseCsv(text: string): { rows: ParsedLead[]; errors: string[] } {
  const errors: string[] = [];
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length === 0) return { rows: [], errors: ["Empty file"] };

  const split = (line: string): string[] => {
    const out: string[] = [];
    let cur = "";
    let inQ = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') {
        if (inQ && line[i + 1] === '"') {
          cur += '"';
          i++;
        } else inQ = !inQ;
      } else if (c === "," && !inQ) {
        out.push(cur);
        cur = "";
      } else cur += c;
    }
    out.push(cur);
    return out.map((s) => s.trim());
  };

  const headers = split(lines[0]).map((h) => h.toLowerCase().replace(/[^a-z0-9_]+/g, "_"));
  const idx = (n: string) => headers.indexOf(n);
  const emailIdx = ["email", "email_address", "e_mail"]
    .map(idx)
    .find((i) => i >= 0) ?? -1;

  if (emailIdx < 0) {
    return { rows: [], errors: ["No 'email' column found in CSV header"] };
  }

  const fIdx = idx("first_name") >= 0 ? idx("first_name") : idx("firstname");
  const lIdx = idx("last_name") >= 0 ? idx("last_name") : idx("lastname");
  const sIdx = idx("state") >= 0 ? idx("state") : idx("region");
  const cIdx = idx("city");
  const segIdx = idx("segment");
  const nIdx = idx("notes");

  const rows: ParsedLead[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = split(lines[i]);
    const email = (cols[emailIdx] ?? "").toLowerCase();
    if (!EMAIL_RE.test(email)) {
      errors.push(`Row ${i + 1}: invalid email "${cols[emailIdx]}"`);
      continue;
    }
    rows.push({
      email,
      first_name: fIdx >= 0 ? cols[fIdx] || null : null,
      last_name: lIdx >= 0 ? cols[lIdx] || null : null,
      state: sIdx >= 0 ? cols[sIdx] || null : null,
      city: cIdx >= 0 ? cols[cIdx] || null : null,
      segment: segIdx >= 0 ? cols[segIdx] || null : null,
      notes: nIdx >= 0 ? cols[nIdx] || null : null,
    });
  }
  return { rows, errors };
}

function AdminAcquiredLeads() {
  const [file, setFile] = useState<File | null>(null);
  const [source, setSource] = useState("hnw-ca-fl-dec2026");
  const [preview, setPreview] = useState<ParsedLead[] | null>(null);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [isImporting, setIsImporting] = useState(false);

  const stats = useQuery({
    queryKey: ["acquired-leads-stats"],
    queryFn: () => getAcquiredLeadsStats(),
  });

  const handleFile = async (f: File) => {
    setFile(f);
    const text = await f.text();
    const { rows, errors } = parseCsv(text);
    setPreview(rows);
    setParseErrors(errors);
  };

  const handleImport = async () => {
    if (!preview || preview.length === 0) return;
    setIsImporting(true);
    try {
      const result = await importAcquiredLeads({
        data: { source, leads: preview },
      });
      toast.success(
        `Imported ${result.inserted} new leads (${result.skipped_existing} already existed, ${result.deduped_in_payload} duplicates in file)`,
      );
      setFile(null);
      setPreview(null);
      stats.refetch();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Import failed");
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-5xl px-6 py-12 space-y-10">
        <div className="flex items-center justify-between">
          <Link
            to="/admin"
            className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-3 w-3" /> Admin
          </Link>
        </div>

        <header className="space-y-3">
          <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
            Marketing · Acquired list
          </p>
          <h1 className="font-serif text-4xl">Acquired Leads</h1>
          <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">
            Import acquired contact lists into a holding table, separate from
            confirmed subscribers. No emails are sent on import. Use a
            re-permission campaign to convert these into opted-in subscribers
            before any marketing send.
          </p>
        </header>

        <Card className="p-6 space-y-4">
          <h2 className="text-sm uppercase tracking-[0.25em]">Current list</h2>
          {stats.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : stats.error ? (
            <p className="text-sm text-destructive">
              {(stats.error as Error).message}
            </p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
              <div>
                <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
                  Total
                </div>
                <div className="text-2xl font-serif">{stats.data?.total ?? 0}</div>
              </div>
              {Object.entries(stats.data?.by_status ?? {}).map(([k, v]) => (
                <div key={k}>
                  <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
                    {k.replace(/_/g, " ")}
                  </div>
                  <div className="text-2xl font-serif">{v}</div>
                </div>
              ))}
            </div>
          )}
          {stats.data && Object.keys(stats.data.by_state).length > 0 ? (
            <div className="pt-4 border-t border-border/40">
              <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground mb-2">
                By state
              </div>
              <div className="flex flex-wrap gap-3 text-sm">
                {Object.entries(stats.data.by_state).map(([k, v]) => (
                  <span key={k} className="px-2 py-1 border border-border/40 rounded">
                    {k}: {v}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
        </Card>

        <Card className="p-6 space-y-5">
          <h2 className="text-sm uppercase tracking-[0.25em]">Import CSV</h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Required column: <code className="px-1 bg-muted">email</code>.
            Optional: <code className="px-1 bg-muted">first_name</code>,{" "}
            <code className="px-1 bg-muted">last_name</code>,{" "}
            <code className="px-1 bg-muted">state</code>,{" "}
            <code className="px-1 bg-muted">city</code>,{" "}
            <code className="px-1 bg-muted">segment</code>,{" "}
            <code className="px-1 bg-muted">notes</code>. Duplicates (by email)
            are skipped automatically.
          </p>

          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
              Source label
            </label>
            <input
              value={source}
              onChange={(e) => setSource(e.target.value)}
              className="w-full bg-transparent border border-border/40 rounded px-3 py-2 text-sm"
              placeholder="e.g. hnw-ca-fl-dec2026"
              maxLength={120}
            />
          </div>

          <div>
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
              }}
              className="text-sm"
            />
          </div>

          {file ? (
            <div className="text-xs text-muted-foreground">
              {file.name} · {preview?.length ?? 0} valid rows
              {parseErrors.length > 0
                ? ` · ${parseErrors.length} skipped`
                : null}
            </div>
          ) : null}

          {parseErrors.length > 0 ? (
            <details className="text-xs">
              <summary className="cursor-pointer text-destructive">
                {parseErrors.length} parse errors
              </summary>
              <ul className="mt-2 space-y-1 max-h-40 overflow-auto">
                {parseErrors.slice(0, 50).map((e, i) => (
                  <li key={i} className="text-muted-foreground">
                    {e}
                  </li>
                ))}
              </ul>
            </details>
          ) : null}

          {preview && preview.length > 0 ? (
            <div className="border border-border/40 rounded overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-muted/40">
                  <tr className="text-left">
                    <th className="px-3 py-2 font-normal uppercase tracking-[0.2em] text-[10px]">
                      Email
                    </th>
                    <th className="px-3 py-2 font-normal uppercase tracking-[0.2em] text-[10px]">
                      Name
                    </th>
                    <th className="px-3 py-2 font-normal uppercase tracking-[0.2em] text-[10px]">
                      Location
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {preview.slice(0, 10).map((r, i) => (
                    <tr key={i} className="border-t border-border/40">
                      <td className="px-3 py-2">{r.email}</td>
                      <td className="px-3 py-2">
                        {[r.first_name, r.last_name].filter(Boolean).join(" ")}
                      </td>
                      <td className="px-3 py-2">
                        {[r.city, r.state].filter(Boolean).join(", ")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {preview.length > 10 ? (
                <div className="px-3 py-2 text-[10px] uppercase tracking-[0.2em] text-muted-foreground border-t border-border/40">
                  + {preview.length - 10} more
                </div>
              ) : null}
            </div>
          ) : null}

          <Button
            onClick={handleImport}
            disabled={!preview || preview.length === 0 || isImporting}
            className="gap-2"
          >
            <Upload className="h-4 w-4" />
            {isImporting ? "Importing…" : `Import ${preview?.length ?? 0} leads`}
          </Button>

          <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground pt-2 border-t border-border/40">
            No emails are sent on import. Re-permission campaign tooling is a
            separate step.
          </p>
        </Card>
      </div>
    </div>
  );
}
