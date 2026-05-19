import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { fetchCollections, fetchVendorIndex } from "@/lib/shopify";
import { collectionImage } from "@/lib/collection-image";
import {
  buildDepartments,
  buildBrandList,
  groupBrandsForMenu,
  vendorSlug,
  type MegaDepartment,
  type BrandEntry,
} from "@/lib/nav-config";

/**
 * Desktop hover/focus megamenu.
 *
 * - Structure for Women / Men is generated live from Shopify Smart
 *   Collections via `buildDepartments()` — new collections appear in the
 *   right column automatically.
 * - The Brands panel is generated live from product vendor data, filtered
 *   to a curated luxury house allowlist.
 */
export function DesktopMegamenu() {
  const [openKey, setOpenKey] = useState<string | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { data: liveCollections } = useQuery({
    queryKey: ["collections-all"],
    queryFn: () => fetchCollections(100),
    staleTime: 5 * 60_000,
  });

  const departments = useMemo(
    () => buildDepartments(liveCollections ?? []),
    [liveCollections],
  );

  const liveHandles = liveCollections
    ? new Set(liveCollections.map((c) => c.handle))
    : null;

  function openNow(key: string) {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpenKey(key);
  }
  function scheduleClose() {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setOpenKey(null), 120);
  }

  useEffect(() => {
    if (!openKey) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpenKey(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openKey]);

  return (
    <div className="flex items-center gap-8" onMouseLeave={scheduleClose}>
      {departments.map((dept) => {
        const isOpen = openKey === dept.key;
        return (
          <MegaTrigger
            key={dept.key}
            dept={dept}
            isOpen={isOpen}
            onOpen={() => openNow(dept.key)}
            onScheduleClose={scheduleClose}
            liveHandles={liveHandles}
          />
        );
      })}
      <BrandsTrigger
        isOpen={openKey === "brands"}
        onOpen={() => openNow("brands")}
        onScheduleClose={scheduleClose}
      />
    </div>
  );
}

function MegaTrigger({
  dept,
  isOpen,
  onOpen,
  onScheduleClose,
  liveHandles,
}: {
  dept: MegaDepartment;
  isOpen: boolean;
  onOpen: () => void;
  onScheduleClose: () => void;
  liveHandles: Set<string> | null;
}) {
  const panelId = useId();
  return (
    <div className="relative" onMouseEnter={onOpen} onFocus={onOpen}>
      <Link
        to="/collections/$handle"
        params={{ handle: dept.rootHandle }}
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-controls={panelId}
        className={`hover:text-bronze transition-colors whitespace-nowrap py-2 ${
          isOpen ? "text-bronze" : ""
        }`}
      >
        {dept.label}
      </Link>
      {isOpen && (
        <MegaPanel
          id={panelId}
          dept={dept}
          liveHandles={liveHandles}
          onMouseEnter={onOpen}
          onMouseLeave={onScheduleClose}
        />
      )}
    </div>
  );
}

