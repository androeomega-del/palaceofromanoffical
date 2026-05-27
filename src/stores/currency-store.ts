/**
 * Display-currency preference. Pure UI sugar: the storefront, cart, and
 * checkout all transact in USD. This store only affects how prices are
 * RENDERED in the product grid / cards / PDP price tag, so an EU or UK
 * shopper sees a familiar number while browsing. The final charge is
 * always in USD (made explicit in the cart drawer and checkout button).
 */
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type DisplayCurrency = "USD" | "EUR" | "GBP";

interface CurrencyStore {
  currency: DisplayCurrency;
  setCurrency: (c: DisplayCurrency) => void;
}

export const useCurrencyStore = create<CurrencyStore>()(
  persist(
    (set) => ({
      currency: "USD",
      setCurrency: (c) => set({ currency: c }),
    }),
    { name: "por-display-currency", storage: createJSONStorage(() => localStorage) },
  ),
);
