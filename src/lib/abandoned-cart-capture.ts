// Client-side helper for the abandoned-cart recovery system.
// Stores the captured email locally so the cart store can link every cart
// mutation to a known recipient, and exposes a debounced `syncAbandonedCart`
// that upserts the latest cart snapshot through the server function.

import { useCartStore, type CartItem } from "@/stores/cart-store";
import { useMarketStore } from "@/stores/market-store";
import { captureAbandonedCart } from "@/lib/abandoned-cart.functions";

const EMAIL_KEY = "por-customer-email";
const SESSION_KEY = "por-analytics-session";
const MARKETING_OPT_IN_KEY = "por-customer-marketing-opt-in";

export function rememberCustomerEmail(email: string) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(EMAIL_KEY, email.trim().toLowerCase());
  } catch {
    /* ignore */
  }
}

export function getCustomerEmail(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(EMAIL_KEY);
  } catch {
    return null;
  }
}

export function rememberMarketingOptIn(optIn: boolean) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(MARKETING_OPT_IN_KEY, optIn ? "1" : "0");
  } catch {
    /* ignore */
  }
}

export function getMarketingOptIn(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(MARKETING_OPT_IN_KEY) === "1";
  } catch {
    return false;
  }
}

function getSessionId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(SESSION_KEY);
  } catch {
    return null;
  }
}

let timer: ReturnType<typeof setTimeout> | null = null;

export function scheduleAbandonedCartSync() {
  if (typeof window === "undefined") return;
  const email = getCustomerEmail();
  const sessionId = getSessionId();
  if (!email || !sessionId) return;

  if (timer) clearTimeout(timer);
  timer = setTimeout(() => {
    const { items, checkoutUrl } = useCartStore.getState();
    const snapshot = items.map((i: CartItem) => ({
      handle: i.product?.node?.handle ?? null,
      title: i.product?.node?.title ?? null,
      variant_title: i.variantTitle ?? null,
      image: i.product?.node?.images?.edges?.[0]?.node?.url ?? null,
      price_usd: i.price ? Number(i.price.amount) : 0,
      quantity: i.quantity,
    }));
    const total = snapshot.reduce((s, i) => s + i.price_usd * i.quantity, 0);
    const itemCount = snapshot.reduce((s, i) => s + i.quantity, 0);

    const market = (() => {
      try { return useMarketStore.getState().market; } catch { return null; }
    })();

    captureAbandonedCart({
      data: {
        session_id: sessionId,
        email,
        items: snapshot,
        total_usd: Math.min(1_000_000, Math.max(0, total)),
        item_count: Math.min(1000, Math.max(0, itemCount)),
        checkout_url: checkoutUrl ?? null,
        page_path: window.location.pathname.slice(0, 500),
        user_agent: (navigator.userAgent ?? "").slice(0, 500),
        market_country: market?.country ?? null,
        market_language: market?.language ?? null,
        market_currency: market?.currency ?? null,
      },
    }).catch((e) => console.debug("[abandoned-cart] sync failed:", e));
  }, 1500);
}
