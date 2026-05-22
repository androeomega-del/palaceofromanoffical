import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { fetchProducts, type ShopifyProduct } from "@/lib/shopify";
import { ProductCard } from "@/components/product-card";
import { computeScarcitySignal, type ScarcityTier } from "@/lib/scarcity-signal";
import { img } from "@/lib/editorial-library";

/**
 * /limited-finds — editorial landing page that curates current inventory by
 * scarcity tier. Real signals only (no fabricated counts). Each tier section
 * auto-hides when empty so the page never looks thin.
 *
 * SEO target: "rare designer pieces", "archive edition", "last piece luxury",
 * "limited availability designer". Canonical, indexable, share-friendly.
 */

const heroImage = img(7);
const ogImage = img(11);

export const Route = createFileRoute("/limited-finds")({
  head: () => ({
    meta: [
      { title: "Limited Finds — Rare & Archive Pieces · Palace of Roman" },
      {
        name: "description",
        content:
          "A curated edit of the rarest pieces currently in our boutique — final units, archive editions, and limited-availability designer styles. Once they ship, they return to the archive.",
      },
      { property: "og:title", content: "Limited Finds — Rare & Archive Designer Pieces" },
      {
        property: "og:description",
        content:
          "Final pieces, archive editions, and rare designer finds. Acquire before the allocation closes.",
      },
      { property: "og:url", content: "https://palaceofromanofficial.com/limited-finds" },
      { property: "og:image", content: `https://palaceofromanofficial.com${ogImage}` },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: `https://palaceofromanofficial.com${ogImage}` },
    ],
    links: [{ rel: "canonical", href: "https://palaceofromanofficial.com/limited-finds" }],
  }),
  component: LimitedFindsPage,
});

type TieredProduct = ShopifyProduct & { __tier: ScarcityTier };

function tierFor(p: ShopifyProduct): ScarcityTier {
  const variants = p.node.variants?.edges?.map((e) => e.node) ?? [];
  const availableCount = variants.filter((v) => v.availableForSale).length;
  const price = p.node.priceRange.minVariantPrice;
  const compareAt = p.node.compareAtPriceRange?.minVariantPrice;
  const onSale =
    !!compareAt && parseFloat(compareAt.amount) > parseFloat(price.amount);
  return computeScarcitySignal({
    availableCount,
    totalVariants: variants.length,
    priceUsd: parseFloat(price.amount),
    onSale,
  }).tier;
}

