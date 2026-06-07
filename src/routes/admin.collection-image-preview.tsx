// Admin preview: review every collection's current hero image and remap
// any handle to a custom URL (or revert to the bundled/static fallback)
// before publishing. Reads from Shopify + the live collection_images map,
// writes through `upsertCollectionImageOverride` (source: "manual").
//
// Sibling of /admin/collection-image-qa — same unprotected-by-obscurity
// pattern (noindex, unlinked). Lock down before public deploy.
import { createFileRoute, Link } from "@tanstack/react-router";
import { adminBeforeLoad } from "@/lib/admin-route-guard";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { fetchCollections, type ShopifyCollection } from "@/lib/shopify";
import {
  collectionImage,
  collectionImageAlt,
  collectionImageFocal,
  resolveCollectionImage,
  type CollectionImageSource,
} from "@/lib/collection-image";
import { getCollectionImageMap } from "@/lib/collection-image.functions";
import {
  upsertCollectionImageOverride,
  deleteCollectionImageOverride,
  syncCollectionImagesFromShopify,
} from "@/lib/collection-image-admin.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/collection-image-preview")({
  ssr: false,
  beforeLoad: adminBeforeLoad,
  component: AdminCollectionImagePreview,
  head: () => ({
    meta: [
      { title: "Collection Image Preview & Remap — Palace of Roman" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

type Row = {
  collection: ShopifyCollection;
  currentSrc: string;
  source: CollectionImageSource;
  topic: string;
  overrideUrl: string | null;
};

const SOURCE_LABEL: Record<CollectionImageSource, string> = {
  dynamic: "Live (DB)",
  handle: "Bundled",
  alias: "Aliased",
  rule: "Rule",
  default: "Default",
};

const SOURCE_TONE: Record<CollectionImageSource, string> = {
  dynamic: "border-emerald-200 text-emerald-900 bg-emerald-50",
  handle: "border-ink/15 text-ink/80 bg-canvas",
  alias: "border-sky-200 text-sky-900 bg-sky-50",
  rule: "border-amber-200 text-amber-900 bg-amber-50",
  default: "border-rose-200 text-rose-900 bg-rose-50",
};

function AdminCollectionImagePreview() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<"all" | "needs-attention" | "overridden">(
    "all",
  );
  const [search, setSearch] = useState("");

  const dynamicMapQ = useQuery({
    queryKey: ["collection-image-map"],
    queryFn: () => getCollectionImageMap(),
    staleTime: 60_000,
  });
  const collectionsQ = useQuery({
    queryKey: ["shopify-collections-admin"],
    queryFn: () => fetchCollections(250),
    staleTime: 60_000,
  });

  const dynamicMap = dynamicMapQ.data ?? {};
  const rows: Row[] = useMemo(() => {
    const cols = collectionsQ.data ?? [];
    return cols.map((c) => {
      const resolved = resolveCollectionImage({
        handle: c.handle,
        title: c.title,
        description: c.description,
        dynamicMap,
      });
      return {
        collection: c,
        currentSrc: resolved.src,
        source: resolved.source,
        topic: resolved.topic,
        overrideUrl: dynamicMap[c.handle] ?? null,
      };
    });
  }, [collectionsQ.data, dynamicMapQ.data]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows
      .filter((r) => {
        if (filter === "overridden" && !r.overrideUrl) return false;
        if (
          filter === "needs-attention" &&
          r.source !== "rule" &&
          r.source !== "default"
        )
          return false;
        if (q) {
          const hay = `${r.collection.handle} ${r.collection.title}`.toLowerCase();
          if (!hay.includes(q)) return false;
        }
        return true;
      })
      .sort((a, b) => {
        const score = (r: Row) =>
          r.source === "default" ? 0 : r.source === "rule" ? 1 : 2;
        return (
          score(a) - score(b) ||
          a.collection.title.localeCompare(b.collection.title)
        );
      });
  }, [rows, filter, search]);

  const counts = useMemo(() => {
    let overridden = 0;
    let needs = 0;
    for (const r of rows) {
      if (r.overrideUrl) overridden++;
      if (r.source === "rule" || r.source === "default") needs++;
    }
    return { total: rows.length, overridden, needs };
  }, [rows]);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["collection-image-map"] });
  };

  const saveMutation = useMutation({
    mutationFn: (vars: { handle: string; title: string | null; imageUrl: string }) =>
      upsertCollectionImageOverride({ data: vars }),
    onSuccess: (_d, v) => {
      toast.success(`Saved override for "${v.handle}"`);
      invalidate();
    },
    onError: (e) => toast.error(`Save failed: ${(e as Error).message}`),
  });

  const deleteMutation = useMutation({
    mutationFn: (handle: string) =>
      deleteCollectionImageOverride({ data: { handle } }),
    onSuccess: (_d, handle) => {
      toast.success(`Reverted "${handle}" to the bundled fallback`);
      invalidate();
    },
    onError: (e) => toast.error(`Revert failed: ${(e as Error).message}`),
  });

  const syncMutation = useMutation({
    mutationFn: () => syncCollectionImagesFromShopify({}),
    onSuccess: (r) => {
      toast.success(
        `Synced ${r.synced} of ${r.total} collections from Shopify` +
          (r.skippedManual ? ` · kept ${r.skippedManual} manual override${r.skippedManual === 1 ? "" : "s"}` : "") +
          (r.skippedNoImage ? ` · ${r.skippedNoImage} had no image` : ""),
      );
      invalidate();
    },
    onError: (e) => toast.error(`Sync failed: ${(e as Error).message}`),
  });

  const loading = collectionsQ.isLoading || dynamicMapQ.isLoading;
  const error = collectionsQ.error ?? dynamicMapQ.error;

  return (
    <main className="min-h-screen bg-canvas text-ink">
      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-12 md:py-16">
        <header className="mb-10">
          <p className="text-[10px] uppercase tracking-[0.4em] text-ink/60 mb-3">
            Admin · Internal
          </p>
          <h1 className="font-serif text-3xl md:text-5xl leading-[1.05] tracking-tight mb-3">
            Hero image preview &amp; remap
          </h1>
          <p className="text-ink/70 max-w-2xl">
            Review every collection's current hero, paste a replacement URL,
            and save. Saved overrides land in the live{" "}
            <code className="font-mono text-[12px]">collection_images</code>{" "}
            table and take effect immediately across the storefront and menu.
          </p>
          <p className="text-ink/60 text-sm mt-2">
            Sibling tool:{" "}
            <Link
              to="/admin/collection-image-qa"
              className="underline underline-offset-4"
            >
              semantic QA dashboard
            </Link>
            .
          </p>
        </header>

        <div className="grid grid-cols-3 gap-3 mb-6">
          <Summary label="Collections" value={counts.total} />
          <Summary label="Overridden" value={counts.overridden} tone="ok" />
          <Summary label="Needs attention" value={counts.needs} tone="warn" />
        </div>

        <div className="mb-8 flex flex-col sm:flex-row sm:items-center gap-3 border border-ink/15 bg-canvas px-4 py-3">
          <div className="flex-1">
            <p className="text-xs uppercase tracking-[0.2em] text-ink/60 mb-1">
              Initial Shopify sync
            </p>
            <p className="text-sm text-ink/70">
              Pull every Shopify collection's hero image into the live map.
              Manual overrides are preserved.
            </p>
          </div>
          <button
            type="button"
            onClick={() => syncMutation.mutate()}
            disabled={syncMutation.isPending}
            className="text-xs uppercase tracking-[0.2em] px-5 py-2.5 bg-ink text-canvas border border-ink hover:bg-ink/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {syncMutation.isPending ? "Syncing…" : "Sync from Shopify"}
          </button>
        </div>



        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-8">
          <div className="flex gap-2">
            {(
              [
                { key: "all", label: "All", n: counts.total },
                { key: "needs-attention", label: "Needs attention", n: counts.needs },
                { key: "overridden", label: "Overridden", n: counts.overridden },
              ] as const
            ).map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => setFilter(f.key)}
                className={
                  "text-xs uppercase tracking-[0.2em] px-4 py-2 border transition-colors " +
                  (filter === f.key
                    ? "bg-ink text-canvas border-ink"
                    : "bg-canvas text-ink border-ink/15 hover:border-ink/40")
                }
              >
                {f.label}
                <span className="ml-2 text-ink/40">{f.n}</span>
              </button>
            ))}
          </div>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search handle or title…"
            className="sm:ml-auto w-full sm:w-80 border border-ink/15 bg-canvas px-3 py-2 text-sm focus:outline-none focus:border-ink"
          />
        </div>

        {loading && <p className="text-ink/60">Loading collections…</p>}
        {error && (
          <p className="text-rose-700">
            Failed to load: {(error as Error).message}
          </p>
        )}
        {!loading && !error && visible.length === 0 && (
          <p className="text-ink/60">Nothing matches that filter.</p>
        )}

        <ul className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {visible.map((r) => (
            <RemapCard
              key={r.collection.handle}
              row={r}
              onSave={(url) =>
                saveMutation.mutate({
                  handle: r.collection.handle,
                  title: r.collection.title,
                  imageUrl: url,
                })
              }
              onRevert={() => deleteMutation.mutate(r.collection.handle)}
              isSaving={
                saveMutation.isPending &&
                saveMutation.variables?.handle === r.collection.handle
              }
              isReverting={
                deleteMutation.isPending &&
                deleteMutation.variables === r.collection.handle
              }
            />
          ))}
        </ul>
      </div>
    </main>
  );
}

