import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { adminBeforeLoad } from "@/lib/admin-route-guard";
import { getShopifySyncStats } from "@/lib/shopify-sync-stats.functions";
import { refreshProductOrigins } from "@/lib/product-origins.functions";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { RefreshCw, MapPin } from "lucide-react";

export const Route = createFileRoute("/admin/shopify-sync")({
  beforeLoad: adminBeforeLoad,
  component: AdminShopifySync,
  head: () => ({
    meta: [
      { title: "Shopify Sync — Palace of Roman" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

function formatNum(n: number) {
  return new Intl.NumberFormat("en-US").format(n);
}

function formatTime(iso: string | null) {
  if (!iso) return "Never";
  const d = new Date(iso);
  const diffMs = Date.now() - d.getTime();
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return d.toLocaleString();
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <Card className="p-6">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-2 font-serif text-3xl tabular-nums">{value}</div>
      {hint ? <div className="mt-1 text-xs text-muted-foreground">{hint}</div> : null}
    </Card>
  );
}

function AdminShopifySync() {
  const queryClient = useQueryClient();
  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: ["admin", "shopify-sync-stats"],
    queryFn: () => getShopifySyncStats(),
    refetchInterval: 30_000,
    staleTime: 15_000,
  });

  const [originsResult, setOriginsResult] = useState<{
    pages: number;
    products: number;
    written: number;
  } | null>(null);

  const refreshOrigins = useMutation({
    mutationFn: () => refreshProductOrigins({ data: {} }),
    onSuccess: (res) => {
      setOriginsResult({
        pages: res.pages,
        products: res.products,
        written: res.written,
      });
      toast.success(
        `Ship-from origins refreshed — ${res.written} products across ${res.pages} pages.`,
      );
      // Bust the shared client-side cache so cards/PDP pick up new origins.
      queryClient.invalidateQueries({ queryKey: ["product-origins-map"] });
    },
    onError: (err: Error) => {
      toast.error("Failed to refresh ship-from origins.", {
        description: err.message,
      });
    },
  });

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <header className="mb-8 flex items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl">Shopify Sync</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Status of the BG catalog → Shopify product import & SKU mapping.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refreshOrigins.mutate()}
            disabled={refreshOrigins.isPending}
            title="Re-read each product's inventory locations from Shopify and recompute Ship-from (most-stock-wins)."
          >
            <MapPin
              className={`mr-2 h-4 w-4 ${refreshOrigins.isPending ? "animate-pulse" : ""}`}
            />
            {refreshOrigins.isPending ? "Refreshing origins…" : "Refresh ship-from origins"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </header>

      {originsResult ? (
        <Card className="mb-6 border-bronze/30 bg-bronze/5 p-4 text-sm">
          Origins updated: <strong>{originsResult.written}</strong> products written
          across <strong>{originsResult.pages}</strong> Shopify pages
          ({originsResult.products} scanned).
        </Card>
      ) : null}


      {error ? (
        <Card className="border-destructive p-6 text-sm text-destructive">
          {(error as Error).message}
        </Card>
      ) : null}

      {isLoading || !data ? (
        <div className="text-sm text-muted-foreground">Loading…</div>
      ) : (
        <div className="space-y-8">
          <section>
            <div className="mb-3 flex items-baseline justify-between">
              <h2 className="text-sm uppercase tracking-wider text-muted-foreground">
                Variant coverage
              </h2>
              <span className="text-xs text-muted-foreground">
                Last sync: {formatTime(data.lastSyncedAt)}
              </span>
            </div>
            <Card className="p-6">
              <div className="flex items-baseline justify-between">
                <div className="font-serif text-4xl tabular-nums">
                  {data.coveragePct.toFixed(1)}%
                </div>
                <div className="text-sm text-muted-foreground tabular-nums">
                  {formatNum(data.mappedSkus)} of {formatNum(data.bgVariants)} SKUs mapped
                </div>
              </div>
              <Progress value={data.coveragePct} className="mt-4 h-2" />
              <div className="mt-3 text-xs text-muted-foreground">
                {formatNum(data.unmappedVariants)} SKUs still pending — re-run{" "}
                <code className="rounded bg-muted px-1 py-0.5">
                  node scripts/shopify/sync-variant-map.mjs
                </code>{" "}
                after BG Importer adds more products.
              </div>
            </Card>
          </section>

          <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <Stat label="BG Products" value={formatNum(data.bgProducts)} hint="In source catalog" />
            <Stat
              label="Mapped Products"
              value={formatNum(data.mappedProducts)}
              hint={`${formatNum(data.unmappedProducts)} pending`}
            />
            <Stat label="BG Variants (SKUs)" value={formatNum(data.bgVariants)} />
            <Stat
              label="Available SKUs"
              value={formatNum(data.availableSkus)}
              hint="In stock right now"
            />
          </section>

          <section className="grid gap-6 md:grid-cols-2">
            <Card className="p-6">
              <h3 className="mb-4 text-sm uppercase tracking-wider text-muted-foreground">
                Top brands with missing products
              </h3>
              {data.topMissingBrands.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Every brand is fully mapped.
                </p>
              ) : (
                <ul className="divide-y">
                  {data.topMissingBrands.map((b) => (
                    <li
                      key={b.brand}
                      className="flex items-center justify-between py-2 text-sm"
                    >
                      <span>{b.brand}</span>
                      <span className="tabular-nums text-muted-foreground">
                        {formatNum(b.missing)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            <Card className="p-6">
              <h3 className="mb-4 text-sm uppercase tracking-wider text-muted-foreground">
                Recent sync activity
              </h3>
              {data.recentSyncs.length === 0 ? (
                <p className="text-sm text-muted-foreground">No syncs yet.</p>
              ) : (
                <ul className="divide-y">
                  {data.recentSyncs.map((r, i) => (
                    <li
                      key={`${r.product_handle ?? "—"}-${i}`}
                      className="flex items-center justify-between gap-4 py-2 text-sm"
                    >
                      <span className="truncate font-mono text-xs">
                        {r.product_handle ?? "—"}
                      </span>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {formatTime(r.synced_at)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </section>
        </div>
      )}
    </main>
  );
}
