/**
 * Header country/market selector — light, minimalist, luxury voice.
 *
 * Mirrors the existing utility-nav cluster (DeliverTo / CurrencySwitcher) and
 * drives `useMarketStore`. Changing the market updates the @inContext
 * variables baked into every Storefront API request and invalidates the
 * TanStack Query cache (via `MarketQuerySync`), so prices and tax-inclusive
 * amounts refresh on screen without a page reload.
 */
import { useEffect, useRef, useState } from "react";
import { ChevronDown, Check, Globe } from "lucide-react";
import { MARKETS, useMarketStore, type Market } from "@/stores/market-store";
import { marketTaxNote } from "@/lib/market-tax";

export function HeaderCountrySelector({ className = "" }: { className?: string }) {
  const market = useMarketStore((s) => s.market);
  const setMarket = useMarketStore((s) => s.setMarket);
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  function pick(m: Market) {
    setMarket(m);
    setOpen(false);
  }

  // SSR-stable label: always render US/USD on the server so React 19 doesn't
  // flag a hydration mismatch when the persisted market loads.
  const label = mounted ? `${market.country} · ${market.currency}` : "US · USD";

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Shipping to ${market.label}. Change country.`}
        className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.25em] text-ink/70 hover:text-bronze transition-colors"
      >
        <Globe className="w-3.5 h-3.5" strokeWidth={1.5} />
        <span className="whitespace-nowrap tabular-nums">{label}</span>
        <ChevronDown
          className="w-3 h-3 transition-transform duration-300"
          style={{ transform: open ? "rotate(180deg)" : "none" }}
          strokeWidth={1.5}
        />
      </button>

      {open && mounted && (
        <div
          role="listbox"
          aria-label="Choose your country"
          className="absolute right-0 mt-3 w-72 max-h-[60vh] overflow-y-auto z-50 bg-canvas border border-ink/10 shadow-xl"
        >
          <p className="px-4 py-3 text-[10px] uppercase tracking-[0.3em] text-bronze border-b border-ink/10">
            Shop in your market
          </p>
          <ul className="py-1">
            {MARKETS.map((m) => {
              const active =
                m.country === market.country && m.language === market.language;
              return (
                <li key={`${m.country}-${m.language}`}>
                  <button
                    role="option"
                    aria-selected={active}
                    onClick={() => pick(m)}
                    className="w-full flex items-center justify-between gap-4 px-4 py-3 text-left text-[12px] tracking-[0.04em] text-ink transition-colors hover:bg-ink/[0.04]"
                  >
                    <span className="flex items-baseline gap-3">
                      <span className="text-[10px] uppercase tracking-[0.28em] w-8 text-bronze">
                        {m.country}
                      </span>
                      <span>{m.label}</span>
                    </span>
                    <span className="flex items-center gap-3">
                      <span className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                        {m.currency} · {m.language}
                      </span>
                      {active && <Check className="w-3.5 h-3.5 text-bronze" strokeWidth={1.5} />}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
          <p className="px-4 py-3 text-[10px] leading-relaxed text-muted-foreground border-t border-ink/10">
            Prices update instantly. <span className="text-ink/80">{mounted ? marketTaxNote(market) : "Duties & taxes calculated at checkout"}.</span>
          </p>
        </div>
      )}
    </div>
  );
}
