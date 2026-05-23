import { useEffect, useState } from "react";
import { MapPin } from "lucide-react";
import { useLocationStore } from "@/stores/location-store";
import { estimateDeliveryForZip } from "@/lib/delivery-estimate";

type Props = {
  vendor: string | null | undefined;
  onSetLocation?: () => void;
};

/**
 * PDP delivery badge shown directly below the Add to Bag button.
 * - No zip set → prompts the shopper to enter one.
 * - Zip set    → renders "Delivering to {zip} · Get it by {date}".
 *
 * Honest copy per mem://constraints/team-identity: all pieces dispatch
 * from our European partners. We never imply a US warehouse.
 */
export function PdpDeliveryBadge({ vendor, onSetLocation }: Props) {
  const zip = useLocationStore((s) => s.zip);

  // Defer to a mounted flag — the store hydrates from localStorage and would
  // otherwise mismatch the SSR render.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <div className="h-12" aria-hidden />;
  }

  if (!zip) {
    return (
      <div className="flex items-center gap-2 text-[12px] text-ink/70 py-3 px-1 border-t border-b border-ink/10">
        <MapPin className="w-3.5 h-3.5 text-bronze shrink-0" strokeWidth={1.5} />
        <span>
          Enter zip code to see estimated delivery dates.{" "}
          <button
            type="button"
            onClick={onSetLocation}
            className="underline underline-offset-4 hover:text-bronze"
          >
            Add location
          </button>
        </span>
      </div>
    );
  }

  const estimate = estimateDeliveryForZip(vendor, zip);

  if (!estimate) {
    return (
      <div className="flex items-center gap-2 text-[12px] text-ink/70 py-3 px-1 border-t border-b border-ink/10">
        <MapPin className="w-3.5 h-3.5 text-bronze shrink-0" strokeWidth={1.5} />
        <span>
          Delivering to <span className="font-medium text-ink">{zip}</span> · Delivery window confirmed at checkout.
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-2 text-[12px] text-ink/70 py-3 px-1 border-t border-b border-ink/10">
      <MapPin className="w-3.5 h-3.5 text-bronze shrink-0 mt-0.5" strokeWidth={1.5} />
      <div className="leading-relaxed">
        <span>
          Delivering to <span className="font-medium text-ink">{zip}</span> · Get it by{" "}
          <span className="font-semibold text-ink">{estimate.arrivalLabel}</span>
        </span>
        <span className="block text-[10px] uppercase tracking-[0.2em] text-muted-foreground mt-1">
          Dispatched from {estimate.origin.country} · {estimate.minDays}–{estimate.maxDays} business days
        </span>
      </div>
    </div>
  );
}