function LimitedFindsPage() {
  // Pull a broad pool of in-stock products, then tier client-side.
  // 100 is enough to surface 10–20 limited pieces in most catalog states.
  const { data, isLoading } = useQuery({
    queryKey: ["limited-finds", "pool"],
    queryFn: () => fetchProducts({ first: 100, sortKey: "BEST_SELLING" }),
    staleTime: 60_000,
  });

  const sectioned = useMemo(() => {
    const pool: ShopifyProduct[] = (data ?? []) as ShopifyProduct[];
    const tagged: TieredProduct[] = pool.map((p) => ({ ...p, __tier: tierFor(p) }));
    return {
      finalPiece: tagged.filter((p) => p.__tier === "finalPiece"),
      archive: tagged.filter((p) => p.__tier === "archive"),
      rareFind: tagged.filter((p) => p.__tier === "rareFind"),
      lastMarkdown: tagged.filter((p) => p.__tier === "lastMarkdown"),
      limited: tagged.filter((p) => p.__tier === "limited"),
    };
  }, [data]);

  const totalLimited =
    sectioned.finalPiece.length +
    sectioned.archive.length +
    sectioned.rareFind.length +
    sectioned.lastMarkdown.length +
    sectioned.limited.length;

  return (
    <main className="min-h-screen bg-canvas text-ink">
      {/* Hero — oversized editorial image, generous whitespace */}
      <section className="relative">
        <div className="grid lg:grid-cols-2 gap-0 min-h-[80vh]">
          <div className="relative bg-muted overflow-hidden order-2 lg:order-1">
            <img
              src={heroImage}
              alt="A curated edit of the rarest pieces currently at Palace of Roman"
              className="absolute inset-0 w-full h-full object-cover"
              loading="eager"
            />
          </div>
          <div className="flex items-center order-1 lg:order-2 px-6 py-20 md:px-16 lg:py-32">
            <div className="max-w-xl">
              <p className="text-[10px] uppercase tracking-[0.4em] text-bronze mb-8">
                The Reserve · Updated Weekly
              </p>
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-serif leading-[1.05] mb-10 text-balance">
                Limited Finds
              </h1>
              <p className="text-base md:text-lg leading-relaxed text-muted-foreground mb-6">
                A small, evolving edit of the rarest pieces currently in our
                boutique — final units across the size run, archive editions
                from closed seasonal allocations, and one-of-a-few
                colourways from the maisons we work with.
              </p>
              <p className="text-base md:text-lg leading-relaxed text-muted-foreground mb-10">
                These pieces move quickly. When the last unit ships, the
                piece returns to the archive and a replacement run in the
                exact same fabric and colour is rarely confirmed.
              </p>
              <div className="text-[10px] uppercase tracking-[0.3em] text-ink/60">
                {isLoading ? "Curating the reserve…" : `${totalLimited} pieces · curated this week`}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Sections — auto-hide when empty so the page never looks thin */}
      <div className="px-6 md:px-16 py-20 md:py-32 space-y-32 md:space-y-40">
        <TierSection
          eyebrow="Final unit"
          title="Final Pieces"
          intro="A single unit remains across every size in our partner inventory. Replenishment of the exact colourway is not confirmed."
          products={sectioned.finalPiece}
          columns="grid-cols-1 md:grid-cols-2"
          isLoading={isLoading}
        />

        <TierSection
          eyebrow="High-value allocation"
          title="Archive Editions"
          intro="High-ticket pieces that rarely re-stock in the same fabric and colour. Acquire while the size run is intact."
          products={sectioned.archive}
          columns="grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
          isLoading={isLoading}
        />

        <TierSection
          eyebrow="Reserve allocation"
          title="Rare Finds"
          intro="Two to three pieces remain at our distributor. Sizes have been selling through over the past two weeks."
          products={sectioned.rareFind}
          columns="grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
          isLoading={isLoading}
        />

        <TierSection
          eyebrow="Markdown closing"
          title="Last at this Price"
          intro="The remaining units at the revised price. Once they ship, the piece returns to full retail or sells through entirely."
          products={sectioned.lastMarkdown}
          columns="grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
          isLoading={isLoading}
        />

        <TierSection
          eyebrow="Short run"
          title="Limited Availability"
          intro="A short remaining run across sizes. Pieces in this tier typically sell out before re-supply windows open."
          products={sectioned.limited}
          columns="grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
          isLoading={isLoading}
        />

        {/* Empty state */}
        {!isLoading && totalLimited === 0 && (
          <div className="text-center py-20">
            <p className="text-[10px] uppercase tracking-[0.3em] text-bronze mb-6">
              The Reserve is fully stocked
            </p>
            <h2 className="text-3xl md:text-4xl font-serif mb-6">
              No limited pieces this week
            </h2>
            <p className="text-base text-muted-foreground max-w-md mx-auto mb-10">
              Our partner inventory is healthy across the catalog. Browse the
              full boutique or check back as the week progresses.
            </p>
            <Link
              to="/shop"
              className="inline-block px-8 py-4 bg-ink text-canvas text-[10px] uppercase tracking-[0.3em] hover:bg-bronze transition-colors"
            >
              Enter the boutique
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}

function TierSection({
  eyebrow,
  title,
  intro,
  products,
  columns,
  isLoading,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  products: TieredProduct[];
  columns: string;
  isLoading: boolean;
}) {
  if (!isLoading && products.length === 0) return null;
  return (
    <section>
      <div className="max-w-2xl mb-12 md:mb-16">
        <p className="text-[10px] uppercase tracking-[0.4em] text-bronze mb-6">
          {eyebrow} · {products.length} {products.length === 1 ? "piece" : "pieces"}
        </p>
        <h2 className="text-3xl md:text-5xl font-serif mb-6 text-balance">{title}</h2>
        <p className="text-base text-muted-foreground leading-relaxed">{intro}</p>
      </div>
      {isLoading ? (
        <div className={`grid ${columns} gap-x-6 gap-y-12`}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="aspect-[4/5] bg-muted animate-pulse" />
          ))}
        </div>
      ) : (
        <div className={`grid ${columns} gap-x-6 gap-y-12 md:gap-y-16`}>
          {products.map((p) => (
            <ProductCard key={p.node.id} product={p} />
          ))}
        </div>
      )}
    </section>
  );
}
