import { createFileRoute, redirect } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ensureAdmin } from "@/lib/admin-guard.functions";
import {
  listQueue,
  generateEditorial,
  approveAndPublish,
  rejectItem,
  getBudgetStatus,
  getQueueItem,
} from "@/lib/growth-os.functions";
import { generateSocialPack, approveSocialItem } from "@/lib/social-pilot.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Sparkles, CheckCircle2, XCircle, Eye, Loader2, DollarSign, TrendingUp, Share2, Copy } from "lucide-react";

export const Route = createFileRoute("/admin/growth-os")({
  beforeLoad: async () => {
    try { await ensureAdmin(); } catch { throw redirect({ to: "/login" }); }
  },
  component: GrowthOsPage,
  head: () => ({
    meta: [
      { title: "Growth OS — Palace of Roman" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

type QueueItem = {
  id: string;
  kind: string;
  channel: string;
  title: string | null;
  status: string;
  cost_cents: number;
  external_id: string | null;
  error_message: string | null;
  created_at: string;
};

const STATUS_TONE: Record<string, string> = {
  draft: "bg-amber-100 text-amber-900 border-amber-200",
  approved: "bg-blue-100 text-blue-900 border-blue-200",
  scheduled: "bg-purple-100 text-purple-900 border-purple-200",
  published: "bg-emerald-100 text-emerald-900 border-emerald-200",
  rejected: "bg-zinc-100 text-zinc-700 border-zinc-200",
};

const CHANNEL_TONE: Record<string, string> = {
  instagram: "bg-pink-50 text-pink-900 border-pink-200",
  pinterest: "bg-red-50 text-red-900 border-red-200",
  x: "bg-zinc-900 text-white border-zinc-900",
  tiktok: "bg-zinc-50 text-zinc-900 border-zinc-300",
  shopify_blog: "bg-emerald-50 text-emerald-900 border-emerald-200",
};

function copy(text: string, label = "Copied") {
  navigator.clipboard.writeText(text).then(
    () => toast.success(label),
    () => toast.error("Copy failed")
  );
}

function GrowthOsPage() {
  const qc = useQueryClient();
  const listFn = useServerFn(listQueue);
  const budgetFn = useServerFn(getBudgetStatus);
  const generateFn = useServerFn(generateEditorial);
  const approveFn = useServerFn(approveAndPublish);
  const rejectFn = useServerFn(rejectItem);
  const getItemFn = useServerFn(getQueueItem);
  const socialFn = useServerFn(generateSocialPack);
  const approveSocialFn = useServerFn(approveSocialItem);

  const [preview, setPreview] = useState<{ item: Record<string, unknown> } | null>(null);

  const budget = useQuery({
    queryKey: ["growth-os", "budget"],
    queryFn: () => budgetFn(),
    refetchInterval: 30_000,
  });

  const queue = useQuery({
    queryKey: ["growth-os", "queue"],
    queryFn: () => listFn({ data: {} }),
  });

  const generate = useMutation({
    mutationFn: () => generateFn({ data: {} }),
    onSuccess: (res) => {
      if (res.ok) {
        toast.success(`Editorial drafted (~$${res.costUsd.toFixed(3)})`);
        qc.invalidateQueries({ queryKey: ["growth-os"] });
      } else {
        toast.error(res.error);
      }
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const approve = useMutation({
    mutationFn: (id: string) => approveFn({ data: { id } }),
    onSuccess: (res) => {
      if (res.ok) {
        toast.success("Published to Shopify blog");
        qc.invalidateQueries({ queryKey: ["growth-os"] });
      } else {
        toast.error(res.error);
      }
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const reject = useMutation({
    mutationFn: (id: string) => rejectFn({ data: { id } }),
    onSuccess: () => {
      toast.success("Rejected");
      qc.invalidateQueries({ queryKey: ["growth-os"] });
    },
  });

  const social = useMutation({
    mutationFn: () => socialFn({ data: {} }),
    onSuccess: (res) => {
      if (res.ok) {
        toast.success(`Social pack drafted for "${res.product.title}" (~$${res.costUsd.toFixed(3)})`);
        qc.invalidateQueries({ queryKey: ["growth-os"] });
      } else {
        toast.error(res.error);
      }
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const approveSocial = useMutation({
    mutationFn: (id: string) => approveSocialFn({ data: { id } }),
    onSuccess: () => {
      toast.success("Approved — copy & post");
      qc.invalidateQueries({ queryKey: ["growth-os"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const openPreview = async (id: string) => {
    try {
      const item = await getItemFn({ data: { id } });
      setPreview({ item: item as unknown as Record<string, unknown> });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load");
    }
  };

  const items = (queue.data?.items ?? []) as QueueItem[];
  const b = budget.data;
  const pct = b?.percentUsed ?? 0;
  const pctTone = pct > 90 ? "bg-red-500" : pct > 70 ? "bg-amber-500" : "bg-emerald-500";

  return (
    <main className="min-h-screen bg-background px-4 py-10 md:px-10">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 flex flex-col gap-2">
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Palace of Roman — Admin</p>
          <h1 className="text-3xl font-serif tracking-tight md:text-4xl">Growth OS</h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            In-house alternative to Click from AI, Xyla, Klaviyo, and HeyGen. Drafts go to the queue; nothing
            ships without your approval.
          </p>
        </header>

        {/* Budget */}
        <Card className="mb-8 p-5">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <DollarSign className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">AI spend, this month</p>
                <p className="text-2xl font-semibold tabular-nums">
                  ${b?.mtdUsd?.toFixed(2) ?? "0.00"}
                  <span className="ml-1 text-base font-normal text-muted-foreground">/ ${b?.capUsd ?? 160}</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <TrendingUp className="h-4 w-4" />
              Projected: ${b?.projectedUsd?.toFixed(2) ?? "0.00"}
            </div>
          </div>
          <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-muted">
            <div className={`h-full ${pctTone} transition-all`} style={{ width: `${Math.min(100, pct)}%` }} />
          </div>
        </Card>

        {/* Module strip */}
        <div className="mb-8 grid gap-3 md:grid-cols-4">
          <ModuleTile
            active
            title="Editorial Engine"
            desc="AI long-form blog → Shopify"
            action={
              <Button size="sm" disabled={generate.isPending} onClick={() => generate.mutate()}>
                {generate.isPending ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Sparkles className="mr-1.5 h-4 w-4" />}
                Draft article
              </Button>
            }
          />
          <ModuleTile
            active
            title="Social Pilot"
            desc="IG, Pinterest, X, TikTok pack from a random in-stock product"
            action={
              <Button size="sm" variant="outline" disabled={social.isPending} onClick={() => social.mutate()}>
                {social.isPending ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Share2 className="mr-1.5 h-4 w-4" />}
                Draft pack
              </Button>
            }
          />
          <ModuleTile title="Lifecycle Autopilot" desc="Email + SMS flows" comingSoon />
          <ModuleTile title="UGC Studio" desc="HeyGen + image-to-video" comingSoon />
        </div>

        {/* Queue */}
        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-medium">Content queue</h2>
            <span className="text-xs text-muted-foreground">{items.length} item{items.length === 1 ? "" : "s"}</span>
          </div>

          {queue.isLoading ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Loading…</p>
          ) : items.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Queue is empty. Click <strong>Draft article</strong> above to generate your first editorial.
            </p>
          ) : (
            <div className="divide-y">
              {items.map((it) => (
                <div key={it.id} className="flex flex-col gap-3 py-3 md:flex-row md:items-center md:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className={STATUS_TONE[it.status] ?? ""}>{it.status}</Badge>
                      <span className="text-xs uppercase tracking-wider text-muted-foreground">{it.kind} → {it.channel}</span>
                      <span className="text-xs text-muted-foreground">${(Number(it.cost_cents) / 100).toFixed(3)}</span>
                    </div>
                    <p className="mt-1 truncate font-medium">{it.title ?? "Untitled"}</p>
                    {it.error_message && <p className="mt-0.5 text-xs text-red-600">{it.error_message}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="ghost" onClick={() => openPreview(it.id)}>
                      <Eye className="mr-1 h-4 w-4" /> Preview
                    </Button>
                    {it.status === "draft" && (
                      <>
                        <Button size="sm" disabled={approve.isPending} onClick={() => approve.mutate(it.id)}>
                          <CheckCircle2 className="mr-1 h-4 w-4" /> Approve & publish
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => reject.mutate(it.id)}>
                          <XCircle className="mr-1 h-4 w-4" /> Reject
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Preview modal */}
        {preview && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
            onClick={() => setPreview(null)}
          >
            <div
              className="max-h-[85vh] w-full max-w-3xl overflow-auto rounded-lg bg-background p-6 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-xl font-serif">{preview.title}</h3>
                <Button size="sm" variant="ghost" onClick={() => setPreview(null)}>Close</Button>
              </div>
              <article
                className="prose prose-sm max-w-none prose-headings:font-serif prose-a:text-primary"
                dangerouslySetInnerHTML={{ __html: preview.html }}
              />
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

function ModuleTile({
  title, desc, action, comingSoon, active,
}: { title: string; desc: string; action?: React.ReactNode; comingSoon?: boolean; active?: boolean }) {
  return (
    <Card className={`p-4 ${active ? "border-primary" : "opacity-70"}`}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-medium">{title}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{desc}</p>
        </div>
        {comingSoon && <Badge variant="outline" className="text-[10px]">Wave 2</Badge>}
      </div>
      {action && <div className="mt-3">{action}</div>}
    </Card>
  );
}
