import { useMemo, useState } from "react";
import { ChevronDown, ChevronUp, Search, X } from "lucide-react";
import type { StorefrontFilter, StorefrontFilterValue } from "@/lib/shopify";
import { cn } from "@/lib/utils";

// Selection model: array of { id, label, input } where input is the JSON
// string Shopify expects in the `filters` arg.
export type Selection = { id: string; label: string; input: string; filterId: string };

export type SortValue =
  | "BEST_SELLING-false"
  | "CREATED-true"
  | "PRICE-false"
  | "PRICE-true"
  | "TITLE-false";

export const SORT_OPTIONS: { value: SortValue; label: string }[] = [
  { value: "BEST_SELLING-false", label: "Best Selling" },
  { value: "CREATED-true", label: "New Arrivals" },
  { value: "TITLE-false", label: "A–Z" },
  { value: "PRICE-false", label: "Price: Low to High" },
  { value: "PRICE-true", label: "Price: High to Low" },
];

// Compact quick-preset pills surfaced above the grid on collection pages
export const SORT_PRESETS: { value: SortValue; label: string }[] = [
  { value: "CREATED-true", label: "New Arrivals" },
  { value: "BEST_SELLING-false", label: "Best Selling" },
  { value: "PRICE-false", label: "Price ↑" },
  { value: "PRICE-true", label: "Price ↓" },
];

// --- Helpers ---

// Map Shopify filter group label to a "friendlier" label and ordering hint
const LABEL_ALIAS: Record<string, string> = {
  "Product type": "Category",
  "Brand": "Brand",
  "Vendor": "Brand",
  "Price": "Price",
  "Color": "Color",
  "Size": "Size",
  "Material": "Material",
  "Availability": "Availability",
};

// Detect if a filter group is a color group (renders swatches)
function isColorGroup(f: StorefrontFilter) {
  return /color/i.test(f.label);
}

