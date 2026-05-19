import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { fetchCollections, type ShopifyCollection } from "@/lib/shopify";
import {
  collectionImageAlt,
  collectionImageFocal,
  qaCollectionImage,
  resolveCollectionImage,
  type CollectionImageQa,
  type QaStatus,
} from "@/lib/collection-image";
import { getCollectionImageMap } from "@/lib/collection-image.functions";

export const Route = createFileRoute("/admin/collection-image-qa")({
  component: AdminCollectionImageQa,
  head: () => ({
    meta: [
      { title: "Collection Image QA — Palace of Roman" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

type Row = {
  collection: ShopifyCollection;
  qa: CollectionImageQa;
  imageSrc: string;
};

const STATUS_FILTERS: { key: "all" | QaStatus; label: string }[] = [
  { key: "all", label: "All" },
  { key: "mismatch", label: "Mismatch" },
  { key: "review", label: "Review" },
  { key: "ok", label: "OK" },
];

const STATUS_STYLES: Record<QaStatus, string> = {
  ok: "bg-emerald-100 text-emerald-900 border-emerald-200",
  review: "bg-amber-100 text-amber-900 border-amber-200",
  mismatch: "bg-rose-100 text-rose-900 border-rose-200",
};

function AdminCollectionImageQa() {
  const [filter, setFilter] = useState<"all" | QaStatus>("all");

  const dynamicMapQ = useQuery({
    queryKey: ["collection-image-map"],
    queryFn: () => getCollectionImageMap(),
    staleTime: 5 * 60_000,
  });
  const collectionsQ = useQuery({
    queryKey: ["shopify-collections-qa"],
    queryFn: () => fetchCollections(250),
    staleTime: 60_000,
  });

  const rows: Row[] = useMemo(() => {
    const cols = collectionsQ.data ?? [];
    const dynamicMap = dynamicMapQ.data ?? {};
    return cols.map((c) => {
      const qa = qaCollectionImage({
        handle: c.handle,
        title: c.title,
        description: c.description,
        dynamicMap,
      });
      const resolved = resolveCollectionImage({
        handle: c.handle,
        title: c.title,
        description: c.description,
        dynamicMap,
      });
      return { collection: c, qa, imageSrc: resolved.src };
    });
  }, [collectionsQ.data, dynamicMapQ.data]);

  const counts = useMemo(() => {
    const c = { ok: 0, review: 0, mismatch: 0, total: rows.length };
    for (const r of rows) c[r.qa.status]++;
    return c;
  }, [rows]);

  const visible = useMemo(() => {
    if (filter === "all") {
      // Sort: mismatch → review → ok, alphabetical within
      const order: Record<QaStatus, number> = { mismatch: 0, review: 1, ok: 2 };
      return [...rows].sort(
        (a, b) =>
          order[a.qa.status] - order[b.qa.status] ||
          a.collection.title.localeCompare(b.collection.title),
      );
    }
    return rows
      .filter((r) => r.qa.status === filter)
      .sort((a, b) => a.collection.title.localeCompare(b.collection.title));
  }, [rows, filter]);

  const loading = collectionsQ.isLoading || dynamicMapQ.isLoading;
  const error = collectionsQ.error ?? dynamicMapQ.error;

  return (
    <main className="min-h-screen bg-canvas text-ink">
      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-12 md:py-16">
        <header className="mb-10">
          <p className="text-[10px] uppercase tracking-[0.4em] text-ink/60 mb-3">
            Admin · Internal QA
          </p>
          <h1 className="font-serif text-3xl md:text-5xl leading-[1.05] tracking-tight mb-3">
            Collection image QA
          </h1>
          <p className="text-ink/70 max-w-2xl">
            Audits every Shopify collection against its resolved hero image and
            flags any whose image doesn't semantically match the collection's
            title or description.
          </p>
        </header>

        {/* Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          <SummaryCard label="Total" value={counts.total} tone="neutral" />
          <SummaryCard label="Mismatch" value={counts.mismatch} tone="mismatch" />
          <SummaryCard label="Review" value={counts.review} tone="review" />
          <SummaryCard label="OK" value={counts.ok} tone="ok" />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-8">
          {STATUS_FILTERS.map((f) => {
            const isActive = filter === f.key;
            const n =
              f.key === "all"
                ? counts.total
                : counts[f.key as QaStatus];
            return (
              <button
                key={f.key}
                type="button"
                onClick={() => setFilter(f.key)}
                className={
                  "text-xs uppercase tracking-[0.2em] px-4 py-2 border transition-colors " +
                  (isActive
                    ? "bg-ink text-canvas border-ink"
                    : "bg-canvas text-ink border-ink/15 hover:border-ink/40")
                }
              >
                {f.label}
                <span className="ml-2 text-ink/40">{n}</span>
              </button>
            );
          })}
        </div>

        {loading && <p className="text-ink/60">Loading collections…</p>}
        {error && (
          <p className="text-rose-700">
            Failed to load: {(error as Error).message}
          </p>
        )}

        {!loading && !error && visible.length === 0 && (
          <p className="text-ink/60">Nothing in this bucket. 🎉</p>
        )}

        <ul className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {visible.map((r) => (
            <QaCard key={r.collection.handle} row={r} />
          ))}
        </ul>
      </div>
    </main>
  );
}

function SummaryCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "ok" | "review" | "mismatch" | "neutral";
}) {
  const toneClass =
    tone === "ok"
      ? "border-emerald-200 bg-emerald-50"
      : tone === "review"
        ? "border-amber-200 bg-amber-50"
        : tone === "mismatch"
          ? "border-rose-200 bg-rose-50"
          : "border-ink/15 bg-canvas";
  return (
    <div className={`border ${toneClass} px-5 py-4`}>
      <p className="text-[10px] uppercase tracking-[0.3em] text-ink/60">{label}</p>
      <p className="font-serif text-3xl mt-1">{value}</p>
    </div>
  );
}

function QaCard({ row }: { row: Row }) {
  const { collection: c, qa, imageSrc } = row;
  return (
    <li className="border border-ink/10 bg-canvas overflow-hidden flex flex-col">
      <div className="aspect-[4/3] bg-muted overflow-hidden relative">
        <img
          src={imageSrc}
          alt={collectionImageAlt({ handle: c.handle, title: c.title, description: c.description })}
          loading="lazy"
          style={{ objectPosition: collectionImageFocal({ handle: c.handle, title: c.title, imageWidth: c.image?.width ?? null, imageHeight: c.image?.height ?? null }) }}
          className="absolute inset-0 w-full h-full object-cover"
        />
        <span
          className={
            "absolute top-3 left-3 text-[10px] uppercase tracking-[0.2em] px-2.5 py-1 border " +
            STATUS_STYLES[qa.status]
          }
        >
          {qa.status}
        </span>
      </div>
      <div className="p-5 flex-1 flex flex-col gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.3em] text-ink/60">
            {c.handle}
          </p>
          <h2 className="font-serif text-xl leading-tight mt-1">{c.title}</h2>
        </div>
        {c.description && (
          <p className="text-sm text-ink/70 line-clamp-3">{c.description}</p>
        )}
        <dl className="text-xs grid grid-cols-[auto,1fr] gap-x-3 gap-y-1 text-ink/70 mt-1">
          <dt className="text-ink/50">Image topic</dt>
          <dd>{qa.imageTopic}</dd>
          <dt className="text-ink/50">Source</dt>
          <dd>{qa.source}</dd>
          <dt className="text-ink/50">Gender</dt>
          <dd>{qa.collectionGender ?? "—"}</dd>
        </dl>
        <p className="text-sm text-ink/80">{qa.reason}</p>
        {qa.suggestion && (
          <p className="text-sm text-ink/60 italic">→ {qa.suggestion}</p>
        )}
        <div className="mt-auto pt-2 flex gap-3 text-xs uppercase tracking-[0.2em]">
          <Link
            to="/collections/$handle"
            params={{ handle: c.handle }}
            className="underline underline-offset-4 hover:text-ink"
          >
            View collection
          </Link>
        </div>
      </div>
    </li>
  );
}
