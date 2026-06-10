/**
 * Desktop top-level hover mega menu — Mr Porter / SSENSE pattern.
 *
 *   MEN · WOMEN · BRANDS · VACATION
 *
 * - MEN, WOMEN, BRANDS each open a full-bleed dark "After Dark" panel on
 *   hover (with a ~120 ms intent delay; closes after a short grace).
 * - VACATION is a click-through to /vacation-stylist; no dropdown.
 * - No SALE item (no sale collection exists in the catalog).
 *
 * Verified-live Shopify handles only. Every link in the panels resolves to
 * an existing collection page; if a link in this file ever returns 404 it
 * should be removed here, not silently substituted at runtime.
 *
 * Keyboard: top items are focusable, Enter/Space opens, Escape closes.
 * Mouse: hover opens after the intent delay, mouse-leave closes after a
 * short grace so diagonal travel into the panel doesn't dismiss it.
 *
 * Editorial image slot (rightmost column) is sourced from a featured
 * collection per panel; renders nothing if the query has no products yet.
 */
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { fetchCollection } from "@/lib/shopify";
import {
  VERIFIED_LIVE_BRANDS,
  brandCollectionHandle,
  isAllowedLuxuryBrand,
} from "@/lib/nav-config";

/* ────────────────────────── panel data ────────────────────────── */

type PanelLink = { label: string; to: string };
type PanelColumn = { heading: string; items: PanelLink[] };
type Panel = {
  key: "men" | "women" | "brands";
  label: string;
  to: string;
  columns: PanelColumn[];
  /** Shopify collection handle whose first product image becomes the editorial tile. */
  featureHandle: string;
  featureEyebrow: string;
  featureTitle: string;
  featureTo: string;
};

const MEN_PANEL: Panel = {
  key: "men",
  label: "Men",
  to: "/men",
  columns: [
    {
      heading: "Apparel",
      items: [
        { label: "Shirts", to: "/collections/mens-shirts" },
        { label: "Polos", to: "/collections/mens-polos" },
        { label: "T-Shirts", to: "/collections/mens-t-shirts" },
        { label: "Tailoring", to: "/collections/suits" },
        { label: "Pants", to: "/collections/mens-pants" },
        { label: "Shorts", to: "/collections/mens-shorts" },
        { label: "Swim", to: "/collections/coastal-essentials" },
        { label: "All Menswear", to: "/collections/mens-clothing" },
      ],
    },
    {
      heading: "Shoes",
      items: [
        { label: "Sneakers", to: "/collections/mens-sneakers" },
        { label: "Loafers", to: "/collections/mens-loafers" },
        { label: "All Shoes", to: "/collections/mens-shoes" },
      ],
    },
    {
      heading: "Carry & Accessories",
      items: [
        { label: "Bags", to: "/collections/mens-bags" },
        { label: "Belts", to: "/collections/belts" },
        { label: "Wallets", to: "/collections/wallets" },
        { label: "Sunglasses", to: "/collections/mens-accessories" },
        { label: "All Accessories", to: "/collections/mens-accessories" },
      ],
    },
    {
      heading: "Edits & New",
      items: [
        { label: "The Riviera Edit", to: "/collections/the-riviera-edit" },
        { label: "Coastal Essentials", to: "/collections/coastal-essentials" },
        { label: "New In", to: "/collections/new-arrivals" },
      ],
    },
  ],
  featureHandle: "the-riviera-edit",
  featureEyebrow: "The Riviera Edit",
  featureTitle: "Sharp lines, quiet codes.",
  featureTo: "/collections/the-riviera-edit",
};

