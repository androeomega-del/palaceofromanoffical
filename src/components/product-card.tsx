import { Link, useNavigate } from "@tanstack/react-router";
import { Loader2, ShoppingBag, Zap } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { formatPrice, type ShopifyProduct } from "@/lib/shopify";
import { useCartStore } from "@/stores/cart-store";


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

  const navigate = useNavigate();
  const addItem = useCartStore((s) => s.addItem);
  const openDrawer = useCartStore((s) => s.openDrawer);
  const isLoading = useCartStore((s) => s.isLoading);
  const [buyingNow, setBuyingNow] = useState(false);

  const altBase = p.vendor ? `${p.title} — ${p.vendor}` : p.title;

  const onAdd = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (soldOut) return;
    if (hasChoices || !firstAvailable) {
      navigate({ to: "/product/$handle", params: { handle: p.handle } });
      return;
    }
    await addItem({
      product,
      variantId: firstAvailable.id,
      variantTitle: firstAvailable.title,
      price: firstAvailable.price,
      quantity: 1,
      selectedOptions: firstAvailable.selectedOptions ?? [],
    });
    openDrawer();
    toast.success(`${p.title} — added to bag`);
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
      await addItem({
        product,
        variantId: firstAvailable.id,
        variantTitle: firstAvailable.title,
        price: firstAvailable.price,
        quantity: 1,
        selectedOptions: firstAvailable.selectedOptions ?? [],
      });
      const checkoutUrl = useCartStore.getState().checkoutUrl;
      if (checkoutUrl) {
        window.open(checkoutUrl, "_blank", "noopener,noreferrer");
      } else {
        toast.error("Could not start checkout. Please try again.");
      }
    } finally {
      setBuyingNow(false);
    }
  };

  const addLabel = soldOut ? "Sold Out" : hasChoices ? "Select Options" : "Add to Bag";


  return (
    <Link to="/product/$handle" params={{ handle: p.handle }} className="group block">
      <div className="w-full aspect-[4/5] bg-muted relative overflow-hidden mb-5">
        {img && (
          <img
            src={img.url}
            alt={img.altText ?? altBase}
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover transition-opacity duration-700 group-hover:opacity-0"
          />
        )}
        {img2 ? (
          <img
            src={img2.url}
            alt={img2.altText ?? altBase}
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-700"
          />
        ) : (
          img && (
            <img
              src={img.url}
              alt=""
              aria-hidden
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

        {/* CTAs — visible on hover (desktop), always on touch */}
        <div className="absolute inset-x-3 bottom-3 flex gap-2 opacity-100 lg:opacity-0 lg:translate-y-2 lg:group-hover:opacity-100 lg:group-hover:translate-y-0 transition-all duration-500">
          <button
            type="button"
            onClick={onAdd}
            disabled={isLoading || soldOut}
            aria-label={addLabel}
            className="flex-1 h-11 bg-ink text-canvas hover:bg-bronze transition-colors duration-300 text-[10px] uppercase tracking-[0.25em] font-medium inline-flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isLoading && !buyingNow ? (
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
              disabled={buyingNow || isLoading}
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

      </div>
      <p className="text-[10px] uppercase tracking-widest mb-1 text-bronze">{p.vendor}</p>
      <h3 className="text-sm font-medium leading-snug line-clamp-2 text-balance">{p.title}</h3>
      <div className="flex items-baseline gap-3 mt-1.5">
        <p className="text-sm">{formatPrice(price)}</p>
        {onSale && <p className="text-xs text-muted-foreground line-through">{formatPrice(compareAt)}</p>}
      </div>
    </Link>
  );
}
