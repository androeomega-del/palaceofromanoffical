// Admin focal-point editor: pick a collection, drag the focal target
// on the image, see a live mobile + desktop hero preview, save to DB.
// Writes to `collection_images.focal_x` / `focal_y` via `upsertCollectionFocal`.
//
// Sibling of /admin/collection-image-preview — same noindex, unlinked
// "lock down before public deploy" pattern.
import { createFileRoute, Link } from "@tanstack/react-router";
import { redirect } from "@tanstack/react-router";
import { ensureAdmin } from "@/lib/admin-guard.functions";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { fetchCollections, type ShopifyCollection } from "@/lib/shopify";
import {
  collectionImage,
  collectionImageAlt,
  collectionImageFocal,
} from "@/lib/collection-image";
import {
  getCollectionImageMap,
  getCollectionImageMetaMap,
} from "@/lib/collection-image.functions";
import {
  upsertCollectionFocal,
  clearCollectionFocal,
  syncCollectionImagesFromShopify,
} from "@/lib/collection-image-admin.functions";

export const Route = createFileRoute("/admin/collection-focal")({
  beforeLoad: async () => {
    try { await ensureAdmin(); } catch { throw redirect({ to: "/login" }); }
  },
  component: AdminCollectionFocal,
  head: () => ({
    meta: [
      { title: "Collection Focal Point Editor — Palace of Roman" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

type Row = {
  handle: string;
  title: string;
  description: string;
  src: string;
  hasOverride: boolean;
  savedFocal: { x: number; y: number } | null;
  imageWidth: number | null;
  imageHeight: number | null;
};

function clamp(n: number, lo = 0, hi = 100) {
  return Math.max(lo, Math.min(hi, n));
}

function parseFocalString(s: string): { x: number; y: number } {
  // e.g. "50% 30%" → { x: 50, y: 30 }
  const m = s.match(/(-?\d+(?:\.\d+)?)%\s+(-?\d+(?:\.\d+)?)%/);
  if (!m) return { x: 50, y: 40 };
  return { x: clamp(parseFloat(m[1])), y: clamp(parseFloat(m[2])) };
}

function AdminCollectionFocal() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "saved" | "unsaved">("all");
  const [selectedHandle, setSelectedHandle] = useState<string | null>(null);
  const [draft, setDraft] = useState<{ x: number; y: number } | null>(null);

  const collectionsQ = useQuery({
    queryKey: ["shopify-collections-admin"],
    queryFn: () => fetchCollections(250),
    staleTime: 60_000,
  });

  const dynamicMapQ = useQuery({
    queryKey: ["collection-image-map"],
    queryFn: () => getCollectionImageMap(),
    staleTime: 60_000,
  });

  const metaMapQ = useQuery({
    queryKey: ["collection-image-meta-map"],
    queryFn: () => getCollectionImageMetaMap(),
    staleTime: 60_000,
  });

  const dynamicMap = dynamicMapQ.data ?? {};
  const metaMap = metaMapQ.data ?? {};

  const rows: Row[] = useMemo(() => {
    const cols = collectionsQ.data ?? [];
    return cols.map((c: ShopifyCollection) => {
      const handle = c.handle.toLowerCase();
      const meta = metaMap[handle];
      const src = collectionImage({
        handle,
        title: c.title,
        description: c.description ?? null,
        dynamicMap,
      });
      const savedFocal =
        meta && meta.focalX !== null && meta.focalY !== null
          ? { x: Number(meta.focalX), y: Number(meta.focalY) }
          : null;
      return {
        handle,
        title: c.title,
        description: c.description ?? "",
        src,
        hasOverride: !!savedFocal,
        savedFocal,
        imageWidth: meta?.width ?? c.image?.width ?? null,
        imageHeight: meta?.height ?? c.image?.height ?? null,
      };
    });
  }, [collectionsQ.data, dynamicMap, metaMap]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows
      .filter((r) => {
        if (filter === "saved" && !r.hasOverride) return false;
        if (filter === "unsaved" && r.hasOverride) return false;
        if (!q) return true;
        return r.handle.includes(q) || r.title.toLowerCase().includes(q);
      })
      .sort((a, b) => a.title.localeCompare(b.title));
  }, [rows, search, filter]);

  const selected = useMemo(
    () => filtered.find((r) => r.handle === selectedHandle) ?? filtered[0] ?? null,
    [filtered, selectedHandle],
  );

  // Whenever the selected row changes, reset the draft to its saved (or
  // computed) focal point.
  const selectedKey = selected?.handle ?? "";
  const savedJSON = selected?.savedFocal ? JSON.stringify(selected.savedFocal) : "";
  const computedFallback = useMemo(() => {
    if (!selected) return { x: 50, y: 40 };
    return parseFocalString(
      collectionImageFocal({
        handle: selected.handle,
        title: selected.title,
        imageWidth: selected.imageWidth,
        imageHeight: selected.imageHeight,
      }),
    );
  }, [selected]);

  useEffect(() => {
    if (!selected) return;
    setDraft(selected.savedFocal ?? computedFallback);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedKey, savedJSON]);

  const focal = draft ?? selected?.savedFocal ?? computedFallback;

  const saveM = useMutation({
    mutationFn: (input: { handle: string; focalX: number; focalY: number }) =>
      upsertCollectionFocal({ data: input }),
    onSuccess: () => {
      toast.success("Focal point saved");
      qc.invalidateQueries({ queryKey: ["collection-image-meta-map"] });
      qc.invalidateQueries({ queryKey: ["collection-focal-map"] });
    },
    onError: (e: Error) => toast.error(e.message || "Save failed"),
  });

  const clearM = useMutation({
    mutationFn: (input: { handle: string }) => clearCollectionFocal({ data: input }),
    onSuccess: () => {
      toast.success("Override cleared");
      qc.invalidateQueries({ queryKey: ["collection-image-meta-map"] });
      qc.invalidateQueries({ queryKey: ["collection-focal-map"] });
    },
    onError: (e: Error) => toast.error(e.message || "Clear failed"),
  });

  const syncM = useMutation({
    mutationFn: () => syncCollectionImagesFromShopify(),
    onSuccess: (res) => {
      toast.success(
        `Synced ${res.synced} (skipped ${res.skippedManual} manual, ${res.skippedNoImage} no-image)`,
      );
      qc.invalidateQueries({ queryKey: ["collection-image-meta-map"] });
      qc.invalidateQueries({ queryKey: ["collection-image-map"] });
    },
    onError: (e: Error) => toast.error(e.message || "Sync failed"),
  });

  return (
    <div className="min-h-screen bg-canvas text-ink">
      <header className="px-6 py-8 border-b border-ink/10 max-w-screen-2xl mx-auto">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <Link
              to="/admin/collection-image-preview"
              className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground hover:text-ink"
            >
              ← Image preview
            </Link>
            <h1 className="font-serif text-3xl md:text-4xl mt-2">
              Collection Focal Point Editor
            </h1>
            <p className="text-sm text-muted-foreground mt-2 max-w-[60ch]">
              Drag the dot on the source image to set where each hero should be
              anchored when cropped. Live previews show the storefront's mobile
              and desktop hero ratios. Saved overrides win over every fallback.
            </p>
          </div>
          <button
            onClick={() => syncM.mutate()}
            disabled={syncM.isPending}
            className="text-[11px] uppercase tracking-[0.2em] px-4 py-2 border border-ink/20 hover:bg-ink hover:text-canvas transition disabled:opacity-50"
          >
            {syncM.isPending ? "Syncing…" : "Sync from Shopify"}
          </button>
        </div>
      </header>

      <div className="max-w-screen-2xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-8">
        {/* Sidebar — handle list */}
        <aside className="space-y-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search handles…"
            className="w-full px-3 py-2 text-sm border border-ink/15 bg-canvas focus:outline-none focus:border-ink/40"
          />
          <div className="flex gap-1 text-[10px] uppercase tracking-[0.2em]">
            {(["all", "saved", "unsaved"] as const).map((k) => (
              <button
                key={k}
                onClick={() => setFilter(k)}
                className={
                  "flex-1 px-2 py-1.5 border transition " +
                  (filter === k
                    ? "bg-ink text-canvas border-ink"
                    : "border-ink/15 hover:border-ink/40")
                }
              >
                {k}
              </button>
            ))}
          </div>
          <ul className="border border-ink/10 max-h-[70vh] overflow-y-auto">
            {collectionsQ.isLoading && (
              <li className="px-3 py-2 text-xs text-muted-foreground">Loading…</li>
            )}
            {!collectionsQ.isLoading && filtered.length === 0 && (
              <li className="px-3 py-2 text-xs text-muted-foreground">No matches</li>
            )}
            {filtered.map((r) => {
              const isSel = selected?.handle === r.handle;
              return (
                <li key={r.handle}>
                  <button
                    onClick={() => setSelectedHandle(r.handle)}
                    className={
                      "w-full text-left px-3 py-2 text-xs border-b border-ink/5 flex items-center justify-between gap-2 transition " +
                      (isSel ? "bg-ink/5" : "hover:bg-ink/5")
                    }
                  >
                    <span className="flex flex-col min-w-0">
                      <span className="truncate text-ink">{r.title}</span>
                      <span className="truncate text-[10px] text-muted-foreground">
                        {r.handle}
                      </span>
                    </span>
                    {r.hasOverride && (
                      <span className="text-[9px] uppercase tracking-[0.2em] px-1.5 py-0.5 border border-emerald-300 text-emerald-800 bg-emerald-50 shrink-0">
                        Saved
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </aside>

        {/* Editor */}
        {selected ? (
          <Editor
            row={selected}
            focal={focal}
            onChange={(next) => setDraft(next)}
            onSave={() =>
              saveM.mutate({
                handle: selected.handle,
                focalX: focal.x,
                focalY: focal.y,
              })
            }
            onReset={() => setDraft(computedFallback)}
            onClear={() => clearM.mutate({ handle: selected.handle })}
            saving={saveM.isPending}
            clearing={clearM.isPending}
          />
        ) : (
          <div className="text-sm text-muted-foreground">
            Pick a collection from the list to start editing.
          </div>
        )}
      </div>
    </div>
  );
}

interface EditorProps {
  row: Row;
  focal: { x: number; y: number };
  onChange: (next: { x: number; y: number }) => void;
  onSave: () => void;
  onReset: () => void;
  onClear: () => void;
  saving: boolean;
  clearing: boolean;
}

function Editor({
  row,
  focal,
  onChange,
  onSave,
  onReset,
  onClear,
  saving,
  clearing,
}: EditorProps) {
  const sourceRef = useRef<HTMLDivElement | null>(null);
  const draggingRef = useRef(false);

  function applyFromEvent(clientX: number, clientY: number) {
    const el = sourceRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = clamp(((clientX - rect.left) / rect.width) * 100);
    const y = clamp(((clientY - rect.top) / rect.height) * 100);
    onChange({ x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 });
  }

  const focalCss = `${focal.x}% ${focal.y}%`;
  const alt = collectionImageAlt({
    handle: row.handle,
    title: row.title,
    description: row.description,
  });

  return (
    <section className="space-y-6">
      <header className="flex items-end justify-between flex-wrap gap-4 border-b border-ink/10 pb-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
            {row.handle}
          </p>
          <h2 className="font-serif text-2xl md:text-3xl mt-1">{row.title}</h2>
          <p className="text-[11px] text-muted-foreground mt-1">
            {row.imageWidth && row.imageHeight
              ? `Source ${row.imageWidth}×${row.imageHeight} · ratio ${(
                  row.imageWidth / row.imageHeight
                ).toFixed(2)}`
              : "Source dimensions unknown"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onReset}
            className="text-[11px] uppercase tracking-[0.2em] px-3 py-2 border border-ink/15 hover:bg-ink/5"
          >
            Reset to computed
          </button>
          <button
            onClick={onClear}
            disabled={clearing || !row.hasOverride}
            className="text-[11px] uppercase tracking-[0.2em] px-3 py-2 border border-rose-200 text-rose-800 hover:bg-rose-50 disabled:opacity-40"
          >
            {clearing ? "Clearing…" : "Clear override"}
          </button>
          <button
            onClick={onSave}
            disabled={saving}
            className="text-[11px] uppercase tracking-[0.2em] px-4 py-2 bg-ink text-canvas hover:opacity-90 disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </header>

      {/* Source picker */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs uppercase tracking-[0.25em] text-muted-foreground">
            Source — click or drag to set focal
          </h3>
          <span className="text-[11px] font-mono text-muted-foreground">
            x {focal.x.toFixed(1)}% · y {focal.y.toFixed(1)}%
          </span>
        </div>
        <div
          ref={sourceRef}
          onPointerDown={(e) => {
            draggingRef.current = true;
            (e.target as Element).setPointerCapture?.(e.pointerId);
            applyFromEvent(e.clientX, e.clientY);
          }}
          onPointerMove={(e) => {
            if (!draggingRef.current) return;
            applyFromEvent(e.clientX, e.clientY);
          }}
          onPointerUp={(e) => {
            draggingRef.current = false;
            (e.target as Element).releasePointerCapture?.(e.pointerId);
          }}
          className="relative w-full max-w-xl bg-muted overflow-hidden cursor-crosshair select-none touch-none"
          style={{
            aspectRatio:
              row.imageWidth && row.imageHeight
                ? `${row.imageWidth} / ${row.imageHeight}`
                : "4 / 5",
          }}
        >
          <img
            src={row.src}
            alt={alt}
            draggable={false}
            className="absolute inset-0 w-full h-full object-contain pointer-events-none"
          />
          {/* Crosshair */}
          <div
            className="absolute h-px w-full bg-canvas/70 mix-blend-difference pointer-events-none"
            style={{ top: `${focal.y}%` }}
          />
          <div
            className="absolute w-px h-full bg-canvas/70 mix-blend-difference pointer-events-none"
            style={{ left: `${focal.x}%` }}
          />
          {/* Focal dot */}
          <div
            className="absolute w-5 h-5 rounded-full border-2 border-canvas shadow-[0_0_0_2px_rgba(0,0,0,0.6)] pointer-events-none"
            style={{
              left: `${focal.x}%`,
              top: `${focal.y}%`,
              transform: "translate(-50%, -50%)",
            }}
          />
        </div>

        {/* Slider fallback */}
        <div className="grid grid-cols-2 gap-4 max-w-xl">
          <label className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
            Horizontal {focal.x.toFixed(0)}%
            <input
              type="range"
              min={0}
              max={100}
              step={0.5}
              value={focal.x}
              onChange={(e) =>
                onChange({ x: Number(e.target.value), y: focal.y })
              }
              className="w-full mt-1"
            />
          </label>
          <label className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
            Vertical {focal.y.toFixed(0)}%
            <input
              type="range"
              min={0}
              max={100}
              step={0.5}
              value={focal.y}
              onChange={(e) =>
                onChange({ x: focal.x, y: Number(e.target.value) })
              }
              className="w-full mt-1"
            />
          </label>
        </div>
      </div>

      {/* Live previews */}
      <div className="space-y-4">
        <h3 className="text-xs uppercase tracking-[0.25em] text-muted-foreground">
          Live previews at storefront ratios
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <PreviewPane
            label="Desktop hero — 16:7"
            src={row.src}
            alt={alt}
            focalCss={focalCss}
            ratio="16 / 7"
          />
          <PreviewPane
            label="Mobile hero — 3:4"
            src={row.src}
            alt={alt}
            focalCss={focalCss}
            ratio="3 / 4"
            narrow
          />
          <PreviewPane
            label="Collection card — 3:4"
            src={row.src}
            alt={alt}
            focalCss={focalCss}
            ratio="3 / 4"
            narrow
          />
          <PreviewPane
            label="Megamenu tile — 4:5"
            src={row.src}
            alt={alt}
            focalCss={focalCss}
            ratio="4 / 5"
            narrow
          />
        </div>
      </div>
    </section>
  );
}

function PreviewPane({
  label,
  src,
  alt,
  focalCss,
  ratio,
  narrow,
}: {
  label: string;
  src: string;
  alt: string;
  focalCss: string;
  ratio: string;
  narrow?: boolean;
}) {
  return (
    <div className="space-y-2">
      <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
        {label}
      </p>
      <div
        className={
          "relative bg-muted overflow-hidden " + (narrow ? "max-w-[240px]" : "")
        }
        style={{ aspectRatio: ratio }}
      >
        <img
          src={src}
          alt={alt}
          className="absolute inset-0 w-full h-full object-cover"
          style={{ objectPosition: focalCss }}
        />
      </div>
    </div>
  );
}
