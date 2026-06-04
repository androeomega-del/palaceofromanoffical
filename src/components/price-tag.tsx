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
  // When Shopify Markets has already localised the price (e.g. EUR / GBP /
  // JPY returned via @inContext), render it directly — the display-currency
  // converter only knows how to convert from USD. Otherwise apply the
  // shopper's manual display preference on top of the canonical USD price.
  const alreadyLocalised = !!money && money.currencyCode !== "USD";
  const text =
    mounted && currency !== "USD" && !alreadyLocalised
      ? convertForDisplay(money, currency)
      : formatPrice(money);
  if (strike) return <s className={className}>{text}</s>;
  return <span className={className}>{text}</span>;
}
