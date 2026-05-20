import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { fetchCollections, fetchVendorIndex } from "@/lib/shopify";
import { collectionImage, collectionImageAlt, collectionImageFocal } from "@/lib/collection-image";
import { getCollectionImageMap } from "@/lib/collection-image.functions";

function useCollectionImageMap() {
  const q = useQuery({
    queryKey: ["collection-image-map"],
    queryFn: () => getCollectionImageMap(),
    staleTime: 5 * 60 * 1000,
  });
  return q.data ?? {};
}
import {
  buildDepartments,
  buildBrandList,
  groupBrandsForMenu,
  vendorSlug,
  type MegaDepartment,
  type BrandEntry,
} from "@/lib/nav-config";

/**
 * Desktop megamenu.
 *
 * Accessibility — implements the WAI-ARIA "disclosure" pattern:
 *   - Each trigger is a <button> with aria-haspopup="true", aria-expanded,
 *     and aria-controls pointing at the panel.
 *   - Mouse: hover opens, leave (with grace timer) closes.
 *   - Keyboard: Enter/Space/ArrowDown opens and moves focus into the panel.
 *     Escape closes the panel and returns focus to the trigger.
 *     ArrowLeft / ArrowRight moves between triggers in the menubar.
 *   - Focus-out: when keyboard focus leaves the entire trigger+panel group,
 *     the panel closes automatically.
 *   - A "Shop all" link is added as the first item in each panel so users who
 *     activated the trigger via keyboard can still reach the root collection.
 *
 * Structure is generated live from Shopify Smart Collections / vendor data.
 */
export function DesktopMegamenu() {
  const [openKey, setOpenKey] = useState<string | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const triggerRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

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

  const triggerKeys = useMemo(
    () => [...departments.map((d) => d.key as string), "brands"],
    [departments],
  );

  const openNow = useCallback((key: string) => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpenKey(key);
  }, []);
  /**
   * Mouse-leave close. If the panel is hiding while keyboard focus is still
   * inside it, move focus back to the matching trigger first — otherwise the
   * `hidden` attribute would strand focus on the body and break Tab order.
   * Escape and focus-out cases are handled by closeAndFocusTrigger / onBlur.
   */
  const scheduleClose = useCallback(() => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => {
      setOpenKey((current) => {
        if (current) {
          const trigger = triggerRefs.current.get(current);
          const active = document.activeElement as HTMLElement | null;
          const panel = trigger?.parentElement?.querySelector<HTMLElement>('[role="region"]');
          if (trigger && active && panel && panel.contains(active)) {
            trigger.focus();
          }
        }
        return null;
      });
    }, 120);
  }, []);

  const closeAndFocusTrigger = useCallback((key: string | null) => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpenKey(null);
    if (key) triggerRefs.current.get(key)?.focus();
  }, []);

  // Global Escape closes any open panel.
  useEffect(() => {
    if (!openKey) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeAndFocusTrigger(openKey);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openKey, closeAndFocusTrigger]);

  // Close when focus leaves the menubar group entirely.
  const onWrapperBlur = (e: React.FocusEvent<HTMLDivElement>) => {
    if (!wrapperRef.current) return;
    const next = e.relatedTarget as Node | null;
    if (!next || !wrapperRef.current.contains(next)) {
      if (closeTimer.current) clearTimeout(closeTimer.current);
      setOpenKey(null);
    }
  };

  // ArrowLeft / ArrowRight rove between triggers.
  const onTriggerArrow = (e: React.KeyboardEvent, currentKey: string) => {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    e.preventDefault();
    const idx = triggerKeys.indexOf(currentKey);
    if (idx < 0) return;
    const delta = e.key === "ArrowRight" ? 1 : -1;
    const nextKey = triggerKeys[(idx + delta + triggerKeys.length) % triggerKeys.length];
    triggerRefs.current.get(nextKey)?.focus();
  };

  const registerTrigger = (key: string) => (el: HTMLButtonElement | null) => {
    if (el) triggerRefs.current.set(key, el);
    else triggerRefs.current.delete(key);
  };

  return (
    <div
      ref={wrapperRef}
      role="menubar"
      aria-label="Primary"
      className="flex items-center gap-8"
      onMouseLeave={scheduleClose}
      onBlur={onWrapperBlur}
    >
      {departments.map((dept) => {
        const isOpen = openKey === dept.key;
        return (
          <MegaTrigger
            key={dept.key}
            dept={dept}
            isOpen={isOpen}
            onOpen={() => openNow(dept.key)}
            onScheduleClose={scheduleClose}
            onCloseAndFocus={() => closeAndFocusTrigger(dept.key)}
            onArrow={(e) => onTriggerArrow(e, dept.key)}
            registerTrigger={registerTrigger(dept.key)}
            liveHandles={liveHandles}
          />
        );
      })}
      <BrandsTrigger
        isOpen={openKey === "brands"}
        onOpen={() => openNow("brands")}
        onScheduleClose={scheduleClose}
        onCloseAndFocus={() => closeAndFocusTrigger("brands")}
        onArrow={(e) => onTriggerArrow(e, "brands")}
        registerTrigger={registerTrigger("brands")}
      />
      <Link
        to="/swim"
        className={TRIGGER_CLASS + " font-serif italic text-[var(--sea)]"}
        role="menuitem"
      >
        Swim
      </Link>
    </div>
  );
}

