/**
 * Reactive price renderer that respects the shopper's display-currency
 * preference. Falls back to USD when no preference is set. Use this in
 * product cards / grids. Cart and checkout intentionally continue to call
 * the canonical `formatPrice()` so the source-of-truth currency is visible
 * during the actual transaction.
 */
import { useEffect, useState } from "react";
import { convertForDisplay, formatPrice, type Money } from "@/lib/shopify";
import { useCurrencyStore } from "@/stores/currency-store";

interface Props {
  money: Money | undefined;
  className?: string;
  /** When true, render as <s>strikethrough</s> for compare-at prices. */
  strike?: boolean;
}

export function PriceTag({ money, className, strike }: Props) {
  const currency = useCurrencyStore((s) => s.currency);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  // SSR / first paint: always render USD to match server output, then swap
  // once the persisted preference is hydrated.
  const text = mounted && currency !== "USD" ? convertForDisplay(money, currency) : formatPrice(money);
  if (strike) return <s className={className}>{text}</s>;
  return <span className={className}>{text}</span>;
}