const WOMEN_PANEL: Panel = {
  key: "women",
  label: "Women",
  to: "/women",
  columns: [
    {
      heading: "Apparel",
      items: [
        { label: "Dresses", to: "/collections/womens-dresses" },
        { label: "Swim", to: "/collections/womens-swim" },
        { label: "All Womenswear", to: "/collections/womens-clothing" },
      ],
    },
    {
      heading: "Shoes",
      items: [{ label: "All Shoes", to: "/collections/womens-shoes" }],
    },
    {
      heading: "Carry",
      items: [{ label: "Bags", to: "/collections/womens-bags" }],
    },
    {
      heading: "Fine Accessories",
      items: [{ label: "All Accessories", to: "/collections/womens-accessories" }],
    },
    {
      heading: "New",
      items: [{ label: "New In", to: "/collections/new-arrivals" }],
    },
  ],
  featureHandle: "womens-dresses",
  featureEyebrow: "The Evening Edit",
  featureTitle: "A study in considered dressing.",
  featureTo: "/collections/womens-clothing",
};

const FEATURED_BRANDS = [
  "Brunello Cucinelli",
  "Dolce & Gabbana",
  "Saint Laurent",
  "Versace",
  "Balenciaga",
  "Gucci",
  "Fendi",
  "Prada",
  "Burberry",
  "Tom Ford",
  "Givenchy",
  "Chloé",
];

const ALL_BRANDS_TAIL = [
  "Ferragamo",
  "Jacquemus",
  "Balmain",
  "Alexander McQueen",
  "Maison Margiela",
  "Off-White",
  "Moschino",
  "Jimmy Choo",
  "Kenzo",
  "Moncler",
  "Valentino",
];

/* ────────────────────────── component ────────────────────────── */

type Key = "men" | "women" | "brands";

export function DesktopCategoryRail() {
  const [openKey, setOpenKey] = useState<Key | null>(null);
  const openTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scheduleOpen = useCallback((k: Key) => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    if (openTimer.current) clearTimeout(openTimer.current);
    openTimer.current = setTimeout(() => setOpenKey(k), 120);
  }, []);
  const openNow = useCallback((k: Key) => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    if (openTimer.current) clearTimeout(openTimer.current);
    setOpenKey(k);
  }, []);
  const scheduleClose = useCallback(() => {
    if (openTimer.current) clearTimeout(openTimer.current);
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setOpenKey(null), 140);
  }, []);

  useEffect(() => {
    if (!openKey) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenKey(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openKey]);

  const items: Array<{ key: Key | "vacation"; label: string; to: string }> =
    useMemo(
      () => [
        { key: "men", label: "Men", to: "/men" },
        { key: "women", label: "Women", to: "/women" },
        { key: "brands", label: "Brands", to: "/brands" },
        { key: "vacation", label: "Vacation", to: "/vacation-stylist" },
      ],
      [],
    );

  return (
    <div className="relative" onMouseLeave={scheduleClose}>
      <nav
        aria-label="Primary"
        className="flex items-center gap-9 text-[12px] uppercase tracking-[0.28em] text-ink"
      >
        {items.map((it) => {
          if (it.key === "vacation") {
            return (
              <Link
                key="vacation"
                to={it.to}
                onMouseEnter={() => {
                  if (openTimer.current) clearTimeout(openTimer.current);
                  scheduleClose();
                }}
                className="whitespace-nowrap py-3 transition-colors text-ink hover:text-bronze"
                data-nav-item="Vacation"
                data-surface="mega_menu"
              >
                {it.label}
              </Link>
            );
          }
          const k = it.key as Key;
          const isOpen = openKey === k;
          return (
            <div
              key={k}
              className="relative"
              onMouseEnter={() => scheduleOpen(k)}
              onFocus={() => openNow(k)}
            >
              <a
                href={it.to}
                aria-haspopup="true"
                aria-expanded={isOpen}
                onClick={() => setOpenKey(null)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    openNow(k);
                  }
                }}
                className={`whitespace-nowrap py-3 transition-colors ${
                  isOpen ? "text-bronze" : "text-ink hover:text-bronze"
                }`}
                data-nav-item={it.label}
                data-surface="mega_menu"
              >
                {it.label}
              </a>
            </div>
          );
        })}
      </nav>

      {openKey === "men" && (
        <CategoryPanel
          panel={MEN_PANEL}
          onMouseEnter={() => openNow("men")}
          onMouseLeave={scheduleClose}
        />
      )}
      {openKey === "women" && (
        <CategoryPanel
          panel={WOMEN_PANEL}
          onMouseEnter={() => openNow("women")}
          onMouseLeave={scheduleClose}
        />
      )}
      {openKey === "brands" && (
        <BrandsPanel
          onMouseEnter={() => openNow("brands")}
          onMouseLeave={scheduleClose}
        />
      )}
    </div>
  );
}

