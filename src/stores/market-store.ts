/**
 * Market store — drives Shopify @inContext localization for the Studio
 * surface. Persists across reloads so a returning shopper sees their last
 * chosen market immediately. Independent from `currency-store` (which only
 * controls display-currency conversion for static USD prices).
 */
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { CountryCode, LanguageCode } from "@/lib/shopify";

export interface Market {
  country: CountryCode;
  language: LanguageCode;
  label: string;
  /** Display hint only — Shopify returns the real currency in price.currencyCode. */
  currency: string;
}

export const MARKETS: Market[] = [
  { country: "US", language: "EN", label: "United States",  currency: "USD" },
  { country: "GB", language: "EN", label: "United Kingdom", currency: "GBP" },
  { country: "FR", language: "FR", label: "France",         currency: "EUR" },
  { country: "DE", language: "DE", label: "Germany",        currency: "EUR" },
  { country: "IT", language: "IT", label: "Italy",          currency: "EUR" },
  { country: "ES", language: "ES", label: "Spain",          currency: "EUR" },
  { country: "CH", language: "DE", label: "Switzerland",    currency: "CHF" },
  { country: "JP", language: "JA", label: "Japan",          currency: "JPY" },
  { country: "HK", language: "EN", label: "Hong Kong SAR",  currency: "HKD" },
  { country: "SG", language: "EN", label: "Singapore",      currency: "SGD" },
  { country: "AE", language: "EN", label: "United Arab Emirates", currency: "AED" },
  { country: "AU", language: "EN", label: "Australia",      currency: "AUD" },
  { country: "CA", language: "EN", label: "Canada",         currency: "CAD" },
  { country: "KR", language: "KO", label: "South Korea",    currency: "KRW" },
];

interface MarketStore {
  market: Market;
  setMarket: (m: Market) => void;
}

export const useMarketStore = create<MarketStore>()(
  persist(
    (set) => ({
      market: MARKETS[0],
      setMarket: (m) => set({ market: m }),
    }),
    {
      name: "por-market",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
