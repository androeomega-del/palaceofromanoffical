/**
 * Mobile primary navigation — Farfetch-style.
 *
 * Pattern (per user reference, IMG_0831.png):
 *   - Top tabs: Women / Men (active tab underlined).
 *   - Flat list of category rows with right-chevron affordance:
 *       "{Dept} homepage" → /collections/{rootHandle}
 *       "Sale"   (bronze accent) → only if a sale handle exists for this dept
 *       "New In" → /collections/new-arrivals (or dept-scoped variant if present)
 *       "Vacation" → /vacation-stylist
 *       "Brands" → drills into a brand A–Z subpanel
 *       Each Shopify-derived column (Clothing, Shoes, Bags, …) → drills into
 *         a subpanel listing its sub-collections.
 *   - Bottom "My Account" block with Sign In + Register actions.
 *
 * Voice: Farfetch IA, Palace of Roman tokens. Serif logo at top, ink/canvas/
 * bronze (bronze stands in for Farfetch's red "Sale" accent), light tracking.
 * No Lorem; every link points at a live route or live Shopify handle —
 * categories with no live items are filtered out.
 */
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight, ChevronLeft, X, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import { fetchVendorIndex } from "@/lib/shopify";
import {
  buildBrandList,
  groupBrandsForMenu,
  vendorSlug,
  navForDept,
  type NavNode,
} from "@/lib/nav-config";
import { useCustomerStore } from "@/stores/customer-store";
import { useConciergeStore } from "@/stores/concierge-store";

type Tab = "women" | "men";

type Drill =
  | { kind: "group"; node: NavNode }
  | { kind: "brands"; items: { vendor: string }[] }
  | null;

