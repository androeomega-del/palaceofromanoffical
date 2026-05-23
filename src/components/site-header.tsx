import { Link } from "@tanstack/react-router";
import { Search, User, ShoppingBag, Menu, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useCartStore } from "@/stores/cart-store";
import { CartDrawer } from "@/components/cart-drawer";
import { ReducedMotionToggle } from "@/components/reduced-motion-toggle";
import { DesktopMegamenu, MobileMegamenu } from "@/components/megamenu";
import { SearchOverlay } from "@/components/search-overlay";
import { fetchCollections } from "@/lib/shopify";
import { DeliverToButton } from "@/components/deliver-to-button";
import { useCustomerStore } from "@/stores/customer-store";

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
  { to: "/collections/$handle", params: { handle: "new-arrivals" }, label: "New Arrivals" },
  { to: "/limited-finds", label: "Limited Finds", accent: true },
];
const FLAT_RIGHT: FlatItem[] = [
  { to: "/collections/$handle", params: { handle: "best-sellers" }, label: "Best Sellers" },
  { to: "/collections", label: "Collections" },
  { to: "/journal", label: "Journal" },
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
  const totalItemsRaw = useCartStore((s) => s.items.reduce((sum, i) => sum + i.quantity, 0));
  const cartOpen = useCartStore((s) => s.isDrawerOpen);
  const setCartOpen = useCartStore((s) => s.setDrawerOpen);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  // Cart state is hydrated from localStorage on the client, so the SSR
  // count (always 0) can disagree with the first client render. Defer to
  // a mounted flag to avoid React #418 hydration text mismatch.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const totalItems = mounted ? totalItemsRaw : 0;
  const ANNOUNCE_KEY = "por-announce-dismissed-v1";
  const [announceOpen, setAnnounceOpen] = useState(true);
  useEffect(() => {
    try {
      if (localStorage.getItem(ANNOUNCE_KEY) === "1") setAnnounceOpen(false);
    } catch {}
  }, []);
  const dismissAnnounce = () => {
    setAnnounceOpen(false);
    try {
      localStorage.setItem(ANNOUNCE_KEY, "1");
    } catch {}
  };

  // Live Shopify collection handles — used to hide flat links whose target
  // collection no longer exists, so the header never shows broken links.
  const { data: liveCollections } = useQuery({
    queryKey: ["collections-all"],
    queryFn: () => fetchCollections(500),
    staleTime: 5 * 60_000,
  });
  const liveHandles = useMemo(
    () => (liveCollections ? new Set(liveCollections.map((c) => c.handle)) : null),
    [liveCollections],
  );
  const isLiveFlat = (n: FlatItem) =>
    n.to !== "/collections/$handle" ||
    !liveHandles ||
    (!!n.params?.handle && liveHandles.has(n.params.handle));
  const flatLeft = useMemo(() => FLAT_LEFT.filter(isLiveFlat), [liveHandles]);
  const flatRight = useMemo(() => FLAT_RIGHT.filter(isLiveFlat), [liveHandles]);


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
      {announceOpen && (
        <div className="relative w-full bg-ink text-canvas text-[10px] py-2.5 uppercase tracking-[0.32em] text-center border-b border-ink/10">
          <span className="text-bronze">●</span>{" "}
          <span className="font-medium">The Curated Luxury Hunt</span>
          <span className="opacity-50 mx-2">·</span>
          Weekly Limited-Edition Drops
          <span className="opacity-50 mx-2">·</span>
          <Link to="/collections/$handle" params={{ handle: "new-arrivals" }} className="underline decoration-bronze/60 underline-offset-4 hover:text-bronze transition-colors">
            See This Week's Edit →
          </Link>
          <button
            type="button"
            aria-label="Dismiss announcement"
            onClick={dismissAnnounce}
            className="absolute right-3 top-1/2 -translate-y-1/2 inline-flex items-center justify-center w-7 h-7 text-canvas/70 hover:text-bronze transition-colors"
          >
            <X className="w-3.5 h-3.5" strokeWidth={1.5} />
          </button>
        </div>
      )}
      <header className="sticky top-0 z-50 bg-canvas/95 backdrop-blur-md border-b border-ink/10">
        <div className="max-w-screen-2xl mx-auto px-6 md:px-10 h-20 grid grid-cols-[1fr_auto_1fr] items-center gap-6">
          {/* Left nav (desktop) */}
          <nav className="hidden lg:flex items-center gap-7 text-[11px] uppercase tracking-[0.25em] font-medium justify-self-end">
            <FlatLinks items={flatLeft} />
            <DesktopMegamenu />
          </nav>

          {/* Mobile menu trigger */}
          <button
            type="button"
            aria-label="Open menu"
            onClick={() => setMobileOpen(true)}
            className="lg:hidden justify-self-start hover:text-bronze transition-colors inline-flex items-center justify-center w-9 h-9 -ml-2"
          >
            <Menu className="w-5 h-5" strokeWidth={1.25} />
          </button>

          <Link
            to="/"
            className="text-xl md:text-2xl font-serif tracking-[0.18em] uppercase whitespace-nowrap justify-self-center leading-none"
          >
            Palace of Roman
          </Link>

          <div className="flex items-center gap-7 justify-self-end">
            <nav className="hidden lg:flex items-center gap-7 text-[11px] uppercase tracking-[0.25em] font-medium">
              <FlatLinks items={flatRight} />
            </nav>
            <div className="flex items-center gap-6">
              <button
                aria-label="Search"
                onClick={() => setSearchOpen(true)}
                className="hover:text-bronze transition-colors inline-flex items-center justify-center w-5 h-5"
              >
                <Search className="w-4 h-4" strokeWidth={1.25} />
              </button>
              <DeliverToButton />
              <ReducedMotionToggle />
              <button
                aria-label="Account"
                onClick={() => {
                  const token = useCustomerStore.getState().getValidToken();
                  window.location.href = token ? "/account" : "/account/login";
                }}
                className="hover:text-bronze transition-colors hidden sm:inline-flex items-center justify-center w-5 h-5"
              >
                <User className="w-4 h-4" strokeWidth={1.25} />
              </button>
              <button
                aria-label="Cart"
                onClick={() => setCartOpen(true)}
                className="relative hover:text-bronze transition-colors inline-flex items-center gap-1.5"
              >
                <ShoppingBag className="w-4 h-4" strokeWidth={1.25} />
                <span className="text-[11px] uppercase tracking-[0.2em] font-medium tabular-nums leading-none">
                  ({totalItems})
                </span>
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
                {[...flatLeft, ...flatRight].map((n) => (
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
