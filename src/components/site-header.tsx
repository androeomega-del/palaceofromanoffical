/**
 * Site header — Farfetch-style two-row layout, Palace of Roman voice.
 *
 * Row 1 (h = 64px @ md+, 56px on small):
 *   [WOMEN | MEN tabs]        [PALACE OF ROMAN wordmark]        [utility cluster]
 *
 * Row 2 (h = 48px, lg+ only):
 *   [Sale · New In · Vacation · Brands · Clothing · Shoes · …]   [inline search]
 *
 * Below lg, the mobile menu button replaces row 1's department tabs and row 2
 * collapses entirely — the mobile drawer (<MobileFarfetchMenu/>) carries the
 * full IA.
 */
import { Link } from "@tanstack/react-router";
import { Heart, Search, User, ShoppingBag, Menu, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useCartStore } from "@/stores/cart-store";
import { CartDrawer } from "@/components/cart-drawer";
import { ReducedMotionToggle } from "@/components/reduced-motion-toggle";
import {
  DesktopCategoryRail,
  DepartmentTabs,
} from "@/components/desktop-rail";
import { MobileFarfetchMenu } from "@/components/mobile-farfetch-menu";
import { SearchOverlay } from "@/components/search-overlay";
import { DeliverToButton } from "@/components/deliver-to-button";
import { useCustomerStore } from "@/stores/customer-store";
import { useWishlistStore } from "@/stores/wishlist-store";
import { CurrencySwitcher } from "@/components/currency-switcher";

function WishlistHeaderLink() {
  const count = useWishlistStore((s) => s.handles.length);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const shown = mounted ? count : 0;
  return (
    <Link
      to="/wishlist"
      aria-label={`Wishlist (${shown})`}
      className="relative hover:text-bronze transition-colors hidden sm:inline-flex items-center justify-center w-5 h-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bronze focus-visible:ring-offset-2 focus-visible:ring-offset-canvas rounded-sm"
    >
      <Heart className="w-4 h-4" strokeWidth={1.25} />
      {shown > 0 && (
        <span className="absolute -top-1.5 -right-2 min-w-[16px] h-[16px] px-1 grid place-items-center bg-bronze text-canvas text-[9px] font-semibold tabular-nums leading-none rounded-full">
          {shown > 99 ? "99+" : shown}
        </span>
      )}
    </Link>
  );
}

