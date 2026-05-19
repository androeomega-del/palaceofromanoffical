import { Link } from "@tanstack/react-router";
import { Search, User, ShoppingBag, Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useCartStore } from "@/stores/cart-store";
import { CartDrawer } from "@/components/cart-drawer";
import { ReducedMotionToggle } from "@/components/reduced-motion-toggle";
import { DesktopMegamenu, MobileMegamenu } from "@/components/megamenu";
import { SearchOverlay } from "@/components/search-overlay";

type FlatItem = {
  label: string;
  to: string;
  params?: Record<string, string>;
  accent?: boolean;
};

// Flat (non-megamenu) links. Department links (Women / Men) are rendered
// separately by <DesktopMegamenu /> and <MobileMegamenu />.
const FLAT_LEFT: FlatItem[] = [
  { to: "/shop", label: "Shop" },
  { to: "/collections", label: "Collections" },
];
const FLAT_RIGHT: FlatItem[] = [
  { to: "/journal", label: "Journal" },
  { to: "/collections/$handle", params: { handle: "high-discounts" }, label: "Sale", accent: true },
];

function FlatLinks({ items }: { items: FlatItem[] }) {
  return (
    <>
      {items.map((n) => (
        <Link
          key={n.label}
          to={n.to as any}
          params={n.params as any}
          className={`hover:text-bronze transition-colors whitespace-nowrap py-2 ${
            n.accent ? "text-bronze" : ""
          }`}
        >
          {n.label}
        </Link>
      ))}
    </>
  );
}

export function SiteHeader() {
  const totalItems = useCartStore((s) => s.items.reduce((sum, i) => sum + i.quantity, 0));
  const [cartOpen, setCartOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (mobileOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [mobileOpen]);

  return (
    <>
      <div className="w-full bg-canvas-raised text-bronze/90 text-[10px] py-2 uppercase tracking-[0.3em] text-center border-b border-ink/5">
        Authenticity Guaranteed — Complimentary Global Shipping over $1,200
      </div>
      <header className="sticky top-0 z-50 bg-canvas/95 backdrop-blur-md border-b border-ink/10">
        <div className="max-w-screen-2xl mx-auto px-6 h-20 grid grid-cols-[1fr_auto_1fr] items-center gap-8">
          {/* Left nav (desktop) */}
          <nav className="hidden lg:flex items-center gap-8 text-[11px] uppercase tracking-[0.25em] font-medium justify-self-start">
            <FlatLinks items={FLAT_LEFT} />
            <DesktopMegamenu />
          </nav>

          {/* Mobile menu trigger */}
          <button
            type="button"
            aria-label="Open menu"
            onClick={() => setMobileOpen(true)}
            className="lg:hidden justify-self-start hover:text-bronze transition-colors"
          >
            <Menu className="w-5 h-5" strokeWidth={1.25} />
          </button>

          <Link
            to="/"
            className="text-xl md:text-2xl font-serif tracking-[0.18em] uppercase whitespace-nowrap justify-self-center"
          >
            Palace of Roman
          </Link>

          <div className="flex items-center gap-8 justify-self-end">
            <nav className="hidden lg:flex items-center gap-8 text-[11px] uppercase tracking-[0.25em] font-medium">
              <FlatLinks items={FLAT_RIGHT} />
            </nav>
            <div className="flex items-center gap-5">
              <button
                aria-label="Search"
                onClick={() => setSearchOpen(true)}
                className="hover:text-bronze transition-colors"
              >
                <Search className="w-4 h-4" strokeWidth={1.25} />
              </button>
              <ReducedMotionToggle />
              <button aria-label="Account" className="hover:text-bronze transition-colors">
                <User className="w-4 h-4" strokeWidth={1.25} />
              </button>
              <button
                aria-label="Cart"
                onClick={() => setCartOpen(true)}
                className="relative hover:text-bronze transition-colors flex items-center gap-2"
              >
                <ShoppingBag className="w-4 h-4" strokeWidth={1.25} />
                <span className="text-[11px] uppercase tracking-[0.2em] font-medium">({totalItems})</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile slide-in drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <div
            className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute left-0 top-0 h-full w-[88%] max-w-sm bg-canvas shadow-2xl flex flex-col">
            <div className="flex items-center justify-between px-6 h-20 border-b border-ink/10">
              <Link
                to="/"
                onClick={() => setMobileOpen(false)}
                className="text-base font-serif tracking-[0.18em] uppercase"
              >
                Palace of Roman
              </Link>
              <button
                type="button"
                aria-label="Close menu"
                onClick={() => setMobileOpen(false)}
                className="hover:text-bronze"
              >
                <X className="w-5 h-5" strokeWidth={1.25} />
              </button>
            </div>
            <div
              className="flex-1 overflow-y-auto px-6 py-4"
              onClick={(e) => {
                // Auto-close when tapping any link inside the drawer
                if ((e.target as HTMLElement).closest("a")) setMobileOpen(false);
              }}
            >
              <MobileMegamenu />
              <div className="mt-4 pt-4 border-t border-ink/10 flex flex-col gap-1">
                {[...FLAT_LEFT, ...FLAT_RIGHT].map((n) => (
                  <Link
                    key={n.label}
                    to={n.to as any}
                    params={n.params as any}
                    className={`py-3 text-[12px] uppercase tracking-[0.3em] ${
                      n.accent ? "text-bronze" : "text-ink"
                    }`}
                  >
                    {n.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <CartDrawer open={cartOpen} onOpenChange={setCartOpen} />
      <SearchOverlay open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  );
}
