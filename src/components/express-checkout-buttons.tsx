import { useCartStore } from "@/stores/cart-store";
import { trackCartEvent } from "@/lib/cart-analytics";

function ShopPayLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 64 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path
        d="M5.5 17.5c-.9 0-1.7-.2-2.4-.5-.7-.4-1.2-.9-1.6-1.6-.4-.7-.5-1.6-.5-2.6V7.1h3.2v5.5c0 .7.1 1.2.4 1.6.3.3.7.5 1.2.5.5 0 .9-.2 1.2-.5.3-.3.4-.9.4-1.6V7.1h3.2v5.7c0 1-.2 1.9-.5 2.6-.4.7-.9 1.3-1.6 1.6-.7.4-1.5.5-2.5.5zm8.5-.3V7.1h5.3c.9 0 1.7.2 2.3.5.6.3 1.1.8 1.4 1.4.3.6.5 1.3.5 2.1 0 .8-.2 1.5-.5 2.1-.3.6-.8 1.1-1.4 1.4-.6.3-1.4.5-2.3.5h-2.6v2.1h-2.7zm2.7-4.4h2.4c.4 0 .7-.1 1-.4.2-.2.4-.6.4-1.1 0-.5-.2-.9-.4-1.1-.3-.2-.6-.4-1-.4h-2.4v2.9zm9.3 4.7c-.8 0-1.5-.2-2.1-.6-.6-.4-1.1-1-1.4-1.7-.3-.7-.5-1.6-.5-2.6V10c0-1 .2-1.9.5-2.6.3-.7.8-1.3 1.4-1.7.6-.4 1.3-.6 2.1-.6s1.5.2 2.1.6c.6.4 1.1 1 1.4 1.7.3.7.5 1.6.5 2.6v2.6c0 1-.2 1.9-.5 2.6-.3.7-.8 1.3-1.4 1.7-.6.4-1.3.6-2.1.6zm0-2.6c.4 0 .7-.2 1-.5.2-.3.4-.8.4-1.4v-2.9c0-.6-.2-1.1-.4-1.4-.3-.3-.6-.5-1-.5s-.7.2-1 .5c-.2.3-.4.8-.4 1.4v2.9c0 .6.2 1.1.4 1.4.3.3.6.5 1 .5zm7.8 2.6c-.8 0-1.5-.2-2.1-.6-.6-.4-1.1-1-1.4-1.7-.3-.7-.5-1.6-.5-2.6V10c0-1 .2-1.9.5-2.6.3-.7.8-1.3 1.4-1.7.6-.4 1.3-.6 2.1-.6s1.5.2 2.1.6c.6.4 1.1 1 1.4 1.7.3.7.5 1.6.5 2.6v2.6c0 1-.2 1.9-.5 2.6-.3.7-.8 1.3-1.4 1.7-.6.4-1.3.6-2.1.6zm0-2.6c.4 0 .7-.2 1-.5.2-.3.4-.8.4-1.4v-2.9c0-.6-.2-1.1-.4-1.4-.3-.3-.6-.5-1-.5s-.7.2-1 .5c-.2.3-.4.8-.4 1.4v2.9c0 .6.2 1.1.4 1.4.3.3.6.5 1 .5zm6.7 2.3V7.1h2.6l3.6 7.2V7.1h2.6v10.1h-2.6l-3.6-7.2v7.2h-2.6zm11.4.3c-.8 0-1.5-.2-2.1-.6-.6-.4-1.1-1-1.4-1.7-.3-.7-.5-1.6-.5-2.6V10c0-1 .2-1.9.5-2.6.3-.7.8-1.3 1.4-1.7.6-.4 1.3-.6 2.1-.6s1.5.2 2.1.6c.6.4 1.1 1 1.4 1.7.3.7.5 1.6.5 2.6v.8h-2.7v-.5c0-.6-.2-1.1-.4-1.4-.3-.3-.6-.5-1-.5s-.7.2-1 .5c-.2.3-.4.8-.4 1.4v2.9c0 .6.2 1.1.4 1.4.3.3.6.5 1 .5s.7-.2 1-.5c.3-.3.4-.8.4-1.4v-.5h2.7v.8c0 1-.2 1.9-.5 2.6-.3.7-.8 1.3-1.4 1.7-.6.4-1.3.6-2.1.6z"
        fill="currentColor"
      />
    </svg>
  );
}

function ApplePayLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 40 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path
        d="M8.3 2.5c.4-.5 1-1.3 1-2.2 0-.1 0-.3-.1-.3-.6 0-1.4.4-1.8.9-.4.4-.1 1.2-.8 2.1 0 0-.5.7-.8.7-.4 0-1-.5-1.7-.5C3 3.2 1.5 4.4 1.5 6.5c0 1.4.5 2.8 1.3 3.7.6.7 1.3 1.1 2 1.1.9 0 1.2-.6 2.3-.6 1 0 1.3.6 2.2.6.9 0 1.6-.8 2.2-1.6.7-.9 1-1.8 1-1.9 0 0-2-.8-2-3.1 0-1.9 1.4-2.7 1.5-2.8-.8-1.1-2.1-1.3-2.6-1.3-.7 0-1.4.5-1.8.5-.4 0-.9-.5-1.5-.5zM7.8 1.6c.5-.6.8-1.4.7-2.2-.7 0-1.5.5-2 1-.5.5-.9 1.3-.8 2.1.9.1 1.6-.4 2.1-1z"
        fill="currentColor"
      />
      <path
        d="M18.4 3.6h-2.5v8h2.5c1.8 0 2.9-1.3 2.9-4 0-2.7-1.1-4-2.9-4zm-.1 7h-1.2V4.6h1.2c1.2 0 1.9 1 1.9 3 0 2-.7 3-1.9 3zm5.1.9V3.6h-.9v8h.9v.1zm2.5 0V4.4h2.6v-.8h-6v.8h2.6v7.2h.8v.1zm6.3.1c1.8 0 3-1.3 3-3.1s-1.2-3.1-3-3.1c-1.8 0-3 1.3-3 3.1s1.2 3.1 3 3.1zm0-.8c-1.3 0-2.2-1-2.2-2.3s.9-2.3 2.2-2.3 2.2 1 2.2 2.3-.9 2.3-2.2 2.3zm6.8.7V7.8h3.2v-.8h-3.2V4.4h3.7v-.8h-4.5v8h.8v.1zm5.7 0V4.4h2.3v-.8h-5.5v.8h2.3v7.2h.9v.1z"
        fill="currentColor"
      />
    </svg>
  );
}

function GooglePayLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 705 272" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path
        d="M187.2 139.3v33.5h-9.6V106h21.6c5.1 0 9.4 1.7 12.9 5.1 3.5 3.4 5.3 7.6 5.3 12.7 0 5.3-1.8 9.6-5.3 12.9-3.5 3.3-7.9 5-13.1 5h-11.8v-3zm0-8.6h11.9c3 0 5.4-.9 7.1-2.7 1.7-1.8 2.6-4.1 2.6-6.9 0-2.8-.9-5.1-2.6-6.9-1.7-1.8-4-2.7-7-2.7h-12v19.2zm50.5 21.5c-4.3 4.3-9.6 6.5-15.9 6.5s-11.6-2.2-15.9-6.5c-4.3-4.3-6.5-9.5-6.5-15.7s2.2-11.5 6.5-15.8c4.3-4.3 9.6-6.5 15.9-6.5s11.6 2.2 15.9 6.5c4.3 4.3 6.5 9.5 6.5 15.8s-2.2 11.4-6.5 15.7zm-3.5-15.7c0-4.6-1.5-8.5-4.4-11.6-2.9-3.1-6.6-4.7-10.9-4.7-4.4 0-8 1.6-10.9 4.7-2.9 3.1-4.4 7-4.4 11.6s1.5 8.5 4.4 11.6c2.9 3.1 6.5 4.7 10.9 4.7 4.4 0 8-1.6 10.9-4.7 2.9-3.1 4.4-7 4.4-11.6zm32.2 14.9c2.8 0 5.1-.9 7.1-2.7 2-1.8 2.9-4.1 2.9-6.9h8.8c0 2.6-.7 5-2 7.3-1.3 2.3-3.2 4.1-5.6 5.4-2.4 1.3-5 2-7.9 2-5.7 0-10.3-1.9-13.7-5.7-3.4-3.8-5.1-8.8-5.1-15.1v-1.4c0-6 1.7-10.8 5.1-14.6 3.4-3.8 7.9-5.7 13.7-5.7 4.7 0 8.6 1.4 11.6 4.3 3 2.8 4.6 6.6 4.6 11.2h-8.8c0-3-1-5.4-2.9-7.2-1.9-1.8-4.3-2.7-7.1-2.7-3.7 0-6.5 1.3-8.5 4-2 2.7-3 6.3-3 10.8v1.4c0 4.6 1 8.2 3 10.9 2 2.7 4.9 4 8.5 4zm29.4-35h.6c.4 0 .8.1 1.2.3.4.2.7.5.9.9.2.4.3.7.3 1.2v23.4c0 .4-.1.8-.3 1.2-.2.4-.5.7-.9.9-.4.2-.7.3-1.2.3h-.6c-.4 0-.8-.1-1.2-.3-.4-.2-.7-.5-.9-.9-.2-.4-.3-.7-.3-1.2v-23.4c0-.4.1-.8.3-1.2.2-.4.5-.7.9-.9.4-.2.7-.3 1.2-.3zm0 29.6h.6c.4 0 .8.1 1.2.3.4.2.7.5.9.9.2.4.3.7.3 1.2v2.8c0 .4-.1.8-.3 1.2-.2.4-.5.7-.9.9-.4.2-.7.3-1.2.3h-.6c-.4 0-.8-.1-1.2-.3-.4-.2-.7-.5-.9-.9-.2-.4-.3-.7-.3-1.2v-2.8c0-.4.1-.8.3-1.2.2-.4.5-.7.9-.9.4-.2.7-.3 1.2-.3z"
        fill="currentColor"
      />
      <path d="M.5 139.6l17.9-17.9 17.9 17.9-17.9 17.9z" fill="#EA4335" />
      <path d="M36.3 139.6l17.9-17.9 17.9 17.9-17.9 17.9z" fill="#FBBC05" />
      <path d="M.5 103.7l17.9-17.9 17.9 17.9-17.9 17.9z" fill="#34A853" />
      <path d="M36.3 103.7l17.9-17.9 17.9 17.9-17.9 17.9z" fill="#4285F4" />
    </svg>
  );
}

