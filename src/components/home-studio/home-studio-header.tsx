/**
 * StudioHeader — concierge-trigger header used ONLY by the standalone
 * `/studio` variant. The live `/` route keeps the real <SiteHeader/> so
 * search, account, cart, and nav remain functional.
 */
import { Link } from "@tanstack/react-router";
import { Menu, Sparkles } from "lucide-react";
import { palette, fontSans, fontSerif } from "./palette";

interface StudioHeaderProps {
  onOpenConcierge: () => void;
}

export function StudioHeader({ onOpenConcierge }: StudioHeaderProps) {
  return (
    <header
      className="sticky top-0 z-30 flex items-center justify-between px-6 md:px-14 h-20 backdrop-blur-md"
      style={{
        background: "rgba(11,11,12,0.7)",
        borderBottom: "1px solid rgba(244,241,236,0.06)",
      }}
    >
      <button
        onClick={onOpenConcierge}
        aria-label="Open styling concierge"
        className="inline-flex items-center gap-3 group"
        style={{ fontFamily: fontSans }}
      >
        <Menu className="w-5 h-5 transition-transform duration-500 group-hover:rotate-90" strokeWidth={1.25} />
        <span className="hidden md:inline text-[10px] uppercase tracking-[0.32em]" style={{ color: palette.sand }}>
          Concierge
        </span>
      </button>

      <Link
        to="/studio"
        className="text-sm md:text-base uppercase tracking-[0.38em]"
        style={{ fontFamily: fontSerif, fontWeight: 400 }}
      >
        Palace of Roman
      </Link>

      <div
        className="flex items-center gap-6 text-[10px] uppercase tracking-[0.32em]"
        style={{ fontFamily: fontSans }}
      >
        <Link to="/shop" search={{} as never} className="hidden md:inline hover:opacity-70 transition-opacity">
          Boutique
        </Link>
        <Sparkles className="w-4 h-4" strokeWidth={1.25} style={{ color: palette.sand }} />
      </div>
    </header>
  );
}
