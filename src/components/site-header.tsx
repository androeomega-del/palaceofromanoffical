import { Link } from "@tanstack/react-router";
import { Search, User, ShoppingBag } from "lucide-react";
import { useState } from "react";
import { useCartStore } from "@/stores/cart-store";
import { CartDrawer } from "@/components/cart-drawer";

type NavItem = {
  label: string;
  to: string;
  params?: Record<string, string>;
  search?: Record<string, string>;
  accent?: boolean;
};

const WOMENS_CLOTHING_QUERY = "dress OR gown OR blouse OR skirt OR coat OR top OR jacket OR knit OR cardigan OR pants OR suit";
const WOMENS_SHOES_QUERY = "heels OR pumps OR sandals OR boots OR stilettos OR mules OR loafers OR sneakers";

const NAV_LEFT: NavItem[] = [
  { to: "/shop", label: "Shop" },
  { to: "/shop", search: { q: WOMENS_CLOTHING_QUERY, title: "Women's Clothing" }, label: "Women's Clothing" },
  { to: "/shop", search: { q: WOMENS_SHOES_QUERY, title: "Women's Shoes" }, label: "Women's Shoes" },
];
const NAV_RIGHT: NavItem[] = [
  { to: "/collections/$handle", params: { handle: "mens-luxury-clothing" }, label: "Men's Clothing" },
  { to: "/collections/$handle", params: { handle: "mens-designer-shoes" }, label: "Men's Shoes" },
  { to: "/brands", label: "Brands" },
  { to: "/collections/$handle", params: { handle: "high-discounts" }, label: "Sale", accent: true },
];
const NAV_MOBILE: NavItem[] = [...NAV_LEFT, ...NAV_RIGHT];

function NavLinks({ items }: { items: NavItem[] }) {
  return (
    <>
      {items.map((n) => (
        <Link
          key={n.label}
          to={n.to as any}
          params={n.params as any}
          search={n.search as any}
          className={`hover:text-bronze transition-colors whitespace-nowrap ${n.accent ? "text-bronze" : ""}`}
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

  return (
    <>
      <div className="w-full bg-canvas-raised text-bronze/90 text-[10px] py-2 uppercase tracking-[0.3em] text-center border-b border-ink/5">
        Authenticity Guaranteed — Complimentary Global Shipping over $1,200
      </div>
      <header className="sticky top-0 z-50 bg-canvas/90 backdrop-blur-md border-b border-ink/10">
        <div className="max-w-screen-2xl mx-auto px-6 h-20 grid grid-cols-[1fr_auto_1fr] items-center gap-8">
          <nav className="hidden lg:flex items-center gap-8 text-[11px] uppercase tracking-[0.25em] font-medium justify-self-start">
            <NavLinks items={NAV_LEFT} />
          </nav>
          <div className="lg:hidden" />

          <Link
            to="/"
            className="text-xl md:text-2xl font-serif tracking-[0.18em] uppercase whitespace-nowrap justify-self-center"
          >
            Palace of Roman
          </Link>

          <div className="flex items-center gap-8 justify-self-end">
            <nav className="hidden lg:flex items-center gap-8 text-[11px] uppercase tracking-[0.25em] font-medium">
              <NavLinks items={NAV_RIGHT} />
            </nav>
            <div className="flex items-center gap-5">
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
                <span className="text-[11px] uppercase tracking-[0.2em] font-medium">({totalItems})</span>
              </button>
            </div>
          </div>
        </div>

        <nav className="lg:hidden flex items-center justify-center gap-6 px-6 py-3 text-[11px] uppercase tracking-[0.2em] border-t border-ink/5 overflow-x-auto scrollbar-hide">
          {NAV_MOBILE.map((n) => (
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
