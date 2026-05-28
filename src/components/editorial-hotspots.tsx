import { useEffect, useMemo, useRef, useState } from "react";
import { useQueries, useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { fetchProductByHandle, formatPrice, type ShopifyProduct } from "@/lib/shopify";
import { useCartStore } from "@/stores/cart-store";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";


export type Hotspot = {
  /** Position in % of image width/height (0–100) */
  x: number;
  y: number;
  /** Short product category, e.g. "Eyewear" — optional. */
  label?: string;
  /** Optional secondary line, e.g. "Alexander McQueen". */
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

  // CATALOG-TRUTH GUARD: verify every hotspot's handle resolves to a live,
  // available product in the Shopify catalog. Hotspots whose product is
  // missing or sold out are filtered out before render so we never tag
  // images with items not actually purchasable (e.g. a shoulder bag pin
  // on an image whose linked McQueen bag is unavailable). Queries share
  // the ["hotspot-product", handle] cache key with HotspotCard so this
  // adds no extra network requests on subsequent reveals.
  const handleList = useMemo(
    () => Array.from(new Set(hotspots.map((h) => h.handle))),
    [hotspots],
  );
  const productQueries = useQueries({
    queries: handleList.map((handle) => ({
      queryKey: ["hotspot-product", handle],
      queryFn: () => fetchProductByHandle(handle),
      staleTime: 5 * 60 * 1000,
    })),
  });
  const availabilityByHandle = useMemo(() => {
    const map = new Map<string, "available" | "unavailable" | "unknown">();
    handleList.forEach((h, i) => {
      const q = productQueries[i];
      if (q.isLoading || q.isFetching) {
        map.set(h, "unknown");
      } else if (!q.data) {
        map.set(h, "unavailable");
      } else {
        const variants = q.data.variants?.edges?.map((e) => e.node) ?? [];
        const anyAvailable = variants.some((v) => v.availableForSale);
        map.set(h, anyAvailable ? "available" : "unavailable");
      }

    });
    return map;
  }, [handleList, productQueries]);
  const visibleHotspots = useMemo(
    () =>
      hotspots.filter(
        (h) => (availabilityByHandle.get(h.handle) ?? "unknown") !== "unavailable",
      ),
    [hotspots, availabilityByHandle],
  );


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

      {visibleHotspots.map((h) => {
        const tipId = `hotspot-tip-${h.handle}`;
        const isRightHalf = h.x > 65;
        const isBottomHalf = h.y > 70;
        const isRevealed = revealedHandle === h.handle;
        return (
          <div
            key={h.handle}
            className="absolute -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${h.x}%`, top: `${h.y}%` }}
            onMouseEnter={() => setRevealedHandle(h.handle)}
            onMouseLeave={() => setRevealedHandle((cur) => (cur === h.handle ? null : cur))}
          >
            <button
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
              aria-label={`Quick shop ${h.label ?? h.handle}${h.sublabel ? ` — ${h.sublabel}` : ""}`}
              aria-describedby={tipId}
              aria-haspopup="dialog"
              aria-expanded={isRevealed}
              className="group relative focus:outline-none"
            >
              {!reduced && (
                <span className="absolute inset-0 m-auto h-8 w-8 rounded-full bg-white/40 animate-ping" aria-hidden />
              )}
              <span
                className={`relative flex h-8 w-8 items-center justify-center rounded-full bg-white text-ink shadow-lg ring-1 ring-ink/10 ${
                  reduced ? "" : "transition-transform group-hover:scale-110 group-focus-visible:scale-110"
                } group-focus-visible:ring-2 group-focus-visible:ring-ink group-focus-visible:ring-offset-2 group-focus-visible:ring-offset-canvas ${
                  isRevealed ? (reduced ? "ring-2 ring-ink" : "scale-110 ring-2 ring-ink") : ""
                }`}
              >
                <Plus className="h-4 w-4" />
              </span>
            </button>

            <HotspotCard
              id={tipId}
              hotspot={h}
              visible={isRevealed}
              reduced={reduced}
              isBottomHalf={isBottomHalf}
              isRightHalf={isRightHalf}
              onOpenDialog={() => {
                setRevealedHandle(null);
                setOpenHandle(h.handle);
              }}
              onClose={() => setRevealedHandle(null)}
            />
          </div>
        );
      })}

      <QuickShopDialog handle={openHandle} onOpenChange={(o) => !o && setOpenHandle(null)} />
    </div>
  );
}