// Normalise a colour label to a CSS color
const COLOR_MAP: Record<string, string> = {
  black: "#000000", white: "#ffffff", grey: "#9aa0a6", gray: "#9aa0a6",
  silver: "#c0c0c0", red: "#dc2626", pink: "#ec4899", orange: "#f97316",
  yellow: "#facc15", gold: "#d4a854", green: "#16a34a", olive: "#65734b",
  teal: "#0d9488", blue: "#2563eb", navy: "#1e3a5f", purple: "#7e22ce",
  violet: "#8b5cf6", brown: "#7c4a1e", beige: "#dcc9a8", tan: "#c8a679",
  cream: "#f5ecd6", ivory: "#fffff0", multicolor: "linear-gradient(135deg,#ec4899,#f59e0b,#22d3ee,#a78bfa)",
};
function colorFor(label: string): string {
  const k = label.trim().toLowerCase();
  if (COLOR_MAP[k]) return COLOR_MAP[k];
  // try first word
  const first = k.split(/\s|\//)[0];
  return COLOR_MAP[first] ?? "#e5e7eb";
}

// --- Components ---

function FilterGroupHeader({ label, open, onToggle }: { label: string; open: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className="w-full flex items-center justify-between py-4 text-left text-[11px] uppercase tracking-[0.2em] hover:text-bronze transition-colors"
    >
      <span>{label}</span>
      {open ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
    </button>
  );
}

function CheckboxRow({ value, selected, onToggle }: { value: StorefrontFilterValue; selected: boolean; onToggle: () => void }) {
  return (
    <label className="flex items-center gap-3 py-1.5 text-xs cursor-pointer group">
      <span
        className={cn(
          "h-4 w-4 border flex items-center justify-center transition-colors",
          selected ? "bg-ink border-ink" : "border-ink/30 group-hover:border-ink"
        )}
      >
        {selected && <span className="text-canvas text-[10px] leading-none">✓</span>}
      </span>
      <span className="flex-1 leading-none">{value.label}</span>
      <span className="text-[10px] text-muted-foreground tabular-nums">{value.count}</span>
      <input type="checkbox" className="sr-only" checked={selected} onChange={onToggle} />
    </label>
  );
}

function ColorSwatch({ value, selected, onToggle }: { value: StorefrontFilterValue; selected: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      title={`${value.label} (${value.count})`}
      className={cn(
        "relative h-7 w-7 rounded-full border transition-all",
        selected ? "border-ink ring-2 ring-offset-2 ring-ink/40" : "border-ink/20 hover:border-ink/50"
      )}
      style={{ background: colorFor(value.label) }}
    >
      <span className="sr-only">{value.label}</span>
    </button>
  );
}

function ListFilter({
  filter,
  selectedInputs,
  onToggle,
  searchable,
  initiallyVisible = 8,
}: {
  filter: StorefrontFilter;
  selectedInputs: Set<string>;
  onToggle: (v: StorefrontFilterValue) => void;
  searchable?: boolean;
  initiallyVisible?: number;
}) {
  const [showAll, setShowAll] = useState(false);
  const [q, setQ] = useState("");
  const values = useMemo(() => {
    const list = filter.values
      .filter((v) => v.count > 0)
      .sort((a, b) => b.count - a.count);
    if (!q) return list;
    const needle = q.toLowerCase();
    return list.filter((v) => v.label.toLowerCase().includes(needle));
  }, [filter.values, q]);
  const visible = showAll || q ? values : values.slice(0, initiallyVisible);

  return (
    <div className="pb-2">
      {searchable && (
        <div className="relative mb-3">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={`Search ${filter.label.toLowerCase()}…`}
            aria-label={`Search ${filter.label.toLowerCase()} options`}
            className="w-full pl-8 pr-2 py-2 text-xs border border-ink/15 bg-transparent focus:outline-none focus:border-ink"
          />
        </div>
      )}
      <div className={cn("space-y-0", searchable && "max-h-72 overflow-y-auto pr-2")}>
        {visible.map((v) => (
          <CheckboxRow
            key={v.id}
            value={v}
            selected={selectedInputs.has(v.input)}
            onToggle={() => onToggle(v)}
          />
        ))}
        {values.length === 0 && (
          <p className="text-xs text-muted-foreground py-2">No options match.</p>
        )}
      </div>
      {!q && values.length > initiallyVisible && (
        <button
          onClick={() => setShowAll((s) => !s)}
          className="mt-3 text-[10px] uppercase tracking-[0.2em] text-bronze hover:text-ink"
        >
          {showAll ? "Show Less" : `Show All (${values.length})`}
        </button>
      )}
    </div>
  );
}

function ColorFilter({
  filter,
  selectedInputs,
  onToggle,
}: {
  filter: StorefrontFilter;
  selectedInputs: Set<string>;
  onToggle: (v: StorefrontFilterValue) => void;
}) {
  const values = filter.values.filter((v) => v.count > 0).sort((a, b) => b.count - a.count);
  return (
    <div className="pb-3 grid grid-cols-7 gap-2">
      {values.map((v) => (
        <ColorSwatch
          key={v.id}
          value={v}
          selected={selectedInputs.has(v.input)}
          onToggle={() => onToggle(v)}
        />
      ))}
    </div>
  );
}

function PriceFilter({
  filter,
  current,
  onChange,
}: {
  filter: StorefrontFilter;
  current: { min: number; max: number } | null;
  onChange: (range: { min: number; max: number } | null) => void;
}) {
  // Filter group exposes a single value whose input encodes the full price range
  // bounds — but Shopify returns them as separate values when prices vary. We
  // use the union of all values to derive overall bounds.
  const bounds = useMemo(() => {
    let lo = Infinity, hi = 0;
    for (const v of filter.values) {
      try {
        const parsed = JSON.parse(v.input);
        const p = parsed.price ?? parsed;
        if (typeof p?.min === "number") lo = Math.min(lo, p.min);
        if (typeof p?.max === "number") hi = Math.max(hi, p.max);
      } catch {}
    }
    if (!isFinite(lo)) lo = 0;
    if (hi === 0) hi = 10000;
    return { lo: Math.floor(lo), hi: Math.ceil(hi) };
  }, [filter.values]);

  const [min, setMin] = useState<number>(current?.min ?? bounds.lo);
  const [max, setMax] = useState<number>(current?.max ?? bounds.hi);

  const apply = () => {
    const clamped = { min: Math.max(bounds.lo, Math.min(min, max)), max: Math.min(bounds.hi, Math.max(max, min)) };
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
        className="w-full accent-bronze"
      />
      <p className="mt-2 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
        ${bounds.lo.toLocaleString()} – ${bounds.hi.toLocaleString()}
      </p>
    </div>
  );
}

// ---- Sort dropdown (separate piece, top-right of grid) ----
export function CatalogSort({
  value,
  onChange,
}: {
  value: SortValue;
  onChange: (v: SortValue) => void;
}) {
  return (
    <label className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.2em]">
      <span className="text-muted-foreground">Sort</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as SortValue)}
        className="border border-ink/15 px-3 py-2 bg-transparent text-xs focus:outline-none focus:border-ink"
      >
        {SORT_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </label>
  );
}

