/**
 * PalaceHeader — architectural header used ONLY by the standalone `/studio`
 * variant. The live `/` route keeps the real <SiteHeader/> for cart/search/
 * account/megamenu. This is a presentation surface that demonstrates the
 * men-first segmented navigation, centered wordmark, and concierge trigger.
 *
 * Layout:
 *   [ HOMME / MEN · FEMME / WOMEN ]   PALACE OF ROMAN   [ CONCIERGE · BAG ]
 */
import { Link, useLocation } from "@tanstack/react-router";
import { Sparkles, ShoppingBag } from "lucide-react";
import { useCartStore } from "@/stores/cart-store";
import { palette, fontSans, fontSerif } from "./palette";

interface PalaceHeaderProps {
  onOpenConcierge: () => void;
}

export function PalaceHeader({ onOpenConcierge }: PalaceHeaderProps) {
  const location = useLocation();
  const openCart = useCartStore((s) => s.openDrawer);
  const itemCount = useCartStore((s) =>
    s.items.reduce((n, i) => n + i.quantity, 0),
  );
  // Studio is a draft surface — "active" reflects whichever segment the
  // visitor is exploring on /shop. We read the gender search param.
  const search = location.search as { gender?: "Men" | "Women" | "Unisex" };
  const activeGender = search?.gender;

  const linkBase =
    "relative inline-flex items-center text-[10px] uppercase tracking-[0.32em] transition-opacity duration-300";
  const linkInactive = "opacity-70 hover:opacity-100";
  const linkActive = "opacity-100";

  return (
    <header
      className="sticky top-0 z-30 grid grid-cols-[1fr_auto_1fr] items-center px-6 md:px-14 h-20 backdrop-blur-md"
      style={{
        background: "rgba(11,11,12,0.72)",
        borderBottom: "1px solid rgba(244,241,236,0.06)",
        fontFamily: fontSans,
      }}
    >
      {/* Left — men-first segmented navigation */}
      <nav className="flex items-center gap-8" aria-label="Collection segments">
        <Link
          to="/shop"
          search={{ gender: "Men" } as never}
          className={`${linkBase} ${activeGender === "Men" ? linkActive : linkInactive}`}
          style={{ color: palette.offwhite }}
        >
          Homme / Men
          <span
            aria-hidden="true"
            className="absolute -bottom-2 left-0 h-px transition-all duration-500"
            style={{
              width: activeGender === "Men" ? "100%" : "0%",
              background: palette.sand,
            }}
          />
        </Link>
        <Link
          to="/shop"
          search={{ gender: "Women" } as never}
          className={`${linkBase} ${activeGender === "Women" ? linkActive : linkInactive}`}
          style={{ color: palette.offwhite }}
        >
          Femme / Women
          <span
            aria-hidden="true"
            className="absolute -bottom-2 left-0 h-px transition-all duration-500"
            style={{
              width: activeGender === "Women" ? "100%" : "0%",
              background: palette.sand,
            }}
          />
        </Link>
      </nav>

      {/* Center — wordmark */}
      <Link
        to="/studio"
        className="text-sm md:text-base uppercase tracking-[0.38em] whitespace-nowrap"
        style={{ fontFamily: fontSerif, fontWeight: 400, color: palette.offwhite }}
      >
        Palace of Roman
      </Link>

      {/* Right — concierge + bag */}
      <div className="flex items-center justify-end gap-6">
        <button
          onClick={onOpenConcierge}
          aria-label="Open concierge"
          className="group inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.32em] transition-opacity duration-300 hover:opacity-100 opacity-80"
          style={{ color: palette.offwhite }}
        >
          <Sparkles className="w-3.5 h-3.5" strokeWidth={1.25} style={{ color: palette.sand }} />
          <span className="hidden md:inline">Concierge</span>
        </button>
        <Link
          to="/cart"
          aria-label="Open bag"
          className="transition-opacity duration-300 opacity-80 hover:opacity-100"
          style={{ color: palette.offwhite }}
        >
          <ShoppingBag className="w-4 h-4" strokeWidth={1.25} />
        </Link>
      </div>
    </header>
  );
}
