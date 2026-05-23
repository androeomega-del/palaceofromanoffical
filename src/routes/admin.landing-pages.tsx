import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminBeforeLoad } from "@/lib/admin-route-guard";
import {
  listLandingPages,
  updateLandingPageStatus,
  deleteLandingPage,
} from "@/lib/admin-management.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Trash2, ExternalLink } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/landing-pages")({
  beforeLoad: adminBeforeLoad,
  component: AdminLandingPages,
  head: () => ({
    meta: [
      { title: "Landing Pages — Palace of Roman" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

function fmt(iso?: string | null) {
  return iso
    ? new Date(iso).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    : "—";
}

function AdminLandingPages() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "landing-pages"],
    queryFn: () => listLandingPages(),
  });

  const statusMut = useMutation({
    mutationFn: (v: { id: string; status: "staged" | "active" | "expired" }) =>
      updateLandingPageStatus({ data: v }),
    onSuccess: () => {
      toast.success("Status updated");
      qc.invalidateQueries({ queryKey: ["admin", "landing-pages"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const delMut = useMutation({
    mutationFn: (id: string) => deleteLandingPage({ data: { id } }),
    onSuccess: () => {
      toast.success("Deleted");
      qc.invalidateQueries({ queryKey: ["admin", "landing-pages"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <main className="min-h-screen bg-canvas px-6 py-12 md:py-16">
      <div className="max-w-6xl mx-auto">
        <Link
          to="/admin"
          className="text-xs uppercase tracking-[0.3em] text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
        >
          <ArrowLeft className="h-3 w-3" /> Admin
        </Link>
        <h1 className="font-serif text-3xl md:text-4xl mt-3">Dynamic Landing Pages</h1>
        <p className="text-sm text-muted-foreground mt-1 mb-8">
          AI-generated pages from trend signals. Stage → review → activate.
        </p>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : !data?.length ? (
          <Card className="p-6">
            <p className="text-sm">No landing pages generated yet.</p>
          </Card>
        ) : (
          <Card className="p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-muted/40 text-left">
                  <tr>
                    <th className="px-4 py-3 uppercase tracking-wider text-[10px]">Slug</th>
                    <th className="px-4 py-3 uppercase tracking-wider text-[10px]">Source</th>
                    <th className="px-4 py-3 uppercase tracking-wider text-[10px]">Score</th>
                    <th className="px-4 py-3 uppercase tracking-wider text-[10px]">Status</th>
                    <th className="px-4 py-3 uppercase tracking-wider text-[10px]">Generated</th>
                    <th className="px-4 py-3 uppercase tracking-wider text-[10px]">Expires</th>
                    <th className="px-4 py-3 uppercase tracking-wider text-[10px] text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((p) => (
                    <tr key={p.id} className="border-t border-border/40">
                      <td className="px-4 py-3 font-mono">
                        <a
                          href={`/${p.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 hover:underline"
                        >
                          {p.slug}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-muted-foreground">{p.signal_type}</span>{" "}
                        <span>· {p.source_term}</span>
                      </td>
                      <td className="px-4 py-3 tabular-nums">{Number(p.priority_score).toFixed(1)}</td>
                      <td className="px-4 py-3">
                        <Badge
                          variant={
                            p.status === "active"
                              ? "default"
                              : p.status === "staged"
                                ? "secondary"
                                : "outline"
                          }
                        >
                          {p.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{fmt(p.generated_at)}</td>
                      <td className="px-4 py-3 text-muted-foreground">{fmt(p.expires_at)}</td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          {p.status !== "active" && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() =>
                                statusMut.mutate({ id: p.id, status: "active" })
                              }
                            >
                              Activate
                            </Button>
                          )}
                          {p.status !== "staged" && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() =>
                                statusMut.mutate({ id: p.id, status: "staged" })
                              }
                            >
                              Stage
                            </Button>
                          )}
                          {p.status !== "expired" && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() =>
                                statusMut.mutate({ id: p.id, status: "expired" })
                              }
                            >
                              Expire
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              if (confirm("Delete this landing page?")) delMut.mutate(p.id);
                            }}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </main>
  );
}
