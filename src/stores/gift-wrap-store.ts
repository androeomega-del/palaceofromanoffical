/**
 * Gift-wrap preference. Local-first; the sync with the Shopify cart
 * (note + attributes) happens via `src/lib/cart-attributes.ts` so we
 * never modify the locked cart-store shape.
 *
 * Wrap is complimentary — no upcharge, no line item. The merchant sees
 * the request as a cart note + attribute on the resulting order.
 */
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface GiftWrapStore {
  enabled: boolean;
  message: string;
  setEnabled: (v: boolean) => void;
  setMessage: (m: string) => void;
  reset: () => void;
}

export const useGiftWrapStore = create<GiftWrapStore>()(
  persist(
    (set) => ({
      enabled: false,
      message: "",
      setEnabled: (enabled) => set({ enabled }),
      setMessage: (message) => set({ message: message.slice(0, 240) }),
      reset: () => set({ enabled: false, message: "" }),
    }),
    { name: "por-gift-wrap", storage: createJSONStorage(() => localStorage) },
  ),
);
