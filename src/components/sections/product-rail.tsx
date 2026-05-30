/**
 * ProductRail — single owner of editorial product-rail render states.
 *
 * Pure presentation + Query subscription. Knows nothing about Shopify,
 * sort keys, or dept tags — those live in the queryOptions factory the
 * caller passes in (see src/lib/rails/queries.ts).
 *
 * Responsible for: header (eyebrow + title), loading skeleton, populated
 * grid, empty-state hide policy, and the trailing CTA. Anything that
 * differs per surface (copy, columns, skeleton aspect, hide-when-empty,
 * CTA target/label) is a prop. Anything that's the same on every rail
 * (spacing, typography scale, divider rhythm) stays inlined.
 */
import { Link } from "@tanstack/react-router";
import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import { ProductCard } from "@/components/product-card";
import type { ShopifyProduct } from "@/lib/shopify";

type ProductRailQueryOptions = UseQueryOptions<
  ShopifyProduct[],
  Error,
  ShopifyProduct[],
  readonly unknown[]
>;

export interface ProductRailProps {
  /** TanStack `queryOptions` returned from a factory (see src/lib/rails/queries.ts). */
  queryOptions: ProductRailQueryOptions;
  eyebrow: string;
  title: string;
  ctaTo: string;
  ctaLabel?: string;
  /** Desktop columns. Mobile is always 2-up. Default 4. */
  columns?: 3 | 4;
  /** Aspect ratio for skeleton placeholders, e.g. "3/4". Default "3/4". */
  skeletonAspect?: string;
  /** Hide the entire section when the query resolves with zero products. Default true. */
  hideWhenEmpty?: boolean;
}

export function ProductRail({
  queryOptions,
  eyebrow,
  title,
  ctaTo,
  ctaLabel = "Shop Now",
  columns = 4,
  skeletonAspect = "3/4",
  hideWhenEmpty = true,
}: ProductRailProps) {
  const { data, isLoading } = useQuery(queryOptions);

  if (!isLoading && hideWhenEmpty && (!data || data.length === 0)) return null;

  const gridCols = columns === 3 ? "lg:grid-cols-3" : "lg:grid-cols-4";
  const skeletonCount = columns;

  return (
    <section className="py-10 md:py-16 bg-canvas">
      <div className="max-w-screen-2xl mx-auto px-5 md:px-10">
        <header className="mb-8">
          <p className="text-[11px] uppercase tracking-[0.32em] text-bronze-deep">
            {eyebrow}
          </p>
          <h2 className="mt-2 font-serif text-2xl md:text-3xl tracking-[0.04em] text-ink">
            {title}
          </h2>
        </header>

        <div className={`grid grid-cols-2 ${gridCols} gap-x-3 gap-y-8 md:gap-x-5`}>
          {isLoading
            ? Array.from({ length: skeletonCount }).map((_, i) => (
                <div
                  key={i}
                  className="bg-ink/5 animate-pulse"
                  style={{ aspectRatio: skeletonAspect.replace("/", " / ") }}
                  aria-hidden="true"
                />
              ))
            : data?.map((p) => <ProductCard key={p.node.id} product={p} />)}
        </div>

        <div className="mt-10 flex justify-center">
          <Link
            to={ctaTo}
            className="inline-flex items-center h-11 px-7 border border-ink text-ink text-[11px] uppercase tracking-[0.3em] hover:bg-ink hover:text-canvas transition-colors"
          >
            {ctaLabel}
          </Link>
        </div>
      </div>
    </section>
  );
}
