import { useEffect, useState } from "react";
import { MapPin } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useLocationStore, useLocationPopover, DEFAULT_ZIP } from "@/stores/location-store";
import {
  getShippingOrigin,
  getShippingOriginOrDefault,
  formatOriginLabel,
  HUB_FALLBACK_LABEL,
  type ShippingOrigin,
} from "@/lib/shipping-origin";
import { estimateForOriginAndZip } from "@/lib/delivery-estimate";
import { getProductOriginsMap } from "@/lib/product-origins.functions";

type Variant = "card" | "pdp";

type Props = {
  vendor: string | null | undefined;
  /** When provided, looks up the real Shopify inventory origin (most-stock
   *  wins) cached in `product_origins`. Falls back to the vendor-based map
   *  when no row exists yet. */
  handle?: string | null;
  variant?: Variant;
};

/** Normalize a country-code string (e.g. "IT") to our internal ShippingOrigin. */
function originFromRow(
  row: { country_code: string | null; country: string | null; city: string | null } | undefined,
): ShippingOrigin | null {
  if (!row?.country_code) return null;
  const code = row.country_code.toUpperCase();
  if (code !== "IT" && code !== "SE" && code !== "DE") return null;
  const countryName =
    code === "IT" ? "Italy" : code === "SE" ? "Sweden" : "Germany";
  return {
    country: countryName,
    countryCode: code,
    city: row.city ?? undefined,
  };
}

/** Shared react-query hook — one network call shared across every card +
 *  PDP on the page (deduped by query key). */
function useProductOriginsMap() {
  return useQuery({
    queryKey: ["product-origins-map"],
    queryFn: () => getProductOriginsMap(),
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
  });
}

/**
 * Unified "Ships from {country} · Get it by {date}" badge. Used on every
 * product card AND on the PDP so the placement, copy, icon, and typography
 * are identical across the site.
 *
 * Origin resolution (priority order):
 *  1. `product_origins.country_code` cached from Shopify inventory
 *     (most-stock-wins across the product's stocked locations).
 *  2. Vendor → BG warehouse map (`getShippingOriginOrDefault`).
 *  3. DEFAULT_ORIGIN (Italy — BG's primary warehouse).
 *
 * Zip resolves via the location store, falling back to {@link DEFAULT_ZIP}
 * so the delivery date renders even before IP auto-detect resolves.
 */
export function ShippingMeta({ vendor, handle, variant = "card" }: Props) {
  const zip = useLocationStore((s) => s.zip);
  const openHeaderPopover = useLocationPopover((s) => s.setOpen);
  const { data: originsMap } = useProductOriginsMap();

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const effectiveZip = zip ?? DEFAULT_ZIP;
  const inventoryOrigin = handle ? originFromRow(originsMap?.[handle]) : null;
  const origin = inventoryOrigin ?? getShippingOriginOrDefault(vendor);
  const originLabel = formatOriginLabel(origin)!;
  const estimate = estimateForOriginAndZip(origin, effectiveZip);

  if (variant === "card") {
    return (
      <div className="mt-1.5 space-y-0.5">
        <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          {originLabel}
        </p>
        {mounted && (
          <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            Get it by{" "}
            <span className="font-semibold text-ink normal-case tracking-normal">
              {estimate.arrivalLabel}
            </span>
          </p>
        )}
      </div>
    );
  }

  // PDP variant
  if (!mounted) return <div className="h-12" aria-hidden />;

  return (
    <div className="flex items-start gap-2 text-[12px] text-ink/70 py-3 px-1 border-t border-b border-ink/10">
      <MapPin className="w-3.5 h-3.5 text-bronze shrink-0 mt-0.5" strokeWidth={1.5} />
      <div className="leading-relaxed">
        <span>
          Delivering to <span className="font-medium text-ink">{effectiveZip}</span> · Get it by{" "}
          <span className="font-semibold text-ink">{estimate.arrivalLabel}</span>
        </span>
        <span className="block text-[10px] uppercase tracking-[0.2em] text-muted-foreground mt-1">
          {originLabel} · {estimate.minDays}–{estimate.maxDays} business days
        </span>
        <button
          type="button"
          onClick={() => openHeaderPopover(true)}
          className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground hover:text-bronze underline underline-offset-4 mt-1"
        >
          {zip ? "Change location" : "Set location"}
        </button>
      </div>
    </div>
  );
}
