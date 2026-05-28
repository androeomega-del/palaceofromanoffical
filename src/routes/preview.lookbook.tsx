import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EditorialHotspots, type Hotspot } from "@/components/editorial-hotspots";
import { getLookbookForSurface } from "@/lib/lookbook-hotspots.functions";

/**
 * Public preview mode for a single lookbook surface.
 *
 * Renders the live DB record for a (surface_kind, surface_slug) — image +
 * hotspots — with zero caching so admins/stakeholders can validate hotspot
 * fixes immediately, without waiting for a redeploy. Public route (no auth)
 * so the link can be shared, but noindex to keep it out of search.
 *
 * URL: /preview/lookbook?kind=homepage&slug=editorial-may-2026[&chapter=hero]
 */

const searchSchema = z.object({
  kind: z.string().min(1).max(64).optional(),
  slug: z.string().min(1).max(255).optional(),
  chapter: z.string().min(1).max(255).optional(),
  aspect: z.string().min(1).max(16).optional(),
});

export const Route = createFileRoute("/preview/lookbook")({
  validateSearch: (search) => searchSchema.parse(search),
  component: PreviewLookbookPage,
  head: () => ({
    meta: [
      { title: "Lookbook Preview — Palace of Roman" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

function PreviewLookbookPage() {
  const { kind, slug, chapter, aspect } = Route.useSearch();

  if (!kind || !slug) {
    return <UsageScreen />;
  }

  return (
    <main className="min-h-screen bg-canvas px-6 py-10">
      <div className="max-w-5xl mx-auto">
        <Header kind={kind} slug={slug} chapter={chapter} />
        <PreviewBody kind={kind} slug={slug} chapter={chapter} aspect={aspect} />
      </div>
    </main>
  );
}

function Header({
  kind,
  slug,
  chapter,
}: {
  kind: string;
  slug: string;
  chapter?: string;
}) {
  const qc = useQueryClient();
  const refresh = () => {
    qc.invalidateQueries({
      queryKey: ["lookbook-preview", kind, slug, chapter ?? null],
    });
  };
  return (
    <div className="mb-6 flex items-end justify-between gap-4">
      <div>
        <div className="text-[10px] uppercase tracking-[0.4em] text-bronze mb-2">
          Preview · live DB
        </div>
        <h1 className="font-serif text-3xl">Lookbook surface</h1>
        <div className="mt-2 flex flex-wrap gap-2 text-xs">
          <Badge variant="secondary">kind: {kind}</Badge>
          <Badge variant="secondary">slug: {slug}</Badge>
          {chapter && <Badge variant="secondary">chapter: {chapter}</Badge>}
        </div>
      </div>
      <Button variant="outline" size="sm" onClick={refresh}>
        <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
        Refresh
      </Button>
    </div>
  );
}

function PreviewBody({
  kind,
  slug,
  chapter,
  aspect,
}: {
  kind: string;
  slug: string;
  chapter?: string;
  aspect?: string;
}) {
  const fetcher = useServerFn(getLookbookForSurface);
  const { data, isLoading, isFetching, error } = useQuery({
    queryKey: ["lookbook-preview", kind, slug, chapter ?? null],
    queryFn: () =>
      fetcher({
        data: {
          surface_kind: kind,
          surface_slug: slug,
          chapter_key: chapter,
        },
      }),
    // Preview mode: never cache, always refetch on mount.
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });

  if (isLoading) {
    return (
      <div className="py-20 text-center">
        <Loader2 className="h-6 w-6 animate-spin mx-auto text-bronze" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <p className="text-sm text-destructive">
          Failed to load: {error instanceof Error ? error.message : String(error)}
        </p>
      </Card>
    );
  }

  if (!data?.image) {
    return (
      <Card className="p-8 text-center">
        <p className="text-sm text-muted-foreground">
          No DB record found for this surface.
        </p>
        <p className="text-xs text-muted-foreground mt-2">
          Seed or create one in the admin tool, then refresh.
        </p>
        <Link
          to="/admin/lookbook-hotspots"
          className="text-xs underline text-bronze mt-3 inline-block"
        >
          Open hotspot admin →
        </Link>
      </Card>
    );
  }

  const spots: Hotspot[] = data.hotspots.map((h) => ({
    x: Number(h.x),
    y: Number(h.y),
    handle: h.product_handle,
    label: h.label ?? undefined,
  }));

  return (
    <div className="space-y-4">
      <EditorialHotspots
        src={data.image.image_url}
        alt={data.image.alt_text ?? ""}
        hotspots={spots}
        aspect={aspect ?? "4/5"}
      />
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="text-[10px] uppercase tracking-[0.3em] text-bronze">
            {spots.length} hotspot{spots.length === 1 ? "" : "s"}
          </div>
          {isFetching && (
            <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
          )}
        </div>
        {spots.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            No hotspots on this image yet.
          </p>
        ) : (
          <ul className="text-xs space-y-1">
            {spots.map((h, i) => (
              <li key={i} className="font-mono text-muted-foreground">
                ({h.x.toFixed(1)}%, {h.y.toFixed(1)}%) → {h.handle}
                {h.label ? ` — ${h.label}` : ""}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

function UsageScreen() {
  return (
    <main className="min-h-screen bg-canvas px-6 py-12">
      <div className="max-w-2xl mx-auto">
        <h1 className="font-serif text-3xl">Lookbook Preview</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Render any (surface_kind, surface_slug) live from the database — no
          redeploy needed.
        </p>
        <Card className="p-5 mt-6 space-y-3 text-sm">
          <div>
            <div className="text-[10px] uppercase tracking-[0.3em] text-bronze">
              Required search params
            </div>
            <ul className="mt-2 font-mono text-xs space-y-1">
              <li>
                <strong>kind</strong> — surface_kind (e.g. <code>homepage</code>,
                <code> editorial</code>, <code>themed-edit</code>)
              </li>
              <li>
                <strong>slug</strong> — surface_slug
              </li>
              <li className="text-muted-foreground">
                <strong>chapter</strong> — optional chapter_key
              </li>
              <li className="text-muted-foreground">
                <strong>aspect</strong> — optional CSS aspect, default{" "}
                <code>4/5</code>
              </li>
            </ul>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-[0.3em] text-bronze">
              Example
            </div>
            <code className="block mt-2 text-xs break-all">
              /preview/lookbook?kind=homepage&slug=editorial-may-2026
            </code>
          </div>
        </Card>
        <Link
          to="/admin/lookbook-hotspots"
          className="text-xs underline text-bronze mt-6 inline-block"
        >
          ← Hotspot admin
        </Link>
      </div>
    </main>
  );
}
