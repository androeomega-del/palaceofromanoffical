import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { fetchProductByHandle, formatPrice, type ShopifyProduct } from "@/lib/shopify";
import { useCartStore } from "@/stores/cart-store";
import { Loader2, Plus } from "lucide-react";

export type Hotspot = {
  /** Position in % of image width/height */
  x: number;
  y: number;
  label: string;
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

  return (
    <div className={`relative w-full bg-canvas-raised overflow-hidden ${className}`} style={{ aspectRatio: aspect }}>
      <img src={src} alt={alt} loading="lazy" className="absolute inset-0 w-full h-full object-cover" />

      {hotspots.map((h) => (
        <button
          key={h.handle}
          type="button"
          onClick={() => setOpenHandle(h.handle)}
          aria-label={`Shop ${h.label}`}
          className="group absolute -translate-x-1/2 -translate-y-1/2"
          style={{ left: `${h.x}%`, top: `${h.y}%` }}
        >
          {/* pulse ring */}
          <span className="absolute inset-0 m-auto h-8 w-8 rounded-full bg-white/40 animate-ping" aria-hidden />
          {/* dot */}
          <span className="relative flex h-8 w-8 items-center justify-center rounded-full bg-white text-ink shadow-lg ring-1 ring-ink/10 transition-transform group-hover:scale-110">
            <Plus className="h-4 w-4" />
          </span>
          {/* tooltip */}
          <span className="pointer-events-none absolute left-1/2 top-full mt-2 -translate-x-1/2 whitespace-nowrap rounded-sm bg-ink px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-white opacity-0 transition-opacity group-hover:opacity-100">
            {h.label}
          </span>
        </button>
      ))}

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
  const isLoading = useCartStore((s) => s.isLoading);
  const isSingleDefault = variants.length === 1 && /default title/i.test(variants[0]?.title ?? "");

  const handleAdd = async () => {
    if (!selected) return;
    await addItem({
      product: { node: product },
      variantId: selected.id,
      variantTitle: selected.title,
      price: selected.price,
      quantity: 1,
      selectedOptions: selected.selectedOptions || [],
    });
    onClose();
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
