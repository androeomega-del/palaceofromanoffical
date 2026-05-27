/**
 * RecentlyViewedRail — horizontal scroll of the shopper's last-viewed pieces.
 * Reads handles from `recently-viewed-store` (localStorage), fetches the
 * corresponding live products from Shopify in one query, excludes the
 * currently-viewed handle, and renders the standard ProductCard.
 *
 * Renders nothing if the shopper has no prior history (or only the current
 * product is in history). Quietly self-hides — no empty state.
 */
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRef } from "react";
import { useRecentlyViewedStore } from "@/stores/recently-viewed-store";
import { fetchProducts, type ShopifyProduct } from "@/lib/shopify";
import { ProductCard } from "@/components/product-card";

interface Props {
  /** Handle of the product currently being viewed (excluded from the rail). */
  excludeHandle?: string;
  /** Max items to display. Defaults to 8. */
  limit?: number;
}

export function RecentlyViewedRail({ excludeHandle, limit = 8 }: Props) {
  const items = useRecentlyViewedStore((s) => s.items);
  const [products, setProducts] = useState<ShopifyProduct[]>([]);
  const trackRef = useRef<HTMLDivElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  // Compute eligible handles (exclude current, dedupe, cap to limit).
  const handles = items
    .map((i) => i.handle)
    .filter((h) => h && h !== excludeHandle)
    .slice(0, limit);

  useEffect(() => {
    if (handles.length === 0) {
      setProducts([]);
      return;
    }
    let cancelled = false;
    // Build OR query across handles — single Storefront request.
    const query = handles.map((h) => `handle:${h}`).join(" OR ");
    fetchProducts({ first: Math.max(handles.length, 4), query })
      .then((edges) => {
        if (cancelled) return;
        // Re-order to match the shopper's view history (most recent first).
        const order = new Map(handles.map((h, i) => [h, i]));
        const sorted = [...edges].sort(
          (a, b) =>
            (order.get(a.node.handle) ?? 99) - (order.get(b.node.handle) ?? 99),
        );
        setProducts(sorted);
      })
      .catch(() => {
        if (!cancelled) setProducts([]);
      });
    return () => {
      cancelled = true;
    };
    // handles is derived from items + excludeHandle; depend on its JSON shape.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items.length, excludeHandle, limit]);

  const updateEdges = () => {
    const el = trackRef.current;
    if (!el) return;
    setCanPrev(el.scrollLeft > 4);
    setCanNext(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  };

  useEffect(() => {
    updateEdges();
    const el = trackRef.current;
    if (!el) return;
    el.addEventListener("scroll", updateEdges, { passive: true });
    window.addEventListener("resize", updateEdges);
    return () => {
      el.removeEventListener("scroll", updateEdges);
      window.removeEventListener("resize", updateEdges);
    };
  }, [products.length]);

  const scrollByPage = (dir: 1 | -1) => {
    const el = trackRef.current;
    if (!el) return;
    const first = el.querySelector<HTMLElement>("[data-rail-item]");
    const step = first ? first.offsetWidth + 24 : el.clientWidth * 0.8;
    el.scrollBy({ left: dir * step, behavior: "smooth" });
  };

  if (products.length === 0) return null;

  return (
    <section className="max-w-7xl mx-auto mt-32 pt-20 border-t border-[var(--studio-rule)]">
      <div className="flex items-end justify-between mb-10 gap-6">
        <div className="space-y-3">
          <p className="text-[10px] tracking-[0.32em] uppercase text-[var(--studio-bronze)] font-semibold">
            From Your Recent Browsing
          </p>
          <h2 className="font-serif text-3xl md:text-4xl">Recently Viewed</h2>
        </div>
        <div className="hidden md:flex items-center gap-2">
          <button
            type="button"
            onClick={() => scrollByPage(-1)}
            disabled={!canPrev}
            aria-label="Previous pieces"
            className="w-11 h-11 grid place-items-center border border-[var(--studio-rule)] hover:border-[var(--studio-ink)] hover:text-[var(--studio-bronze)] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" strokeWidth={1.5} />
          </button>
          <button
            type="button"
            onClick={() => scrollByPage(1)}
            disabled={!canNext}
            aria-label="Next pieces"
            className="w-11 h-11 grid place-items-center border border-[var(--studio-rule)] hover:border-[var(--studio-ink)] hover:text-[var(--studio-bronze)] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-4 h-4" strokeWidth={1.5} />
          </button>
        </div>
      </div>
      <div
        ref={trackRef}
        className="flex gap-5 md:gap-6 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-4 -mx-6 px-6"
        role="region"
        aria-label="Recently viewed pieces"
      >
        {products.map((p) => (
          <div
            key={p.node.id}
            data-rail-item
            className="snap-start flex-shrink-0 w-[68%] sm:w-[42%] md:w-[28%] lg:w-[22%]"
          >
            <ProductCard product={p} />
          </div>
        ))}
      </div>
    </section>
  );
}