export function SiteHeader() {
  const totalItemsRaw = useCartStore((s) => s.items.reduce((sum, i) => sum + i.quantity, 0));
  const cartOpen = useCartStore((s) => s.isDrawerOpen);
  const setCartOpen = useCartStore((s) => s.setDrawerOpen);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const totalItems = mounted ? totalItemsRaw : 0;
  // Cart badge pop animation.
  const prevCount = useRef(totalItems);
  const [popKey, setPopKey] = useState(0);
  useEffect(() => {
    if (totalItems > prevCount.current) setPopKey((k) => k + 1);
    prevCount.current = totalItems;
  }, [totalItems]);

  const ANNOUNCE_KEY = "por-announce-dismissed-v2";
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

  // Lock body scroll when the mobile drawer is open.
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
        <div className="relative w-full bg-ink text-canvas text-[10px] py-2.5 uppercase tracking-[0.28em] text-center border-b border-ink/10">
          <span className="inline-flex items-center gap-2">
            Sign up for our newsletter for a surprise offer
          </span>
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
      <header
        className="sticky top-0 z-50 bg-canvas/95 backdrop-blur-md border-b border-ink/10"
        style={
          {
            // Used by megamenu panels to anchor below the header.
            "--header-row1": "64px",
            "--header-row2": "48px",
          } as React.CSSProperties
        }
      >
        {/* ───── Row 1: tabs / logo / utility ───── */}
          <div className="max-w-screen-2xl mx-auto px-4 md:px-10 h-16 grid grid-cols-[1fr_auto_1fr] items-center gap-3 md:gap-6">
          {/* Left: dept tabs (lg+) or mobile menu button */}
          <div className="justify-self-start flex items-center">
            <button
              type="button"
              aria-label="Open menu"
              onClick={() => setMobileOpen(true)}
              className="lg:hidden hover:text-bronze transition-colors inline-flex items-center justify-center w-9 h-9 -ml-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bronze focus-visible:ring-offset-2 focus-visible:ring-offset-canvas rounded-sm"
            >
              <Menu className="w-5 h-5" strokeWidth={1.25} />
            </button>
            <div className="hidden lg:flex">
              <DepartmentTabs />
            </div>
          </div>

          {/* Center: serif wordmark */}
          <Link
            to="/"
            className="text-[17px] sm:text-xl md:text-2xl font-serif tracking-[0.14em] md:tracking-[0.18em] uppercase whitespace-nowrap justify-self-center leading-none"
          >
            Palace of Roman
          </Link>

          {/* Right: utility cluster */}
          <div className="flex items-center gap-3 sm:gap-5 md:gap-6 justify-self-end">
            <Link
              to="/style-quiz"
              className="hidden xl:inline text-[11px] uppercase tracking-[0.25em] text-bronze hover:text-ink transition-colors"
            >
              Style Quiz
            </Link>
            <div className="hidden xl:flex items-center gap-6">
              <DeliverToButton />
              <CurrencySwitcher />
              <ReducedMotionToggle />
            </div>
            <button
              aria-label="Search"
              onClick={() => setSearchOpen(true)}
              className="lg:hidden hover:text-bronze transition-colors inline-flex items-center justify-center w-5 h-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bronze focus-visible:ring-offset-2 focus-visible:ring-offset-canvas rounded-sm"
            >
              <Search className="w-4 h-4" strokeWidth={1.25} />
            </button>
            <WishlistHeaderLink />
            <button
              aria-label="Account"
              onClick={() => {
                const token = useCustomerStore.getState().getValidToken();
                window.location.href = token ? "/account" : "/account/login";
              }}
              className="hover:text-bronze transition-colors hidden sm:inline-flex items-center justify-center w-5 h-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bronze focus-visible:ring-offset-2 focus-visible:ring-offset-canvas rounded-sm"
            >
              <User className="w-4 h-4" strokeWidth={1.25} />
            </button>
            <button
              aria-label={`Cart (${totalItems})`}
              onClick={() => setCartOpen(true)}
              className="relative hover:text-bronze transition-colors inline-flex items-center justify-center w-5 h-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bronze focus-visible:ring-offset-2 focus-visible:ring-offset-canvas rounded-sm"
            >
              <ShoppingBag className="w-4 h-4" strokeWidth={1.25} />
              {totalItems > 0 && (
                <span
                  key={popKey}
                  className="por-badge-pop absolute -top-1.5 -right-2 min-w-[16px] h-[16px] px-1 grid place-items-center bg-bronze text-canvas text-[9px] font-semibold tabular-nums leading-none rounded-full"
                >
                  {totalItems > 99 ? "99+" : totalItems}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* ───── Row 2: category rail + inline search (lg+ only) ───── */}
        <div className="hidden lg:block border-t border-ink/5">
          <div className="max-w-screen-2xl mx-auto px-10 h-12 flex items-center justify-between gap-8">
            <DesktopCategoryRail />
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="group flex items-center gap-2.5 text-[12px] text-ink/55 hover:text-ink transition-colors w-[260px] xl:w-[320px] h-9 px-3 border-b border-ink/15 hover:border-ink/40"
              aria-label="Open search"
            >
              <Search className="w-3.5 h-3.5" strokeWidth={1.5} />
              <span className="italic font-light tracking-[0.02em]">
                Search the maisons…
              </span>
            </button>
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
          <div className="absolute left-0 top-0 h-full w-[92%] max-w-sm bg-canvas shadow-2xl">
            <MobileFarfetchMenu onClose={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      <CartDrawer open={cartOpen} onOpenChange={setCartOpen} />
      <SearchOverlay open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  );
}
