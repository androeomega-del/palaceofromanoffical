/**
 * ClientFacets — derives Brand / Price / Size / Colour / Material facets
 * from the products already loaded into the grid and filters them
 * client-side. Used as a fallback when Shopify Storefront API doesn't
 * return native filter facets (sparse catalog, missing option metadata).
 *
 * Selections live in the parent (URL-free, ephemeral); `applyClientFacets`
 * runs the filter pass over the edges array before render.
 */
import { useMemo, useState } from "react";
import { ChevronDown, ChevronUp, X, Search } from "lucide-react";
import type { ShopifyProduct } from "@/lib/shopify";
import { cn } from "@/lib/utils";

export type SaleFilter = "any" | "sale" | "full";

export type ClientFacetState = {
  brands: Set<string>;
  sizes: Set<string>;
  colors: Set<string>;
  materials: Set<string>;
  occasions: Set<string>;
  sale: SaleFilter;
  price: { min: number; max: number } | null;
};

export function emptyClientFacetState(): ClientFacetState {
  return {
    brands: new Set(),
    sizes: new Set(),
    colors: new Set(),
    materials: new Set(),
    occasions: new Set(),
    sale: "any",
    price: null,
  };
}

export function clientFacetCount(s: ClientFacetState): number {
  return (
    s.brands.size +
    s.sizes.size +
    s.colors.size +
    s.materials.size +
    s.occasions.size +
    (s.sale !== "any" ? 1 : 0) +
    (s.price ? 1 : 0)
  );
}

// ── Derivation ──────────────────────────────────────────────────────────────

const SIZE_OPTION_RE = /^size$/i;
const COLOR_OPTION_RE = /^colou?r$/i;
const MATERIAL_OPTION_RE = /^material|fabric$/i;

// Heuristic material vocabulary — used to pull materials from product
// titles/descriptions when no Material option exists.
const MATERIAL_KEYWORDS = [
  "leather", "suede", "cashmere", "wool", "silk", "linen", "cotton",
  "denim", "velvet", "satin", "lace", "nylon", "polyester", "viscose",
  "shearling", "fur", "calfskin", "lambskin", "patent",
];

type Bucket = { label: string; count: number };

function bucketsFromOptions(
  edges: ShopifyProduct[],
  match: (name: string) => boolean,
): Bucket[] {
  const counts = new Map<string, number>();
  for (const e of edges) {
    const seen = new Set<string>();
    for (const o of e.node.options ?? []) {
      if (!match(o.name)) continue;
      for (const v of o.values ?? []) {
        const k = v.trim();
        if (!k || seen.has(k.toLowerCase())) continue;
        seen.add(k.toLowerCase());
        counts.set(k, (counts.get(k) ?? 0) + 1);
      }
    }
  }
  return [...counts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);
}

