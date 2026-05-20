import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { fetchProductByHandle, formatPrice, type ShopifyProduct } from "@/lib/shopify";
import { useCartStore } from "@/stores/cart-store";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";

export type Hotspot = {
  /** Position in % of image width/height */
  x: number;
  y: number;
  /** Short product category, e.g. "Eyewear" */
  label: string;
  /** Optional secondary line, e.g. "Alexander McQueen" */
  sublabel?: string;
  handle: string;
};

type Props = {
  src: string;
  alt: string;
  hotspots: Hotspot[];
  aspect?: string; // e.g. "4/5"
  className?: string;
};

export function EditorialHotspots({ src, alt, hotspots, aspect = "4/5", className = "" }: Props) {
  const [openHandle, setOpenHandle] = useState<string | null>(null);
  const [revealedHandle, setRevealedHandle] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { reduced } = useReducedMotion();

  // Close the revealed tooltip when tapping outside any hotspot
  useEffect(() => {
    if (!revealedHandle) return;
    const onDown = (e: PointerEvent) => {
      const el = e.target as Node | null;
      if (!containerRef.current?.contains(el)) setRevealedHandle(null);
      else if (el instanceof Element && !el.closest("[data-hotspot]")) setRevealedHandle(null);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [revealedHandle]);

  const vibrate = (pattern: number | number[]) => {
    if (reduced) return;
    if (typeof navigator === "undefined") return;
    const nav = navigator as Navigator & { vibrate?: (p: number | number[]) => boolean };
    try { nav.vibrate?.(pattern); } catch { /* ignore */ }
  };

  const handleActivate = (handle: string, pointerType: string) => {
    // Coarse pointer (touch/pen): first tap reveals tooltip, second opens dialog
    const isCoarse = pointerType === "touch" || pointerType === "pen";
    if (isCoarse && revealedHandle !== handle) {
      vibrate(8); // subtle tick on reveal
      setRevealedHandle(handle);
      return;
    }
    if (isCoarse) vibrate([10, 30, 14]); // double-pulse on open
    setRevealedHandle(null);
    setOpenHandle(handle);
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full bg-canvas-raised overflow-hidden ${className}`}
      style={{ aspectRatio: aspect }}
    >
      <img src={src} alt={alt} loading="lazy" className="absolute inset-0 w-full h-full object-cover" />

      {hotspots.map((h) => {
        const tipId = `hotspot-tip-${h.handle}`;
        const isRightHalf = h.x > 65;
        const isBottomHalf = h.y > 70;
        const isRevealed = revealedHandle === h.handle;
        return (
          <button
            key={h.handle}
            type="button"
            data-hotspot
            onPointerUp={(e) => handleActivate(h.handle, e.pointerType)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setRevealedHandle(null);
                setOpenHandle(h.handle);
              }
            }}
            aria-label={`Quick shop ${h.label}${h.sublabel ? ` — ${h.sublabel}` : ""}`}
            aria-describedby={tipId}
            aria-haspopup="dialog"
            aria-expanded={isRevealed}
            className="group absolute -translate-x-1/2 -translate-y-1/2 focus:outline-none"
            style={{ left: `${h.x}%`, top: `${h.y}%` }}
          >
            {/* pulse ring — suppressed for reduced motion */}
            {!reduced && (
              <span className="absolute inset-0 m-auto h-8 w-8 rounded-full bg-white/40 animate-ping" aria-hidden />
            )}
            {/* dot */}
            <span
              className={`relative flex h-8 w-8 items-center justify-center rounded-full bg-white text-ink shadow-lg ring-1 ring-ink/10 ${
                reduced ? "" : "transition-transform group-hover:scale-110 group-focus-visible:scale-110"
              } group-focus-visible:ring-2 group-focus-visible:ring-ink group-focus-visible:ring-offset-2 group-focus-visible:ring-offset-canvas ${
                isRevealed ? (reduced ? "ring-2 ring-ink" : "scale-110 ring-2 ring-ink") : ""
              }`}
            >
              <Plus className="h-4 w-4" />
            </span>
            {/* tooltip — shown on hover, keyboard focus, or first tap on touch */}
            <span
              id={tipId}
              role="tooltip"
              className={`pointer-events-none absolute z-10 min-w-max max-w-[12rem] bg-ink px-3 py-2 text-left text-white shadow-xl ${
                reduced ? "" : "transition-all duration-200"
              } group-hover:opacity-100 group-hover:translate-y-0 group-focus-visible:opacity-100 group-focus-visible:translate-y-0 ${
                isRevealed ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1"
              } ${isBottomHalf ? "bottom-full mb-3" : "top-full mt-3"} ${
                isRightHalf ? "right-1/2 translate-x-2" : "left-1/2 -translate-x-2"
              }`}
            >
              <span className="block text-[9px] uppercase tracking-[0.3em] text-bronze">{h.label}</span>
              {h.sublabel && (
                <span className="block text-[11px] font-medium leading-tight mt-1">{h.sublabel}</span>
              )}
              <span className="block text-[9px] uppercase tracking-[0.25em] text-white/60 mt-1.5">
                {isRevealed ? "Tap again to open →" : "Quick shop →"}
              </span>
            </span>
          </button>
        );
      })}

      <QuickShopDialog handle={openHandle} onOpenChange={(o) => !o && setOpenHandle(null)} />
    </div>
  );
}

function QuickShopDialog({ handle, onOpenChange }: { handle: string | null; onOpenChange: (open: boolean) => void }) {
  const enabled = !!handle;
  const { data, isLoading } = useQuery({
    queryKey: ["product", handle],
    queryFn: () => fetchProductByHandle(handle!),
    enabled,
    staleTime: 5 * 60 * 1000,
  });

  const product = data as ShopifyProduct["node"] | null | undefined;

  return (
    <Dialog open={enabled} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl p-0 overflow-hidden gap-0 bg-canvas">
        {isLoading || !product ? (
          <div className="flex h-[60vh] items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            <DialogTitle className="sr-only">Loading product</DialogTitle>
          </div>
        ) : (
          <QuickShopBody product={product} onClose={() => onOpenChange(false)} />
        )}
      </DialogContent>
    </Dialog>
  );
}

function QuickShopBody({ product, onClose }: { product: ShopifyProduct["node"]; onClose: () => void }) {
  const img = product.images?.edges?.[0]?.node;
  const variants = product.variants?.edges?.map((e) => e.node) ?? [];
  const firstAvailable = variants.find((v) => v.availableForSale) ?? variants[0];
  const [variantId, setVariantId] = useState(firstAvailable?.id);
  const selected = variants.find((v) => v.id === variantId) ?? firstAvailable;
  const addItem = useCartStore((s) => s.addItem);
  const openDrawer = useCartStore((s) => s.openDrawer);
  const isLoading = useCartStore((s) => s.isLoading);
  const isSingleDefault = variants.length === 1 && /default title/i.test(variants[0]?.title ?? "");

  const handleAdd = async () => {
    if (!selected) return;
    const added = await addItem({
      product: { node: product },
      variantId: selected.id,
      variantTitle: selected.title,
      price: selected.price,
      quantity: 1,
      selectedOptions: selected.selectedOptions || [],
    });
    if (!added) {
      toast.error("Could not add this item to bag.", { description: "Please try another size or refresh the page." });
      return;
    }
    onClose();
    openDrawer();
  };

  return (
    <div className="grid md:grid-cols-2">
      <div className="aspect-[4/5] bg-canvas-raised">
        {img && <img src={img.url} alt={img.altText ?? product.title} className="h-full w-full object-cover" />}
      </div>
      <div className="flex flex-col p-8 gap-5">
        <div>
          <p className="text-[10px] uppercase tracking-[0.3em] text-bronze mb-2">{product.vendor}</p>
          <DialogTitle className="text-xl font-serif leading-snug text-balance">{product.title}</DialogTitle>
          <p className="text-base mt-2">{selected ? formatPrice(selected.price) : formatPrice(product.priceRange.minVariantPrice)}</p>
        </div>

        <DialogDescription className="sr-only">Quick shop — choose a variant and add to your bag.</DialogDescription>

        {!isSingleDefault && variants.length > 1 && (
          <div>
            <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground mb-2">Select option</p>
            <div className="flex flex-wrap gap-2">
              {variants.map((v) => {
                const active = v.id === variantId;
                return (
                  <button
                    key={v.id}
                    type="button"
                    disabled={!v.availableForSale}
                    onClick={() => setVariantId(v.id)}
                    className={`px-3 py-2 text-xs border transition-colors ${
                      active ? "border-ink bg-ink text-canvas" : "border-ink/20 hover:border-ink/60"
                    } ${!v.availableForSale ? "opacity-40 line-through" : ""}`}
                  >
                    {v.title}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex flex-col gap-2 mt-auto pt-4">
          <Button onClick={handleAdd} disabled={!selected?.availableForSale || isLoading} className="w-full rounded-none h-12 text-[11px] uppercase tracking-[0.25em]">
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : selected?.availableForSale ? "Add to bag" : "Sold out"}
          </Button>
          <Link
            to="/product/$handle"
            params={{ handle: product.handle }}
            onClick={onClose}
            className="text-center text-[11px] uppercase tracking-[0.25em] text-muted-foreground hover:text-ink pt-2"
          >
            View full details →
          </Link>
        </div>
      </div>
    </div>
  );
}
