import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { adminBeforeLoad } from "@/lib/admin-route-guard";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  listProductImageQueue,
  generateProductImageForSku,
  reviewProductImage,
  buildProductImagePrompt,
  type QueueItem,
  type CatalogSource,
} from "@/lib/product-image-review.functions";
import { Loader2, Sparkles, Check, X, RefreshCw } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/product-images")({
  beforeLoad: adminBeforeLoad,
  component: AdminProductImages,
  head: () => ({
    meta: [
      { title: "Product Images — QA — Palace of Roman" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

type Filter = "ungenerated" | "pending" | "approved" | "rejected" | "all";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "ungenerated", label: "Needs image" },
  { key: "pending", label: "Pending review" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
  { key: "all", label: "All" },
];

const SOURCES: { key: CatalogSource; label: string; hint: string }[] = [
  { key: "bg_products", label: "BrandsGateway", hint: "bg_products table" },
  { key: "shopify", label: "Shopify (live)", hint: "Admin API · tags + metafields" },
];

function AdminProductImages() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<Filter>("ungenerated");
  const [source, setSource] = useState<CatalogSource>("bg_products");

  const queueQ = useQuery({
    queryKey: ["product-image-queue", source, filter],
    queryFn: () =>
      listProductImageQueue({ data: { source, status: filter, limit: 40 } }),
    staleTime: 30_000,
  });

  const items = queueQ.data?.items ?? [];

  return (
    <main className="min-h-screen bg-canvas px-6 py-10">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <p className="text-[10px] uppercase tracking-[0.4em] text-bronze mb-2">Admin</p>
          <h1 className="font-serif text-3xl md:text-4xl">Product Images — QA</h1>
          <p className="mt-2 text-sm text-muted-foreground max-w-3xl">
            Pick the catalog source for this batch. Prompts are built strictly
            from <code>color · style · category · sku · gender</code> on the
            source record — never inferred from the generated image. Approved
            images write back the SKU reference; rejected items re-enter the
            queue with the reviewer note used as a prompt override on the next
            regen.
          </p>
        </header>

        {/* Source selector — per batch */}
        <div className="mb-5">
          <p className="text-[10px] uppercase tracking-[0.3em] text-bronze mb-2">Data source (per batch)</p>
          <div className="inline-flex rounded border border-border overflow-hidden">
            {SOURCES.map((s) => (
              <button
                key={s.key}
                onClick={() => setSource(s.key)}
                className={`px-4 py-2 text-xs text-left transition-colors ${
                  source === s.key
                    ? "bg-foreground text-background"
                    : "bg-transparent hover:bg-muted/40"
                }`}
              >
                <span className="block font-medium">{s.label}</span>
                <span className="block text-[10px] opacity-70">{s.hint}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-3 py-1.5 text-xs rounded border transition-colors ${
                filter === f.key
                  ? "bg-foreground text-background border-foreground"
                  : "bg-transparent border-border hover:border-foreground/40"
              }`}
            >
              {f.label}
            </button>
          ))}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => qc.invalidateQueries({ queryKey: ["product-image-queue"] })}
            className="ml-auto"
          >
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Refresh
          </Button>
        </div>

        {queueQ.isLoading && (
          <div className="text-sm text-muted-foreground flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading queue…
          </div>
        )}
        {queueQ.isError && (
          <div className="text-sm text-rose-600">
            Failed to load queue: {(queueQ.error as Error)?.message}
          </div>
        )}
        {queueQ.isSuccess && items.length === 0 && (
          <div className="text-sm text-muted-foreground">Nothing in this bucket.</div>
        )}

        <div className="grid gap-6">
          {items.map((item) => (
            <ReviewRow key={`${item.source}:${item.sku}`} item={item} />
          ))}
        </div>
      </div>
    </main>
  );
}

function ReviewRow({ item }: { item: QueueItem }) {
  const qc = useQueryClient();
  const [notes, setNotes] = useState(item.review?.reviewer_notes ?? "");

  const previewPrompt =
    item.review?.prompt ?? buildProductImagePrompt(item.catalog, notes || null);

  const genMut = useMutation({
    mutationFn: () =>
      generateProductImageForSku({
        data: { sku: item.sku, source: item.source, override: notes || undefined },
      }),
    onSuccess: () => {
      toast.success(`Generated image for ${item.sku}`);
      qc.invalidateQueries({ queryKey: ["product-image-queue"] });
    },
    onError: (e: Error) => toast.error(e.message || "Generation failed"),
  });

  const reviewMut = useMutation({
    mutationFn: (decision: "approved" | "rejected") =>
      reviewProductImage({
        data: { sku: item.sku, source: item.source, decision, notes },
      }),
    onSuccess: (_d, decision) => {
      toast.success(decision === "approved" ? "Approved — SKU linked" : "Rejected — re-queued");
      qc.invalidateQueries({ queryKey: ["product-image-queue"] });
    },
    onError: (e: Error) => toast.error(e.message || "Failed"),
  });

  const status = item.review?.status ?? "ungenerated";
  const statusStyle =
    status === "approved"
      ? "bg-emerald-100 text-emerald-900 border-emerald-200"
      : status === "rejected"
        ? "bg-rose-100 text-rose-900 border-rose-200"
        : status === "pending"
          ? "bg-amber-100 text-amber-900 border-amber-200"
          : "bg-muted text-muted-foreground border-border";

  return (
    <Card className="p-5">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT — Catalog attributes */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-[10px] uppercase tracking-[0.3em] text-bronze">
              {item.source === "shopify" ? "Shopify attributes" : "BrandsGateway attributes"}
            </p>
            <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded border ${statusStyle}`}>
              {status}
            </span>
          </div>
          <h3 className="font-serif text-lg leading-tight">{item.catalog.name ?? item.catalog.handle}</h3>
          <dl className="text-xs grid grid-cols-[110px_1fr] gap-y-1.5 gap-x-3">
            <Attr k="SKU" v={item.catalog.sku} mono />
            <Attr k="Handle" v={item.catalog.handle} mono />
            <Attr k="Brand" v={item.catalog.brand} />
            <Attr k="Gender" v={item.catalog.gender} />
            <Attr k="Category" v={item.catalog.category} />
            <Attr k="Style" v={item.catalog.style} />
            <Attr k="Subcategory" v={item.catalog.subcategory} />
            <Attr k="Color" v={item.catalog.color} highlight />
            <Attr k="Material" v={item.catalog.material} />
          </dl>

          <details className="text-[11px] text-muted-foreground">
            <summary className="cursor-pointer">View data-bound prompt</summary>
            <p className="mt-2 font-mono leading-relaxed whitespace-pre-wrap break-words">
              {previewPrompt}
            </p>
          </details>

          {item.mainPicture && (
            <details className="text-[11px] text-muted-foreground">
              <summary className="cursor-pointer">Catalog reference photo</summary>
              <img
                src={item.mainPicture}
                alt={`Catalog reference for SKU ${item.catalog.sku}`}
                loading="lazy"
                className="mt-2 max-h-48 w-auto rounded border border-border"
              />
            </details>
          )}
        </div>

        {/* RIGHT — Generated image + actions */}
        <div className="space-y-3">
          <p className="text-[10px] uppercase tracking-[0.3em] text-bronze">Generated image</p>
          <div className="aspect-[4/5] bg-muted/40 border border-border rounded flex items-center justify-center overflow-hidden">
            {item.review?.image_url ? (
              <img
                src={item.review.image_url}
                alt={`Generated: ${item.catalog.color ?? ""} ${item.catalog.style ?? item.catalog.subcategory ?? item.catalog.category ?? ""} (SKU ${item.catalog.sku})`}
                className="w-full h-full object-cover"
              />
            ) : (
              <p className="text-xs text-muted-foreground">No image yet</p>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => genMut.mutate()}
              disabled={genMut.isPending}
            >
              {genMut.isPending ? (
                <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
              ) : (
                <Sparkles className="h-3.5 w-3.5 mr-1.5" />
              )}
              {item.review ? "Regenerate" : "Generate"}
            </Button>

            {item.review?.image_url && (
              <>
                <Button
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={() => reviewMut.mutate("approved")}
                  disabled={reviewMut.isPending}
                >
                  <Check className="h-3.5 w-3.5 mr-1.5" /> Approve
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => reviewMut.mutate("rejected")}
                  disabled={reviewMut.isPending}
                >
                  <X className="h-3.5 w-3.5 mr-1.5" /> Reject & re-queue
                </Button>
              </>
            )}
          </div>

          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Override note — used as a prompt override on next regen (e.g. 'shot from above, flat lay')…"
            rows={2}
            className="text-xs"
          />
        </div>
      </div>
    </Card>
  );
}

function Attr({
  k,
  v,
  mono,
  highlight,
}: {
  k: string;
  v: string | null;
  mono?: boolean;
  highlight?: boolean;
}) {
  return (
    <>
      <dt className="text-muted-foreground uppercase tracking-wider text-[10px] pt-0.5">{k}</dt>
      <dd
        className={`${mono ? "font-mono" : ""} ${
          highlight ? "font-semibold text-foreground" : ""
        } break-words`}
      >
        {v ?? <span className="text-muted-foreground/60">—</span>}
      </dd>
    </>
  );
}