interface ExpressCheckoutButtonsProps {
  onCheckout: () => void;
}

export function ExpressCheckoutButtons({ onCheckout }: ExpressCheckoutButtonsProps) {
  const store = useCartStore();
  const items = store.items;
  const totalItems = items.reduce((sum: number, i: any) => sum + i.quantity, 0);
  const totalAmount = items.reduce((sum: number, i: any) => sum + parseFloat(i.price.amount) * i.quantity, 0);

  const handleExpress = (method: "shop_pay" | "apple_pay" | "google_pay") => {
    trackCartEvent({
      event_type: "checkout_started",
      quantity: totalItems,
      price_usd: totalAmount,
    });
    onCheckout();
  };

  if (items.length === 0) return null;

  return (
    <div className="space-y-2">
      <p className="text-[9px] uppercase tracking-[0.25em] text-muted-foreground text-center">
        Express checkout
      </p>
      <div className="grid grid-cols-3 gap-2">
        {/* Shop Pay */}
        <button
          type="button"
          onClick={() => handleExpress("shop_pay")}
          className="flex items-center justify-center h-10 rounded-md bg-[#5A31F4] text-white hover:bg-[#4a21e4] active:bg-[#3a11d4] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5A31F4] focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
          aria-label="Check out with Shop Pay"
        >
          <ShopPayLogo className="h-4 w-auto" />
        </button>

        {/* Apple Pay */}
        <button
          type="button"
          onClick={() => handleExpress("apple_pay")}
          className="flex items-center justify-center h-10 rounded-md bg-black text-white hover:bg-black/90 active:bg-black/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
          aria-label="Check out with Apple Pay"
        >
          <ApplePayLogo className="h-3.5 w-auto" />
        </button>

        {/* Google Pay */}
        <button
          type="button"
          onClick={() => handleExpress("google_pay")}
          className="flex items-center justify-center h-10 rounded-md bg-white text-black border border-ink/10 hover:bg-gray-50 active:bg-gray-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/30 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
          aria-label="Check out with Google Pay"
        >
          <GooglePayLogo className="h-5 w-auto" />
        </button>
      </div>

      <div className="relative flex items-center justify-center my-3">
        <span className="absolute inset-x-0 top-1/2 h-px bg-ink/10" aria-hidden="true" />
        <span className="relative bg-canvas px-3 text-[9px] uppercase tracking-[0.25em] text-muted-foreground">
          or
        </span>
      </div>
    </div>
  );
}
