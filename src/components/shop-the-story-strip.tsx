/**
 * Editorial "Shop the Story" — a horizontal product strip that turns an
 * editorial page from a story into a shoppable surface. Accepts either an
 * explicit list of product handles OR a Shopify search query (e.g. a
 * collection / vendor / tag filter), and renders the standard ProductCard.
 *
 * Self-hides if no products match — never renders an empty rail.
 *
 * Use on editorial / journal / campaign pages to close the loop between
 * narrative and catalog. Per mem://preferences/tag-products-always.
 */
import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { fetchProducts, type ShopifyProduct } from "@/lib/shopify";
import { ProductCard } from "@/components/product-card";

interface Props {
  eyebrow?: string;
  title: string;
  caption?: string;
  /** Explicit product handles. Takes precedence over `query`. */
  handles?: string[];
  /** Storefront search query (e.g. `vendor:Versace product_type:Bag`). */
  query?: string;
  /** Cap the number of pieces rendered. Default 8. */
  limit?: number;
}

export function ShopTheStoryStrip({
  eyebrow = "Shop the Story",
  title,
  caption,
  handles,
  query,
  limit = 8,
}: Props) {
  const [products, setProducts] = useState<ShopifyProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const trackRef = useRef<HTMLDivElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const q = handles && handles.length > 0
      ? handles.map((h) => `handle:${h}`).join(" OR ")
      : query ?? "";
    if (!q) {
      setProducts([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    fetchProducts({ first: Math.max(limit, handles?.length ?? limit), query: q })
      .then((edges) => {
        if (cancelled) return;
        // Keep only in-stock pieces. Re-order to match handle list if given.
        const available = edges.filter((e) =>
          e.node.variants.edges.some((v) => v.node.availableForSale),
        );
        if (handles && handles.length > 0) {
          const order = new Map(handles.map((h, i) => [h, i]));
          available.sort(
            (a, b) =>
              (order.get(a.node.handle) ?? 999) - (order.get(b.node.handle) ?? 999),
          );
        }
        setProducts(available.slice(0, limit));
      })
      .catch(() => !cancelled && setProducts([]))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [handles?.join("|"), query, limit]);

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
    const first = el.querySelector<HTMLElement>("[data-strip-item]");
    const step = first ? first.offsetWidth + 24 : el.clientWidth * 0.8;
    el.scrollBy({ left: dir * step, behavior: "smooth" });
  };

  if (!loading && products.length === 0) return null;

  return (
    <section className="max-w-7xl mx-auto px-6 md:px-10 my-24 md:my-32">
      <div className="flex items-end justify-between mb-10 gap-6 flex-wrap">
        <div className="space-y-3 max-w-xl">
          <p className="text-[10px] tracking-[0.32em] uppercase text-bronze font-semibold">
            {eyebrow}
          </p>
          <h2 className="font-serif text-3xl md:text-4xl">{title}</h2>
          {caption && (
            <p className="text-sm text-ink/70 leading-relaxed">{caption}</p>
          )}
        </div>
        <div className="hidden md:flex items-center gap-2">
          <button
            type="button"
            onClick={() => scrollByPage(-1)}
            disabled={!canPrev}
            aria-label="Previous pieces"
            className="w-11 h-11 grid place-items-center border border-ink/15 hover:border-ink hover:text-bronze transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" strokeWidth={1.5} />
          </button>
          <button
            type="button"
            onClick={() => scrollByPage(1)}
            disabled={!canNext}
            aria-label="Next pieces"
            className="w-11 h-11 grid place-items-center border border-ink/15 hover:border-ink hover:text-bronze transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-4 h-4" strokeWidth={1.5} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex gap-5 md:gap-6 overflow-hidden">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="flex-shrink-0 w-[68%] sm:w-[42%] md:w-[28%] lg:w-[22%] aspect-[4/5] bg-ink/5 animate-pulse"
            />
          ))}
        </div>
      ) : (
        <div
          ref={trackRef}
          className="flex gap-5 md:gap-6 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-4 -mx-6 px-6"
          role="region"
          aria-label={`${title} — shoppable pieces`}
        >
          {products.map((p) => (
            <div
              key={p.node.id}
              data-strip-item
              className="snap-start flex-shrink-0 w-[68%] sm:w-[42%] md:w-[28%] lg:w-[22%]"
            >
              <ProductCard product={p} />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
