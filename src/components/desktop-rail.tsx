/**
 * Desktop category rail (row 2 of the Farfetch-style header).
 *
 * Renders, for the active department, a horizontal list of rail items:
 *
 *   Sale · New In · Vacation · Brands · {dept.columns[].heading...}
 *
 * Hover/focus behaviour:
 *   - Sale / New In / Vacation: plain link, no panel.
 *   - Brands: full-bleed megamenu panel — alphabetical brand list + 2 hero
 *     tiles (D&G + Pucci) sourced from `HERO_BRANDS`.
 *   - Each department column (Clothing, Shoes, Bags, …): panel listing the
 *     column's live sub-collections + that department's editorial feature
 *     tile on the right.
 *
 * Voice: ink/canvas/bronze. Sale rendered in bronze (PoR's red-equivalent).
 * Only live Shopify handles are linked; rail items whose target/column is
 * empty for the active dept are skipped — never a broken link.
 */
import { Link, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { fetchCollections, fetchVendorIndex, type ShopifyCollection } from "@/lib/shopify";
import {
  buildDepartments,
  buildBrandList,
  groupBrandsForMenu,
  vendorSlug,
  HERO_BRANDS,
  type MegaDepartment,
  type MegaColumn,
} from "@/lib/nav-config";
import { getShopifyMenu } from "@/lib/menu-source.functions";
import { buildDepartmentsFromShopifyMenu } from "@/lib/megamenu-source";
import { useDeptStore, type Dept } from "@/stores/dept-store";

/* ────────────────────────── public component ────────────────────────── */

export function DesktopCategoryRail() {
  const dept = useDeptStore((s) => s.dept);
  const [openKey, setOpenKey] = useState<string | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { data: liveCollections } = useQuery({
    queryKey: ["collections-all"],
    queryFn: () => fetchCollections(500),
    staleTime: 5 * 60_000,
  });
  const { data: menuSource } = useQuery({
    queryKey: ["shopify-main-menu"],
    queryFn: () => getShopifyMenu(),
    staleTime: 10 * 60_000,
  });
  const { data: brands } = useQuery({
    queryKey: ["nav-brand-index"],
    queryFn: () => fetchVendorIndex(),
    staleTime: 10 * 60_000,
    select: (rows) => buildBrandList(rows),
  });

  const liveHandles = useMemo(
    () => (liveCollections ? new Set(liveCollections.map((c) => c.handle)) : null),
    [liveCollections],
  );

  const departments: MegaDepartment[] = useMemo(() => {
    const built = buildDepartments(liveCollections ?? []);
    const filtered = liveHandles
      ? built.filter((d) => liveHandles.has(d.rootHandle))
      : built;
    const shopify = menuSource?.tree
      ? buildDepartmentsFromShopifyMenu(menuSource.tree, filtered, liveHandles)
      : null;
    return shopify ?? filtered;
  }, [liveCollections, liveHandles, menuSource]);

  const activeDept = useMemo(
    () => departments.find((d) => d.key === dept) ?? departments[0],
    [departments, dept],
  );

  const saleHandle = useMemo(() => {
    if (!liveHandles) return null;
    for (const h of [`${dept}-sale`, `sale-${dept}`, "sale"]) {
      if (liveHandles.has(h)) return h;
    }
    return null;
  }, [liveHandles, dept]);
  const newInHandle = useMemo(() => {
    if (!liveHandles) return "new-arrivals";
    for (const h of [`${dept}-new-arrivals`, `new-arrivals-${dept}`, "new-arrivals"]) {
      if (liveHandles.has(h)) return h;
    }
    return null;
  }, [liveHandles, dept]);

  const openNow = useCallback((key: string) => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpenKey(key);
  }, []);
  const scheduleClose = useCallback(() => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setOpenKey(null), 120);
  }, []);

  // Reset open key when dept switches.
  useEffect(() => setOpenKey(null), [dept]);

  // Escape closes any open panel.
  useEffect(() => {
    if (!openKey) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenKey(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openKey]);

  if (!activeDept) {
    // No deps loaded yet — render an invisible skeleton so the row keeps height.
    return <div className="h-12" aria-hidden="true" />;
  }

  // Filter columns to live items so we never render empty rail items.
  const liveColumns: MegaColumn[] = activeDept.columns
    .map((col) => ({
      heading: col.heading,
      items: liveHandles
        ? col.items.filter((it) => liveHandles.has(it.handle))
        : col.items,
    }))
    .filter((col) => col.items.length > 0);

  return (
    <div
      className="relative"
      onMouseLeave={scheduleClose}
    >
      <nav
        aria-label={`${activeDept.label} categories`}
        className="flex items-center gap-7 text-[12px] tracking-[0.02em] text-ink"
      >
        {saleHandle && (
          <RailLink
            label="Sale"
            to={`/collections/${saleHandle}`}
            accent
          />
        )}
        {newInHandle && (
          <RailLink label="New In" to={`/collections/${newInHandle}`} />
        )}
        <RailLink label="Vacation" to="/vacation-stylist" />

        <RailTrigger
          label="Brands"
          to="/brands"
          isOpen={openKey === "brands"}
          onOpen={() => openNow("brands")}
          onClose={() => setOpenKey(null)}
        >
          <BrandsPanel
            brands={brands ?? []}
            liveCollections={liveCollections ?? []}
            onMouseEnter={() => openNow("brands")}
            onMouseLeave={scheduleClose}
          />
        </RailTrigger>

        {liveColumns.map((col) => {
          // Prefer a column-specific collection if it exists in the live catalog
          // (e.g. "women-clothing"); otherwise fall back to the dept root so the
          // click always lands somewhere shoppable.
          const slug = col.heading.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
          const candidate = `${activeDept.key}-${slug}`;
          const colHandle =
            liveHandles && liveHandles.has(candidate) ? candidate : activeDept.rootHandle;
          return (
            <RailTrigger
              key={col.heading}
              label={col.heading}
              to={`/collections/${colHandle}`}
              isOpen={openKey === col.heading}
              onOpen={() => openNow(col.heading)}
              onClose={() => setOpenKey(null)}
            >
              <CategoryPanel
                column={col}
                dept={activeDept}
                liveCollections={liveCollections ?? []}
                onMouseEnter={() => openNow(col.heading)}
                onMouseLeave={scheduleClose}
              />
            </RailTrigger>
          );
        })}
      </nav>
    </div>
  );
}

