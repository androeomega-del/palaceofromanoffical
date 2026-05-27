/**
 * Tiny header switcher for the shopper's preferred DISPLAY currency.
 * The site continues to transact in USD; this only changes how prices
 * are rendered in the grid / PDP tag.
 */
import { useEffect, useState } from "react";
import { useCurrencyStore, type DisplayCurrency } from "@/stores/currency-store";

const OPTIONS: DisplayCurrency[] = ["USD", "EUR", "GBP"];

export function CurrencySwitcher() {
  const currency = useCurrencyStore((s) => s.currency);
  const setCurrency = useCurrencyStore((s) => s.setCurrency);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Avoid SSR/CSR text mismatch — render the persisted value only after mount.
  const value = mounted ? currency : "USD";

  return (
    <label className="hidden sm:inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.25em] text-ink/70 hover:text-ink transition-colors">
      <span className="sr-only">Display currency</span>
      <select
        value={value}
        onChange={(e) => setCurrency(e.target.value as DisplayCurrency)}
        aria-label="Display currency"
        title="Display currency — checkout remains in USD"
        className="bg-transparent border-0 text-[10px] uppercase tracking-[0.25em] font-medium focus:outline-none cursor-pointer pr-1"
      >
        {OPTIONS.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>
    </label>
  );
}
