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
// CTA renders as a plain anchor (not <Link/>) so callers can pass arbitrary
// URLs with query strings (e.g. /shop?gender=Men&sort=BEST_SELLING-false)
// without fighting TanStack Router's typed route paths. A full navigation
// into /shop is preferable anyway — resets scroll, lands on a fresh grid.
import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import { ProductCard } from "@/components/product-card";
import { useRailImpression } from "@/hooks/use-rail-impression";
import type { ShopifyProduct } from "@/lib/shopify";

// Loose at the prop boundary so any `queryOptions(...)` factory whose
// queryFn resolves to ShopifyProduct[] is assignable, regardless of the
// exact queryKey tuple shape. Keeps presets type-clean without forcing
// them to widen their own keys.
type ProductRailQueryOptions = UseQueryOptions<
  ShopifyProduct[],
  Error,
  ShopifyProduct[],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  any
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
  /**
   * Analytics surface id — `rail:<name>` (lowercase kebab). Required for
   * every rail preset so cross-surface analytics stay consistent from day 1.
   */
  surface: string;
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
  surface,
}: ProductRailProps) {
  const { data, isLoading } = useQuery(queryOptions);
  const railRef = useRailImpression(surface, data?.[0]?.node.handle);

  if (!isLoading && hideWhenEmpty && (!data || data.length === 0)) return null;

  const gridCols = columns === 3 ? "lg:grid-cols-3" : "lg:grid-cols-4";
  const skeletonCount = columns;

  return (
    <section
      ref={railRef as React.RefObject<HTMLElement>}
      data-rail-surface={surface}
      className="py-section-sm md:py-16 bg-canvas"
    >
      <div className="max-w-screen-2xl mx-auto px-5 md:px-10">
        <header className="mb-8">
          <p className="text-eyebrow uppercase text-bronze-deep">
            {eyebrow}
          </p>
          <h2 className="mt-tight font-serif text-subhead-md md:text-subhead-lg tracking-subhead-open text-ink">
            {title}
          </h2>
        </header>

        <div
          className={`flex gap-x-3 overflow-x-auto snap-x snap-mandatory pb-2 -mx-5 px-5 md:mx-0 md:px-0 md:pb-0 md:overflow-visible md:snap-none md:grid md:grid-cols-2 ${gridCols} md:gap-x-5 md:gap-y-8 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden`}
        >
          {isLoading
            ? Array.from({ length: skeletonCount }).map((_, i) => (
                <div
                  key={i}
                  className="bg-ink/5 animate-pulse shrink-0 basis-[72%] snap-start md:basis-auto md:shrink"
                  style={{ aspectRatio: skeletonAspect.replace("/", " / ") }}
                  aria-hidden="true"
                />
              ))
            : data?.map((p, i) => (
                <div
                  key={p.node.id}
                  className="shrink-0 basis-[72%] snap-start md:basis-auto md:shrink"
                >
                  <ProductCard product={p} surface={surface} position={i} />
                </div>
              ))}
        </div>

        <div className="mt-10 flex justify-center">
          <a
            href={ctaTo}
            className="inline-flex items-center h-tap-target px-7 border border-ink text-ink text-cta-lg uppercase hover:bg-ink hover:text-canvas transition-colors"
          >
            {ctaLabel}
          </a>
        </div>
      </div>
    </section>
  );
}
