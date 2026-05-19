import { Link } from "@tanstack/react-router";
import { Search, User, ShoppingBag } from "lucide-react";
import { useState } from "react";
import { useCartStore } from "@/stores/cart-store";
import { CartDrawer } from "@/components/cart-drawer";

type NavItem = {
  label: string;
  to: string;
  params?: Record<string, string>;
  accent?: boolean;
};

const NAV: NavItem[] = [
  { to: "/collections/$handle", params: { handle: "womens-accessories" }, label: "Women" },
  { to: "/collections/$handle", params: { handle: "mens-luxury-clothing" }, label: "Men" },
  { to: "/collections/$handle", params: { handle: "new-arrivals" }, label: "New" },
  { to: "/collections/$handle", params: { handle: "high-discounts" }, label: "Sale", accent: true },
  { to: "/brands", label: "Brands" },
];

export function SiteHeader() {
  const totalItems = useCartStore((s) => s.items.reduce((sum, i) => sum + i.quantity, 0));
  const [cartOpen, setCartOpen] = useState(false);

  return (
    <>
      <div className="w-full bg-ink text-canvas/80 text-[10px] py-1.5 uppercase tracking-[0.2em] text-center">
        Authenticity Guaranteed on Every Piece — Complimentary Global Shipping over $1,200
      </div>
      <header className="sticky top-0 z-50 bg-canvas/95 backdrop-blur-sm border-b border-ink/5">
        <div className="max-w-screen-2xl mx-auto px-6 h-20 flex items-center justify-between relative">
          <nav className="hidden lg:flex items-center gap-8 text-xs uppercase tracking-widest font-medium">
            {NAV.map((n) => (
              <Link
                key={n.label}
                to={n.to as any}
                params={n.params as any}
                className={`hover:text-bronze transition-colors ${n.accent ? "text-bronze" : ""}`}
              >
                {n.label}
              </Link>
            ))}
          </nav>

          <Link
            to="/"
            className="absolute left-1/2 -translate-x-1/2 text-xl md:text-2xl font-serif tracking-[0.15em] uppercase whitespace-nowrap"
          >
            Palace of Roman
          </Link>

          <div className="flex items-center gap-5 ml-auto lg:ml-0">
            <button aria-label="Search" className="hidden md:block hover:text-bronze transition-colors">
              <Search className="w-4 h-4" strokeWidth={1.25} />
            </button>
            <button aria-label="Account" className="hover:text-bronze transition-colors">
              <User className="w-4 h-4" strokeWidth={1.25} />
            </button>
            <button
              aria-label="Cart"
              onClick={() => setCartOpen(true)}
              className="relative hover:text-bronze transition-colors flex items-center gap-2"
            >
              <ShoppingBag className="w-4 h-4" strokeWidth={1.25} />
              <span className="text-xs uppercase tracking-widest font-medium">({totalItems})</span>
            </button>
          </div>
        </div>

        <nav className="lg:hidden flex items-center justify-center gap-6 px-6 py-3 text-[11px] uppercase tracking-widest border-t border-ink/5 overflow-x-auto scrollbar-hide">
          {NAV.map((n) => (
            <Link
              key={n.label}
              to={n.to as any}
              params={n.params as any}
              className={`hover:text-bronze transition-colors whitespace-nowrap ${n.accent ? "text-bronze" : ""}`}
            >
              {n.label}
            </Link>
          ))}
        </nav>
      </header>
      <CartDrawer open={cartOpen} onOpenChange={setCartOpen} />
    </>
  );
}
