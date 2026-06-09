import { supabase } from "@/integrations/supabase/client";

const SESSION_KEY = "por-analytics-session";

function getSessionId(): string {
  if (typeof window === "undefined") return "ssr";
  try {
    let id = localStorage.getItem(SESSION_KEY);
    if (!id) {
      id = (crypto.randomUUID?.() ?? Math.random().toString(36).slice(2) + Date.now().toString(36)).slice(0, 64);
      localStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return "anon";
  }
}

export interface TrackPayload {
  event_type: "add_to_cart" | "remove_from_cart" | "checkout_started" | "reached_checkout";
  product_handle?: string | null;
  product_title?: string | null;
  variant_id?: string | null;
  variant_title?: string | null;
  price_usd?: number | null;
  quantity?: number;
  payment_method?: string | null;
}

function trim(s: string | null | undefined, max: number): string | null {
  if (!s) return null;
  return s.length > max ? s.slice(0, max) : s;
}

export function trackCartEvent(p: TrackPayload): void {
  if (typeof window === "undefined") return;
  const row = {
    event_type: p.event_type,
    product_handle: trim(p.product_handle ?? null, 255),
    product_title: trim(p.product_title ?? null, 500),
    variant_id: trim(p.variant_id ?? null, 255),
    variant_title: trim(p.variant_title ?? null, 255),
    price_usd: p.price_usd != null ? Math.max(0, Math.min(1000000, Number(p.price_usd))) : null,
    quantity: Math.max(1, Math.min(100, p.quantity ?? 1)),
    session_id: getSessionId(),
    page_path: trim(window.location.pathname, 500),
    user_agent: trim(navigator.userAgent, 500),
  };

  // Fire and forget — never block UX, never throw
  try {
    Promise.resolve(supabase.from("cart_events").insert(row))
      .then(({ error }) => {
        if (error) console.debug("[cart-analytics] insert failed:", error.message);
      })
      .catch((error) => {
        console.debug("[cart-analytics] unavailable:", error);
      });
  } catch (error) {
    console.debug("[cart-analytics] unavailable:", error);
  }
}