/* ────────────────────────── primitives ────────────────────────── */

function RailLink({
  label,
  to,
  accent,
}: {
  label: string;
  to: string;
  accent?: boolean;
}) {
  return (
    <a
      href={to}
      className={`whitespace-nowrap py-3 transition-colors ${
        accent ? "text-bronze hover:text-ink" : "text-ink hover:text-bronze"
      }`}
    >
      {label}
    </a>
  );
}

function RailTrigger({
  label,
  to,
  isOpen,
  onOpen,
  onClose,
  children,
}: {
  label: string;
  to: string;
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className="relative"
      onMouseEnter={onOpen}
      onFocus={onOpen}
    >
      <a
        href={to}
        aria-haspopup="true"
        aria-expanded={isOpen}
        onClick={() => onClose()}
        className={`whitespace-nowrap py-3 transition-colors ${
          isOpen ? "text-bronze" : "text-ink hover:text-bronze"
        }`}
      >
        {label}
      </a>
      {isOpen && children}
    </div>
  );
}

/* ────────────────────────── Category panel ────────────────────────── */

function CategoryPanel({
  column,
  dept,
  liveCollections,
  onMouseEnter,
  onMouseLeave,
}: {
  column: MegaColumn;
  dept: MegaDepartment;
  liveCollections: ShopifyCollection[];
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}) {
  const featureImg = liveCollections.find(
    (c) => c.handle === dept.feature.handle,
  )?.image;
  // Split the column items into 3 visual columns for breathing room.
  const chunks = chunk(column.items, Math.ceil(column.items.length / 3));

  return (
    <div
      role="region"
      aria-label={`${column.heading} navigation`}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className="fixed left-0 right-0 top-[calc(var(--header-row1)+var(--header-row2))] z-40 bg-canvas border-t border-ink/10 shadow-[0_40px_80px_-40px_rgba(0,0,0,0.12)]"
    >
      <div className="max-w-screen-2xl mx-auto px-12 py-12 grid grid-cols-[1fr_minmax(320px,28%)] gap-16">
        <div>
          <p className="font-serif italic text-[14px] tracking-[0.04em] text-bronze pb-3 border-b border-ink/15 mb-6">
            {dept.label} · {column.heading}
          </p>
          <div className="grid grid-cols-3 gap-x-12 gap-y-2">
            {chunks.map((c, i) => (
              <ul key={i} className="flex flex-col gap-2.5">
                {c.map((it) => (
                  <li key={it.handle}>
                    <Link
                      to="/collections/$handle"
                      params={{ handle: it.handle }}
                      className="text-[13px] font-light text-ink/75 hover:text-ink transition-colors inline-block normal-case tracking-normal leading-relaxed"
                    >
                      {it.label}
                    </Link>
                  </li>
                ))}
              </ul>
            ))}
          </div>
        </div>

        <Link
          to="/collections/$handle"
          params={{ handle: dept.feature.handle }}
          className="group relative block aspect-[4/5] overflow-hidden bg-muted"
        >
          {featureImg && (
            <img
              src={featureImg.url}
              alt={featureImg.altText ?? `${dept.feature.title} — ${dept.label}`}
              loading="lazy"
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-[1.04]"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-ink/75 via-ink/20 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-8">
            <p className="text-[10px] uppercase tracking-[0.4em] text-canvas/75 mb-3">
              {dept.feature.eyebrow}
            </p>
            <p className="font-serif text-[26px] leading-[1.15] text-canvas text-balance">
              {dept.feature.title}
            </p>
            <span className="mt-5 inline-block text-[10px] uppercase tracking-[0.35em] text-canvas/90 border-b border-canvas/40 pb-1">
              Discover
            </span>
          </div>
        </Link>
      </div>
    </div>
  );
}

/* ────────────────────────── Brands panel ────────────────────────── */

function BrandsPanel({
  brands,
  liveCollections,
  onMouseEnter,
  onMouseLeave,
}: {
  brands: ReturnType<typeof buildBrandList>;
  liveCollections: ShopifyCollection[];
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}) {
  const grouped = groupBrandsForMenu(brands);
  const liveVendors = useMemo(
    () => new Set(brands.map((b) => b.vendor.toLowerCase())),
    [brands],
  );
  // Only render hero tiles for brands actually in the catalog.
  const heroTiles = HERO_BRANDS.filter((h) =>
    liveVendors.has(h.vendor.toLowerCase()),
  );
  const heroImg = (vendor: string) => {
    const slug = vendorSlug(vendor);
    return (
      liveCollections.find((c) => c.handle === `brand-${slug}`)?.image ??
      liveCollections.find((c) => c.handle === "best-selling-brands")?.image
    );
  };

  return (
    <div
      role="region"
      aria-label="Brands navigation"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className="fixed left-0 right-0 top-[calc(var(--header-row1)+var(--header-row2))] z-40 bg-canvas border-t border-ink/10 shadow-[0_40px_80px_-40px_rgba(0,0,0,0.12)]"
    >
      <div className="max-w-screen-2xl mx-auto px-12 py-12 grid grid-cols-[1fr_minmax(360px,32%)] gap-16">
        <div>
          <div className="flex items-baseline justify-between pb-3 mb-6 border-b border-ink/15">
            <p className="font-serif italic text-[14px] tracking-[0.04em] text-bronze">
              The House Directory
            </p>
            <Link
              to="/brands"
              className="text-[11px] uppercase tracking-[0.3em] text-ink hover:text-bronze"
            >
              View all →
            </Link>
          </div>
          <div
            className="grid gap-x-12 gap-y-2"
            style={{
              gridTemplateColumns: `repeat(${Math.max(grouped.length, 1)}, minmax(0, 1fr))`,
            }}
          >
            {grouped.length === 0 ? (
              <p className="text-[12px] font-light italic text-muted-foreground">
                Loading houses…
              </p>
            ) : (
              grouped.map((col) => (
                <div key={col.heading} className="flex flex-col gap-3">
                  <p className="text-[10px] uppercase tracking-[0.3em] text-ink/45">
                    {col.heading}
                  </p>
                  <ul className="flex flex-col gap-2">
                    {col.items.map((b) => (
                      <li key={b.vendor}>
                        <Link
                          to="/brand/$vendor"
                          params={{ vendor: vendorSlug(b.vendor) }}
                          className="text-[13px] font-light text-ink/75 hover:text-ink transition-colors inline-block normal-case tracking-normal leading-relaxed"
                        >
                          {b.vendor}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-5">
          {heroTiles.map((h) => {
            const img = heroImg(h.vendor);
            return (
              <a
                key={h.vendor}
                href={h.to}
                className="group relative block aspect-[3/4] overflow-hidden bg-muted"
              >
                {img && (
                  <img
                    src={img.url}
                    alt={img.altText ?? h.title}
                    loading="lazy"
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-[1.04]"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/25 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-5">
                  <p className="text-[9px] uppercase tracking-[0.35em] text-canvas/75 mb-2">
                    {h.eyebrow}
                  </p>
                  <p className="font-serif text-[19px] leading-[1.15] text-canvas text-balance">
                    {h.title}
                  </p>
                </div>
              </a>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────── tab strip ────────────────────────── */

/**
 * Department tab strip rendered at the top-left of row 1 in the header.
 * Width is intentionally compact so it sits beside the centered logo.
 */
export function DepartmentTabs() {
  const dept = useDeptStore((s) => s.dept);
  const setDept = useDeptStore((s) => s.setDept);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const TABS: { key: Dept; label: string; to: string }[] = [
    { key: "women", label: "Women", to: "/women" },
    { key: "men", label: "Men", to: "/men" },
  ];
  // Prefer URL as source of truth on dept landing pages so the underline
  // is correct on first paint (the dept store hydrates in useEffect).
  const urlDept: Dept | null = pathname.startsWith("/men")
    ? "men"
    : pathname.startsWith("/women")
      ? "women"
      : null;
  const effective: Dept = urlDept ?? dept;
  return (
    <div className="flex items-stretch gap-6">
      {TABS.map((t) => {
        const active = effective === t.key;
        return (
          <Link
            key={t.key}
            to={t.to}
            onClick={() => setDept(t.key)}
            className={`relative py-2 text-[11px] uppercase tracking-[0.3em] transition-colors ${
              active ? "text-ink" : "text-ink/45 hover:text-ink"
            }`}
          >
            {t.label}
            {active && (
              <span
                aria-hidden="true"
                className="absolute left-0 right-0 -bottom-[2px] h-px bg-ink"
              />
            )}
          </Link>
        );
      })}
    </div>
  );
}

/* ────────────────────────── utils ────────────────────────── */

function chunk<T>(arr: T[], size: number): T[][] {
  if (size <= 0) return [arr];
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}
