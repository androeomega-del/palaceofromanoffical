import { Link, useNavigate } from "@tanstack/react-router";
import { Check, Heart, Loader2, ShoppingBag, X, Zap } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { formatPrice, type ShopifyProduct } from "@/lib/shopify";
import { cdnImage } from "@/lib/cdn-image";
import { computeScarcitySignal } from "@/lib/scarcity-signal";
import { ShippingMeta } from "@/components/shipping-meta";
import { useCartStore } from "@/stores/cart-store";
import { useWishlistStore } from "@/stores/wishlist-store";
import { useInteractionStore } from "@/stores/interaction-store";
import { QuickViewSheet } from "@/components/quick-view-sheet";


export function ProductCard({ product }: { product: ShopifyProduct }) {
  const p = product.node;
  const img = p.images?.edges?.[0]?.node;
  const img2 = p.images?.edges?.[1]?.node;
  const compareAt = p.compareAtPriceRange?.minVariantPrice;
  const price = p.priceRange.minVariantPrice;
  const onSale = compareAt && parseFloat(compareAt.amount) > parseFloat(price.amount);

  const variants = p.variants?.edges?.map((e) => e.node) ?? [];
  const firstAvailable = variants.find((v) => v.availableForSale);
  const hasChoices =
    (p.options ?? []).some(
      (o) => o.values.length > 1 || o.name.toLowerCase() !== "title",
    ) || variants.length > 1;
  const soldOut = variants.length > 0 && !firstAvailable;
  const availableCount = variants.filter((v) => v.availableForSale).length;
  // Desktop hover quick-add: when a product has exactly one option group and
  // it's size, render size pills inline on hover instead of opening the sheet.
  const sizeOnlyOption = (() => {
    const opts = (p.options ?? []).filter(
      (o) => o.values.length > 1 || o.name.toLowerCase() !== "title",
    );
    if (opts.length !== 1) return null;
    if (!/size/i.test(opts[0].name)) return null;
    return opts[0];
  })();

  // Availability Urgency for designer retail — tiered, evidence-based copy.
  // See src/lib/scarcity-signal.ts for the tactic stack & tier definitions.
  const scarcity = computeScarcitySignal({
    availableCount,
    totalVariants: variants.length,
    priceUsd: parseFloat(price.amount),
    onSale: Boolean(onSale),
  });
  const showScarcityBadge = !soldOut && scarcity.tier !== "none" && scarcity.tier !== "soldOut";

  const navigate = useNavigate();
  const addItem = useCartStore((s) => s.addItem);
  const openDrawer = useCartStore((s) => s.openDrawer);
  const wishlisted = useWishlistStore((s) => s.handles.includes(p.handle));
  const toggleWishlist = useWishlistStore((s) => s.toggle);
  const [adding, setAdding] = useState(false);
  const [buyingNow, setBuyingNow] = useState(false);
  const [quickViewOpen, setQuickViewOpen] = useState(false);
  const track = useInteractionStore((s) => s.track);
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cardRef = useRef<HTMLAnchorElement | null>(null);
  const impressionFired = useRef(false);
  const [quickAddState, setQuickAddState] = useState<"idle" | "sizing" | "success">("idle");
  const [successLabel, setSuccessLabel] = useState<string | null>(null);
  const successTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [revealed, setRevealed] = useState(false);
  const isTouchRef = useRef(false);
  useEffect(() => () => { if (successTimer.current) clearTimeout(successTimer.current); }, []);

  // Mobile: dismiss the revealed CTA overlay when tapping outside the card.
  useEffect(() => {
    if (!revealed) return;
    const onDown = (e: PointerEvent) => {
      const el = cardRef.current;
      if (el && !el.contains(e.target as Node)) setRevealed(false);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [revealed]);

  const meta = { vendor: p.vendor, productType: p.productType };

  // Viewport impression — fire once per mount when ≥50% of the card is
  // visible for 600ms. Implicit signal: "shopper actually saw this card".
  // When the card carries a scarcity tier, also fire `scarcity_view` so we
  // can measure urgency-badge conversion in the admin panel.
  const hasScarcity = scarcity.tier !== "none" && scarcity.tier !== "soldOut";
  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    const el = cardRef.current;
    if (!el) return;
    let dwellTimer: ReturnType<typeof setTimeout> | null = null;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
            if (impressionFired.current || dwellTimer) continue;
            dwellTimer = setTimeout(() => {
              if (impressionFired.current) return;
              impressionFired.current = true;
              track({ handle: p.handle, event: "impression", vendor: p.vendor, productType: p.productType });
              if (hasScarcity) {
                track({ handle: p.handle, event: "scarcity_view", vendor: p.vendor, productType: p.productType });
              }
              observer.disconnect();
            }, 600);
          } else if (dwellTimer) {
            clearTimeout(dwellTimer);
            dwellTimer = null;
          }
        }
      },
      { threshold: [0, 0.5, 1] },
    );
    observer.observe(el);
    return () => {
      if (dwellTimer) clearTimeout(dwellTimer);
      observer.disconnect();
    };
  }, [p.handle, p.vendor, p.productType, track, hasScarcity]);

  const onCardClick = (e: React.MouseEvent) => {
    // Mobile/touch: first tap reveals the CTA overlay; second tap navigates.
    if (isTouchRef.current && !revealed && quickAddState === "idle") {
      e.preventDefault();
      setRevealed(true);
      return;
    }
    track({ handle: p.handle, event: "click", ...meta });
    if (hasScarcity) {
      track({ handle: p.handle, event: "scarcity_click", ...meta });
    }
  };

  const onCardPointerDown = (e: React.PointerEvent) => {
    isTouchRef.current = e.pointerType === "touch" || e.pointerType === "pen";
  };

  const onCardEnter = () => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    hoverTimer.current = setTimeout(() => {
      track({ handle: p.handle, event: "hover", ...meta });
    }, 800);
  };

  const onCardLeave = () => {
    if (hoverTimer.current) {
      clearTimeout(hoverTimer.current);
      hoverTimer.current = null;
    }
  };

  const onToggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const wasOn = wishlisted;
    toggleWishlist(p.handle);
    if (!wasOn) track({ handle: p.handle, event: "wishlist", ...meta });
    toast.success(wasOn ? "Removed from wishlist" : "Saved to wishlist", {
      description: p.title,
    });
  };

  const altBase = p.vendor ? `${p.title} — ${p.vendor}` : p.title;

  const onAdd = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (soldOut) return;
    // Multi-variant pieces open the Quick-View sheet in-grid — no PDP detour.
    // Single-variant pieces add straight to bag below.
    // Size-only multi-variant pieces: open inline two-step quick-add row.
    if (sizeOnlyOption) {
      setQuickAddState("sizing");
      return;
    }
    // Other multi-option pieces (e.g. size + color) → quick-view sheet.
    if (hasChoices || !firstAvailable) {
      setQuickViewOpen(true);
      return;
    }
    if (adding) return; // per-card spam guard
    setAdding(true);
    try {
      const added = await addItem({
        product,
        variantId: firstAvailable.id,
        variantTitle: firstAvailable.title,
        price: firstAvailable.price,
        quantity: 1,
        selectedOptions: firstAvailable.selectedOptions ?? [],
      });
      if (!added) {
        toast.error("Could not add this item to bag.", { description: "Please try another size or refresh the page." });
        return;
      }
      track({ handle: p.handle, event: "cart", ...meta });
      if (hasScarcity) {
        track({ handle: p.handle, event: "scarcity_cart", ...meta });
      }
      openDrawer();
      toast.success(`${p.title} — added to bag`);
    } finally {
      setAdding(false);
    }
  };


  const onBuyNow = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (soldOut) return;
    // Multi-variant pieces: route to PDP — first available is preselected,
    // and the #buy hash makes the PDP scroll to + flash the selector.
    if (hasChoices || !firstAvailable) {
      navigate({
        to: "/product/$handle",
        params: { handle: p.handle },
        hash: "buy",
      });
      return;
    }

    setBuyingNow(true);
    try {
      const added = await addItem({
        product,
        variantId: firstAvailable.id,
        variantTitle: firstAvailable.title,
        price: firstAvailable.price,
        quantity: 1,
        selectedOptions: firstAvailable.selectedOptions ?? [],
      });
      if (!added) {
        toast.error("Could not add this item to bag.", { description: "Please try another size or refresh the page." });
        return;
      }
      track({ handle: p.handle, event: "cart", ...meta });
      const checkoutUrl = useCartStore.getState().getCheckoutUrl();
      if (checkoutUrl) {
        const { trackCartEvent } = await import("@/lib/cart-analytics");
        const base = {
          product_handle: product.node.handle,
          product_title: product.node.title,
          variant_id: firstAvailable.id,
          variant_title: firstAvailable.title,
          price_usd: Number(firstAvailable.price.amount),
          quantity: 1,
        };
        trackCartEvent({ event_type: "checkout_started", ...base });
        const win = window.open(checkoutUrl, "_blank", "noopener,noreferrer");
        if (win) trackCartEvent({ event_type: "reached_checkout", ...base });
      } else {
        toast.error("Could not start checkout. Please try again.");
      }
    } finally {
      setBuyingNow(false);
    }
  };

  const addLabel = soldOut ? "Sold Out" : hasChoices ? "Quick Add" : "Add to Bag";


  return (
    <>
    <Link
      ref={cardRef}
      to="/product/$handle"
      params={{ handle: p.handle }}
      className="group block"
      onClick={onCardClick}
      onPointerDown={onCardPointerDown}
      onMouseEnter={onCardEnter}
      onMouseLeave={onCardLeave}
    >
      <div className="w-full aspect-[4/5] bg-muted relative overflow-hidden mb-5">
        {img && (
          <img
            src={cdnImage(img.url, { width: 700 })}
            alt={img.altText ?? altBase}
            loading="lazy"
            decoding="async"
            className="absolute inset-0 w-full h-full object-cover transition-opacity duration-700 group-hover:opacity-0"
          />
        )}
        {img2 ? (
          <img
            src={cdnImage(img2.url, { width: 700 })}
            alt={img2.altText ?? altBase}
            loading="lazy"
            decoding="async"
            className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-700"
          />
        ) : (
          img && (
            <img
              src={cdnImage(img.url, { width: 700 })}
              alt=""
              aria-hidden
              loading="lazy"
              decoding="async"
              className="absolute inset-0 w-full h-full object-cover scale-105 opacity-0 group-hover:opacity-100 transition-all duration-700"
            />
          )
        )}

        {onSale && !soldOut && (
          <span className="absolute top-3 left-3 text-[10px] uppercase tracking-[0.25em] bg-bronze text-canvas px-2 py-1">
            Sale
          </span>
        )}
        {soldOut && (
          <span className="absolute top-3 left-3 text-[10px] uppercase tracking-[0.25em] bg-ink/80 text-canvas px-2 py-1">
            Sold Out
          </span>
        )}
        {showScarcityBadge && !onSale && (
          <span
            className="absolute top-3 left-3 text-[10px] uppercase tracking-[0.25em] bg-ink text-canvas px-2 py-1 font-medium"
            title={scarcity.rationale}
          >
            <span className="text-bronze mr-1 animate-pulse">●</span>
            {scarcity.label}
          </span>
        )}

        {/* Wishlist heart — top right, always visible */}
        <button
          type="button"
          onClick={onToggleWishlist}
          aria-label={wishlisted ? "Remove from wishlist" : "Save to wishlist"}
          aria-pressed={wishlisted}
          className="absolute top-3 right-3 w-9 h-9 grid place-items-center bg-canvas/85 backdrop-blur-sm hover:bg-canvas transition-colors group/heart"
        >
          <Heart
            className={`w-4 h-4 transition-all duration-300 ${
              wishlisted
                ? "fill-bronze stroke-bronze scale-110"
                : "stroke-ink group-hover/heart:stroke-bronze"
            }`}
            strokeWidth={1.5}
          />
        </button>

        {/* Bottom CTA — fixed-height container so size-pill swap never
            reflows the card. Three states: idle | sizing | success. */}
        <div
          className={`absolute inset-x-3 bottom-3 h-11 ${
            quickAddState !== "idle" || revealed
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-2 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto group-focus-within:opacity-100 group-focus-within:translate-y-0 group-focus-within:pointer-events-auto"
          } transition-all duration-300`}
          onClick={(e) => {
            // Stop clicks inside the CTA row from triggering the card link.
            if (quickAddState !== "idle") {
              e.preventDefault();
              e.stopPropagation();
            }
          }}
        >
          {/* IDLE */}
          <div
            className={`absolute inset-0 flex gap-2 transition-opacity duration-200 ${
              quickAddState === "idle" ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
          >
            <button
              type="button"
              onClick={onAdd}
              disabled={soldOut || (!hasChoices && adding)}
              aria-label={addLabel}
              aria-busy={!hasChoices && adding}
              className="flex-1 h-11 bg-ink text-canvas hover:bg-bronze transition-colors duration-300 text-[10px] uppercase tracking-[0.25em] font-medium inline-flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {!hasChoices && adding ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <>
                  <ShoppingBag className="w-3 h-3" strokeWidth={1.5} />
                  {addLabel}
                </>
              )}
            </button>
            {!soldOut && (
              <button
                type="button"
                onClick={onBuyNow}
                disabled={buyingNow || (!hasChoices && adding)}
                aria-label="Buy Now"
                title="Buy Now"
                className="h-11 px-3 bg-bronze text-canvas hover:bg-ink transition-colors duration-300 text-[10px] uppercase tracking-[0.25em] font-medium inline-flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {buyingNow ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <>
                    <Zap className="w-3 h-3" strokeWidth={1.5} />
                    Buy Now
                  </>
                )}
              </button>
            )}
          </div>

          {/* SIZING — anchored to bottom, grows upward over the image so
              pills wrap onto multiple rows on narrow mobile widths instead
              of horizontally scrolling. Card height is unchanged because
              the idle CTA still occupies the h-11 row underneath. */}
          {sizeOnlyOption && (
            <div
              className={`absolute inset-x-0 bottom-0 min-h-11 bg-canvas/95 backdrop-blur-sm border border-ink/15 shadow-md px-1.5 py-1.5 flex items-start gap-1 transition-opacity duration-200 ${
                quickAddState === "sizing" ? "opacity-100" : "opacity-0 pointer-events-none"
              }`}
              role="group"
              aria-label="Select a size"
            >
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setQuickAddState("idle");
                }}
                aria-label="Cancel quick add"
                className="shrink-0 w-8 h-8 grid place-items-center text-ink/70 hover:text-ink hover:bg-ink/5 rounded-full transition-colors"
              >
                <X className="w-3.5 h-3.5" strokeWidth={1.5} />
              </button>
              <div className="flex-1 flex flex-wrap items-center gap-1">
                {sizeOnlyOption.values.map((value) => {
                  const v = variants.find((vv) =>
                    vv.selectedOptions?.some(
                      (o) => o.name === sizeOnlyOption.name && o.value === value,
                    ),
                  );
                  const unavailable = !v || !v.availableForSale;
                  return (
                    <button
                      key={value}
                      type="button"
                      disabled={unavailable || adding}
                      aria-label={unavailable ? `Size ${value} — out of stock` : `Add size ${value}`}
                      onClick={async (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (!v || unavailable || adding) return;
                        setAdding(true);
                        try {
                          const added = await addItem({
                            product,
                            variantId: v.id,
                            variantTitle: v.title,
                            price: v.price,
                            quantity: 1,
                            selectedOptions: v.selectedOptions ?? [],
                          });
                          if (!added) {
                            toast.error("Could not add. Try another size.");
                            return;
                          }
                          track({ handle: p.handle, event: "cart", ...meta });
                          if (hasScarcity) {
                            track({ handle: p.handle, event: "scarcity_cart", ...meta });
                          }
                          toast.success(`${p.title} — ${value} added to bag`);
                          setSuccessLabel(value);
                          setQuickAddState("success");
                          if (successTimer.current) clearTimeout(successTimer.current);
                          successTimer.current = setTimeout(() => {
                            setQuickAddState("idle");
                            setSuccessLabel(null);
                          }, 2000);
                        } finally {
                          setAdding(false);
                        }
                      }}
                      className={`min-w-[32px] h-8 px-2 rounded-full text-[10px] uppercase tracking-widest font-medium border transition-colors ${
                        unavailable
                          ? "border-ink/10 text-ink/30 line-through cursor-not-allowed bg-transparent"
                          : "border-ink/20 text-ink bg-canvas hover:bg-ink hover:text-canvas hover:border-ink active:scale-95"
                      }`}
                    >
                      {value}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* SUCCESS */}
          <div
            className={`absolute inset-0 transition-opacity duration-200 ${
              quickAddState === "success" ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
            aria-live="polite"
          >
            <div
              className="w-full h-11 inline-flex items-center justify-center gap-2 text-canvas text-[10px] uppercase tracking-[0.25em] font-medium"
              style={{ background: "var(--color-success)" }}
            >
              <Check className="w-3.5 h-3.5" strokeWidth={2} />
              Added to Bag{successLabel ? ` — ${successLabel}` : ""}
            </div>
          </div>
        </div>




      </div>
      <p className="text-[10px] uppercase tracking-widest mb-1 text-bronze">{p.vendor}</p>
      <h3 className="text-sm font-medium leading-snug line-clamp-2 text-balance">{p.title}</h3>
      <div className="flex items-baseline gap-3 mt-1.5">
        <p className="text-sm">{formatPrice(price)}</p>
        {onSale && <p className="text-xs text-muted-foreground line-through">{formatPrice(compareAt)}</p>}
      </div>
      <ShippingMeta vendor={p.vendor} handle={p.handle} variant="card" />

    </Link>
    <QuickViewSheet
      product={product}
      open={quickViewOpen}
      onOpenChange={setQuickViewOpen}
    />
    </>
  );
}