export function MobileFarfetchMenu({ onClose }: { onClose: () => void }) {
  const [tab, setTab] = useState<Tab>("women");
  const [drill, setDrill] = useState<Drill>(null);

  const { data: brands } = useQuery({
    queryKey: ["nav-brand-index"],
    queryFn: () => fetchVendorIndex(),
    staleTime: 10 * 60_000,
    select: (rows) => buildBrandList(rows),
  });

  const navItems = useMemo(() => navForDept(tab), [tab]);

  const brandGroups = useMemo(() => groupBrandsForMenu(brands ?? []), [brands]);
  const flatBrands = useMemo(
    () => brandGroups.flatMap((g) => g.items).map((b) => ({ vendor: b.vendor })),
    [brandGroups],
  );

  const closeAll = () => {
    setDrill(null);
    onClose();
  };

  // ───────────────────────── Drill-in subpanel ─────────────────────────
  if (drill) {
    return (
      <Shell>
        <Header onClose={closeAll}>
          <button
            type="button"
            onClick={() => setDrill(null)}
            className="inline-flex items-center gap-2 text-[12px] uppercase tracking-[0.25em] text-ink hover:text-bronze"
          >
            <ChevronLeft className="w-4 h-4" strokeWidth={1.5} />
            Back
          </button>
        </Header>
        <div className="px-5 pt-4 pb-2">
          <p className="text-[11px] uppercase tracking-[0.3em] text-bronze">
            {tab === "women" ? "Women" : "Men"}
          </p>
          <h2 className="mt-1 font-serif text-[22px] tracking-[0.04em] text-ink">
            {drill.kind === "brands" ? "Brands" : drill.node.label}
          </h2>
        </div>
        <ul className="flex-1 overflow-y-auto px-5 pb-6 divide-y divide-ink/10">
          {drill.kind === "group" && (
            <>
              <li>
                <Link
                  to={drill.node.to}
                  onClick={closeAll}
                  className="flex items-center justify-between py-4 text-[15px] text-bronze-deep"
                  data-nav-item={`All ${drill.node.label}`}
                >
                  <span>All {drill.node.label}</span>
                  <ChevronRight className="w-4 h-4 text-ink/40" strokeWidth={1.5} />
                </Link>
              </li>
              {drill.node.children!.map((c) => (
                <li key={c.to}>
                  <Link
                    to={c.to}
                    onClick={closeAll}
                    className="flex items-center justify-between py-4 pl-4 text-[15px] text-ink"
                    data-nav-item={c.label}
                  >
                    <span>{c.label}</span>
                    <ChevronRight className="w-4 h-4 text-ink/40" strokeWidth={1.5} />
                  </Link>
                </li>
              ))}
            </>
          )}
          {drill.kind === "brands" &&
            drill.items.map((b) => (
              <li key={b.vendor}>
                <Link
                  to="/brand/$vendor"
                  params={{ vendor: vendorSlug(b.vendor) }}
                  onClick={closeAll}
                  className="flex items-center justify-between py-4 text-[15px] text-ink"
                >
                  <span>{b.vendor}</span>
                  <ChevronRight className="w-4 h-4 text-ink/40" strokeWidth={1.5} />
                </Link>
              </li>
            ))}
          {drill.kind === "brands" && (
            <li>
              <Link
                to="/brands"
                onClick={closeAll}
                className="flex items-center justify-between py-4 text-[12px] uppercase tracking-[0.3em] text-bronze"
              >
                View the full directory
                <ChevronRight className="w-4 h-4" strokeWidth={1.5} />
              </Link>
            </li>
          )}
        </ul>
      </Shell>
    );
  }

  // ───────────────────────── Top-level panel ─────────────────────────
  return (
    <Shell>
      <Header onClose={closeAll}>
        <Link
          to="/"
          onClick={closeAll}
          className="font-serif text-[15px] tracking-[0.18em] uppercase text-ink"
        >
          Palace of Roman
        </Link>
      </Header>

      <button
        type="button"
        onClick={() => {
          useConciergeStore.getState().setOpen(true);
          closeAll();
        }}
        className="flex items-center justify-between px-5 py-4 border-b border-ink/10 text-left"
      >
        <span className="inline-flex items-center gap-2.5 text-[12px] uppercase tracking-[0.28em] text-ink">
          <Sparkles className="w-3.5 h-3.5 text-bronze" strokeWidth={1.5} />
          Concierge
        </span>
        <ChevronRight className="w-4 h-4 text-ink/40" strokeWidth={1.25} />
      </button>

      {/* Tabs */}
      <div className="px-5 pt-2">
        <div className="flex items-stretch gap-7 border-b border-ink/10">
          {(["women", "men"] as Tab[]).map((t) => {
            const active = tab === t;
            return (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={`relative -mb-px py-3 text-[11px] uppercase tracking-[0.32em] transition-colors ${
                  active ? "text-ink" : "text-ink/45"
                }`}
              >
                {t === "women" ? "Women" : "Men"}
                {active && (
                  <span
                    aria-hidden="true"
                    className="absolute left-0 right-0 -bottom-px h-px bg-ink"
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Rows */}
      <ul className="flex-1 overflow-y-auto px-5 divide-y divide-ink/10">
        <li>
          <Link
            to={tab === "men" ? "/men" : "/women"}
            onClick={closeAll}
            className="flex items-center justify-between py-4 text-[14px] text-bronze-deep"
          >
            <span>{tab === "women" ? "The Women's Edit" : "The Men's Edit"}</span>
            <ChevronRight className="w-4 h-4 text-ink/40" strokeWidth={1.5} />
          </Link>
        </li>
        {navItems.map((item) => {
          if (item.label === "Brands") {
            return (
              <li key="brands">
                <button
                  type="button"
                  onClick={() => setDrill({ kind: "brands", items: flatBrands })}
                  data-nav-item="Brands"
                  className="w-full flex items-center justify-between py-4 text-[15px] text-ink"
                >
                  <span>Brands</span>
                  <ChevronRight className="w-4 h-4 text-ink/40" strokeWidth={1.5} />
                </button>
              </li>
            );
          }
          if (item.children && item.children.length > 0) {
            return (
              <li key={item.label}>
                <button
                  type="button"
                  onClick={() => setDrill({ kind: "group", node: item })}
                  data-nav-item={item.label}
                  className="w-full flex items-center justify-between py-4 text-[15px] text-ink"
                >
                  <span>{item.label}</span>
                  <ChevronRight className="w-4 h-4 text-ink/40" strokeWidth={1.5} />
                </button>
              </li>
            );
          }
          return (
            <li key={item.label}>
              <Link
                to={item.to}
                onClick={closeAll}
                data-nav-item={item.label}
                className="flex items-center justify-between py-4 text-[15px] text-ink"
              >
                <span>{item.label}</span>
                <ChevronRight className="w-4 h-4 text-ink/40" strokeWidth={1.5} />
              </Link>
            </li>
          );
        })}
      </ul>

      <MyAccountBlock onClose={closeAll} />
    </Shell>
  );
}


/* ───────────────────────── Subcomponents ───────────────────────── */

function Shell({ children }: { children: React.ReactNode }) {
  return <div className="flex h-full flex-col bg-canvas">{children}</div>;
}

function Header({
  onClose,
  children,
}: {
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between px-5 h-16 border-b border-ink/10">
      {children}
      <button
        type="button"
        onClick={onClose}
        aria-label="Close menu"
        className="inline-flex items-center justify-center w-9 h-9 -mr-2 text-ink hover:text-bronze"
      >
        <X className="w-5 h-5" strokeWidth={1.25} />
      </button>
    </div>
  );
}

function Row({
  label,
  to,
  onClose,
  accent,
  muted,
}: {
  label: string;
  to: string;
  onClose: () => void;
  accent?: boolean;
  muted?: boolean;
}) {
  return (
    <li>
      <Link
        to={to}
        onClick={onClose}
        className={`flex items-center justify-between py-4 ${
          accent
            ? "text-[15px] text-bronze"
            : muted
              ? "text-[14px] text-ink/70"
              : "text-[15px] text-ink"
        }`}
      >
        <span>{label}</span>
        <ChevronRight
          className={`w-4 h-4 ${accent ? "text-bronze" : "text-ink/40"}`}
          strokeWidth={1.5}
        />
      </Link>
    </li>
  );
}

function MyAccountBlock({ onClose }: { onClose: () => void }) {
  const goAccount = () => {
    const token = useCustomerStore.getState().getValidToken();
    onClose();
    window.location.href = token ? "/account" : "/account/login";
  };
  const goRegister = () => {
    onClose();
    window.location.href = "/account/register";
  };
  return (
    <div className="border-t border-ink/10 px-5 pt-5 pb-7 bg-canvas">
      <p className="font-serif text-[20px] tracking-[0.02em] text-ink">
        My Account
      </p>
      <div className="mt-4 flex flex-col gap-2.5">
        <button
          type="button"
          onClick={goAccount}
          className="w-full h-12 bg-ink text-canvas text-[12px] uppercase tracking-[0.3em] font-medium hover:bg-bronze transition-colors"
        >
          Sign In
        </button>
        <button
          type="button"
          onClick={goRegister}
          className="w-full h-12 border border-ink text-ink text-[12px] uppercase tracking-[0.3em] font-medium hover:border-bronze hover:text-bronze transition-colors"
        >
          Register
        </button>
      </div>
    </div>
  );
}
