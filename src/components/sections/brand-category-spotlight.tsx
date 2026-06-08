/**
 * BrandCategorySpotlight — renders an SEO-targeted H2 + 4-up product grid
 * on /brand/$vendor pages for high-opportunity long-tail keywords (e.g.
 * "moncler men jacket", "gucci men loafers"). See src/lib/brand-seo-categories.ts.
 *
 * Hides itself when the filtered query returns zero products so we never
 * ship an empty H2 (bad UX + an SEO negative signal).
 */
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { fetchProducts } from "@/lib/shopify";
import { ProductCard } from "@/components/product-card";
import type { BrandCategorySpotlight as Spotlight } from "@/lib/brand-seo-categories";

interface Props {
  vendorSlug: string;
  spotlight: Spotlight;
}

export function BrandCategorySpotlight({ vendorSlug, spotlight }: Props) {
  const { brand, eyebrow, h2, intro, ctaLabel, categoryQuery, keyword } = spotlight;

  const { data, isLoading } = useQuery({
    queryKey: ["brand-spotlight", brand, keyword],
    queryFn: () =>
      fetchProducts({
        first: 4,
        query: `vendor:"${brand}" AND ${categoryQuery} AND tag:Men AND available_for_sale:true`,
        sortKey: "BEST_SELLING",
      }),
    staleTime: 10 * 60_000,
  });

  if (!isLoading && (!data || data.length === 0)) return null;

  // Filtered shop URL routes through the catalog grid, preserving the sort + filter.
  const shopHref = `/brand/${vendorSlug}?sort=BEST_SELLING-false#${encodeURIComponent(
    keyword.replace(/\s+/g, "-"),
  )}`;

  return (
    <section
      className="border-t border-ink/10 bg-canvas py-section-sm md:py-16"
      data-spotlight={keyword}
      id={keyword.replace(/\s+/g, "-")}
    >
      <div className="max-w-screen-2xl mx-auto px-6 md:px-10">
        <header className="mb-8 max-w-[60ch]">
          <p className="text-[11px] uppercase tracking-[0.3em] text-bronze-deep">
            {eyebrow}
          </p>
          <h2 className="mt-3 font-serif text-3xl md:text-4xl tracking-tight text-ink">
            {h2}
          </h2>
          <p className="mt-4 text-sm md:text-base text-muted-foreground leading-relaxed">
            {intro}
          </p>
        </header>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-3 gap-y-10 md:gap-x-5">
          {isLoading
            ? Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-ink/5 animate-pulse"
                  style={{ aspectRatio: "3 / 4" }}
                  aria-hidden="true"
                />
              ))
            : data!.map((p, i) => (
                <ProductCard
                  key={p.node.id}
                  product={p}
                  surface={`brand-spotlight:${vendorSlug}`}
                  position={i}
                />
              ))}
        </div>

        <div className="mt-10 flex justify-center">
          <Link
            to="/brand/$vendor"
            params={{ vendor: vendorSlug }}
            search={{ sort: "BEST_SELLING-false" }}
            className="inline-flex items-center h-tap-target px-7 border border-ink text-ink text-[11px] uppercase tracking-[0.25em] hover:bg-ink hover:text-canvas transition-colors"
            aria-label={`${ctaLabel} — view the full ${brand} edit`}
          >
            {ctaLabel}
          </Link>
          <span className="sr-only">{shopHref}</span>
        </div>
      </div>
    </section>
  );
}