const TRIGGER_CLASS =
  "hover:text-bronze transition-colors whitespace-nowrap py-2 bg-transparent border-0 p-0 m-0 font-inherit text-inherit cursor-pointer focus-visible:outline-none focus-visible:text-bronze";

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"]), input:not([disabled]), select:not([disabled]), textarea:not([disabled])';

function getPanelFocusables(panelId: string): HTMLElement[] {
  const panel = document.getElementById(panelId);
  if (!panel) return [];
  return Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    (el) => !el.hasAttribute("hidden") && el.offsetParent !== null,
  );
}

function focusFirstLinkInPanel(panelId: string) {
  // Defer so the panel is mounted before we query it.
  requestAnimationFrame(() => {
    getPanelFocusables(panelId)[0]?.focus();
  });
}

/**
 * Trap Tab / Shift+Tab inside the open panel so keyboard users can't
 * accidentally land in background content while the megamenu is open.
 * Escape and arrow-key behaviour are handled separately by the trigger.
 */
function onPanelKeyDown(
  e: React.KeyboardEvent<HTMLDivElement>,
  panelId: string,
) {
  if (e.key !== "Tab") return;
  const focusables = getPanelFocusables(panelId);
  if (focusables.length === 0) return;
  const first = focusables[0];
  const last = focusables[focusables.length - 1];
  const active = document.activeElement as HTMLElement | null;
  if (e.shiftKey && active === first) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && active === last) {
    e.preventDefault();
    first.focus();
  }
}

function MegaTrigger({
  dept,
  isOpen,
  onOpen,
  onScheduleClose,
  onCloseAndFocus,
  onArrow,
  registerTrigger,
  liveHandles,
}: {
  dept: MegaDepartment;
  isOpen: boolean;
  onOpen: () => void;
  onScheduleClose: () => void;
  onCloseAndFocus: () => void;
  onArrow: (e: React.KeyboardEvent) => void;
  registerTrigger: (el: HTMLButtonElement | null) => void;
  liveHandles: Set<string> | null;
}) {
  const panelId = useId();

  const onKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
      e.preventDefault();
      onOpen();
      focusFirstLinkInPanel(panelId);
      return;
    }
    if (e.key === "Escape" && isOpen) {
      e.preventDefault();
      onCloseAndFocus();
      return;
    }
    onArrow(e);
  };

  return (
    <div className="relative" onMouseEnter={onOpen} role="none">
      <button
        ref={registerTrigger}
        type="button"
        role="menuitem"
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-controls={panelId}
        onClick={() => (isOpen ? onCloseAndFocus() : onOpen())}
        onKeyDown={onKeyDown}
        onFocus={onOpen}
        className={`${TRIGGER_CLASS} ${isOpen ? "text-bronze" : ""}`}
      >
        {dept.label}
      </button>
      <MegaPanel
        id={panelId}
        dept={dept}
        isOpen={isOpen}
        liveHandles={liveHandles}
        onMouseEnter={onOpen}
        onMouseLeave={onScheduleClose}
      />
    </div>
  );
}