/* ────────────────────────── panels ────────────────────────── */

function PanelShell({
  ariaLabel,
  onMouseEnter,
  onMouseLeave,
  children,
}: {
  ariaLabel: string;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      role="region"
      aria-label={ariaLabel}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className="fixed left-0 right-0 top-[calc(var(--header-row1)+var(--header-row2))] z-40 border-t border-white/5 shadow-[0_40px_80px_-40px_rgba(0,0,0,0.6)]"
      style={{ background: "#0A0A0A", color: "#F4F1EC" }}
    >
      <div className="max-w-screen-2xl mx-auto px-12 py-12">{children}</div>
    </div>
  );
}

function CategoryPanel({
  panel,
  onMouseEnter,
  onMouseLeave,
}: {
  panel: Panel;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}) {
  const { data: feature } = useQuery({
    queryKey: ["mega-feature", panel.featureHandle],
    queryFn: () => fetchCollection(panel.featureHandle, 1),
    staleTime: 10 * 60_000,
    refetchOnWindowFocus: false,
  });
  const img = feature?.products?.[0]?.images?.[0];

  return (
    <PanelShell
      ariaLabel={`${panel.label} navigation`}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className="grid grid-cols-[repeat(4,minmax(0,1fr))_minmax(280px,22%)] gap-12">
        {panel.columns.map((col) => (
          <div key={col.heading} className="flex flex-col gap-5">
            <p
              className="text-[10px] uppercase tracking-[0.32em]"
              style={{ color: "rgba(212,175,108,0.85)" }}
            >
              {col.heading}
            </p>
            <ul className="flex flex-col gap-3">
              {col.items.map((item) => (
                <li key={item.to}>
                  <a
                    href={item.to}
                    className="text-[13px] font-light tracking-[0.01em] transition-colors"
                    style={{ color: "rgba(244,241,236,0.82)" }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.color = "rgba(212,175,108,1)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.color = "rgba(244,241,236,0.82)")
                    }
                    data-nav-item={item.label}
                    data-surface="mega_menu"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}

        {/* pad to fill 4 slots when fewer columns */}
        {Array.from({ length: Math.max(0, 4 - panel.columns.length) }).map(
          (_, i) => (
            <div key={`pad-${i}`} aria-hidden="true" />
          ),
        )}

        <FeatureTile
          imgUrl={img?.url}
          imgAlt={img?.altText ?? panel.featureTitle}
          eyebrow={panel.featureEyebrow}
          title={panel.featureTitle}
          to={panel.featureTo}
        />
      </div>
    </PanelShell>
  );
}

function FeatureTile({
  imgUrl,
  imgAlt,
  eyebrow,
  title,
  to,
}: {
  imgUrl?: string;
  imgAlt: string;
  eyebrow: string;
  title: string;
  to: string;
}) {
  if (!imgUrl) {
    return (
      <a
        href={to}
        className="group relative flex flex-col justify-end aspect-[4/5] p-5 border border-white/10 transition-colors"
        style={{ background: "#111" }}
      >
        <p
          className="text-[10px] uppercase tracking-[0.32em] mb-2"
          style={{ color: "rgba(212,175,108,0.9)" }}
        >
          {eyebrow}
        </p>
        <p
          className="font-serif text-[19px] leading-[1.2] text-balance"
          style={{ color: "#F4F1EC" }}
        >
          {title}
        </p>
      </a>
    );
  }
  return (
    <a
      href={to}
      className="group relative block aspect-[4/5] overflow-hidden"
      style={{ background: "#111" }}
    >
      <img
        src={imgUrl}
        alt={imgAlt}
        loading="lazy"
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-[1.04]"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 p-5">
        <p
          className="text-[10px] uppercase tracking-[0.32em] mb-2"
          style={{ color: "rgba(212,175,108,0.95)" }}
        >
          {eyebrow}
        </p>
        <p
          className="font-serif text-[19px] leading-[1.2] text-balance"
          style={{ color: "#F4F1EC" }}
        >
          {title}
        </p>
      </div>
    </a>
  );
}

function BrandsPanel({
  onMouseEnter,
  onMouseLeave,
}: {
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}) {
  // Source the brand list from the verified-live allowlist so this stays
  // in sync with the /brands index. We only render brands explicitly named
  // in the spec AND present in VERIFIED_LIVE_BRANDS.
  const featured = useMemo(
    () =>
      FEATURED_BRANDS.filter(isAllowedLuxuryBrand).filter((b) =>
        VERIFIED_LIVE_BRANDS.includes(b),
      ),
    [],
  );
  const all = useMemo(
    () =>
      ALL_BRANDS_TAIL.filter(isAllowedLuxuryBrand).filter((b) =>
        VERIFIED_LIVE_BRANDS.includes(b),
      ),
    [],
  );

  const { data: feature } = useQuery({
    queryKey: ["mega-feature", "brand-dolce-gabbana"],
    queryFn: () => fetchCollection("dolce-gabbana", 1),
    staleTime: 10 * 60_000,
    refetchOnWindowFocus: false,
  });
  const img = feature?.products?.[0]?.images?.[0];

  return (
    <PanelShell
      ariaLabel="Brands navigation"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className="grid grid-cols-[1fr_1fr_minmax(280px,22%)] gap-12">
        <BrandColumn heading="Featured Brands" brands={featured} />
        <BrandColumn heading="All Brands" brands={all} />
        <FeatureTile
          imgUrl={img?.url}
          imgAlt={img?.altText ?? "Dolce & Gabbana"}
          eyebrow="House Spotlight"
          title="Dolce & Gabbana"
          to={`/collections/${brandCollectionHandle("Dolce & Gabbana")}`}
        />
      </div>
      <div className="mt-8 pt-6 border-t border-white/10 flex justify-end">
        <Link
          to="/brands"
          className="text-[11px] uppercase tracking-[0.32em]"
          style={{ color: "rgba(212,175,108,1)" }}
        >
          View the house directory →
        </Link>
      </div>
    </PanelShell>
  );
}

function BrandColumn({
  heading,
  brands,
}: {
  heading: string;
  brands: string[];
}) {
  return (
    <div className="flex flex-col gap-5">
      <p
        className="text-[10px] uppercase tracking-[0.32em]"
        style={{ color: "rgba(212,175,108,0.85)" }}
      >
        {heading}
      </p>
      <ul className="grid grid-cols-2 gap-x-8 gap-y-3">
        {brands.map((b) => (
          <li key={b}>
            <a
              href={`/collections/${brandCollectionHandle(b)}`}
              className="text-[13px] font-light transition-colors"
              style={{ color: "rgba(244,241,236,0.82)" }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.color = "rgba(212,175,108,1)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.color = "rgba(244,241,236,0.82)")
              }
              data-nav-item={b}
              data-surface="mega_menu"
            >
              {b}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ────────────────────────── department tabs (legacy export) ────────────────────────── */

/**
 * Kept as a no-op export so legacy imports don't break. The new top-level
 * mega rail surfaces Men/Women directly, so the standalone dept tab strip
 * is no longer mounted in the header.
 */
export function DepartmentTabs() {
  return null;
}
