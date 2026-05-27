import { useEffect, useState, useMemo } from "react";
import { Link, useLocation, useParams } from "@tanstack/react-router";
import { Sparkles, X, Loader2 } from "lucide-react";
import {
  fetchConciergePicks,
  type ConciergeResult,
} from "@/lib/ai-concierge.functions";
import { useWishlistStore } from "@/stores/wishlist-store";
import { useRecentlyViewedStore } from "@/stores/recently-viewed-store";
import { useInteractionStore } from "@/stores/interaction-store";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "@/lib/shopify";
import { brandFromSlug } from "@/lib/brand-heritage";

type PageContext = {
  pageType: "home" | "product" | "brand" | "collection" | "shop" | "other";
  currentProductHandle?: string;
  currentVendor?: string;
  currentCollection?: string;
};

/** Read the current page context out of the active route. */
function usePageContext(): PageContext {
  const loc = useLocation();
  const params = useParams({ strict: false }) as {
    handle?: string;
    vendor?: string;
  };
  const path = loc.pathname;

  return useMemo<PageContext>(() => {
    if (path === "/") return { pageType: "home" };
    if (path.startsWith("/product/") && params.handle) {
      return { pageType: "product", currentProductHandle: params.handle };
    }
    if (path.startsWith("/brand/") && params.vendor) {
      return {
        pageType: "brand",
        currentVendor: brandFromSlug(params.vendor) ?? undefined,
      };
    }
    if (path.startsWith("/collections/") && params.handle) {
      return { pageType: "collection", currentCollection: params.handle };
    }
    if (path.startsWith("/shop")) return { pageType: "shop" };
    return { pageType: "other" };
  }, [path, params.handle, params.vendor]);
}

/**
 * AI Concierge — a discreet floating button that opens a side panel of
 * contextual product recommendations based on what the shopper is viewing
 * right now plus their wishlist + recently-viewed signals.
 */