function MegaPanel({
  id,
  dept,
  isOpen,
  liveHandles,
  onMouseEnter,
  onMouseLeave,
}: {
  id: string;
  dept: MegaDepartment;
  isOpen: boolean;
  liveHandles: Set<string> | null;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}) {
  const dynamicMap = useCollectionImageMap();
  const featureImg = collectionImage({ handle: dept.feature.handle, title: dept.label, dynamicMap });
  return (
    <div
      id={id}
      role="region"
      aria-label={`${dept.label} navigation`}
      hidden={!isOpen}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onKeyDown={(e) => onPanelKeyDown(e, id)}
      className="fixed left-0 right-0 top-20 z-40 bg-canvas border-t border-ink/10 shadow-[0_40px_80px_-40px_rgba(0,0,0,0.12)]"
      data-testid="megamenu-panel"
      data-dept={dept.label}
    >
      <div className="max-w-screen-2xl mx-auto px-12 py-16 grid grid-cols-[1fr_minmax(340px,30%)] gap-16">
        <div
          className="grid gap-x-12 gap-y-2"
          style={{ gridTemplateColumns: `repeat(${dept.columns.length}, minmax(0, 1fr))` }}
        >
          {dept.columns.map((col, colIdx) => {
            const items = liveHandles
              ? col.items.filter((it) => liveHandles.has(it.handle))
              : col.items;
            if (items.length === 0) return null;
            return (
              <div key={col.heading} className="flex flex-col gap-5">
                <p className="font-serif italic text-[13px] tracking-[0.04em] text-bronze pb-3 border-b border-ink/15">
                  {col.heading}
                </p>
                <ul className="flex flex-col gap-2.5">
                  {colIdx === 0 && (
                    <li>
                      <Link
                        to="/collections/$handle"
                        params={{ handle: dept.rootHandle }}
                        className="text-[13px] text-ink hover:text-bronze inline-block normal-case tracking-normal font-medium"
                      >
                        Shop all {dept.label}
                      </Link>
                    </li>
                  )}
                  {items.map((it) => (
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
              </div>
            );
          })}
        </div>

        <Link
          to="/collections/$handle"
          params={{ handle: dept.feature.handle }}
          className="group relative block aspect-[4/5] overflow-hidden bg-muted"
          data-testid="megamenu-feature-tile"
          data-handle={dept.feature.handle}
        >
          <img
            src={featureImg}
            alt={collectionImageAlt({ handle: dept.feature.handle, title: dept.feature.title ?? dept.label })}
            loading="lazy"
            style={{ objectPosition: collectionImageFocal({ handle: dept.feature.handle, title: dept.feature.title ?? dept.label }) }}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-[1.04]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink/75 via-ink/20 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-8">
            <p className="text-[10px] uppercase tracking-[0.4em] text-canvas/75 mb-3">
              {dept.feature.eyebrow}
            </p>
            <p className="font-serif text-[28px] leading-[1.15] text-canvas text-balance">
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
  onCloseAndFocus,
  onArrow,
  registerTrigger,
}: {
  isOpen: boolean;
  onOpen: () => void;
  onScheduleClose: () => void;
  onCloseAndFocus: () => void;
  onArrow: (e: React.KeyboardEvent) => void;
  registerTrigger: (el: HTMLButtonElement | null) => void;
}) {
  const panelId = useId();
  const { data: brands } = useBrandIndex();

  const onKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
      e.preventDefault();
      onOpen();
      focusFirstLinkInPanel(panelId);
      return;
    }
    if (e.key === "Escape" && isOpen) {
      e.preventDefault();
      onCloseAndFocus();
      return;
    }
    onArrow(e);
  };

  return (
    <div className="relative" onMouseEnter={onOpen} role="none">
      <button
        ref={registerTrigger}
        type="button"
        role="menuitem"
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-controls={panelId}
        onClick={() => (isOpen ? onCloseAndFocus() : onOpen())}
        onKeyDown={onKeyDown}
        onFocus={onOpen}
        className={`${TRIGGER_CLASS} ${isOpen ? "text-bronze" : ""}`}
      >
        Brands
      </button>
      <BrandsPanel
        id={panelId}
        isOpen={isOpen}
        brands={brands ?? []}
        onMouseEnter={onOpen}
        onMouseLeave={onScheduleClose}
      />
    </div>
  );
}

function BrandsPanel({
  id,
  isOpen,
  brands,
  onMouseEnter,
  onMouseLeave,
}: {
  id: string;
  isOpen: boolean;
  brands: BrandEntry[];
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}) {
  const grouped = groupBrandsForMenu(brands);
  const dynamicMap = useCollectionImageMap();
  const featureImg = collectionImage({ handle: "best-selling-brands", title: "Brands", dynamicMap });

  return (
    <div
      id={id}
      role="region"
      aria-label="Brands navigation"
      hidden={!isOpen}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onKeyDown={(e) => onPanelKeyDown(e, id)}
      className="fixed left-0 right-0 top-20 z-40 bg-canvas border-t border-ink/10 shadow-[0_40px_80px_-40px_rgba(0,0,0,0.12)]"
    >
      <div className="max-w-screen-2xl mx-auto px-12 py-16 grid grid-cols-[1fr_minmax(340px,30%)] gap-16">
        <div
          className="grid gap-x-12 gap-y-2"
          style={{ gridTemplateColumns: `repeat(${Math.max(grouped.length, 1)}, minmax(0, 1fr))` }}
        >
          {grouped.length === 0 ? (
            <p className="text-[12px] font-light italic text-muted-foreground">Loading houses…</p>
          ) : (
            grouped.map((col, colIdx) => (
              <div key={col.heading} className="flex flex-col gap-5">
                <p className="font-serif italic text-[13px] tracking-[0.04em] text-bronze pb-3 border-b border-ink/15">
                  {col.heading}
                </p>
                <ul className="flex flex-col gap-2.5">
                  {colIdx === 0 && (
                    <li>
                      <Link
                        to="/brands"
                        className="text-[13px] text-ink hover:text-bronze inline-block normal-case tracking-normal font-medium"
                      >
                        All Brands
                      </Link>
                    </li>
                  )}
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

        <Link
          to="/brands"
          className="group relative block aspect-[4/5] overflow-hidden bg-muted"
        >
          <img
            src={featureImg}
            alt={collectionImageAlt({ handle: "best-selling-brands", title: "Best-selling luxury fashion brands" })}
            loading="lazy"
            style={{ objectPosition: collectionImageFocal({ handle: "best-selling-brands", title: "Best-selling luxury fashion brands" }) }}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-[1.04]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink/75 via-ink/20 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-8">
            <p className="text-[10px] uppercase tracking-[0.4em] text-canvas/75 mb-3">
              The Directory
            </p>
            <p className="font-serif text-[28px] leading-[1.15] text-canvas text-balance">
              Every house, A — Z.
            </p>
            <span className="mt-5 inline-block text-[10px] uppercase tracking-[0.35em] text-canvas/90 border-b border-canvas/40 pb-1">
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
 * group fed from the same live Shopify data. Button + region are wired with
 * aria-controls/aria-expanded so screen readers announce state correctly.
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
    <nav aria-label="Mobile primary" className="flex flex-col divide-y divide-ink/10">
      {departments.map((dept) => (
        <MobileAccordion
          key={dept.key}
          label={dept.label}
          isOpen={openKey === dept.key}
          onToggle={() => setOpenKey(openKey === dept.key ? null : dept.key)}
        >
          <Link
            to="/collections/$handle"
            params={{ handle: dept.rootHandle }}
            className="text-[14px] text-ink font-medium hover:text-bronze py-1"
          >
            Shop all {dept.label}
          </Link>
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
        </MobileAccordion>
      ))}

      <MobileAccordion
        label="Brands"
        isOpen={openKey === "brands"}
        onToggle={() => setOpenKey(openKey === "brands" ? null : "brands")}
      >
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
      </MobileAccordion>
    </nav>
  );
}

function MobileAccordion({
  label,
  isOpen,
  onToggle,
  children,
}: {
  label: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  const panelId = useId();
  return (
    <div>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-controls={panelId}
        className="w-full flex items-center justify-between py-4 text-[12px] uppercase tracking-[0.3em] text-ink min-h-11"
      >
        <span>{label}</span>
        <span aria-hidden="true" className="text-bronze text-lg leading-none">
          {isOpen ? "−" : "+"}
        </span>
      </button>
      <div
        id={panelId}
        role="region"
        aria-label={`${label} links`}
        hidden={!isOpen}
        className="pb-6 flex flex-col gap-5"
      >
        {children}
      </div>
    </div>
  );
}
