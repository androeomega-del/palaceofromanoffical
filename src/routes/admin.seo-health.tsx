import { createFileRoute, redirect } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ensureAdmin } from "@/lib/admin-guard.functions";
import { checkHomepageSeo } from "@/lib/seo-health.functions";
import { HOMEPAGE_URL } from "@/lib/seo-health";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, Check, X } from "lucide-react";

export const Route = createFileRoute("/admin/seo-health")({
  beforeLoad: async () => {
    try {
      await ensureAdmin();
    } catch {
      throw redirect({ to: "/login" });
    }
  },
  component: AdminSeoHealth,
  head: () => ({
    meta: [
      { title: "SEO Health — Palace of Roman" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

function AdminSeoHealth() {
  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: ["admin", "seo-health"],
    queryFn: () => checkHomepageSeo(),
    refetchOnWindowFocus: false,
  });

  const passing = data?.checks.filter((c) => c.ok).length ?? 0;
  const total = data?.checks.length ?? 0;

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.3em] text-bronze">House Tools</p>
          <h1 className="mt-2 font-serif text-4xl">Homepage SEO Health</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Live check against{" "}
            <a href={HOMEPAGE_URL} target="_blank" rel="noopener noreferrer" className="underline">
              {HOMEPAGE_URL}
            </a>
            . Public JSON endpoint:{" "}
            <a href="/api/public/seo-health" target="_blank" rel="noopener noreferrer" className="underline">
              /api/public/seo-health
            </a>{" "}
            (200 = pass, 503 = fail).
          </p>
        </div>
        <Button onClick={() => refetch()} disabled={isFetching} variant="outline" size="sm">
          <RefreshCw className={`mr-2 h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`} />
          Re-run
        </Button>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Fetching live homepage…</p>
      ) : error ? (
        <Card className="border-destructive p-6 text-sm text-destructive">
          {error instanceof Error ? error.message : String(error)}
        </Card>
      ) : data ? (
        <>
          <Card className="mb-6 flex items-center justify-between p-6">
            <div>
              <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Summary</div>
              <div className="mt-2 font-serif text-3xl tabular-nums">
                {passing} / {total} passing
              </div>
            </div>
            <div
              className={`rounded-full px-4 py-2 text-xs uppercase tracking-[0.2em] ${
                data.ok ? "bg-green-100 text-green-900" : "bg-red-100 text-red-900"
              }`}
            >
              {data.ok ? "All checks pass" : "Issues found"}
            </div>
          </Card>

          <Card className="overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-left text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                <tr>
                  <th className="w-12 px-4 py-3"></th>
                  <th className="px-4 py-3">Check</th>
                  <th className="px-4 py-3">Expected</th>
                  <th className="px-4 py-3">Actual</th>
                </tr>
              </thead>
              <tbody>
                {data.checks.map((c) => (
                  <tr key={c.id} className="border-t align-top">
                    <td className="px-4 py-3">
                      {c.ok ? (
                        <Check className="h-4 w-4 text-green-600" />
                      ) : (
                        <X className="h-4 w-4 text-red-600" />
                      )}
                    </td>
                    <td className="px-4 py-3 font-medium">
                      {c.label}
                      {c.note ? <div className="mt-1 text-xs text-muted-foreground">{c.note}</div> : null}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      <div className="max-w-xs break-words">{c.expected}</div>
                    </td>
                    <td className="px-4 py-3 text-xs">
                      <div className="max-w-md break-words font-mono">{c.actual}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          <p className="mt-6 text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
            Checked {new Date(data.checkedAt).toLocaleString()} · Homepage returned HTTP {data.fetchedStatus}
          </p>
        </>
      ) : null}
    </div>
  );
}