function bucketsFromVendor(edges: ShopifyProduct[]): Bucket[] {
  const counts = new Map<string, number>();
  for (const e of edges) {
    const v = e.node.vendor?.trim();
    if (!v) continue;
    counts.set(v, (counts.get(v) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);
}

function bucketsFromMaterials(edges: ShopifyProduct[]): Bucket[] {
  const counts = new Map<string, number>();
  for (const e of edges) {
    const hay = `${e.node.title} ${e.node.description ?? ""}`.toLowerCase();
    const seen = new Set<string>();
    for (const o of e.node.options ?? []) {
      if (!MATERIAL_OPTION_RE.test(o.name)) continue;
      for (const v of o.values ?? []) {
        const k = v.trim();
        if (!k || seen.has(k.toLowerCase())) continue;
        seen.add(k.toLowerCase());
        counts.set(cap(k), (counts.get(cap(k)) ?? 0) + 1);
      }
    }
    for (const m of MATERIAL_KEYWORDS) {
      if (seen.has(m)) continue;
      if (hay.includes(m)) {
        seen.add(m);
        counts.set(cap(m), (counts.get(cap(m)) ?? 0) + 1);
      }
    }
  }
  return [...counts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);
}

function priceBounds(edges: ShopifyProduct[]): { lo: number; hi: number } {
  let lo = Infinity, hi = 0;
  for (const e of edges) {
    const p = Number(e.node.priceRange.minVariantPrice.amount);
    if (!Number.isFinite(p)) continue;
    if (p < lo) lo = p;
    if (p > hi) hi = p;
  }
  if (!Number.isFinite(lo)) lo = 0;
  if (hi === 0) hi = 1000;
  return { lo: Math.floor(lo), hi: Math.ceil(hi) };
}

function cap(s: string) { return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase(); }

// ── In-memory filter pass ───────────────────────────────────────────────────

export function applyClientFacets(
  edges: ShopifyProduct[],
  state: ClientFacetState,
): ShopifyProduct[] {
  if (clientFacetCount(state) === 0) return edges;
  return edges.filter((e) => {
    const n = e.node;
    if (state.brands.size && !state.brands.has(n.vendor)) return false;
    if (state.price) {
      const p = Number(n.priceRange.minVariantPrice.amount);
      if (!(p >= state.price.min && p <= state.price.max)) return false;
    }
    if (state.sizes.size) {
      const sizes = optValues(n.options, SIZE_OPTION_RE);
      if (!sizes.some((s) => state.sizes.has(s))) return false;
    }
    if (state.colors.size) {
      const cols = optValues(n.options, COLOR_OPTION_RE);
      if (!cols.some((c) => state.colors.has(c))) return false;
    }
    if (state.materials.size) {
      const mats = optValues(n.options, MATERIAL_OPTION_RE).map(cap);
      const hay = `${n.title} ${n.description ?? ""}`.toLowerCase();
      const ok = [...state.materials].some(
        (m) => mats.includes(m) || hay.includes(m.toLowerCase()),
      );
      if (!ok) return false;
    }
    return true;
  });
}

function optValues(
  options: ShopifyProduct["node"]["options"],
  match: RegExp,
): string[] {
  const out: string[] = [];
  for (const o of options ?? []) {
    if (match.test(o.name)) out.push(...(o.values ?? []).map((v) => v.trim()).filter(Boolean));
  }
  return out;
}

// ── UI ──────────────────────────────────────────────────────────────────────

const COLOR_MAP: Record<string, string> = {
  black: "#000000", white: "#ffffff", grey: "#9aa0a6", gray: "#9aa0a6",
  silver: "#c0c0c0", red: "#dc2626", pink: "#ec4899", orange: "#f97316",
  yellow: "#facc15", gold: "#d4a854", green: "#16a34a", olive: "#65734b",
  teal: "#0d9488", blue: "#2563eb", navy: "#1e3a5f", purple: "#7e22ce",
  violet: "#8b5cf6", brown: "#7c4a1e", beige: "#dcc9a8", tan: "#c8a679",
  cream: "#f5ecd6", ivory: "#fffff0",
  multicolor: "linear-gradient(135deg,#ec4899,#f59e0b,#22d3ee,#a78bfa)",
};
function colorFor(label: string): string {
  const k = label.trim().toLowerCase();
  if (COLOR_MAP[k]) return COLOR_MAP[k];
  return COLOR_MAP[k.split(/\s|\//)[0]] ?? "#e5e7eb";
}

function GroupHeader({ label, open, onToggle, count }: { label: string; open: boolean; onToggle: () => void; count?: number }) {
  return (
    <button
      onClick={onToggle}
      className="w-full flex items-center justify-between py-4 text-left text-[11px] uppercase tracking-[0.2em] hover:text-bronze transition-colors"
    >
      <span>
        {label}
        {count ? <span className="ml-2 text-bronze tabular-nums">{count}</span> : null}
      </span>
      {open ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
    </button>
  );
}

function CheckList({
  buckets,
  selected,
  onToggle,
  searchable,
  initiallyVisible = 8,
}: {
  buckets: Bucket[];
  selected: Set<string>;
  onToggle: (label: string) => void;
  searchable?: boolean;
  initiallyVisible?: number;
}) {
  const [showAll, setShowAll] = useState(false);
  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    if (!q) return buckets;
    const needle = q.toLowerCase();
    return buckets.filter((b) => b.label.toLowerCase().includes(needle));
  }, [buckets, q]);
  const visible = showAll || q ? filtered : filtered.slice(0, initiallyVisible);

  return (
    <div className="pb-2">
      {searchable && buckets.length > 6 && (
        <div className="relative mb-3">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search designers…"
            className="w-full pl-8 pr-2 py-2 text-xs border border-ink/15 bg-transparent focus:outline-none focus:border-ink"
          />
        </div>
      )}
      <div className={cn("space-y-0", searchable && "max-h-72 overflow-y-auto pr-2")}>
        {visible.map((b) => {
          const isSel = selected.has(b.label);
          return (
            <label key={b.label} className="flex items-center gap-3 py-1.5 text-xs cursor-pointer group">
              <span
                className={cn(
                  "h-4 w-4 border flex items-center justify-center transition-colors",
                  isSel ? "bg-ink border-ink" : "border-ink/30 group-hover:border-ink",
                )}
              >
                {isSel && <span className="text-canvas text-[10px] leading-none">✓</span>}
              </span>
              <span className="flex-1 leading-none">{b.label}</span>
              <span className="text-[10px] text-muted-foreground tabular-nums">{b.count}</span>
              <input type="checkbox" className="sr-only" checked={isSel} onChange={() => onToggle(b.label)} />
            </label>
          );
        })}
        {filtered.length === 0 && <p className="text-xs text-muted-foreground py-2">No options match.</p>}
      </div>
      {!q && filtered.length > initiallyVisible && (
        <button
          onClick={() => setShowAll((s) => !s)}
          className="mt-3 text-[10px] uppercase tracking-[0.2em] text-bronze hover:text-ink"
        >
          {showAll ? "Show Less" : `Show All (${filtered.length})`}
        </button>
      )}
    </div>
  );
}

function ColorGrid({
  buckets,
  selected,
  onToggle,
}: {
  buckets: Bucket[];
  selected: Set<string>;
  onToggle: (label: string) => void;
}) {
  return (
    <div className="pb-3 grid grid-cols-7 gap-2">
      {buckets.map((b) => {
        const isSel = selected.has(b.label);
        return (
          <button
            key={b.label}
            onClick={() => onToggle(b.label)}
            title={`${b.label} (${b.count})`}
            className={cn(
              "relative h-7 w-7 rounded-full border transition-all",
              isSel ? "border-ink ring-2 ring-offset-2 ring-ink/40" : "border-ink/20 hover:border-ink/50",
            )}
            style={{ background: colorFor(b.label) }}
          >
            <span className="sr-only">{b.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function PriceControl({
  bounds,
  current,
  onChange,
}: {
  bounds: { lo: number; hi: number };
  current: { min: number; max: number } | null;
  onChange: (range: { min: number; max: number } | null) => void;
}) {
  const [min, setMin] = useState<number>(current?.min ?? bounds.lo);
  const [max, setMax] = useState<number>(current?.max ?? bounds.hi);
  const apply = () => {
    const clamped = {
      min: Math.max(bounds.lo, Math.min(min, max)),
      max: Math.min(bounds.hi, Math.max(max, min)),
    };
    if (clamped.min === bounds.lo && clamped.max === bounds.hi) onChange(null);
    else onChange(clamped);
  };
  return (
    <div className="pb-3">
      <div className="flex items-center gap-2 mb-3">
        <div className="flex-1">
          <label className="block text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-1">Min</label>
          <div className="flex items-center border border-ink/15 px-2 py-1.5">
            <span className="text-xs mr-1">$</span>
            <input
              type="number"
              value={min}
              onChange={(e) => setMin(Number(e.target.value))}
              onBlur={apply}
              aria-label="Minimum price"
              className="w-full text-xs bg-transparent focus:outline-none"
            />
          </div>
        </div>
        <div className="flex-1">
          <label className="block text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-1">Max</label>
          <div className="flex items-center border border-ink/15 px-2 py-1.5">
            <span className="text-xs mr-1">$</span>
            <input
              type="number"
              value={max}
              onChange={(e) => setMax(Number(e.target.value))}
              onBlur={apply}
              aria-label="Maximum price"
              className="w-full text-xs bg-transparent focus:outline-none"
            />
          </div>
        </div>
      </div>
      <input
        type="range"
        min={bounds.lo}
        max={bounds.hi}
        value={max}
        onChange={(e) => setMax(Number(e.target.value))}
        onMouseUp={apply}
        onTouchEnd={apply}
        aria-label={`Price up to $${max}`}
        className="w-full accent-bronze"
      />
      <p className="mt-2 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
        ${bounds.lo.toLocaleString()} – ${bounds.hi.toLocaleString()}
      </p>
    </div>
  );
}

export function ClientFacets({
  edges,
  state,
  onChange,
}: {
  edges: ShopifyProduct[];
  state: ClientFacetState;
  onChange: (next: ClientFacetState) => void;
}) {
  const brands = useMemo(() => bucketsFromVendor(edges), [edges]);
  const sizes = useMemo(() => bucketsFromOptions(edges, (n) => SIZE_OPTION_RE.test(n)), [edges]);
  const colors = useMemo(() => bucketsFromOptions(edges, (n) => COLOR_OPTION_RE.test(n)), [edges]);
  const materials = useMemo(() => bucketsFromMaterials(edges), [edges]);
  const bounds = useMemo(() => priceBounds(edges), [edges]);

  const [open, setOpen] = useState<Record<string, boolean>>({
    brand: true, price: true, size: true, color: true, material: false,
  });

  const toggleSet = (key: keyof ClientFacetState, label: string) => {
    if (key === "price") return;
    const set = new Set(state[key] as Set<string>);
    set.has(label) ? set.delete(label) : set.add(label);
    onChange({ ...state, [key]: set });
  };

  const setPrice = (p: { min: number; max: number } | null) => onChange({ ...state, price: p });

  return (
    <div className="divide-y divide-ink/10">
      {brands.length > 1 && (
        <div>
          <GroupHeader label="Designer" open={open.brand} onToggle={() => setOpen((s) => ({ ...s, brand: !s.brand }))} count={state.brands.size} />
          {open.brand && (
            <CheckList
              buckets={brands}
              selected={state.brands}
              onToggle={(l) => toggleSet("brands", l)}
              searchable
              initiallyVisible={10}
            />
          )}
        </div>
      )}
      {bounds.hi > bounds.lo && (
        <div>
          <GroupHeader label="Price" open={open.price} onToggle={() => setOpen((s) => ({ ...s, price: !s.price }))} count={state.price ? 1 : 0} />
          {open.price && <PriceControl bounds={bounds} current={state.price} onChange={setPrice} />}
        </div>
      )}
      {sizes.length > 0 && (
        <div>
          <GroupHeader label="Size" open={open.size} onToggle={() => setOpen((s) => ({ ...s, size: !s.size }))} count={state.sizes.size} />
          {open.size && (
            <CheckList buckets={sizes} selected={state.sizes} onToggle={(l) => toggleSet("sizes", l)} />
          )}
        </div>
      )}
      {colors.length > 0 && (
        <div>
          <GroupHeader label="Colour" open={open.color} onToggle={() => setOpen((s) => ({ ...s, color: !s.color }))} count={state.colors.size} />
          {open.color && (
            <ColorGrid buckets={colors} selected={state.colors} onToggle={(l) => toggleSet("colors", l)} />
          )}
        </div>
      )}
      {materials.length > 0 && (
        <div>
          <GroupHeader label="Material" open={open.material} onToggle={() => setOpen((s) => ({ ...s, material: !s.material }))} count={state.materials.size} />
          {open.material && (
            <CheckList buckets={materials} selected={state.materials} onToggle={(l) => toggleSet("materials", l)} />
          )}
        </div>
      )}
    </div>
  );
}

export function ClientFacetPills({
  state,
  onChange,
}: {
  state: ClientFacetState;
  onChange: (next: ClientFacetState) => void;
}) {
  const items: Array<{ key: string; label: string; onClear: () => void }> = [];
  for (const b of state.brands) items.push({ key: `b:${b}`, label: b, onClear: () => { const s = new Set(state.brands); s.delete(b); onChange({ ...state, brands: s }); } });
  for (const sz of state.sizes) items.push({ key: `sz:${sz}`, label: `Size ${sz}`, onClear: () => { const s = new Set(state.sizes); s.delete(sz); onChange({ ...state, sizes: s }); } });
  for (const c of state.colors) items.push({ key: `c:${c}`, label: c, onClear: () => { const s = new Set(state.colors); s.delete(c); onChange({ ...state, colors: s }); } });
  for (const m of state.materials) items.push({ key: `m:${m}`, label: m, onClear: () => { const s = new Set(state.materials); s.delete(m); onChange({ ...state, materials: s }); } });
  if (state.price) items.push({ key: "price", label: `$${state.price.min}–$${state.price.max}`, onClear: () => onChange({ ...state, price: null }) });

  if (items.length === 0) return null;
  const pillCls =
    "inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.15em] border border-ink/20 px-3 py-1.5 hover:bg-ink hover:text-canvas transition-colors";
  return (
    <div className="flex flex-wrap items-center gap-2">
      {items.map((i) => (
        <button key={i.key} onClick={i.onClear} className={pillCls}>
          {i.label}
          <X className="h-3 w-3" />
        </button>
      ))}
      <button
        onClick={() => onChange(emptyClientFacetState())}
        className="text-[10px] uppercase tracking-[0.2em] text-bronze hover:text-ink ml-2 underline-offset-4 hover:underline"
      >
        Clear Refinements
      </button>
    </div>
  );
}
