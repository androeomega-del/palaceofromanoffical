import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Minus, Plus, X, Loader2, ShoppingBag, ArrowRight, ShieldCheck, RotateCcw, Lock } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useCartStore } from "@/stores/cart-store";
import { formatPrice } from "@/lib/shopify";
import { trackCartEvent } from "@/lib/cart-analytics";
import { CartFbt } from "@/components/cart-fbt";
import { CartEmailCapture, type CartEmailCaptureHandle } from "@/components/atelier/cart-email-capture";
import { VipPriorityAccess } from "@/components/atelier/vip-priority-access";
import { ExpressCheckoutButtons } from "@/components/express-checkout-buttons";



export function CartDrawer({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  // 1. Add mount state to prevent hydration errors
  const [isMounted, setIsMounted] = useState(false);

  const store = useCartStore();
  const { isLoading, isSyncing, updateQuantity, removeItem, getCheckoutUrl, syncCart } = store;
  const items = store.items;
  const totalItems = items.reduce((sum: number, i: any) => sum + i.quantity, 0);
  const totalAmount = items.reduce((sum: number, i: any) => sum + parseFloat(i.price.amount) * i.quantity, 0);
  const currency = items[0]?.price.currencyCode ?? "USD";
  const fbtProductType = items[0]?.product?.node?.productType ?? null;
  const fbtExclude = useMemo(
    () => new Set<string>(items.map((i: any) => i.product.node.handle as string)),
    [items],
  );

  // 2. Set mounted to true once the browser takes over
  useEffect(() => {
    setIsMounted(true);
    if (open) syncCart();
  }, [open, syncCart]);



  const emailCaptureRef = useRef<CartEmailCaptureHandle | null>(null);

  const handleCheckout = () => {
    const url = getCheckoutUrl();
    if (!url) return;

    // Email is required — block checkout until a valid address is saved.
    const hasEmail = emailCaptureRef.current?.promptIfMissing() ?? true;
    if (!hasEmail) return;

    trackCartEvent({
      event_type: "checkout_started",
      quantity: totalItems,
      price_usd: totalAmount,
    });

    const win = window.open(url, "_blank", "noopener,noreferrer");
    if (win) {
      trackCartEvent({
        event_type: "reached_checkout",
        quantity: totalItems,
        price_usd: totalAmount,
      });
      onOpenChange(false);
    }
  };

  // 3. Hydration Safeguard: Render nothing on the server, render the cart on the browser
  if (!isMounted) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        className="studio obsidian w-full sm:max-w-md flex flex-col h-full bg-canvas border-l border-ink/10 p-0 gap-0"
        style={{ transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)" }}
      >
        <SheetHeader className="px-6 py-6 border-b border-ink/10">
          <SheetTitle className="text-xs uppercase tracking-[0.3em] font-medium text-left">
            Shopping Bag {totalItems > 0 && <span className="text-muted-foreground">({totalItems})</span>}
          </SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-5 px-6 text-center">
            <ShoppingBag className="w-9 h-9 text-muted-foreground" strokeWidth={1} />
            <div className="space-y-1.5">
              <p className="text-sm">Your bag is empty</p>
              <p className="text-[11px] text-muted-foreground max-w-[26ch] mx-auto leading-relaxed">
                Pieces you add will live here until you're ready to check out.
              </p>
            </div>
            <Link
              to="/shop"
              onClick={() => onOpenChange(false)}
              className="mt-2 inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] border-b border-ink pb-1 hover:text-bronze hover:border-bronze transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bronze focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
            >
              Browse the House <ArrowRight className="w-3 h-3" strokeWidth={1.5} />
            </Link>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto">
              <VipPriorityAccess />
              <ul className="space-y-8 px-6 py-6">
                {items.map((item: any) => {
                  const img = item.product.node.images?.edges?.[0]?.node;
                  return (
                    <li key={item.variantId} className="flex gap-4">
                      <div className="w-20 h-24 bg-canvas-raised overflow-hidden flex-shrink-0">
                        {img && <img src={img.url} alt={img.altText ?? item.product.node.title} className="w-full h-full object-contain p-2" />}
                      </div>
                      <div className="flex-1 min-w-0 flex flex-col">
                        <p className="text-[10px] uppercase tracking-widest text-bronze">{item.product.node.vendor}</p>
                        <h4 className="text-sm font-medium leading-snug mt-1 line-clamp-2">{item.product.node.title}</h4>
                        <p className="text-[11px] text-muted-foreground mt-1">
                          {item.selectedOptions.map((o: any) => o.value).join(" · ")}
                        </p>
                        <div className="flex items-center justify-between mt-auto pt-3">
                          <div className="flex items-center border border-ink/10">
                            <button
                              onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                              disabled={isLoading}
                              className="p-1.5 hover:bg-ink/5 disabled:opacity-40 disabled:cursor-not-allowed transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bronze focus-visible:ring-inset"
                              aria-label="Decrease"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="text-xs w-6 text-center tabular-nums">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                              disabled={isLoading}
                              className="p-1.5 hover:bg-ink/5 disabled:opacity-40 disabled:cursor-not-allowed transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bronze focus-visible:ring-inset"
                              aria-label="Increase"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                          <p className="text-sm tabular-nums">{formatPrice(item.price)}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => removeItem(item.variantId)}
                        disabled={isLoading}
                        aria-label="Remove"
                        className="text-muted-foreground hover:text-ink h-fit disabled:opacity-40 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bronze rounded-sm"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </li>
                  );
                })}
              </ul>

              {/* Extras in the scroll area; email capture lives in the sticky footer */}
              <CartFbt productType={fbtProductType} excludeHandles={fbtExclude} />
              <div className="h-2" />
            </div>

            {/* Sticky checkout footer — always above the fold on mobile */}
            <div
              className="border-t border-ink/10 px-6 pt-4 space-y-3 bg-canvas shadow-[0_-8px_24px_-12px_rgba(0,0,0,0.08)]"
              style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
            >
              {(() => {
                const EXPRESS_THRESHOLD = 250;
                const VIP_THRESHOLD = 1500;
                const expressUnlocked = totalAmount >= EXPRESS_THRESHOLD;
                const vipUnlocked = totalAmount >= VIP_THRESHOLD;
                const remainingExpress = Math.max(0, EXPRESS_THRESHOLD - totalAmount);
                const remainingVip = Math.max(0, VIP_THRESHOLD - totalAmount);
                // Two-tier progress: bronze fill to Express, then ink fill to VIP.
                const pctExpress = Math.min(100, (totalAmount / EXPRESS_THRESHOLD) * 100);
                const pctVip = expressUnlocked
                  ? Math.min(100, ((totalAmount - EXPRESS_THRESHOLD) / (VIP_THRESHOLD - EXPRESS_THRESHOLD)) * 100)
                  : 0;
                return (
                  <div className="space-y-2">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-ink/80 transition-opacity duration-500">
                      {vipUnlocked
                        ? "Unlocked — Priority White-Glove VIP Dispatch"
                        : expressUnlocked
                          ? `Complimentary Express Premium Shipping unlocked · ${formatPrice({ amount: remainingVip.toFixed(2), currencyCode: currency })} more for White-Glove VIP`
                          : `Spend ${formatPrice({ amount: remainingExpress.toFixed(2), currencyCode: currency })} more for Complimentary Express Premium Shipping`}
                    </p>
                    <div className="relative h-[2px] w-full bg-ink/10 overflow-hidden">
                      <div
                        className="absolute inset-y-0 left-0 bg-bronze transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
                        style={{ width: `${pctExpress}%` }}
                        aria-hidden
                      />
                      <div
                        className="absolute inset-y-0 left-0 bg-ink transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
                        style={{
                          width: `${pctExpress * 0.5 + pctVip * 0.5}%`,
                          opacity: expressUnlocked ? 1 : 0,
                          mixBlendMode: "multiply",
                        }}
                        aria-hidden
                      />
                    </div>
                    {vipUnlocked && (
                      <p className="text-[10px] leading-relaxed text-bronze animate-[fade-in_.5s_ease-out_both]">
                        Hand-delivered by appointment · Signature concierge dispatch · No additional charge.
                      </p>
                    )}
                  </div>
                );
              })()}

              <ExpressCheckoutButtons onCheckout={handleCheckout} />

              <div className="flex justify-between items-baseline" aria-live="polite">
                <span className="text-xs uppercase tracking-[0.2em]">Subtotal</span>
                <span className="text-lg font-serif tabular-nums">
                  {formatPrice({ amount: totalAmount.toFixed(2), currencyCode: currency })}
                </span>
              </div>

              {/* Charge-currency disclosure — required for Merchant Center misrepresentation compliance */}
              <p className="text-[10px] text-center text-muted-foreground -mt-1">
                All orders are charged in USD at checkout.
              </p>

              {/* Trust micro-strip — placed ABOVE the CTA so it's always visible alongside the button */}
              <ul className="grid grid-cols-4 gap-2 text-[9px] uppercase tracking-[0.15em] text-muted-foreground border-y border-ink/10 py-2.5">
                <li className="flex items-center justify-center gap-1.5 text-center">
                  <ShieldCheck className="w-3 h-3 shrink-0" strokeWidth={1.5} />
                  <span>Insured</span>
                </li>
                <li className="flex items-center justify-center gap-1.5 text-center">
                  <Lock className="w-3 h-3 shrink-0" strokeWidth={1.5} />
                  <span>Secure</span>
                </li>
                <li className="flex items-center justify-center gap-1.5 text-center">
                  <ShieldCheck className="w-3 h-3 shrink-0" strokeWidth={1.5} />
                  <span>Authentic</span>
                </li>
                <li className="flex items-center justify-center gap-1.5 text-center">
                  <RotateCcw className="w-3 h-3 shrink-0" strokeWidth={1.5} />
                  <span>14-Day Returns</span>
                </li>
              </ul>

              <CartEmailCapture ref={emailCaptureRef} />


              <Button
                onClick={handleCheckout}
                disabled={isLoading || isSyncing}
                className="w-full bg-ink text-canvas hover:bg-ink/90 rounded-none h-12 text-[11px] uppercase tracking-[0.25em] font-medium"
              >
                {isLoading || isSyncing
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : "Begin Your Order"}
              </Button>

              <p className="text-[10px] text-center text-muted-foreground">
                Shipping is fully insured at no extra cost · Taxes calculated at checkout ·{" "}
                <Link
                  to="/shipping-returns"
                  onClick={() => onOpenChange(false)}
                  className="underline underline-offset-2 hover:text-ink transition-colors"
                >
                  Shipping policy
                </Link>
                ·{" "}
                <Link
                  to="/contact"
                  onClick={() => onOpenChange(false)}
                  className="underline underline-offset-2 hover:text-ink transition-colors"
                >
                  Concierge replies in 24h
                </Link>
              </p>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
