import { useMemo, useState } from "react";
import { Loader2, ShoppingBag, X } from "lucide-react";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { formatPrice, type ShopifyProduct } from "@/lib/shopify";
import { cdnImage } from "@/lib/cdn-image";
import { useCartStore } from "@/stores/cart-store";
import { useInteractionStore } from "@/stores/interaction-store";
import { formatLuxuryTitle } from "@/utils/productHelpers";

/**
 * In-grid size picker. Lets shoppers add a multi-variant piece to bag
 * without a PDP detour — the single biggest ATC leak on listing pages.
 * Multi-variant items previously navigated away; this keeps them in flow.
 */
export function QuickViewSheet({
  product,
  open,
  onOpenChange,
}: {
  product: ShopifyProduct;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const p = product.node;
  const img = p.images?.edges?.[0]?.node;
  const variants = useMemo(
    () => p.variants?.edges?.map((e) => e.node) ?? [],
    [p.variants],
  );

  // Surface the size option (or first multi-value option) for picking.
  const sizeOption = useMemo(() => {
    const opts = p.options ?? [];
    return (
      opts.find((o) => /size/i.test(o.name)) ??
      opts.find((o) => o.values.length > 1) ??
      null
    );
  }, [p.options]);

  const [selectedValue, setSelectedValue] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  const matchedVariant = useMemo(() => {
    if (!sizeOption) return variants.find((v) => v.availableForSale) ?? null;
    if (!selectedValue) return null;
    return (
      variants.find((v) =>
        v.selectedOptions?.some(
          (o) => o.name === sizeOption.name && o.value === selectedValue,
        ),
      ) ?? null
    );
  }, [variants, sizeOption, selectedValue]);

  const addItem = useCartStore((s) => s.addItem);
  const openDrawer = useCartStore((s) => s.openDrawer);
  const track = useInteractionStore((s) => s.track);

  const handleAdd = async () => {
    if (!matchedVariant) {
      toast.error("Please choose a size first.");
      return;
    }
    if (!matchedVariant.availableForSale) return;
    setAdding(true);
    try {
      const ok = await addItem({
        product,
        variantId: matchedVariant.id,
        variantTitle: matchedVariant.title,
        price: matchedVariant.price,
        quantity: 1,
        selectedOptions: matchedVariant.selectedOptions ?? [],
      });
      if (!ok) {
        toast.error("Could not add this piece. Please try another size.");
        return;
      }
      track({
        handle: p.handle,
        event: "cart",
        vendor: p.vendor,
        productType: p.productType,
      });
      onOpenChange(false);
      openDrawer();
      toast.success(`${p.title} — added to bag`);
    } finally {
      setAdding(false);
    }
  };

  const price = p.priceRange.minVariantPrice;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md flex flex-col h-full bg-canvas border-l border-ink/10 p-0 gap-0"
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-ink/10">
          <SheetTitle className="text-[10px] uppercase tracking-[0.3em] font-medium">
            Quick Add
          </SheetTitle>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            aria-label="Close"
            className="text-muted-foreground hover:text-ink"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {img && (
            <div className="w-full aspect-[4/5] bg-muted">
              <img
                src={cdnImage(img.url, { width: 900 })}
                alt={img.altText ?? p.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <div className="px-6 py-6 space-y-5">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-bronze mb-1">
                {p.vendor}
              </p>
              <h3 className="text-base font-medium leading-snug">{p.title}</h3>
              <p className="text-sm mt-2">{formatPrice(price)}</p>
            </div>

            {sizeOption && (
              <div className="space-y-3">
                <p className="text-[10px] uppercase tracking-[0.25em] text-ink/70">
                  {sizeOption.name}
                </p>
                <div className="flex flex-wrap gap-2">
                  {sizeOption.values.map((value) => {
                    const variantForValue = variants.find((v) =>
                      v.selectedOptions?.some(
                        (o) =>
                          o.name === sizeOption.name && o.value === value,
                      ),
                    );
                    const disabled =
                      !variantForValue ||
                      !variantForValue.availableForSale;
                    const active = selectedValue === value;
                    return (
                      <button
                        key={value}
                        type="button"
                        disabled={disabled}
                        onClick={() => setSelectedValue(value)}
                        className={[
                          "min-w-[48px] h-10 px-3 border text-xs uppercase tracking-widest transition-colors",
                          active
                            ? "bg-ink text-canvas border-ink"
                            : "bg-canvas text-ink border-ink/20 hover:border-ink",
                          disabled &&
                            "opacity-40 line-through cursor-not-allowed hover:border-ink/20",
                        ]
                          .filter(Boolean)
                          .join(" ")}
                      >
                        {value}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-ink/10 px-6 py-5">
          <button
            type="button"
            onClick={handleAdd}
            disabled={adding || (sizeOption !== null && !matchedVariant)}
            className="w-full h-12 bg-ink text-canvas hover:bg-bronze transition-colors text-[11px] uppercase tracking-[0.25em] font-medium inline-flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {adding ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : matchedVariant && !matchedVariant.availableForSale ? (
              "Sold Out"
            ) : (
              <>
                <ShoppingBag className="w-3.5 h-3.5" strokeWidth={1.5} />
                Add to Bag
              </>
            )}
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
