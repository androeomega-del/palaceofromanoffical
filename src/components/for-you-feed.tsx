import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Sparkles, Loader2 } from "lucide-react";
import {
  fetchPersonalizedFeed,
  type RecommendationsResult,
} from "@/lib/ai-recommendations.functions";
import { useWishlistStore } from "@/stores/wishlist-store";
import { useRecentlyViewedStore } from "@/stores/recently-viewed-store";
import { useInteractionStore } from "@/stores/interaction-store";
import { formatPrice } from "@/lib/shopify";

/**
 * "Curated For You" rail. Fetches a personalised edit on mount based on the
 * shopper's wishlist + recently-viewed. AI-ranked via Claude. Cold-start
 * gracefully falls back to best-sellers from the curated 100.
 */
export function ForYouFeed() {
  const wishlist = useWishlistStore((s) => s.handles);
  const recent = useRecentlyViewedStore((s) => s.items);
  // Select the raw records map (stable reference) and derive top handles
  // in a memo. Calling `topHandles()` inside the selector returns a new
  // array on every render, which Zustand treats as state changing →
  // infinite re-render loop (React #185).
  const records = useInteractionStore((s) => s.records);
  const interactions = useMemo(
    () =>
      Object.values(records)
        .sort((a, b) => b.score - a.score || b.lastTs - a.lastTs)
        .slice(0, 20)
        .map((r) => r.handle),
    [records],
  );
  const [state, setState] = useState<{
    loading: boolean;
    data: RecommendationsResult | null;
  }>({ loading: true, data: null });
  // SSR sees empty persisted stores; returning visitors hydrate with their
  // saved wishlist / recently-viewed. Reading those values directly into
  // rendered text ("Curated For You" vs "Today's Edit", different headline,
  // conditional helper copy) produced a text-content hydration mismatch
  // (React #418). Defer the personalised flag until after mount so SSR
  // always renders the cold-start variant, then swap on the client.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);


  useEffect(() => {
    let cancelled = false;
    setState((s) => ({ ...s, loading: true }));
    // Safety net: if the AI route stalls (Lovable AI gateway slow / cold),
    // bail out of the spinner after 8s and render the CTA fallback so the
    // homepage never shows an infinite "Curating your edit…" state.
    const timeoutId = setTimeout(() => {
      if (!cancelled) setState((s) => (s.loading ? { loading: false, data: null } : s));
    }, 8000);
    fetchPersonalizedFeed({
      data: {
        wishlistHandles: wishlist.slice(0, 20),
        recentHandles: recent.slice(0, 20).map((r) => r.handle),
        interactionHandles: interactions,
      },
    })
      .then((data) => {
        if (!cancelled) setState({ loading: false, data });
      })
      .catch((err) => {
        console.error("[for-you] fetch failed:", err);
        if (!cancelled) setState({ loading: false, data: null });
      });
    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
    // Stable identity — only re-run when handles meaningfully change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    wishlist.join(","),
    recent.map((r) => r.handle).join(","),
    interactions.join(","),
  ]);

  const isPersonalized =
    mounted && wishlist.length + recent.length + interactions.length > 0;


  return (
    <section
      className="px-6 py-20 border-t border-ink/5 bg-canvas"
      data-testid="for-you-feed"
    >
      <div className="max-w-screen-2xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <p className="flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-bronze mb-3">
              <Sparkles className="w-3.5 h-3.5" strokeWidth={1.5} />
              {isPersonalized ? "Curated For You" : "Today's Edit"}
            </p>
            <h2 className="text-4xl md:text-5xl font-serif text-balance max-w-[20ch]">
              {isPersonalized
                ? "An edit, shaped by your eye."
                : "An edit, shaped by the boutique."}
            </h2>
            {state.data?.ok && (
              <p className="mt-4 text-sm text-muted-foreground italic max-w-[55ch]">
                {state.data.narrative}
              </p>
            )}
          </div>
          {!isPersonalized && (
            <p className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground max-w-[28ch]">
              Save a few pieces to your wishlist — your edit personalises immediately.
            </p>
          )}
        </div>

        {state.loading ? (
          <div className="flex items-center gap-3 text-sm text-muted-foreground" data-testid="for-you-loading">
            <Loader2 className="w-4 h-4 animate-spin" />
            Curating your edit…
          </div>
        ) : !state.data || !state.data.ok ? (
          <div className="flex flex-col sm:flex-row sm:items-center gap-4" data-testid="for-you-empty">
            <p className="text-sm text-muted-foreground italic max-w-[42ch]">
              Your edit will appear once you've explored a few pieces.
            </p>
            <Link
              to="/shop"
              search={{ q: "tag:new-arrival", title: "New Arrivals" }}
              className="self-start sm:self-auto text-[11px] uppercase tracking-[0.25em] text-ink border-b border-bronze/40 hover:text-bronze hover:border-bronze transition-colors pb-0.5"
            >
              Start your edit — browse New Arrivals →
            </Link>
          </div>
        ) : state.data.products.length === 0 ? (
          <p className="text-sm text-muted-foreground">No matches yet — check back shortly.</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-x-6 gap-y-12" data-testid="for-you-grid">
            {state.data.products.map((p, idx) => {
              const img = p.node.images.edges[0]?.node;
              const reason = state.data?.ok ? state.data.recommendations[idx]?.reason : null;
              return (
                <Link
                  key={p.node.id}
                  to="/product/$handle"
                  params={{ handle: p.node.handle }}
                  className="group"
                  data-testid={`for-you-card-${p.node.handle}`}
                >
                  <div className="aspect-[4/5] bg-muted overflow-hidden mb-3">
                    {img && (
                      <img
                        src={img.url}
                        alt={img.altText ?? p.node.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        loading="lazy"
                      />
                    )}
                  </div>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground truncate">
                    {p.node.vendor}
                  </p>
                  <p className="text-xs mt-1 leading-snug group-hover:text-bronze transition-colors line-clamp-2">
                    {p.node.title}
                  </p>
                  <p className="text-xs mt-1 text-muted-foreground">
                    {formatPrice(p.node.priceRange.minVariantPrice)}
                  </p>
                  {reason && (
                    <p className="mt-2 text-[10px] uppercase tracking-[0.18em] text-bronze italic">
                      {reason}
                    </p>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
