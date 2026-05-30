import { Link, useNavigate } from "@tanstack/react-router";
import { Check, Eye, Heart, Loader2, ShoppingBag, X, Zap } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { type ShopifyProduct } from "@/lib/shopify";
import { cdnImage, cdnSrcSet } from "@/lib/cdn-image";
import { computeScarcitySignal } from "@/lib/scarcity-signal";
import { useCartStore } from "@/stores/cart-store";
import { useWishlistStore } from "@/stores/wishlist-store";
import { useInteractionStore } from "@/stores/interaction-store";
import { QuickViewSheet } from "@/components/quick-view-sheet";
import { PriceTag } from "@/components/price-tag";


export type SuppressedBadge = "markdown" | "scarcity";

export function ProductCard({
  product,
  suppressBadges = [],
}: {
  product: ShopifyProduct;
  /**
   * Hide badge categories that would be redundant given the surface the card
   * lives on. Example: on /collections/sale, pass ["markdown"] because every
   * card on that page is on sale — the badge is implied by the page itself.
   * Scarcity badges (Final Piece / Rare — N Left / Archive Edition) are
   * never automatically suppressed; opt-out is per-surface.
   */
   suppressBadges?: SuppressedBadge[];
}) {
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
  // Scarcity badge removed; `scarcity` still feeds analytics + halo lighting.

  const navigate = useNavigate();
  const addItem = useCartStore((s) => s.addItem);
  const openDrawer = useCartStore((s) => s.openDrawer);
  const wishlistedRaw = useWishlistStore((s) => s.handles.includes(p.handle));
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
  // Broken-image guard — if the Shopify CDN returns 404 or the URL is
  // missing, swap in an editorial placeholder instead of leaving the native
  // broken-image icon. Top-tier sites never ship a card without imagery.
  const [imgError, setImgError] = useState(false);
  const [img2Error, setImg2Error] = useState(false);
  // Hydration gate for any badge whose visibility depends on the current wall
  // clock (e.g. "New In" — pieces added in the last 14 days). Server-rendered
  // HTML uses the build/SSR timestamp; the client may evaluate `Date.now()` a
  // few minutes (or hours, with CDN caching) later, which flips the badge on
  // products at the exact 14-day boundary and triggers React #418.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  // SSR sees an empty wishlist (no localStorage); returning visitors see
  // their persisted list. Render the inert state until mount to avoid #418.
  const wishlisted = mounted ? wishlistedRaw : false;
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
      className="group block h-full"
      onClick={onCardClick}
      onPointerDown={onCardPointerDown}
      onMouseEnter={onCardEnter}
      onMouseLeave={onCardLeave}
    >
      <div className="w-full aspect-[3/4] bg-secondary relative overflow-hidden mb-3 isolate">
        {img && !imgError && (
          <img
            src={cdnImage(img.url, { width: 700 })}
            srcSet={cdnSrcSet(img.url, [400, 700, 1000, 1400])}
            sizes="(min-width: 1280px) 22vw, (min-width: 768px) 30vw, 50vw"
            alt={img.altText ?? altBase}
            width={700}
            height={875}
            loading="lazy"
            decoding="async"
            onError={() => setImgError(true)}
            className="absolute inset-0 w-full h-full object-contain p-4 transition-opacity duration-500 group-hover:opacity-0"
          />
        )}
        {(!img || imgError) && (
          <div
            aria-hidden
            className="absolute inset-0 flex flex-col items-center justify-center bg-[color:var(--canvas)] text-center px-6"
          >
            <span className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground mb-3">
              {p.vendor ?? "Palace of Roman"}
            </span>
            <span className="text-[11px] uppercase tracking-[0.25em] text-ink/70 leading-relaxed line-clamp-3">
              {p.title}
            </span>
            <span className="mt-4 h-px w-8 bg-bronze/40" />
          </div>
        )}
        {img2 && !img2Error ? (
          <img
            src={cdnImage(img2.url, { width: 700 })}
            srcSet={cdnSrcSet(img2.url, [400, 700, 1000, 1400])}
            sizes="(min-width: 1280px) 22vw, (min-width: 768px) 30vw, 50vw"
            alt={img2.altText ?? altBase}
            width={700}
            height={875}
            loading="lazy"
            decoding="async"
            onError={() => setImg2Error(true)}
            className="absolute inset-0 w-full h-full object-contain p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          />
        ) : (
          img && !imgError && (
            <img
              src={cdnImage(img.url, { width: 700 })}
              srcSet={cdnSrcSet(img.url, [400, 700, 1000, 1400])}
              sizes="(min-width: 1280px) 22vw, (min-width: 768px) 30vw, 50vw"
              alt=""
              aria-hidden
              width={700}
              height={875}
              loading="lazy"
              decoding="async"
              className="absolute inset-0 w-full h-full object-contain p-4 scale-[1.02] opacity-0 group-hover:opacity-100 transition-all duration-500"
            />
          )
        )}

        {/* GLORIFY LIGHTING — layered system:
            (1) Lacquer rim: always-on hairline of specular light along the top
                & left edge, like light catching the edge of a glass vitrine
                or lacquered surface. Universal, very restrained.
            (2) Bronze halo: warm radial bloom from behind the product, only
                on the rarest tiers (Final Piece / Rare / Archive). Subtle at
                rest, glows on hover. The vitrine spotlight earns its place. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-[1]"
          style={{
            background:
              "linear-gradient(135deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0) 22%), linear-gradient(315deg, rgba(0,0,0,0.10) 0%, rgba(0,0,0,0) 30%)",
            mixBlendMode: "soft-light",
          }}
        />
        {(scarcity.tier === "finalPiece" ||
          scarcity.tier === "rareFind" ||
          scarcity.tier === "archive") &&
          !soldOut && (
            <div
              aria-hidden
              className="pointer-events-none absolute -inset-2 z-[2] opacity-50 group-hover:opacity-100 transition-opacity duration-700"
              style={{
                background:
                  "radial-gradient(60% 55% at 50% 55%, color-mix(in oklch, var(--bronze) 32%, transparent) 0%, transparent 70%)",
                mixBlendMode: "screen",
              }}
            />
          )}

        {/* Badge priority — Farfetch-style restraint:
            Sold Out → Sale % off → New Season.
            Scarcity / Markdown / New In chips removed per brand direction;
            strikethrough price already signals reductions, and a single
            "New Season" tag covers freshness without clutter. */}
        {(() => {
          if (soldOut) {
            return (
              <span className="absolute top-3 left-3 z-10 text-[10px] uppercase tracking-[0.25em] bg-ink/80 text-canvas px-2 py-1">
                Sold Out
              </span>
            );
          }
          const hideMarkdown = suppressBadges.includes("markdown");
          if (onSale && !hideMarkdown && compareAt) {
            const was = parseFloat(compareAt.amount);
            const now = parseFloat(price.amount);
            const pct = was > 0 ? Math.round(((was - now) / was) * 100) : 0;
            if (pct > 0) {
              return (
                <span
                  className="absolute top-3 left-3 z-10 text-[10px] uppercase tracking-[0.25em] bg-canvas/95 backdrop-blur-sm text-ink border border-ink/15 px-2 py-1 font-medium"
                  title={`${pct}% off`}
                >
                  −{pct}%
                </span>
              );
            }
          }
          // "New Season" — only pieces whose description names the current
          // or upcoming season. Source of truth = the season token written
          // into each product's description (e.g. "SS26", "Spring/Summer
          // 2026", "FW26", "Fall/Winter 2026", "Resort 2027", "Pre-Fall
          // 2026", "Cruise 2027"). No more time-based heuristic.
          if (isCurrentOrUpcomingSeason(p.description)) {
            return (
              <span
                className="absolute top-3 left-3 z-10 text-[10px] uppercase tracking-[0.25em] bg-canvas/95 backdrop-blur-sm text-ink border border-ink/15 px-2 py-1 font-medium"
                title="New season arrival"
              >
                New Season
              </span>
            );
          }
          return null;
        })()}


        {/* Top-right actions — wishlist heart (always) + Quick View (desktop hover) */}
        <div className="absolute top-3 right-3 z-10 flex flex-col gap-2 items-end">
          <button
            type="button"
            onClick={onToggleWishlist}
            aria-label={wishlisted ? "Remove from wishlist" : "Save to wishlist"}
            aria-pressed={wishlisted}
            className="w-9 h-9 grid place-items-center bg-canvas/85 backdrop-blur-sm hover:bg-canvas transition-colors group/heart"
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
          {/* Quick-View — desktop hover only. Opens the size/variant sheet
              without navigating away. Mobile already has the inline reveal CTA. */}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setQuickViewOpen(true);
              track({ handle: p.handle, event: "hover", ...meta });
            }}
            aria-label="Quick view"
            title="Quick view"
            className="hidden md:grid w-9 h-9 place-items-center bg-canvas/85 backdrop-blur-sm hover:bg-ink hover:text-canvas transition-all opacity-0 -translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 duration-300"
          >
            <Eye className="w-4 h-4" strokeWidth={1.5} />
          </button>
        </div>

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
      <p className="text-[10px] uppercase tracking-[0.18em] mb-1.5 text-muted-foreground">{p.vendor}</p>
      <h3 className="text-[13px] md:text-sm font-medium leading-snug line-clamp-2 text-balance group-hover:underline underline-offset-4 decoration-ink/30">{p.title}</h3>
      <div className="flex items-baseline gap-2.5 mt-2">
        <PriceTag money={price} className="text-sm" />
        {onSale && <PriceTag money={compareAt} strike className="text-xs text-muted-foreground" />}
      </div>

    </Link>
    <QuickViewSheet
      product={product}
      open={quickViewOpen}
      onOpenChange={setQuickViewOpen}
    />
    </>
  );
}
