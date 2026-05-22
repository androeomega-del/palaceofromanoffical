import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { adminBeforeLoad } from "@/lib/admin-route-guard";
import {
  listQueue,
  generateEditorial,
  approveAndPublish,
  rejectItem,
  getBudgetStatus,
  getQueueItem,
} from "@/lib/growth-os.functions";
import { generateSocialPack, approveSocialItem } from "@/lib/social-pilot.functions";
import {
  generateEmailFlow,
  generateUgcBrief,
  generateSeoPage,
  generateAdCreative,
  approveQueueItem,
} from "@/lib/growth-os-extra.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Sparkles, CheckCircle2, XCircle, Eye, Loader2, DollarSign, TrendingUp, Share2, Copy, Mail, Video, Search, Megaphone, ShieldCheck, Lightbulb, AlertTriangle, CircleDot } from "lucide-react";
import { runActiveAudit, type AuditReport, type AuditSeverity } from "@/lib/active-audit.functions";
import { generateUgcIdeas, queueUgcDraft, type UgcDraft } from "@/lib/ugc-recommender.functions";

export const Route = createFileRoute("/admin/growth-os")({
  beforeLoad: adminBeforeLoad,
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
  const emailFn = useServerFn(generateEmailFlow);
  const ugcFn = useServerFn(generateUgcBrief);
  const seoFn = useServerFn(generateSeoPage);
  const adsFn = useServerFn(generateAdCreative);
  const approveGenericFn = useServerFn(approveQueueItem);

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

  // Wave 3 + 4 generators all follow the same shape
  const mkDraftMutation = (fn: (args: { data: Record<string, never> }) => Promise<{ ok: boolean; error?: string; costUsd?: number }>, label: string) => useMutation({
    mutationFn: () => fn({ data: {} as Record<string, never> }),
    onSuccess: (res) => {
      if (res.ok) {
        toast.success(`${label} drafted${res.costUsd ? ` (~$${res.costUsd.toFixed(3)})` : ""}`);
        qc.invalidateQueries({ queryKey: ["growth-os"] });
      } else {
        toast.error(res.error ?? `${label} failed`);
      }
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const email = mkDraftMutation(emailFn as never, "Email flow");
  const ugc = mkDraftMutation(ugcFn as never, "UGC brief");
  const seo = mkDraftMutation(seoFn as never, "SEO page");
  const ads = mkDraftMutation(adsFn as never, "Ad set");

  const approveGeneric = useMutation({
    mutationFn: (id: string) => approveGenericFn({ data: { id } }),
    onSuccess: () => {
      toast.success("Approved");
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
        <div className="mb-8 grid gap-3 md:grid-cols-3 lg:grid-cols-6">
          <ModuleTile
            active title="Editorial Engine" desc="AI long-form blog → Shopify"
            action={
              <Button size="sm" disabled={generate.isPending} onClick={() => generate.mutate()}>
                {generate.isPending ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Sparkles className="mr-1.5 h-4 w-4" />}
                Draft article
              </Button>
            }
          />
          <ModuleTile
            active title="Social Pilot" desc="IG, Pinterest, X, TikTok pack"
            action={
              <Button size="sm" variant="outline" disabled={social.isPending} onClick={() => social.mutate()}>
                {social.isPending ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Share2 className="mr-1.5 h-4 w-4" />}
                Draft pack
              </Button>
            }
          />
          <ModuleTile
            active title="Lifecycle Autopilot" desc="Multi-step email & SMS flows"
            action={
              <Button size="sm" variant="outline" disabled={email.isPending} onClick={() => email.mutate()}>
                {email.isPending ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Mail className="mr-1.5 h-4 w-4" />}
                Draft flow
              </Button>
            }
          />
          <ModuleTile
            active title="UGC Studio" desc="HeyGen avatar + TikTok shot list"
            action={
              <Button size="sm" variant="outline" disabled={ugc.isPending} onClick={() => ugc.mutate()}>
                {ugc.isPending ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Video className="mr-1.5 h-4 w-4" />}
                Draft brief
              </Button>
            }
          />
          <ModuleTile
            active title="SEO Factory" desc="Programmatic long-tail landing pages"
            action={
              <Button size="sm" variant="outline" disabled={seo.isPending} onClick={() => seo.mutate()}>
                {seo.isPending ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Search className="mr-1.5 h-4 w-4" />}
                Draft page
              </Button>
            }
          />
          <ModuleTile
            active title="Ad Forge" desc="6-angle paid set: Meta + TikTok + Pinterest"
            action={
              <Button size="sm" variant="outline" disabled={ads.isPending} onClick={() => ads.mutate()}>
                {ads.isPending ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Megaphone className="mr-1.5 h-4 w-4" />}
                Draft ads
              </Button>
            }
          />
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
              {items.map((it) => {
                const isSocial = it.kind.startsWith("social_");
                return (
                <div key={it.id} className="flex flex-col gap-3 py-3 md:flex-row md:items-center md:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className={STATUS_TONE[it.status] ?? ""}>{it.status}</Badge>
                      <Badge variant="outline" className={CHANNEL_TONE[it.channel] ?? ""}>{it.channel}</Badge>
                      <span className="text-xs uppercase tracking-wider text-muted-foreground">{it.kind}</span>
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
                        {it.kind === "editorial" ? (
                          <Button size="sm" disabled={approve.isPending} onClick={() => approve.mutate(it.id)}>
                            <CheckCircle2 className="mr-1 h-4 w-4" /> Approve & publish
                          </Button>
                        ) : isSocial ? (
                          <Button size="sm" disabled={approveSocial.isPending} onClick={() => approveSocial.mutate(it.id)}>
                            <CheckCircle2 className="mr-1 h-4 w-4" /> Approve
                          </Button>
                        ) : (
                          <Button size="sm" disabled={approveGeneric.isPending} onClick={() => approveGeneric.mutate(it.id)}>
                            <CheckCircle2 className="mr-1 h-4 w-4" /> Approve
                          </Button>
                        )}
                        <Button size="sm" variant="outline" onClick={() => reject.mutate(it.id)}>
                          <XCircle className="mr-1 h-4 w-4" /> Reject
                        </Button>
                      </>
                    )}
                  </div>
                </div>
                );
              })}
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
              <PreviewBody item={preview.item} onClose={() => setPreview(null)} />
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

function PreviewBody({ item, onClose }: { item: Record<string, unknown>; onClose: () => void }) {
  const title = (item.title as string) ?? "Untitled";
  const kind = (item.kind as string) ?? "";
  const channel = (item.channel as string) ?? "";
  const payload = (item.payload as Record<string, unknown>) ?? {};
  const productUrl = payload.productUrl as string | undefined;
  const image = payload.image as string | null | undefined;

  return (
    <>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-xl font-serif">{title}</h3>
          <p className="mt-0.5 text-xs uppercase tracking-wider text-muted-foreground">{kind} → {channel}</p>
        </div>
        <Button size="sm" variant="ghost" onClick={onClose}>Close</Button>
      </div>

      {image && (
        <img src={image} alt="" className="mb-4 max-h-56 w-auto rounded-md border object-contain" />
      )}

      {kind === "editorial" && (
        <article
          className="prose prose-sm max-w-none prose-headings:font-serif prose-a:text-primary"
          dangerouslySetInnerHTML={{ __html: (payload.bodyHtml as string) ?? "<p>No body</p>" }}
        />
      )}

      {kind === "social_post" && <InstagramPreview payload={payload} productUrl={productUrl} />}
      {kind === "social_pin" && <PinterestPreview payload={payload} productUrl={productUrl} />}
      {kind === "social_thread" && <XThreadPreview payload={payload} />}
      {kind === "social_hook" && <TikTokPreview payload={payload} />}
      {(kind === "email_flow" || kind === "ugc_brief" || kind === "seo_page" || kind === "ad_set") && (
        <pre className="whitespace-pre-wrap rounded-md border bg-muted/40 p-3 text-xs font-mono max-h-[60vh] overflow-auto">
{JSON.stringify(payload, null, 2)}
        </pre>
      )}
    </>
  );
}

function CopyBtn({ text, label = "Copy" }: { text: string; label?: string }) {
  return (
    <Button size="sm" variant="outline" onClick={() => copy(text, `${label} copied`)}>
      <Copy className="mr-1 h-3 w-3" /> {label}
    </Button>
  );
}

function InstagramPreview({ payload, productUrl }: { payload: Record<string, unknown>; productUrl?: string }) {
  const caption = (payload.caption as string) ?? "";
  const slides = (payload.slides as Array<{ headline: string; body: string }>) ?? [];
  const tags = (payload.hashtags as string[]) ?? [];
  const fullCaption = `${caption}\n\n${tags.join(" ")}${productUrl ? `\n\n${productUrl}` : ""}`;
  return (
    <div className="space-y-5 text-sm">
      <section>
        <div className="mb-2 flex items-center justify-between"><h4 className="font-medium">Carousel slides</h4></div>
        <ol className="space-y-2">
          {slides.map((s, i) => (
            <li key={i} className="rounded-md border bg-muted/40 p-3">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Slide {i + 1}</p>
              <p className="mt-1 font-serif text-base">{s.headline}</p>
              <p className="text-muted-foreground">{s.body}</p>
            </li>
          ))}
        </ol>
      </section>
      <section>
        <div className="mb-2 flex items-center justify-between"><h4 className="font-medium">Caption</h4><CopyBtn text={fullCaption} label="Full caption" /></div>
        <pre className="whitespace-pre-wrap rounded-md border bg-muted/40 p-3 font-sans">{caption}</pre>
      </section>
      <section>
        <div className="mb-2 flex items-center justify-between"><h4 className="font-medium">Hashtags</h4><CopyBtn text={tags.join(" ")} label="Tags" /></div>
        <p className="text-muted-foreground">{tags.join(" ")}</p>
      </section>
    </div>
  );
}

function PinterestPreview({ payload, productUrl }: { payload: Record<string, unknown>; productUrl?: string }) {
  const title = (payload.title as string) ?? "";
  const description = (payload.description as string) ?? "";
  const tags = (payload.hashtags as string[]) ?? [];
  const full = `${description}\n\n${tags.join(" ")}${productUrl ? `\n${productUrl}` : ""}`;
  return (
    <div className="space-y-4 text-sm">
      <section><div className="mb-1 flex items-center justify-between"><h4 className="font-medium">Pin title</h4><CopyBtn text={title} label="Title" /></div><p className="rounded-md border bg-muted/40 p-3">{title}</p></section>
      <section><div className="mb-1 flex items-center justify-between"><h4 className="font-medium">Description</h4><CopyBtn text={full} label="Description" /></div><pre className="whitespace-pre-wrap rounded-md border bg-muted/40 p-3 font-sans">{description}</pre></section>
      <section><h4 className="mb-1 font-medium">Hashtags</h4><p className="text-muted-foreground">{tags.join(" ")}</p></section>
      {productUrl && <p className="text-xs text-muted-foreground">Destination URL: <a className="underline" href={productUrl} target="_blank" rel="noreferrer">{productUrl}</a></p>}
    </div>
  );
}

function XThreadPreview({ payload }: { payload: Record<string, unknown> }) {
  const tweets = (payload.tweets as string[]) ?? [];
  return (
    <div className="space-y-3 text-sm">
      <div className="flex items-center justify-between"><h4 className="font-medium">Thread ({tweets.length})</h4><CopyBtn text={tweets.join("\n\n---\n\n")} label="Full thread" /></div>
      <ol className="space-y-2">
        {tweets.map((t, i) => (
          <li key={i} className="rounded-md border bg-muted/40 p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">{i + 1}/{tweets.length} · {t.length} chars</p>
              <CopyBtn text={t} label="Tweet" />
            </div>
            <p className="mt-1 whitespace-pre-wrap">{t}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}

function TikTokPreview({ payload }: { payload: Record<string, unknown> }) {
  const hooks = (payload.hooks as string[]) ?? [];
  const audio = (payload.audioArchetypes as string[]) ?? [];
  const outline = (payload.scriptOutline as string) ?? "";
  return (
    <div className="space-y-4 text-sm">
      <section><div className="mb-1 flex items-center justify-between"><h4 className="font-medium">Hook bank</h4><CopyBtn text={hooks.map((h, i) => `${i + 1}. ${h}`).join("\n")} label="All hooks" /></div>
        <ol className="space-y-1 list-decimal pl-5">{hooks.map((h, i) => <li key={i}>{h}</li>)}</ol>
      </section>
      <section><h4 className="mb-1 font-medium">Audio archetypes</h4><ul className="list-disc pl-5 text-muted-foreground">{audio.map((a, i) => <li key={i}>{a}</li>)}</ul></section>
      <section><div className="mb-1 flex items-center justify-between"><h4 className="font-medium">Script outline</h4><CopyBtn text={outline} label="Outline" /></div><pre className="whitespace-pre-wrap rounded-md border bg-muted/40 p-3 font-sans">{outline}</pre></section>
    </div>
  );
}