function HotspotCard({
  id,
  hotspot,
  visible,
  reduced,
  isBottomHalf,
  isRightHalf,
  onOpenDialog,
  onClose,
}: {
  id: string;
  hotspot: Hotspot;
  visible: boolean;
  reduced: boolean;
  isBottomHalf: boolean;
  isRightHalf: boolean;
  onOpenDialog: () => void;
  onClose: () => void;
}) {
  const addItem = useCartStore((s) => s.addItem);
  const openDrawer = useCartStore((s) => s.openDrawer);
  const cartLoading = useCartStore((s) => s.isLoading);
  const [adding, setAdding] = useState(false);

  // Lazy-fetch the product only when the card has been revealed at least once.
  const [primed, setPrimed] = useState(false);
  useEffect(() => {
    if (visible && !primed) setPrimed(true);
  }, [visible, primed]);

  const { data: product, isLoading } = useQuery({
    queryKey: ["hotspot-product", hotspot.handle],
    queryFn: () => fetchProductByHandle(hotspot.handle),
    enabled: primed,
    staleTime: 5 * 60 * 1000,
  });

  const variants = product?.variants?.edges?.map((e) => e.node) ?? [];
  const firstAvailable = variants.find((v) => v.availableForSale);
  // One-click quick-add is only safe when there's no size/colour choice to make.
  const isSingleDefault =
    variants.length === 1 && /default title/i.test(variants[0]?.title ?? "");
  const canOneClick = !!firstAvailable && (isSingleDefault || variants.length === 1);

  const priceText = product
    ? formatPrice(
        (firstAvailable ?? variants[0])?.price ?? product.priceRange.minVariantPrice,
      )
    : null;

  const handleQuickAdd = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!product || !firstAvailable || adding || cartLoading) return;
    if (!canOneClick) {
      onOpenDialog();
      return;
    }
    setAdding(true);
    const added = await addItem({
      product: { node: product },
      variantId: firstAvailable.id,
      variantTitle: firstAvailable.title,
      price: firstAvailable.price,
      quantity: 1,
      selectedOptions: firstAvailable.selectedOptions || [],
    });
    setAdding(false);
    if (!added) {
      toast.error("Could not add this item to bag.");
      return;
    }
    onClose();
    openDrawer();
  };

  return (
    <div
      id={id}
      role="tooltip"
      onClick={(e) => e.stopPropagation()}
      className={`absolute z-10 w-60 bg-canvas text-ink border border-ink/10 shadow-xl ${
        reduced ? "" : "transition-all duration-200"
      } ${visible ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 translate-y-1 pointer-events-none"} ${
        isBottomHalf ? "bottom-full mb-3" : "top-full mt-3"
      } ${isRightHalf ? "right-1/2 translate-x-2" : "left-1/2 -translate-x-2"}`}
    >
      <div className="p-3.5">
        {hotspot.label && (
          <span className="block text-[9px] uppercase tracking-[0.3em] text-bronze mb-1.5">
            {hotspot.label}
          </span>
        )}
        <span className="block text-[12px] font-medium leading-snug text-ink line-clamp-2 min-h-[2em]">
          {product?.title ?? hotspot.sublabel ?? "Loading…"}
        </span>
        {product?.vendor && (
          <span className="block text-[10px] uppercase tracking-[0.2em] text-muted-foreground mt-1">
            {product.vendor}
          </span>
        )}
        <span className="block text-[12px] text-ink mt-2 tabular-nums">
          {isLoading ? "—" : (priceText ?? "—")}
        </span>
        <button
          type="button"
          onClick={handleQuickAdd}
          disabled={isLoading || !product || (!firstAvailable && !!product)}
          className="mt-3 w-full bg-ink text-canvas text-[10px] uppercase tracking-[0.25em] py-2.5 hover:bg-bronze transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
        >
          {adding || cartLoading ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : !product && !isLoading ? (
            "Unavailable"
          ) : firstAvailable || !product ? (
            canOneClick ? "Quick Add" : "Quick Add — choose size"
          ) : (
            "Sold Out"
          )}
        </button>
      </div>
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

/**
 * DB-first variant: reads hotspots from the `lookbook_images` /
 * `lookbook_hotspots` tables for a given (surface_kind, surface_slug). If
 * no row is seeded yet, falls back to the inline `fallbackHotspots` so the
 * storefront never breaks while seeds are still propagating.
 *
 * The admin Lookbook Hotspots tool writes to those tables — so once seeded,
 * a placement correction made there is reflected on the public page
 * without a code change.
 */
export function EditorialHotspotsBySurface({
  surfaceKind,
  surfaceSlug,
  src,
  alt,
  fallbackHotspots,
  aspect = "4/5",
  className = "",
}: {
  surfaceKind: string;
  surfaceSlug: string;
  src: string;
  alt: string;
  fallbackHotspots: Hotspot[];
  aspect?: string;
  className?: string;
}) {
  // Lazy-import the server fn to avoid bundling the admin reader into all
  // pages that just import editorial-hotspots. useQuery owns SWR for us.
  const { useServerFn } = require("@tanstack/react-start") as typeof import("@tanstack/react-start");
  const { getLookbookForSurface } = require("@/lib/lookbook-hotspots.functions") as typeof import("@/lib/lookbook-hotspots.functions");
  const fetcher = useServerFn(getLookbookForSurface);
  const { data } = useQuery({
    queryKey: ["lookbook-surface", surfaceKind, surfaceSlug],
    queryFn: () =>
      fetcher({ data: { surface_kind: surfaceKind, surface_slug: surfaceSlug } }),
    staleTime: 60_000,
  });
  const spots = useMemo<Hotspot[]>(() => {
    if (data?.image && data.hotspots.length > 0) {
      return data.hotspots.map((h) => ({
        x: Number(h.x),
        y: Number(h.y),
        handle: h.product_handle,
        label: h.label ?? undefined,
      }));
    }
    return fallbackHotspots;
  }, [data, fallbackHotspots]);
  const effectiveSrc = data?.image?.image_url ?? src;
  const effectiveAlt = data?.image?.alt_text ?? alt;
  return (
    <EditorialHotspots
      src={effectiveSrc}
      alt={effectiveAlt}
      hotspots={spots}
      aspect={aspect}
      className={className}
    />
  );
}

