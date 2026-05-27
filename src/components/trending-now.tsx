import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Flame } from "lucide-react";
import { getTrendingHandles } from "@/lib/trending.functions";
import { ProductCard } from "@/components/product-card";

/**
 * "Trending This Week" — data-driven rail powered by aggregated
 * `interaction_events` + `cart_events`. Hidden until the signal volume
 * crosses the server-side minimum (so it never renders a sparse/biased
 * edit). When live, links to a curated subset and updates as shoppers
 * actually engage with pieces.
 */
export function TrendingNowRail() {
  const fetchTrending = useServerFn(getTrendingHandles);
  const { data, isLoading } = useQuery({
    queryKey: ["trending-handles", "v1"],
    queryFn: () => fetchTrending(),
    staleTime: 10 * 60 * 1000, // 10 minutes — trending shifts slowly
    refetchOnWindowFocus: false,
  });

  // Hide the rail entirely if we don't have enough signal yet, or on
  // server error. The homepage continues to render the curated rails
  // already in place; this one only joins the lineup once data justifies it.
  // Hide the rail entirely if we don't have enough signal yet, or on
  // server error. The homepage continues to render the curated rails
  // already in place; this one only joins the lineup once data justifies it.
  // Minimum of 3 — a sparse 1-card row in a 4-col grid reads as broken.
  if (isLoading) return null;
  if (!data || !data.ok) return null;
  if (data.products.length < 3) return null;

  return (
    <section
      className="px-6 py-20 md:py-24 bg-canvas border-t border-ink/5"
      data-testid="trending-now"
    >
      <div className="max-w-screen-2xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 md:mb-12">
          <div>
            <p className="flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-bronze mb-3">
              <Flame className="w-3.5 h-3.5" strokeWidth={1.5} />
              Trending This Week
            </p>
            <h2 className="text-3xl md:text-4xl font-serif max-w-[24ch]">
              What the boutique is watching now.
            </h2>
            <p className="mt-3 text-xs md:text-sm text-muted-foreground italic max-w-[55ch]">
              Ranked by real shopper behaviour over the past {data.windowDays} days
              — saves, views, and cart adds across the floor.
            </p>
          </div>
          <Link
            to="/shop"
            className="text-[11px] uppercase tracking-[0.25em] text-ink border-b border-bronze/40 hover:text-bronze hover:border-bronze transition-colors pb-0.5 self-start md:self-auto"
          >
            Shop everything →
          </Link>
        </div>
        <div
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-12"
          data-testid="trending-grid"
        >
          {data.products.slice(0, 8).map((p) => (
            <ProductCard key={p.node.id} product={p} />
          ))}
        </div>
      </div>
    </section>
  );
}
