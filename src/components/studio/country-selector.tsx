/**
 * Sleek country/market selector. Renders as an inline pill in the Studio
 * header. Selecting a market updates `useMarketStore`, which is included
 * in the PDP query key — TanStack Query immediately re-fetches all
 * Storefront data with the matching @inContext directive so prices,
 * currency, and (where Shopify markets are configured for inclusive
 * pricing) tax-inclusive amounts update instantly on screen.
 */
import { useEffect, useRef, useState } from "react";
import { ChevronDown, Check, Globe } from "lucide-react";
import { MARKETS, useMarketStore, type Market } from "@/stores/market-store";

interface Props {
  /** Visual tokens — letting callers (Studio shell) own the palette. */
  ink?: string;
  hairline?: string;
  accent?: string;
  surface?: string;
}

export function CountrySelector({
  ink = "#F4F1EC",
  hairline = "rgba(244,241,236,0.18)",
  accent = "#D9CFC1",
  surface = "#0B0B0C",
}: Props) {
  const market = useMarketStore((s) => s.market);
  const setMarket = useMarketStore((s) => s.setMarket);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

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

  return (
    <div
      ref={ref}
      className="relative"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2.5 px-3 py-2 text-[11px] tracking-[0.3em] uppercase transition-opacity hover:opacity-70"
        style={{ color: ink, border: `1px solid ${hairline}` }}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <Globe className="h-3.5 w-3.5" style={{ color: accent }} />
        <span>
          {market.country} · {market.currency}
        </span>
        <ChevronDown
          className="h-3 w-3 transition-transform duration-300"
          style={{ transform: open ? "rotate(180deg)" : "none", color: accent }}
        />
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute right-0 mt-2 w-72 max-h-[60vh] overflow-y-auto z-50 animate-[studioFade_0.25s_ease-out_both]"
          style={{
            background: surface,
            border: `1px solid ${hairline}`,
            color: ink,
          }}
        >
          <p
            className="px-4 py-3 text-[10px] tracking-[0.4em] uppercase border-b"
            style={{ borderColor: hairline, color: accent }}
          >
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
                    className="w-full flex items-center justify-between gap-4 px-4 py-3 text-left text-[12px] tracking-[0.05em] transition-colors hover:bg-white/5"
                  >
                    <span className="flex items-baseline gap-3">
                      <span
                        className="text-[10px] tracking-[0.3em] uppercase w-8"
                        style={{ color: accent }}
                      >
                        {m.country}
                      </span>
                      <span>{m.label}</span>
                    </span>
                    <span className="flex items-center gap-3">
                      <span
                        className="text-[10px] tracking-[0.25em] uppercase"
                        style={{ color: "rgba(244,241,236,0.55)" }}
                      >
                        {m.currency} · {m.language}
                      </span>
                      {active && <Check className="h-3.5 w-3.5" style={{ color: accent }} />}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