// ---- Sort preset pill row (quick selectors above the grid) ----
export function SortPresets({
  value,
  onChange,
  extra,
}: {
  value: SortValue;
  onChange: (v: SortValue) => void;
  extra?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {SORT_PRESETS.map((p) => {
        const active = p.value === value;
        return (
          <button
            key={p.value}
            onClick={() => onChange(p.value)}
            className={cn(
              "text-[10px] uppercase tracking-[0.2em] px-3 py-2 border transition-colors",
              active
                ? "bg-ink text-canvas border-ink"
                : "border-ink/15 hover:border-ink hover:text-bronze",
            )}
          >
            {p.label}
          </button>
        );
      })}
      {extra}
    </div>
  );
}



// ---- Active filter pills row ----
export function ActiveFilterPills({
  selections,
  priceRange,
  onRemove,
  onClearPrice,
  onClearAll,
}: {
  selections: Selection[];
  priceRange: { min: number; max: number } | null;
  onRemove: (input: string) => void;
  onClearPrice: () => void;
  onClearAll: () => void;
}) {
  if (selections.length === 0 && !priceRange) return null;
  return (
    <div className="flex flex-wrap items-center gap-2 mb-6">
      {priceRange && (
        <button
          onClick={onClearPrice}
          className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.15em] border border-ink/20 px-3 py-1.5 hover:bg-ink hover:text-canvas transition-colors"
        >
          ${priceRange.min} – ${priceRange.max}
          <X className="h-3 w-3" />
        </button>
      )}
      {selections.map((s) => (
        <button
          key={s.input}
          onClick={() => onRemove(s.input)}
          className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.15em] border border-ink/20 px-3 py-1.5 hover:bg-ink hover:text-canvas transition-colors"
        >
          {s.label}
          <X className="h-3 w-3" />
        </button>
      ))}
      <button
        onClick={onClearAll}
        className="text-[10px] uppercase tracking-[0.2em] text-bronze hover:text-ink ml-2 underline-offset-4 hover:underline"
      >
        Clear All
      </button>
    </div>
  );
}

// ---- Main sidebar ----
export function CatalogFilters({
  filters,
  selectedInputs,
  priceRange,
  onToggle,
  onPriceChange,
}: {
  filters: StorefrontFilter[];
  selectedInputs: Set<string>;
  priceRange: { min: number; max: number } | null;
  onToggle: (filterId: string, v: StorefrontFilterValue) => void;
  onPriceChange: (range: { min: number; max: number } | null) => void;
}) {
  // Open/closed state per filter group (default: open for first 5)
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  // Hide noise: groups with zero usable values
  const visible = filters.filter((f) => {
    if (f.type === "PRICE_RANGE") return true;
    return f.values.some((v) => v.count > 0);
  });

  return (
    <aside className="w-full lg:w-64 lg:flex-shrink-0">
      <h2 className="text-[11px] uppercase tracking-[0.25em] mb-3 pb-3 border-b border-ink/10">
        Refine
      </h2>
      <div className="divide-y divide-ink/10">
        {visible.map((f, i) => {
          const friendly = LABEL_ALIAS[f.label] ?? f.label;
          const isOpen = openGroups[f.id] ?? i < 5;
          const isPrice = f.type === "PRICE_RANGE";
          const isColor = isColorGroup(f);
          const isBrand = /brand|vendor/i.test(f.label);
          return (
            <div key={f.id}>
              <FilterGroupHeader
                label={friendly}
                open={isOpen}
                onToggle={() => setOpenGroups((s) => ({ ...s, [f.id]: !isOpen }))}
              />
              {isOpen && (
                <div>
                  {isPrice ? (
                    <PriceFilter
                      filter={f}
                      current={priceRange}
                      onChange={onPriceChange}
                    />
                  ) : isColor ? (
                    <ColorFilter
                      filter={f}
                      selectedInputs={selectedInputs}
                      onToggle={(v) => onToggle(f.id, v)}
                    />
                  ) : (
                    <ListFilter
                      filter={f}
                      selectedInputs={selectedInputs}
                      onToggle={(v) => onToggle(f.id, v)}
                      searchable={isBrand}
                      initiallyVisible={isBrand ? 12 : 8}
                    />
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </aside>
  );
}
