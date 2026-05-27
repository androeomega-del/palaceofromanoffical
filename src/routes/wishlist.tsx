import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Heart } from "lucide-react";
import { useWishlistStore } from "@/stores/wishlist-store";
import { fetchProducts, type ShopifyProduct } from "@/lib/shopify";
import { ProductCard } from "@/components/product-card";
import { pageTitle, metaDescription, absoluteUrl } from "@/lib/seo";

export const Route = createFileRoute("/wishlist")({
  head: () => {
    const url = absoluteUrl("/wishlist");
    return {
      meta: [
        { title: pageTitle("Wishlist") },
        { name: "description", content: metaDescription("Your saved pieces from Palace of Roman — kept in one place so you can return when you're ready.") },
        { property: "og:title", content: pageTitle("Wishlist") },
        { property: "og:description", content: "Your saved pieces from Palace of Roman." },
        { property: "og:url", content: url },
        { name: "robots", content: "noindex,follow" },
      ],
      links: [{ rel: "canonical", href: url }],
    };
  },
  component: WishlistPage,
});

function WishlistPage() {
  const handles = useWishlistStore((s) => s.handles);
  const clear = useWishlistStore((s) => s.clear);
  const [mounted, setMounted] = useState(false);
  const [products, setProducts] = useState<ShopifyProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!mounted) return;
    if (handles.length === 0) {
      setProducts([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    // Storefront search caps query length; chunk to be safe on >50 saves.
    const chunks: string[][] = [];
    for (let i = 0; i < handles.length; i += 40) chunks.push(handles.slice(i, i + 40));

    Promise.all(
      chunks.map((chunk) =>
        fetchProducts({
          first: chunk.length,
          query: chunk.map((h) => `handle:${h}`).join(" OR "),
        }),
      ),
    )
      .then((batches) => {
        if (cancelled) return;
        const all = batches.flat();
        const order = new Map(handles.map((h, i) => [h, i]));
        const sorted = [...all].sort(
          (a, b) => (order.get(a.node.handle) ?? 999) - (order.get(b.node.handle) ?? 999),
        );
        setProducts(sorted);
      })
      .catch(() => !cancelled && setProducts([]))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [handles, mounted]);

  return (
    <div className="min-h-screen bg-canvas">
      <div className="max-w-screen-2xl mx-auto px-6 md:px-10 pt-12 md:pt-20 pb-24">
        <nav aria-label="Breadcrumb" className="mb-8">
          <ol className="flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-ink/60">
            <li>
              <Link to="/" className="hover:text-bronze">Home</Link>
            </li>
            <li aria-hidden>/</li>
            <li className="text-ink">Wishlist</li>
          </ol>
        </nav>

        <header className="mb-12 md:mb-16 flex items-end justify-between gap-6 flex-wrap">
          <div className="space-y-3">
            <p className="text-[10px] tracking-[0.32em] uppercase text-bronze font-semibold">
              Saved Pieces
            </p>
            <h1 className="font-serif text-4xl md:text-5xl">Your Wishlist</h1>
            <p className="text-sm text-ink/70 max-w-xl">
              Pieces you've set aside to consider. Sizes and stock are checked live —
              add to bag when you're ready.
            </p>
          </div>
          {mounted && handles.length > 0 && (
            <button
              type="button"
              onClick={() => {
                if (confirm("Clear your entire wishlist?")) clear();
              }}
              className="text-[10px] uppercase tracking-[0.3em] text-ink/60 hover:text-ink underline underline-offset-4"
            >
              Clear wishlist
            </button>
          )}
        </header>

        {!mounted || loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="aspect-[4/5] bg-ink/5 animate-pulse" />
            ))}
          </div>
        ) : handles.length === 0 ? (
          <div className="border border-ink/10 px-8 py-20 text-center">
            <Heart className="w-8 h-8 mx-auto text-ink/30 mb-6" strokeWidth={1} />
            <h2 className="font-serif text-2xl mb-3">Nothing saved yet</h2>
            <p className="text-sm text-ink/70 max-w-md mx-auto mb-8">
              Tap the heart on any piece to keep it here for later. Your list is
              private and stays on this device.
            </p>
            <Link
              to="/shop"
              className="inline-block bg-ink text-canvas px-8 py-3 text-[11px] uppercase tracking-[0.3em] hover:bg-bronze transition-colors"
            >
              Browse the House
            </Link>
          </div>
        ) : products.length === 0 ? (
          <div className="border border-ink/10 px-8 py-20 text-center">
            <p className="text-sm text-ink/70">
              The pieces you saved are no longer available. They may have sold or
              been retired from the edit.
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-14">
              {products.map((p) => (
                <ProductCard key={p.node.id} product={p} />
              ))}
            </div>
            {products.length < handles.length && (
              <p className="mt-12 text-xs text-ink/50 text-center">
                {handles.length - products.length} saved piece
                {handles.length - products.length === 1 ? "" : "s"} no longer
                available.
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