function Summary({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: "ok" | "warn";
}) {
  const cls =
    tone === "ok"
      ? "border-emerald-200 bg-emerald-50"
      : tone === "warn"
        ? "border-amber-200 bg-amber-50"
        : "border-ink/15 bg-canvas";
  return (
    <div className={`border ${cls} px-5 py-4`}>
      <p className="text-[10px] uppercase tracking-[0.3em] text-ink/60">
        {label}
      </p>
      <p className="font-serif text-3xl mt-1">{value}</p>
    </div>
  );
}

function RemapCard({
  row,
  onSave,
  onRevert,
  isSaving,
  isReverting,
}: {
  row: Row;
  onSave: (url: string) => void;
  onRevert: () => void;
  isSaving: boolean;
  isReverting: boolean;
}) {
  const { collection: c, currentSrc, source, topic, overrideUrl } = row;
  const [draft, setDraft] = useState("");
  const [previewing, setPreviewing] = useState(false);

  // Live preview uses the draft URL when present, otherwise the current src.
  const previewSrc = previewing && draft.trim() ? draft.trim() : currentSrc;
  const focal = collectionImageFocal({ handle: c.handle, title: c.title });

  // Bundled fallback (ignores the dynamic map) — what the page will fall back
  // to if this override is reverted.
  const bundledSrc = collectionImage({
    handle: c.handle,
    title: c.title,
    description: c.description,
  });

  const canSave = /^https?:\/\//i.test(draft.trim());

  return (
    <li className="border border-ink/10 bg-canvas overflow-hidden flex flex-col">
      <div className="grid grid-cols-2 gap-px bg-ink/10">
        <Preview label="Current" src={currentSrc} focal={focal} handle={c.handle} title={c.title} />
        <Preview
          label={previewing && draft.trim() ? "Draft" : "After revert"}
          src={previewing && draft.trim() ? previewSrc : bundledSrc}
          focal={focal}
          handle={c.handle}
          title={c.title}
        />
      </div>

      <div className="p-5 flex-1 flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-ink/60">
              {c.handle}
            </p>
            <h2 className="font-serif text-xl leading-tight mt-1">{c.title}</h2>
          </div>
          <span
            className={
              "shrink-0 text-[10px] uppercase tracking-[0.2em] px-2.5 py-1 border " +
              SOURCE_TONE[source]
            }
            title={`Resolved via ${source} (topic: ${topic})`}
          >
            {SOURCE_LABEL[source]}
          </span>
        </div>

        {c.description && (
          <p className="text-sm text-ink/70 line-clamp-2">{c.description}</p>
        )}

        <div className="flex flex-col gap-2">
          <label
            htmlFor={`url-${c.handle}`}
            className="text-[10px] uppercase tracking-[0.3em] text-ink/60"
          >
            Replacement image URL
          </label>
          <input
            id={`url-${c.handle}`}
            type="url"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="https://cdn.shopify.com/…/hero.jpg"
            className="border border-ink/15 bg-canvas px-3 py-2 text-sm font-mono focus:outline-none focus:border-ink"
          />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={!canSave}
              onClick={() => setPreviewing((v) => !v)}
              className="text-xs uppercase tracking-[0.2em] px-3 py-2 border border-ink/20 hover:border-ink disabled:opacity-40"
            >
              {previewing ? "Hide preview" : "Preview"}
            </button>
            <button
              type="button"
              disabled={!canSave || isSaving}
              onClick={() => {
                onSave(draft.trim());
                setDraft("");
                setPreviewing(false);
              }}
              className="text-xs uppercase tracking-[0.2em] px-3 py-2 bg-ink text-canvas hover:opacity-90 disabled:opacity-40"
            >
              {isSaving ? "Saving…" : "Save override"}
            </button>
            {overrideUrl && (
              <button
                type="button"
                disabled={isReverting}
                onClick={onRevert}
                className="text-xs uppercase tracking-[0.2em] px-3 py-2 border border-rose-300 text-rose-700 hover:bg-rose-50 disabled:opacity-40"
              >
                {isReverting ? "Reverting…" : "Revert to bundled"}
              </button>
            )}
          </div>
        </div>

        {overrideUrl && (
          <p className="text-xs text-ink/60 font-mono break-all">
            Live: {overrideUrl}
          </p>
        )}

        <div className="mt-auto pt-2 flex gap-3 text-xs uppercase tracking-[0.2em]">
          <Link
            to="/collections/$handle"
            params={{ handle: c.handle }}
            className="underline underline-offset-4 hover:text-ink"
          >
            View on storefront
          </Link>
        </div>
      </div>
    </li>
  );
}

function Preview({
  label,
  src,
  focal,
  handle,
  title,
}: {
  label: string;
  src: string;
  focal: string;
  handle: string;
  title: string;
}) {
  return (
    <div className="aspect-[4/3] bg-muted overflow-hidden relative">
      <img
        src={src}
        alt={collectionImageAlt({ handle, title })}
        loading="lazy"
        style={{ objectPosition: focal }}
        className="absolute inset-0 w-full h-full object-cover"
      />
      <span className="absolute top-3 left-3 text-[10px] uppercase tracking-[0.2em] px-2.5 py-1 border border-ink/20 bg-canvas/80 backdrop-blur">
        {label}
      </span>
    </div>
  );
}