function MegaPanel({
  id,
  dept,
  liveHandles,
  onMouseEnter,
  onMouseLeave,
}: {
  id: string;
  dept: MegaDepartment;
  liveHandles: Set<string> | null;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}) {
  const featureImg = collectionImage({ handle: dept.feature.handle, title: dept.label });
  return (
    <div
      id={id}
      role="region"
      aria-label={`${dept.label} navigation`}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className="fixed left-0 right-0 top-20 z-40 bg-canvas border-y border-ink/10 shadow-[0_30px_60px_-30px_rgba(0,0,0,0.18)]"
    >
      <div className="max-w-screen-2xl mx-auto px-10 py-12 grid grid-cols-[1fr_minmax(320px,28%)] gap-12">
        <div
          className="grid gap-x-10 gap-y-2"
          style={{ gridTemplateColumns: `repeat(${dept.columns.length}, minmax(0, 1fr))` }}
        >
          {dept.columns.map((col) => {
            const items = liveHandles
              ? col.items.filter((it) => liveHandles.has(it.handle))
              : col.items;
            if (items.length === 0) return null;
            return (
              <div key={col.heading} className="flex flex-col gap-3">
                <p className="text-[10px] uppercase tracking-[0.3em] text-bronze font-medium pb-2 border-b border-ink/10">
                  {col.heading}
                </p>
                <ul className="flex flex-col gap-1.5">
                  {items.map((it) => (
                    <li key={it.handle}>
                      <Link
                        to="/collections/$handle"
                        params={{ handle: it.handle }}
                        className="text-[13px] text-ink/80 hover:text-ink hover:translate-x-0.5 transition-all inline-block normal-case tracking-normal"
                      >
                        {it.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        <Link
          to="/collections/$handle"
          params={{ handle: dept.feature.handle }}
          className="group relative block aspect-[4/5] overflow-hidden bg-muted"
        >
          <img
            src={featureImg}
            alt={dept.feature.title}
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/15 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-6">
            <p className="text-[10px] uppercase tracking-[0.3em] text-canvas/80 mb-2">
              {dept.feature.eyebrow}
            </p>
            <p className="font-serif text-2xl text-canvas leading-tight text-balance">
              {dept.feature.title}
            </p>
            <span className="mt-4 inline-block text-[11px] uppercase tracking-[0.25em] text-canvas border-b border-canvas/60 pb-0.5">
              Discover
            </span>
          </div>
        </Link>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Brands megamenu — live from Shopify vendor data
// -----------------------------------------------------------------------------

function useBrandIndex() {
  return useQuery({
    queryKey: ["nav-brand-index"],
    queryFn: () => fetchVendorIndex(4, 250),
    staleTime: 10 * 60_000,
    select: (rows) => buildBrandList(rows),
  });
}

function BrandsTrigger({
  isOpen,
  onOpen,
  onScheduleClose,
}: {
  isOpen: boolean;
  onOpen: () => void;
  onScheduleClose: () => void;
}) {
  const panelId = useId();
  const { data: brands } = useBrandIndex();
  return (
    <div className="relative" onMouseEnter={onOpen} onFocus={onOpen}>
      <Link
        to="/brands"
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-controls={panelId}
        className={`hover:text-bronze transition-colors whitespace-nowrap py-2 ${
          isOpen ? "text-bronze" : ""
        }`}
      >
        Brands
      </Link>
      {isOpen && (
        <BrandsPanel
          id={panelId}
          brands={brands ?? []}
          onMouseEnter={onOpen}
          onMouseLeave={onScheduleClose}
        />
      )}
    </div>
  );
}

function BrandsPanel({
  id,
  brands,
  onMouseEnter,
  onMouseLeave,
}: {
  id: string;
  brands: BrandEntry[];
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}) {
  const grouped = groupBrandsForMenu(brands);
  const featureImg = collectionImage({ handle: "best-selling-brands", title: "Brands" });

  return (
    <div
      id={id}
      role="region"
      aria-label="Brands navigation"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className="fixed left-0 right-0 top-20 z-40 bg-canvas border-y border-ink/10 shadow-[0_30px_60px_-30px_rgba(0,0,0,0.18)]"
    >
      <div className="max-w-screen-2xl mx-auto px-10 py-12 grid grid-cols-[1fr_minmax(320px,28%)] gap-12">
        <div
          className="grid gap-x-10 gap-y-2"
          style={{ gridTemplateColumns: `repeat(${Math.max(grouped.length, 1)}, minmax(0, 1fr))` }}
        >
          {grouped.length === 0 ? (
            <p className="text-[12px] text-muted-foreground">Loading houses…</p>
          ) : (
            grouped.map((col) => (
              <div key={col.heading} className="flex flex-col gap-3">
                <p className="text-[10px] uppercase tracking-[0.3em] text-bronze font-medium pb-2 border-b border-ink/10">
                  {col.heading}
                </p>
                <ul className="flex flex-col gap-1.5">
                  {col.items.map((b) => (
                    <li key={b.vendor}>
                      <Link
                        to="/brand/$vendor"
                        params={{ vendor: vendorSlug(b.vendor) }}
                        className="text-[13px] text-ink/80 hover:text-ink hover:translate-x-0.5 transition-all inline-block normal-case tracking-normal"
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

        <Link
          to="/brands"
          className="group relative block aspect-[4/5] overflow-hidden bg-muted"
        >
          <img
            src={featureImg}
            alt="The full house directory"
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/15 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-6">
            <p className="text-[10px] uppercase tracking-[0.3em] text-canvas/80 mb-2">
              The Directory
            </p>
            <p className="font-serif text-2xl text-canvas leading-tight text-balance">
              Every house, A — Z.
            </p>
            <span className="mt-4 inline-block text-[11px] uppercase tracking-[0.25em] text-canvas border-b border-canvas/60 pb-0.5">
              Browse All Brands
            </span>
          </div>
        </Link>
      </div>
    </div>
  );
}

/**
 * Mobile / small-screen accordion. Each department + Brands is an expandable
 * group fed from the same live Shopify data.
 */
export function MobileMegamenu() {
  const [openKey, setOpenKey] = useState<string | null>("women");

  const { data: liveCollections } = useQuery({
    queryKey: ["collections-all"],
    queryFn: () => fetchCollections(100),
    staleTime: 5 * 60_000,
  });
  const liveHandles = liveCollections
    ? new Set(liveCollections.map((c) => c.handle))
    : null;
  const departments = useMemo(
    () => buildDepartments(liveCollections ?? []),
    [liveCollections],
  );
  const { data: brands } = useBrandIndex();
  const brandGroups = useMemo(() => groupBrandsForMenu(brands ?? []), [brands]);

  return (
    <div className="flex flex-col divide-y divide-ink/10">
      {departments.map((dept) => {
        const isOpen = openKey === dept.key;
        return (
          <div key={dept.key}>
            <button
              type="button"
              onClick={() => setOpenKey(isOpen ? null : dept.key)}
              aria-expanded={isOpen}
              className="w-full flex items-center justify-between py-4 text-[12px] uppercase tracking-[0.3em] text-ink"
            >
              <span>{dept.label}</span>
              <span className="text-bronze text-lg leading-none">{isOpen ? "−" : "+"}</span>
            </button>
            {isOpen && (
              <div className="pb-6 flex flex-col gap-5">
                {dept.columns.map((col) => {
                  const items = liveHandles
                    ? col.items.filter((it) => liveHandles.has(it.handle))
                    : col.items;
                  if (items.length === 0) return null;
                  return (
                    <div key={col.heading} className="flex flex-col gap-1.5">
                      <p className="text-[10px] uppercase tracking-[0.3em] text-bronze mb-1">
                        {col.heading}
                      </p>
                      {items.map((it) => (
                        <Link
                          key={it.handle}
                          to="/collections/$handle"
                          params={{ handle: it.handle }}
                          className="text-[14px] text-ink/85 hover:text-bronze py-1"
                        >
                          {it.label}
                        </Link>
                      ))}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      {/* Brands accordion */}
      <div>
        <button
          type="button"
          onClick={() => setOpenKey(openKey === "brands" ? null : "brands")}
          aria-expanded={openKey === "brands"}
          className="w-full flex items-center justify-between py-4 text-[12px] uppercase tracking-[0.3em] text-ink"
        >
          <span>Brands</span>
          <span className="text-bronze text-lg leading-none">{openKey === "brands" ? "−" : "+"}</span>
        </button>
        {openKey === "brands" && (
          <div className="pb-6 flex flex-col gap-5">
            {brandGroups.length === 0 ? (
              <p className="text-[12px] text-muted-foreground">Loading houses…</p>
            ) : (
              brandGroups.map((col) => (
                <div key={col.heading} className="flex flex-col gap-1.5">
                  <p className="text-[10px] uppercase tracking-[0.3em] text-bronze mb-1">
                    {col.heading}
                  </p>
                  {col.items.map((b) => (
                    <Link
                      key={b.vendor}
                      to="/brand/$vendor"
                      params={{ vendor: vendorSlug(b.vendor) }}
                      className="text-[14px] text-ink/85 hover:text-bronze py-1"
                    >
                      {b.vendor}
                    </Link>
                  ))}
                </div>
              ))
            )}
            <Link
              to="/brands"
              className="mt-2 text-[11px] uppercase tracking-[0.3em] text-bronze border-b border-bronze/40 self-start pb-1"
            >
              View the full directory →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
