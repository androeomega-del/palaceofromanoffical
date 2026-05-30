/**
 * New This Week — 4-product editorial rail.
 *
 * Farfetch reference: "New in: handpicked daily from the world's best brands
 * and boutiques" — four cards with a "New Season" eyebrow and a Shop Now CTA.
 * Pulls live Shopify products sorted by CREATED_AT desc, scoped to the dept
 * (Women / Men) via tag query.
 */
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { fetchProducts } from "@/lib/shopify";
import { ProductCard } from "@/components/product-card";

export function NewThisWeekRail({
  dept = "Women",
  ctaTo = "/collections/new-arrivals",
}: {
  dept?: "Women" | "Men";
  ctaTo?: string;
}) {
  const query = `tag:${dept}`;
  const { data, isLoading } = useQuery({
    queryKey: ["section-new-this-week", dept],
    queryFn: () =>
      fetchProducts({ first: 4, query, sortKey: "CREATED_AT", reverse: true }),
    staleTime: 5 * 60_000,
  });

  if (!isLoading && (!data || data.length === 0)) return null;

  return (
    <section className="py-10 md:py-16 bg-canvas">
      <div className="max-w-screen-2xl mx-auto px-5 md:px-10">
        <header className="mb-8">
          <p className="text-[11px] uppercase tracking-[0.32em] text-bronze">
            New Season
          </p>
          <h2 className="mt-2 font-serif text-2xl md:text-3xl tracking-[0.04em] text-ink">
            New this week — handpicked from the maisons
          </h2>
        </header>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-3 gap-y-8 md:gap-x-5">
          {isLoading
            ? Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="aspect-[3/4] bg-ink/5 animate-pulse"
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
            Shop New In
          </Link>
        </div>
      </div>
    </section>
  );
}
