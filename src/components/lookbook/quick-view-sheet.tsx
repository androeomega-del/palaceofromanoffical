/**
 * QuickViewSheet — Burberry-style off-white side sheet. Embla carousel left,
 * variant selectors + Add-to-bag right. Hands off to the existing cart store
 * untouched; cart drawer opens via existing setDrawerOpen mechanism.
 */
import { useEffect, useMemo, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { type ShopifyProductNode, formatPrice } from "@/lib/shopify";
import { useCartStore } from "@/stores/cart-store";

interface QuickViewSheetProps {
  product: ShopifyProductNode | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function QuickViewSheet({ product, open, onOpenChange }: QuickViewSheetProps) {
  const addItem = useCartStore((s) => s.addItem);
  const openCart = useCartStore((s) => s.openDrawer);
  const isLoading = useCartStore((s) => s.isLoading);

  const [emblaRef, embla] = useEmblaCarousel({ loop: false, dragFree: false });
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    if (!embla) return;
    const onSelect = () => setSelectedIndex(embla.selectedScrollSnap());
    embla.on("select", onSelect);
    onSelect();
    return () => {
      embla.off("select", onSelect);
    };
  }, [embla]);

  // Variant selection per option name (e.g. { Size: "M", Color: "Navy" })
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});

  // Reset selections when product changes
  useEffect(() => {
    if (!product) {
      setSelectedOptions({});
      return;
    }
    const initial: Record<string, string> = {};
    for (const opt of product.options) {
      // Prefer the first available variant's value for this option
      const firstAvail = product.variants.edges.find((v) => v.node.availableForSale);
      const v = firstAvail?.node.selectedOptions.find((o) => o.name === opt.name)?.value;
      initial[opt.name] = v ?? opt.values[0];
    }
    setSelectedOptions(initial);
  }, [product?.id]);

  const matchedVariant = useMemo(() => {
    if (!product) return null;
    return product.variants.edges.find((v) =>
      v.node.selectedOptions.every((o) => selectedOptions[o.name] === o.value),
    )?.node ?? null;
  }, [product, selectedOptions]);

  const handleAdd = async () => {
    if (!product || !matchedVariant) return;
    const ok = await addItem({
      product: { node: product },
      variantId: matchedVariant.id,
      variantTitle: matchedVariant.title,
      price: matchedVariant.price,
      quantity: 1,
      selectedOptions: matchedVariant.selectedOptions,
    });
    if (ok) {
      onOpenChange(false);
      openCart();
    } else {
      toast.error("Couldn't add to bag", { description: "Please try again or refresh the page." });
    }
  };

  const images = product?.images.edges ?? [];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-2xl p-0 bg-[oklch(0.97_0.005_85)] text-ink border-l border-ink/10"
      >
        <SheetHeader className="sr-only">
          <SheetTitle>{product?.title ?? "Quick view"}</SheetTitle>
        </SheetHeader>

        {product ? (
          <div className="grid grid-cols-1 md:grid-cols-[1.05fr_1fr] h-full overflow-y-auto">
            {/* Image carousel */}
            <div className="relative bg-[oklch(0.93_0.012_82)]">
              <div className="overflow-hidden h-full" ref={emblaRef}>
                <div className="flex h-full">
                  {images.length === 0 ? (
                    <div className="flex-[0_0_100%] aspect-[3/4] bg-ink/5" />
                  ) : (
                    images.map((e, i) => (
                      <div key={i} className="flex-[0_0_100%] aspect-[3/4]">
                        <img
                          src={e.node.url}
                          alt={e.node.altText ?? product.title}
                          loading={i === 0 ? "eager" : "lazy"}
                          decoding="async"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))
                  )}
                </div>
              </div>
              {images.length > 1 && (
                <div className="absolute bottom-4 inset-x-0 flex justify-center gap-1.5">
                  {images.map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      aria-label={`Image ${i + 1}`}
                      onClick={() => embla?.scrollTo(i)}
                      className={
                        "w-6 h-[2px] transition-colors " +
                        (i === selectedIndex ? "bg-ink" : "bg-ink/25")
                      }
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Details */}
            <div className="px-7 md:px-9 py-9 md:py-12 flex flex-col">
              {product.vendor && (
                <p className="text-[10px] uppercase tracking-[0.32em] text-bronze mb-3">
                  {product.vendor}
                </p>
              )}
              <h2 className="font-serif text-2xl md:text-3xl leading-tight text-ink">
                {product.title}
              </h2>
              <p className="mt-3 text-base text-ink">
                {formatPrice(matchedVariant?.price ?? product.priceRange.minVariantPrice)}
              </p>

              {product.description && (
                <p className="mt-5 text-[13px] leading-relaxed text-muted-foreground line-clamp-4">
                  {product.description}
                </p>
              )}

              {/* Variant selectors */}
              <div className="mt-7 space-y-5">
                {product.options.map((opt) => (
                  <div key={opt.name}>
                    <p className="text-[10px] uppercase tracking-[0.3em] text-ink/70 mb-2">
                      {opt.name}
                      <span className="ml-2 text-ink">{selectedOptions[opt.name]}</span>
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {opt.values.map((v) => {
                        // A value is available if some variant with this value + current other selections is in stock
                        const candidate = product.variants.edges.find((va) =>
                          va.node.selectedOptions.every((o) =>
                            o.name === opt.name ? o.value === v : selectedOptions[o.name] === o.value,
                          ),
                        );
                        const available = candidate?.node.availableForSale ?? false;
                        const active = selectedOptions[opt.name] === v;
                        return (
                          <button
                            key={v}
                            type="button"
                            disabled={!available}
                            onClick={() =>
                              setSelectedOptions((prev) => ({ ...prev, [opt.name]: v }))
                            }
                            className={
                              "min-w-[42px] px-3 py-2 text-[11px] tracking-wide border transition-colors " +
                              (active
                                ? "border-ink bg-ink text-canvas"
                                : available
                                  ? "border-ink/25 hover:border-ink"
                                  : "border-ink/10 text-ink/30 line-through cursor-not-allowed")
                            }
                          >
                            {v}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={handleAdd}
                disabled={!matchedVariant?.availableForSale || isLoading}
                className="mt-9 w-full py-4 bg-ink text-canvas text-[11px] uppercase tracking-[0.3em] hover:bg-bronze hover:text-canvas transition-colors disabled:bg-ink/30 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : matchedVariant?.availableForSale ? (
                  "Add to bag"
                ) : (
                  "Out of stock"
                )}
              </button>

              <a
                href={`/product/${product.handle}`}
                className="mt-4 text-center text-[11px] uppercase tracking-[0.25em] text-ink/70 hover:text-ink border-b border-ink/20 hover:border-ink pb-1 self-center"
              >
                View full details →
              </a>
            </div>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center">
            <Loader2 className="w-5 h-5 animate-spin text-ink/50" />
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
