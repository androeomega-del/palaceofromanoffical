import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState, useEffect, useRef } from "react";
import { adminBeforeLoad } from "@/lib/admin-route-guard";
import { callAdminServerFn } from "@/lib/admin-server-call";
import { listSiteImages, type SiteImage, type ImageGroup } from "@/lib/image-export.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Copy, Download, AlertTriangle, Check } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/image-export")({
  ssr: false,
  beforeLoad: adminBeforeLoad,
  component: AdminImageExport,
  head: () => ({
    meta: [
      { title: "Image Export — Palace of Roman" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

const GROUP_ORDER: ImageGroup[] = ["Hero", "Banners", "Lookbook", "Collections", "Products"];
const GBP_MIN = 720;

type Measured = { width: number; height: number; bytes?: number };

function AdminImageExport() {
  const { data, isLoading } = useQuery({
    queryKey: ["image-export", "list"],
    queryFn: () => callAdminServerFn(listSiteImages),
  });

  const [minSize, setMinSize] = useState<number>(GBP_MIN);
  const [activeGroup, setActiveGroup] = useState<ImageGroup | "All">("All");
  const [measured, setMeasured] = useState<Record<string, Measured>>({});

  const images = data?.images ?? [];

  const filtered = useMemo(() => {
    return images.filter((img) => {
      if (activeGroup !== "All" && img.group !== activeGroup) return false;
      const m = measured[img.url];
      const w = m?.width ?? img.width ?? null;
      const h = m?.height ?? img.height ?? null;
      if (w == null || h == null) return true; // unknown — show; the load handler will update
      return Math.min(w, h) >= minSize;
    });
  }, [images, activeGroup, minSize, measured]);

  const grouped = useMemo(() => {
    const out = new Map<ImageGroup, SiteImage[]>();
    for (const img of filtered) {
      const arr = out.get(img.group) ?? [];
      arr.push(img);
      out.set(img.group, arr);
    }
    return out;
  }, [filtered]);

  const onMeasured = (url: string, m: Measured) => {
    setMeasured((prev) => (prev[url] ? prev : { ...prev, [url]: m }));
  };

  return (
    <main className="min-h-screen bg-canvas px-6 py-12">
      <div className="max-w-7xl mx-auto">
        <Link
          to="/admin"
          className="text-[10px] uppercase tracking-[0.4em] text-bronze mb-3 inline-block hover:text-foreground"
        >
          ← Admin
        </Link>
        <h1 className="font-serif text-4xl">Image Export</h1>
        <p className="mt-2 text-sm text-muted-foreground max-w-2xl">
          Every image currently rendered across the site, grouped by surface. Use this to
          pick the strongest shots for Google Business Profile. GBP requires ≥720px on the
          short side — anything smaller is flagged.
        </p>

        <Card className="p-4 mt-6 mb-6">
          <div className="grid sm:grid-cols-[1fr_auto] gap-4 items-end">
            <div>
              <Label className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                Minimum short-side resolution (px)
              </Label>
              <Input
                type="number"
                value={minSize}
                min={0}
                step={20}
                onChange={(e) => setMinSize(Number(e.target.value) || 0)}
                className="mt-1 w-40"
              />
              <p className="text-[11px] text-muted-foreground mt-1">
                Default 720 = Google Business Profile minimum.
              </p>
            </div>
            <div className="text-xs text-muted-foreground">
              {isLoading ? "Loading…" : `${filtered.length} of ${images.length} images shown`}
            </div>
          </div>
          <div className="flex flex-wrap gap-2 mt-4">
            <GroupChip
              active={activeGroup === "All"}
              onClick={() => setActiveGroup("All")}
              label="All"
              count={images.length}
            />
            {GROUP_ORDER.map((g) => (
              <GroupChip
                key={g}
                active={activeGroup === g}
                onClick={() => setActiveGroup(g)}
                label={g}
                count={data?.counts[g] ?? 0}
              />
            ))}
          </div>
        </Card>

        {isLoading && (
          <div className="py-20 text-center">
            <Loader2 className="h-6 w-6 animate-spin mx-auto text-bronze" />
          </div>
        )}

        {!isLoading && filtered.length === 0 && (
          <Card className="p-12 text-center text-sm text-muted-foreground">
            No images match the current filter.
          </Card>
        )}

        {GROUP_ORDER.map((g) => {
          const list = grouped.get(g);
          if (!list || list.length === 0) return null;
          return (
            <section key={g} className="mb-10">
              <h2 className="text-[11px] uppercase tracking-[0.35em] text-bronze mb-3">
                {g} · {list.length}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {list.map((img) => (
                  <ImageTile
                    key={img.url}
                    img={img}
                    measured={measured[img.url]}
                    minSize={minSize}
                    onMeasured={onMeasured}
                  />
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </main>
  );
}

function GroupChip({
  active,
  onClick,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
}) {
  return (
    <button
      onClick={onClick}
      className={`text-[11px] uppercase tracking-[0.25em] px-3 py-1.5 border rounded-full transition-colors ${
        active
          ? "bg-foreground text-background border-foreground"
          : "border-border text-muted-foreground hover:border-bronze hover:text-foreground"
      }`}
    >
      {label} <span className="ml-1 opacity-70">({count})</span>
    </button>
  );
}

function ImageTile({
  img,
  measured,
  minSize,
  onMeasured,
}: {
  img: SiteImage;
  measured?: Measured;
  minSize: number;
  onMeasured: (url: string, m: Measured) => void;
}) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [copied, setCopied] = useState(false);
  const [bytes, setBytes] = useState<number | undefined>(measured?.bytes);
  const w = measured?.width ?? img.width ?? null;
  const h = measured?.height ?? img.height ?? null;
  const short = w && h ? Math.min(w, h) : null;
  const tooSmall = short != null && short < minSize;

  // Best-effort file-size fetch via HEAD; ignore failures (CORS, opaque).
  useEffect(() => {
    if (bytes != null) return;
    let cancelled = false;
    fetch(img.url, { method: "HEAD" })
      .then((r) => {
        const cl = r.headers.get("content-length");
        if (!cancelled && cl) setBytes(Number(cl));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [img.url, bytes]);

  const absoluteUrl = useMemo(() => {
    if (/^https?:\/\//i.test(img.url)) return img.url;
    if (typeof window !== "undefined") return new URL(img.url, window.location.origin).toString();
    return img.url;
  }, [img.url]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(absoluteUrl);
      setCopied(true);
      toast.success("URL copied");
      setTimeout(() => setCopied(false), 1200);
    } catch {
      toast.error("Copy failed");
    }
  };

  const download = () => {
    // Route through our server-side proxy so cross-origin CDN images
    // (Shopify, Supabase storage) download properly with Content-Disposition.
    const name = (img.url.split("/").pop()?.split("?")[0] || "image").replace(/[^\w.\-]/g, "_");
    const proxied = `/api/admin/image-proxy?url=${encodeURIComponent(absoluteUrl)}&filename=${encodeURIComponent(name)}`;
    const a = document.createElement("a");
    a.href = proxied;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };


  return (
    <Card className="overflow-hidden flex flex-col">
      <div className="relative aspect-square bg-muted">
        <img
          ref={imgRef}
          src={img.url}
          alt={img.context ?? img.label}
          loading="lazy"
          decoding="async"
          onLoad={(e) => {
            const el = e.currentTarget;
            onMeasured(img.url, {
              width: el.naturalWidth,
              height: el.naturalHeight,
              bytes,
            });
          }}
          className="absolute inset-0 w-full h-full object-cover"
        />
        {tooSmall && (
          <Badge variant="destructive" className="absolute top-2 left-2 gap-1">
            <AlertTriangle className="h-3 w-3" />
            &lt; {minSize}px
          </Badge>
        )}
      </div>
      <div className="p-3 space-y-1.5 flex-1 flex flex-col">
        <div className="text-[10px] uppercase tracking-[0.3em] text-bronze">{img.group}</div>
        <div className="text-xs font-medium truncate" title={img.label}>
          {img.label}
        </div>
        {img.context && (
          <div className="text-[11px] text-muted-foreground truncate" title={img.context}>
            {img.context}
          </div>
        )}
        <div className="text-[11px] text-muted-foreground">
          {w && h ? `${w} × ${h}` : "measuring…"}
          {bytes != null && <> · {formatBytes(bytes)}</>}
        </div>
        <div className="text-[10px] text-muted-foreground/80 break-all line-clamp-2" title={absoluteUrl}>
          {absoluteUrl}
        </div>
        <div className="flex gap-2 pt-2 mt-auto">
          <Button size="sm" variant="outline" className="flex-1" onClick={copy}>
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            <span className="ml-1">Copy URL</span>
          </Button>
          <Button size="sm" variant="outline" className="flex-1" onClick={download}>
            <Download className="h-3.5 w-3.5" />
            <span className="ml-1">Download</span>
          </Button>
        </div>
      </div>
    </Card>
  );
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}
