// Visual regression check for collection hero crops.
//
// Captures a per-handle "baseline" focal point in localStorage, then renders
// each collection hero side-by-side (baseline vs current) at the storefront's
// three common breakpoints — mobile 3:4, tablet 4:5, desktop 16:7 — so we can
// eyeball mis-crops introduced by focal-point edits before they ship.
//
// Sibling of /admin/collection-focal (the editor). Noindex, unlinked.
import { createFileRoute, Link } from "@tanstack/react-router";
import { adminBeforeLoad } from "@/lib/admin-route-guard";
import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState } from "react";
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
  getCollectionFocalMap,
} from "@/lib/collection-image.functions";

export const Route = createFileRoute("/admin/collection-hero-regression")({
  beforeLoad: adminBeforeLoad,
  component: AdminHeroRegression,
  head: () => ({
    meta: [
      { title: "Collection Hero Regression — Palace of Roman" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

type Snapshot = { x: number; y: number; capturedAt: string };
type Baselines = Record<string, Snapshot>;

const STORAGE_KEY = "por.collection-hero-baselines.v1";

const BREAKPOINTS = [
  { id: "mobile", label: "Mobile · 3:4", ratio: "3 / 4", width: 180 },
  { id: "tablet", label: "Tablet · 4:5", ratio: "4 / 5", width: 220 },
  { id: "desktop", label: "Desktop · 16:7", ratio: "16 / 7", width: 480 },
] as const;

function parseFocal(s: string): { x: number; y: number } {
  const m = s.match(/(-?\d+(?:\.\d+)?)%\s+(-?\d+(?:\.\d+)?)%/);
  if (!m) return { x: 50, y: 40 };
  return { x: parseFloat(m[1]), y: parseFloat(m[2]) };
}

function loadBaselines(): Baselines {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Baselines) : {};
  } catch {
    return {};
  }
}

function saveBaselines(b: Baselines) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(b));
}

function diff(a: { x: number; y: number }, b: { x: number; y: number }) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function AdminHeroRegression() {
  const collectionsQ = useQuery({
    queryKey: ["shopify-collections-admin"],
    queryFn: () => fetchCollections(250),
    staleTime: 60_000,
  });
  const dynMapQ = useQuery({
    queryKey: ["collection-image-map"],
    queryFn: () => getCollectionImageMap(),
    staleTime: 60_000,
  });
  const metaMapQ = useQuery({
    queryKey: ["collection-image-meta-map"],
    queryFn: () => getCollectionImageMetaMap(),
    staleTime: 60_000,
  });
  const focalMapQ = useQuery({
    queryKey: ["collection-focal-map"],
    queryFn: () => getCollectionFocalMap(),
    staleTime: 60_000,
  });

  const [baselines, setBaselines] = useState<Baselines>({});
  useEffect(() => setBaselines(loadBaselines()), []);

  const [filter, setFilter] = useState<"all" | "drift" | "missing">("all");
  const [search, setSearch] = useState("");

  type Row = {
    handle: string;
    title: string;
    src: string;
    alt: string;
    current: { x: number; y: number };
    baseline: Snapshot | null;
    drift: number;
    hasOverride: boolean;
  };

  const rows: Row[] = useMemo(() => {
    const cols = collectionsQ.data ?? [];
    const dynMap = dynMapQ.data ?? {};
    const metaMap = metaMapQ.data ?? {};
    const focalMap = focalMapQ.data ?? {};
    return cols.map((c: ShopifyCollection): Row => {
      const handle = c.handle.toLowerCase();
      const meta = metaMap[handle];
      const src = collectionImage({
        handle,
        title: c.title,
        description: c.description ?? null,
        dynamicMap: dynMap,
      });
      const focalCss = collectionImageFocal({
        handle,
        title: c.title,
        imageWidth: meta?.width ?? c.image?.width ?? null,
        imageHeight: meta?.height ?? c.image?.height ?? null,
        dynamicFocal: focalMap,
      });
      const current = parseFocal(focalCss);
      const baseline = baselines[handle] ?? null;
      return {
        handle,
        title: c.title,
        src,
        alt: collectionImageAlt({
          handle,
          title: c.title,
          description: c.description ?? "",
        }),
        current,
        baseline,
        drift: baseline ? diff(current, baseline) : 0,
        hasOverride: !!(meta && meta.focalX !== null && meta.focalY !== null),
      };
    });
  }, [collectionsQ.data, dynMapQ.data, metaMapQ.data, focalMapQ.data, baselines]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows
      .filter((r) => {
        if (filter === "drift" && (!r.baseline || r.drift < 0.5)) return false;
        if (filter === "missing" && r.baseline) return false;
        if (!q) return true;
        return r.handle.includes(q) || r.title.toLowerCase().includes(q);
      })
      .sort((a, b) => b.drift - a.drift || a.title.localeCompare(b.title));
  }, [rows, filter, search]);

  const captureOne = useCallback((handle: string, current: { x: number; y: number }) => {
    setBaselines((prev) => {
      const next = {
        ...prev,
        [handle]: { ...current, capturedAt: new Date().toISOString() },
      };
      saveBaselines(next);
      return next;
    });
    toast.success(`Baseline captured for ${handle}`);
  }, []);

  const captureAll = useCallback(() => {
    const now = new Date().toISOString();
    const next: Baselines = {};
    for (const r of rows) next[r.handle] = { ...r.current, capturedAt: now };
    saveBaselines(next);
    setBaselines(next);
    toast.success(`Captured ${rows.length} baselines`);
  }, [rows]);

  const clearAll = useCallback(() => {
    if (!confirm("Clear all stored baselines?")) return;
    saveBaselines({});
    setBaselines({});
    toast.success("Baselines cleared");
  }, []);

  const driftCount = rows.filter((r) => r.baseline && r.drift >= 0.5).length;
  const missingCount = rows.filter((r) => !r.baseline).length;

  return (
    <div className="min-h-screen bg-canvas text-ink">
      <header className="px-6 py-8 border-b border-ink/10 max-w-screen-2xl mx-auto">
        <Link
          to="/admin/collection-focal"
          className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground hover:text-ink"
        >
          ← Focal editor
        </Link>
        <div className="flex items-end justify-between flex-wrap gap-4 mt-2">
          <div>
            <h1 className="font-serif text-3xl md:text-4xl">
              Hero Crop Regression
            </h1>
            <p className="text-sm text-muted-foreground mt-2 max-w-[64ch]">
              Side-by-side renders of every collection hero at mobile, tablet and
              desktop ratios. Capture a baseline focal point, then re-check after
              focal edits to spot mis-crops before they ship. Baselines are stored
              locally in your browser.
            </p>
            <p className="text-[11px] text-muted-foreground mt-2">
              {rows.length} collections · {driftCount} drifted · {missingCount}{" "}
              missing baseline
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={captureAll}
              className="text-[11px] uppercase tracking-[0.2em] px-3 py-2 bg-ink text-canvas hover:opacity-90"
            >
              Capture all
            </button>
            <button
              onClick={clearAll}
              className="text-[11px] uppercase tracking-[0.2em] px-3 py-2 border border-rose-200 text-rose-800 hover:bg-rose-50"
            >
              Clear baselines
            </button>
          </div>
        </div>
        <div className="flex items-center gap-3 mt-4 flex-wrap">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search handles…"
            className="px-3 py-2 text-sm border border-ink/15 bg-canvas focus:outline-none focus:border-ink/40 w-64"
          />
          <div className="flex gap-1 text-[10px] uppercase tracking-[0.2em]">
            {(["all", "drift", "missing"] as const).map((k) => (
              <button
                key={k}
                onClick={() => setFilter(k)}
                className={
                  "px-3 py-1.5 border transition " +
                  (filter === k
                    ? "bg-ink text-canvas border-ink"
                    : "border-ink/15 hover:border-ink/40")
                }
              >
                {k}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-screen-2xl mx-auto px-6 py-8 space-y-10">
        {collectionsQ.isLoading && (
          <p className="text-sm text-muted-foreground">Loading collections…</p>
        )}
        {!collectionsQ.isLoading && filtered.length === 0 && (
          <p className="text-sm text-muted-foreground">No collections match.</p>
        )}
        {filtered.map((r) => (
          <RegressionCard
            key={r.handle}
            row={r}
            onCapture={() => captureOne(r.handle, r.current)}
          />
        ))}
      </main>
    </div>
  );
}

function RegressionCard({
  row,
  onCapture,
}: {
  row: {
    handle: string;
    title: string;
    src: string;
    alt: string;
    current: { x: number; y: number };
    baseline: Snapshot | null;
    drift: number;
    hasOverride: boolean;
  };
  onCapture: () => void;
}) {
  const drifted = !!row.baseline && row.drift >= 0.5;
  const status = !row.baseline
    ? { text: "No baseline", cls: "border-ink/15 text-muted-foreground" }
    : drifted
      ? { text: `Drift ${row.drift.toFixed(1)}`, cls: "border-amber-300 bg-amber-50 text-amber-900" }
      : { text: "Stable", cls: "border-emerald-300 bg-emerald-50 text-emerald-900" };

  return (
    <section
      className={
        "border p-5 " +
        (drifted ? "border-amber-300 bg-amber-50/30" : "border-ink/10")
      }
    >
      <header className="flex items-end justify-between flex-wrap gap-3 mb-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
            {row.handle}
            {row.hasOverride && (
              <span className="ml-2 text-emerald-700">· saved override</span>
            )}
          </p>
          <h2 className="font-serif text-xl mt-1">{row.title}</h2>
          <p className="text-[11px] font-mono text-muted-foreground mt-1">
            current {row.current.x.toFixed(1)}% / {row.current.y.toFixed(1)}%
            {row.baseline && (
              <>
                {" "}
                · baseline {row.baseline.x.toFixed(1)}% /{" "}
                {row.baseline.y.toFixed(1)}%
              </>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={
              "text-[10px] uppercase tracking-[0.2em] px-2 py-1 border " +
              status.cls
            }
          >
            {status.text}
          </span>
          <button
            onClick={onCapture}
            className="text-[10px] uppercase tracking-[0.2em] px-3 py-1.5 border border-ink/20 hover:bg-ink hover:text-canvas transition"
          >
            {row.baseline ? "Recapture" : "Capture baseline"}
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {BREAKPOINTS.map((bp) => (
          <div key={bp.id} className="space-y-2">
            <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
              {bp.label}
            </p>
            <div className="grid grid-cols-2 gap-2">
              <Crop
                tag="Before"
                src={row.src}
                alt={row.alt}
                ratio={bp.ratio}
                focal={row.baseline}
                drifted={drifted}
                isBefore
              />
              <Crop
                tag="After"
                src={row.src}
                alt={row.alt}
                ratio={bp.ratio}
                focal={row.current}
                drifted={drifted}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Crop({
  tag,
  src,
  alt,
  ratio,
  focal,
  drifted,
  isBefore,
}: {
  tag: string;
  src: string;
  alt: string;
  ratio: string;
  focal: { x: number; y: number } | null;
  drifted: boolean;
  isBefore?: boolean;
}) {
  const pos = focal ? `${focal.x}% ${focal.y}%` : "50% 40%";
  return (
    <figure className="space-y-1">
      <div
        className={
          "relative w-full bg-muted overflow-hidden " +
          (drifted && !isBefore ? "ring-2 ring-amber-400" : "")
        }
        style={{ aspectRatio: ratio }}
      >
        {focal ? (
          <img
            src={src}
            alt={alt}
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover"
            style={{ objectPosition: pos }}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
            No baseline
          </div>
        )}
      </div>
      <figcaption className="text-[9px] uppercase tracking-[0.25em] text-muted-foreground flex justify-between">
        <span>{tag}</span>
        {focal && <span className="font-mono normal-case tracking-normal">{pos}</span>}
      </figcaption>
    </figure>
  );
}
