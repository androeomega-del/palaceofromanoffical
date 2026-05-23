import { useEffect, useState } from "react";
import { MapPin } from "lucide-react";
import { useLocationStore, useLocationPopover, DEFAULT_ZIP } from "@/stores/location-store";
import {
  getShippingOriginOrDefault,
  formatOriginLabel,
} from "@/lib/shipping-origin";
import { estimateForOriginAndZip } from "@/lib/delivery-estimate";

type Variant = "card" | "pdp";

type Props = {
  vendor: string | null | undefined;
  variant?: Variant;
};

/**
 * Unified "Ships from {country} · Get it by {date}" badge. Used on every
 * product card AND on the PDP so the placement, copy, icon, and typography
 * are identical across the site.
 *
 * - `variant="card"` → compact two-line tag for the grid (≈10–11px).
 * - `variant="pdp"`  → fuller block under the Add-to-Bag CTA with a
 *   "Change location" link.
 *
 * Origin resolves via {@link getShippingOriginOrDefault} so the badge is
 * never blank. Zip resolves via the location store, falling back to
 * {@link DEFAULT_ZIP} so the delivery date renders even before the IP
 * auto-detect resolves.
 */
export function ShippingMeta({ vendor, variant = "card" }: Props) {
  const zip = useLocationStore((s) => s.zip);
  const openHeaderPopover = useLocationPopover((s) => s.setOpen);

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const effectiveZip = zip ?? DEFAULT_ZIP;
  const origin = getShippingOriginOrDefault(vendor);
  const originLabel = formatOriginLabel(origin)!;
  const estimate = estimateForOriginAndZip(origin, effectiveZip);

  if (variant === "card") {
    // SSR-safe: render the origin line immediately; show the date once
    // mounted so we can use the (possibly user-set) zip without hydration
    // mismatch.
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
