import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { adminBeforeLoad } from "@/lib/admin-route-guard";
import {
  listReviews,
  setReviewStatus,
  deleteReview,
} from "@/lib/admin-management.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Check, X, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/reviews")({
  beforeLoad: adminBeforeLoad,
  component: AdminReviews,
  head: () => ({
    meta: [
      { title: "Reviews — Palace of Roman" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

type Filter = "pending" | "approved" | "rejected" | "all";

function AdminReviews() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<Filter>("pending");
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "reviews", filter],
    queryFn: () => listReviews({ data: { status: filter } }),
  });

  const statusMut = useMutation({
    mutationFn: (v: { id: string; status: "approved" | "rejected" | "pending" }) =>
      setReviewStatus({ data: v }),
    onSuccess: () => {
      toast.success("Updated");
      qc.invalidateQueries({ queryKey: ["admin", "reviews"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const delMut = useMutation({
    mutationFn: (id: string) => deleteReview({ data: { id } }),
    onSuccess: () => {
      toast.success("Deleted");
      qc.invalidateQueries({ queryKey: ["admin", "reviews"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const filters: Filter[] = ["pending", "approved", "rejected", "all"];

  return (
    <main className="min-h-screen bg-canvas px-6 py-12 md:py-16">
      <div className="max-w-5xl mx-auto">
        <Link
          to="/admin"
          className="text-xs uppercase tracking-[0.3em] text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
        >
          <ArrowLeft className="h-3 w-3" /> Admin
        </Link>
        <h1 className="font-serif text-3xl md:text-4xl mt-3">Product Reviews</h1>
        <p className="text-sm text-muted-foreground mt-1 mb-6">
          Approve or reject customer reviews. Only approved reviews appear on PDPs.
        </p>

        <div className="flex gap-2 mb-6 flex-wrap">
          {filters.map((f) => (
            <Button
              key={f}
              size="sm"
              variant={filter === f ? "default" : "outline"}
              onClick={() => setFilter(f)}
              className="capitalize"
            >
              {f}
            </Button>
          ))}
        </div>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : !data?.length ? (
          <Card className="p-6">
            <p className="text-sm">No reviews in this status.</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {data.map((r) => (
              <Card key={r.id} className="p-5">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-serif text-base">{r.author_name}</span>
                      <span className="text-xs text-muted-foreground">{r.author_email}</span>
                      {r.verified_purchase ? (
                        <Badge variant="secondary" className="text-[10px]">
                          Verified
                        </Badge>
                      ) : null}
                      <Badge
                        variant={
                          r.status === "approved"
                            ? "default"
                            : r.status === "rejected"
                              ? "outline"
                              : "secondary"
                        }
                      >
                        {r.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1 mt-2">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`h-3.5 w-3.5 ${
                            i < r.rating
                              ? "fill-bronze text-bronze"
                              : "text-muted-foreground/40"
                          }`}
                        />
                      ))}
                      <span className="text-xs text-muted-foreground ml-2">
                        on{" "}
                        <a
                          href={`/product/${r.product_handle}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline"
                        >
                          {r.product_handle}
                        </a>
                      </span>
                    </div>
                    {r.title ? (
                      <p className="font-serif text-sm mt-3">{r.title}</p>
                    ) : null}
                    <p className="text-sm mt-1 whitespace-pre-wrap">{r.body}</p>
                    <p className="text-[10px] text-muted-foreground mt-3">
                      {new Date(r.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex flex-col gap-2 shrink-0">
                    {r.status !== "approved" && (
                      <Button
                        size="sm"
                        onClick={() => statusMut.mutate({ id: r.id, status: "approved" })}
                      >
                        <Check className="h-3.5 w-3.5 mr-1.5" /> Approve
                      </Button>
                    )}
                    {r.status !== "rejected" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => statusMut.mutate({ id: r.id, status: "rejected" })}
                      >
                        <X className="h-3.5 w-3.5 mr-1.5" /> Reject
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        if (confirm("Permanently delete this review?")) delMut.mutate(r.id);
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
