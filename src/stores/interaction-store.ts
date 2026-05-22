import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

/**
 * Lightweight per-handle interaction scoring. Feeds the AI personalisation
 * loop with implicit signals the wishlist + recently-viewed stores miss:
 * card clicks, deliberate hovers, PDP dwell, etc.
 *
 * Scoring weights (tunable):
 *   impression   0.1   (card scrolled into view)
 *   hover        0.5   (≥800ms hover on a card)
 *   click        1     (card link clicked)
 *   pdp_view     2     (handle reached PDP)
 *   wishlist     3     (added to wishlist)
 *   cart         5     (added to cart)
 *
 * State is capped at 60 handles, decays naturally as new signals overwrite
 * old ones. Pure client, persisted to localStorage — no network calls.
 */

export type InteractionEvent =
  | "impression"
  | "hover"
  | "click"
  | "pdp_view"
  | "wishlist"
  | "cart";

const WEIGHTS: Record<InteractionEvent, number> = {
  impression: 0.1,
  hover: 0.5,
  click: 1,
  pdp_view: 2,
  wishlist: 3,
  cart: 5,
};

type InteractionRecord = {
  handle: string;
  vendor?: string;
  productType?: string;
  score: number;
  lastTs: number;
};

interface InteractionStore {
  records: Record<string, InteractionRecord>;
  track: (input: {
    handle: string;
    event: InteractionEvent;
    vendor?: string;
    productType?: string;
  }) => void;
  /** Top-N handles by weighted score, most recent ties win. */
  topHandles: (n?: number) => string[];
  clear: () => void;
}

const MAX_RECORDS = 60;

export const useInteractionStore = create<InteractionStore>()(
  persist(
    (set, get) => ({
      records: {},
      track: ({ handle, event, vendor, productType }) => {
        if (!handle) return;
        const weight = WEIGHTS[event] ?? 0;
        if (weight === 0) return;
        set((state) => {
          const prev = state.records[handle];
          const next: InteractionRecord = {
            handle,
            vendor: vendor ?? prev?.vendor,
            productType: productType ?? prev?.productType,
            score: (prev?.score ?? 0) + weight,
            lastTs: Date.now(),
          };
          const merged = { ...state.records, [handle]: next };
          // Cap size by dropping the lowest-scoring oldest entries.
          const entries = Object.values(merged);
          if (entries.length <= MAX_RECORDS) return { records: merged };
          const kept = entries
            .sort((a, b) => b.score - a.score || b.lastTs - a.lastTs)
            .slice(0, MAX_RECORDS);
          return {
            records: Object.fromEntries(kept.map((r) => [r.handle, r])),
          };
        });
      },
      topHandles: (n = 20) => {
        return Object.values(get().records)
          .sort((a, b) => b.score - a.score || b.lastTs - a.lastTs)
          .slice(0, n)
          .map((r) => r.handle);
      },
      clear: () => set({ records: {} }),
    }),
    {
      name: "por-interactions",
      storage: createJSONStorage(() => localStorage),
      version: 1,
    },
  ),
);
