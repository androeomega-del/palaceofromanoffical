import { supabase } from "@/integrations/supabase/client";

/**
 * Batched server-side flusher for interaction events.
 *
 * The client-side `useInteractionStore` keeps a localStorage scoring
 * snapshot for personalisation in the current device. This module is the
 * other half: every event also enqueues an append-only row into the
 * `interaction_events` Supabase table so trending / bought-together /
 * rail re-ordering can be computed from real cross-device data.
 *
 * Behaviour:
 *   - queue capped at 50 rows (oldest dropped on overflow)
 *   - flush every 10s, on visibilitychange→hidden, on pagehide
 *   - flush immediately when queue reaches 25 rows
 *   - fire-and-forget; never blocks UX, never throws
 */

type Pending = {
  handle: string;
  event_type: string;
  vendor: string | null;
  product_type: string | null;
  session_id: string | null;
  page_path: string | null;
  user_agent: string | null;
};

// Reuse the same anon session id minted by cart-analytics so a single
// shopper's interaction + cart events are joinable downstream.
const SESSION_KEY = "por-analytics-session";
const QUEUE_MAX = 50;
const BATCH_LIMIT = 25;
const FLUSH_INTERVAL_MS = 10_000;

let queue: Pending[] = [];
let initialized = false;
let flushing = false;

function trim(s: string | null | undefined, max: number): string | null {
  if (!s) return null;
  return s.length > max ? s.slice(0, max) : s;
}

function getSessionId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    let id = localStorage.getItem(SESSION_KEY);
    if (!id) {
      id = (
        crypto.randomUUID?.() ??
        Math.random().toString(36).slice(2) + Date.now().toString(36)
      ).slice(0, 64);
      localStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return null;
  }
}

async function flush(): Promise<void> {
  if (flushing || queue.length === 0) return;
  flushing = true;
  const batch = queue.splice(0, BATCH_LIMIT);
  try {
    const { error } = await supabase.from("interaction_events").insert(batch);
    if (error) {
      console.debug("[interaction-flush] insert failed:", error.message);
    }
  } catch (error) {
    console.debug("[interaction-flush] unavailable:", error);
  } finally {
    flushing = false;
  }
}

function setup(): void {
  if (initialized || typeof window === "undefined") return;
  initialized = true;
  setInterval(() => {
    void flush();
  }, FLUSH_INTERVAL_MS);
  window.addEventListener("pagehide", () => {
    void flush();
  });
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") void flush();
  });
}

export function enqueueInteractionEvent(input: {
  handle: string;
  event_type:
    | "impression"
    | "hover"
    | "click"
    | "pdp_view"
    | "wishlist"
    | "cart"
    | "scarcity_view"
    | "scarcity_click"
    | "scarcity_cart";
  vendor?: string;
  productType?: string;
}): void {
  if (typeof window === "undefined") return;
  if (!input.handle) return;
  setup();
  if (queue.length >= QUEUE_MAX) queue.shift();
  queue.push({
    handle: trim(input.handle, 255) ?? "",
    event_type: input.event_type,
    vendor: trim(input.vendor ?? null, 255),
    product_type: trim(input.productType ?? null, 255),
    session_id: getSessionId(),
    page_path: trim(window.location.pathname, 500),
    user_agent: trim(navigator.userAgent, 500),
  });
  if (queue.length >= BATCH_LIMIT) void flush();
}