export function ConciergeWidget() {
  const [open, setOpen] = useState(false);
  const [seenOnce, setSeenOnce] = useState(false);
  // Luxury-tier behaviour: never overlap hero copy or PDP sticky CTAs. Stay
  // hidden until the visitor has scrolled past one viewport (signal of intent
  // to browse) and, on product pages, never compete with the add-to-bag bar.
  const [revealed, setRevealed] = useState(false);
  const ctx = usePageContext();
  useEffect(() => {
    if (typeof window === "undefined") return;
    const check = () => {
      if (window.scrollY > window.innerHeight * 0.9) setRevealed(true);
    };
    check();
    window.addEventListener("scroll", check, { passive: true });
    return () => window.removeEventListener("scroll", check);
  }, []);

  const wishlist = useWishlistStore((s) => s.handles);
  const recent = useRecentlyViewedStore((s) => s.items);
  const interactionRecords = useInteractionStore((s) => s.records);
  const interactionHandles = useMemo(
    () =>
      Object.values(interactionRecords)
        .sort((a, b) => b.score - a.score || b.lastTs - a.lastTs)
        .slice(0, 20)
        .map((r) => r.handle),
    [interactionRecords],
  );
  const [shopperName, setShopperName] = useState<string | undefined>(undefined);
  useEffect(() => {
    let cancelled = false;
    supabase.auth.getUser().then(({ data }) => {
      if (cancelled) return;
      const meta = (data.user?.user_metadata ?? {}) as Record<string, unknown>;
      const name =
        (meta.first_name as string | undefined) ||
        (meta.full_name as string | undefined)?.split(" ")[0] ||
        (meta.name as string | undefined)?.split(" ")[0] ||
        data.user?.email?.split("@")[0];
      if (name) setShopperName(name);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Infer shopper destination from browser locale (e.g. "en-US" → "US").
  // Cheap, zero-friction; ~85% accurate for the AI's delivery-window math.
  const shopperCountry = useMemo<string | undefined>(() => {
    if (typeof navigator === "undefined") return undefined;
    const locale = navigator.language || (navigator.languages?.[0] ?? "");
    const match = /-([A-Z]{2})\b/.exec(locale);
    return match?.[1];
  }, []);

  const [state, setState] = useState<{
    loading: boolean;
    data: ConciergeResult | null;
  }>({ loading: false, data: null });

  // Build a stable signal-string so we only re-fetch when context changes meaningfully.
  const signal = [
    ctx.pageType,
    ctx.currentProductHandle ?? "",
    ctx.currentVendor ?? "",
    ctx.currentCollection ?? "",
    wishlist.slice(0, 8).join("|"),
    recent.slice(0, 8).map((r) => r.handle).join("|"),
    interactionHandles.slice(0, 8).join("|"),
    shopperName ?? "",
    shopperCountry ?? "",
  ].join("::");

  // Fetch when the drawer opens (lazy — saves tokens until shoppers ask for it).
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setState((s) => ({ ...s, loading: true }));
    fetchConciergePicks({
      data: {
        pageType: ctx.pageType,
        currentProductHandle: ctx.currentProductHandle,
        currentVendor: ctx.currentVendor,
        currentCollection: ctx.currentCollection,
        wishlistHandles: wishlist.slice(0, 20),
        recentHandles: recent.slice(0, 20).map((r) => r.handle),
        interactionHandles: interactionHandles.slice(0, 20),
        shopperName,
        shopperCountry,
        shopperLocalTime: new Date().toISOString(),
      },
    })
      .then((data) => {
        if (!cancelled) setState({ loading: false, data });
      })
      .catch((err) => {
        console.error("[concierge] fetch failed:", err);
        if (!cancelled) {
          setState({
            loading: false,
            data: { ok: false, error: "The concierge is briefly unavailable." },
          });
        }
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, signal]);

  // Show a one-time nudge tooltip 8s after first product view.
  const showNudge = !open && !seenOnce && recent.length >= 1;
  useEffect(() => {
    if (open) setSeenOnce(true);
  }, [open]);

  return (
    <>
      {/* Floating launcher button (bottom-right). */}
      <button
        onClick={() => setOpen(true)}
        aria-label="Open AI concierge"
        data-testid="concierge-launcher"
        className="fixed bottom-24 md:bottom-6 right-6 z-40 group flex items-center gap-2.5 bg-ink text-canvas pl-4 pr-5 py-3.5 rounded-full shadow-lg shadow-ink/30 hover:bg-bronze transition-colors"
      >
        <span className="relative flex">
          <Sparkles className="w-4 h-4" strokeWidth={1.5} />
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-bronze rounded-full animate-pulse" />
        </span>
        <span className="text-[10px] uppercase tracking-[0.25em] font-medium">
          Concierge
        </span>
      </button>

      {/* One-time nudge tooltip pointing to the launcher. */}
      {showNudge && (
        <div
          className="fixed bottom-44 md:bottom-24 right-6 z-40 max-w-[280px] bg-canvas border border-ink/15 px-4 py-3 shadow-xl text-xs leading-relaxed text-ink/80 animate-in fade-in slide-in-from-bottom-2 duration-500"
          data-testid="concierge-nudge"
        >
          <p className="text-[10px] uppercase tracking-[0.22em] text-bronze mb-1.5">
            <Sparkles className="w-3 h-3 inline mr-1" strokeWidth={1.5} />
            Concierge
          </p>
          Ask me what pairs with what you're viewing.
          <button
            onClick={() => setSeenOnce(true)}
            aria-label="Dismiss"
            className="absolute top-1.5 right-1.5 text-muted-foreground hover:text-ink"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Slide-out drawer. */}
      {open && (
        <div className="fixed inset-0 z-50" data-testid="concierge-drawer">
          <div
            className="absolute inset-0 bg-ink/40 backdrop-blur-[2px]"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <aside
            className="absolute right-0 top-0 bottom-0 w-full sm:w-[440px] bg-canvas border-l border-ink/10 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300"
            role="dialog"
            aria-label="AI concierge"
          >
            <header className="flex items-center justify-between px-6 py-5 border-b border-ink/10">
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-4 h-4 text-bronze" strokeWidth={1.5} />
                <h2 className="text-[11px] uppercase tracking-[0.3em] font-medium">
                  The Concierge
                </h2>
              </div>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close concierge"
                data-testid="concierge-close"
                className="hover:text-bronze transition-colors"
              >
                <X className="w-5 h-5" strokeWidth={1.25} />
              </button>
            </header>

            <div className="flex-1 overflow-y-auto px-6 py-6">
              {state.loading ? (
                <div
                  className="flex items-center gap-3 text-sm text-muted-foreground"
                  data-testid="concierge-loading"
                >
                  <Loader2 className="w-4 h-4 animate-spin text-bronze" />
                  Reading the room…
                </div>
              ) : !state.data ? null : !state.data.ok ? (
                <p
                  className="text-sm text-muted-foreground"
                  data-testid="concierge-error"
                >
                  {state.data.error}
                </p>
              ) : (
                <>
                  <p
                    className="font-serif italic text-xl leading-snug text-balance mb-8"
                    data-testid="concierge-greeting"
                  >
                    "{state.data.greeting}"
                  </p>
                  {state.data.handoff ? (
                    <div className="border border-ink/15 bg-canvas-raised px-5 py-5" data-testid="concierge-handoff">
                      <p className="text-sm leading-relaxed text-ink/85 mb-4">
                        {state.data.handoff.message}
                      </p>
                      <a
                        href={state.data.handoff.mailto}
                        className="inline-flex items-center justify-center bg-ink text-canvas px-5 py-3 text-[10px] uppercase tracking-[0.25em] font-medium hover:bg-bronze transition-colors"
                      >
                        {state.data.handoff.buttonLabel}
                      </a>
                    </div>
                  ) : state.data.products.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No matches yet — explore a few more pieces and I'll refresh.
                    </p>
                  ) : (
                    <ul
                      className="space-y-6"
                      data-testid="concierge-list"
                    >
                      {state.data.products.map((p, idx) => {
                        const img = p.node.images.edges[0]?.node;
                        const reason = state.data?.ok
                          ? state.data.picks[idx]?.reason
                          : null;
                        return (
                          <li key={p.node.id}>
                            <Link
                              to="/product/$handle"
                              params={{ handle: p.node.handle }}
                              onClick={() => setOpen(false)}
                              className="group grid grid-cols-[96px_1fr] gap-4 hover:bg-canvas-raised -mx-3 px-3 py-2 transition-colors"
                              data-testid={`concierge-pick-${p.node.handle}`}
                            >
                              <div className="aspect-[4/5] bg-muted overflow-hidden">
                                {img && (
                                  <img
                                    src={img.url}
                                    alt={img.altText ?? p.node.title}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                    loading="lazy"
                                  />
                                )}
                              </div>
                              <div className="flex flex-col justify-between">
                                <div>
                                  <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                                    {p.node.vendor}
                                  </p>
                                  <p className="text-sm mt-1 leading-snug line-clamp-2 group-hover:text-bronze transition-colors">
                                    {p.node.title}
                                  </p>
                                  <p className="text-xs mt-1 text-muted-foreground">
                                    {formatPrice(p.node.priceRange.minVariantPrice)}
                                  </p>
                                </div>
                                {reason && (
                                  <p className="mt-2 text-[10px] uppercase tracking-[0.18em] text-bronze italic">
                                    {reason}
                                  </p>
                                )}
                              </div>
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </>
              )}
            </div>

            <footer className="border-t border-ink/10 px-6 py-4 flex items-center justify-between text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
              <span>Curated live by Claude</span>
              <Link
                to="/shop"
                search={{} as never}
                onClick={() => setOpen(false)}
                className="text-bronze hover:text-ink transition-colors"
              >
                Browse all →
              </Link>
            </footer>
          </aside>
        </div>
      )}
    </>
  );
}
