import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Minus, Plus, X, Loader2, ShoppingBag } from "lucide-react";
import { useEffect, useState } from "react";
import { useCartStore } from "@/stores/cart-store";
import { formatPrice } from "@/lib/shopify";
import { trackCartEvent } from "@/lib/cart-analytics";

export function CartDrawer({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  // 1. Add mount state to prevent hydration errors
  const [isMounted, setIsMounted] = useState(false);
  
  const { items, isLoading, isSyncing, updateQuantity, removeItem, getCheckoutUrl, syncCart } = useCartStore();
  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const totalAmount = items.reduce((sum, i) => sum + parseFloat(i.price.amount) * i.quantity, 0);
  const currency = items[0]?.price.currencyCode ?? "USD";

  // 2. Set mounted to true once the browser takes over
  useEffect(() => { 
    setIsMounted(true);
    if (open) syncCart(); 
  }, [open, syncCart]);

  const handleCheckout = () => {
    const url = getCheckoutUrl();
    if (url) {
      trackCartEvent({
        event_type: "checkout_started",
        quantity: totalItems,
        price_usd: totalAmount,
      });

      trackCartEvent({
        event_type: "reached_checkout",
        quantity: totalItems,
        price_usd: totalAmount,
      });

      window.location.href = url;
    }
  };

  // 3. Hydration Safeguard: Render nothing on the server, render the cart on the browser
  if (!isMounted) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md flex flex-col h-full bg-canvas border-l border-ink/10 p-0 gap-0">
        <SheetHeader className="px-6 py-6 border-b border-ink/10">
          <SheetTitle className="text-xs uppercase tracking-[0.3em] font-medium text-left">
            Shopping Bag {totalItems > 0 && <span className="text-muted-foreground">({totalItems})</span>}
          </SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 px-6">
            <ShoppingBag className="w-8 h-8 text-muted-foreground" strokeWidth={1} />
            <p className="text-sm text-muted-foreground">Your bag is empty</p>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-6 py-6">
              <ul className="space-y-8">
                {items.map((item) => {
                  const img = item.product.node.images?.edges?.[0]?.node;
                  return (
                    <li key={item.variantId} className="flex gap-4">
                      <div className="w-20 h-24 bg-muted overflow-hidden flex-shrink-0">
                        {img && <img src={img.url} alt={img.altText ?? item.product.node.title} className="w-full h-full object-cover" />}
                      </div>
                      <div className="flex-1 min-w-0 flex flex-col">
                        <p className="text-[10px] uppercase tracking-widest text-bronze">{item.product.node.vendor}</p>
                        <h4 className="text-sm font-medium leading-snug mt-1 line-clamp-2">{item.product.node.title}</h4>
                        <p className="text-[11px] text-muted-foreground mt-1">
                          {item.selectedOptions.map((o) => o.value).join(" · ")}
                        </p>
                        <div className="flex items-center justify-between mt-auto pt-3">
                          <div className="flex items-center border border-ink/10">
                            <button onClick={() => updateQuantity(item.variantId, item.quantity - 1)} className="p-1.5 hover:bg-ink/5" aria-label="Decrease">
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="text-xs w-6 text-center">{item.quantity}</span>
                            <button onClick={() => updateQuantity(item.variantId, item.quantity + 1)} className="p-1.5 hover:bg-ink/5" aria-label="Increase">
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                          <p className="text-sm">{formatPrice(item.price)}</p>
                        </div>
                      </div>
                      <button onClick={() => removeItem(item.variantId)} aria-label="Remove" className="text-muted-foreground hover:text-ink h-fit">
                        <X className="w-4 h-4" />
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>

            <div className="border-t border-ink/10 px-6 py-6 space-y-4">
              <div className="flex justify-between items-baseline">
                <span className="text-xs uppercase tracking-[0.2em]">Subtotal</span>
                <span className="text-lg font-serif">
                  {formatPrice({ amount: totalAmount.toFixed(2), currencyCode: currency })}
                </span>
              </div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Taxes and shipping calculated at checkout</p>
              <Button
                onClick={handleCheckout}
                disabled={isLoading || isSyncing}
                className="w-full bg-ink text-canvas hover:bg-ink/90 rounded-none h-12 text-[11px] uppercase tracking-[0.25em] font-medium"
              >
                {isLoading || isSyncing ? <Loader2 className="w-4 h-4 animate-spin" /> : "Proceed to Checkout"}
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
