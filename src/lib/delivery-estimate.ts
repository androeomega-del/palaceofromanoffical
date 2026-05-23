// US-zip-aware delivery estimate built on top of `estimateDelivery`.
//
// Honest framing per mem://constraints/team-identity: all pieces dispatch
// from our European partners (Italy / Sweden / Germany). The US zip code
// only nudges the final-mile window within the existing carrier range —
// East Coast (0/1 prefixes) lands a touch sooner via JFK/EWR; West Coast
// (9 prefix) adds a day for the cross-country leg. We never imply a US
// warehouse or "domestic" shipping.

import { estimateDelivery, type DeliveryEstimate } from "@/lib/shipping-eta";
import { getShippingOrigin, type ShippingOrigin } from "@/lib/shipping-origin";

const WEEKDAY_FMT = new Intl.DateTimeFormat("en-US", {
  weekday: "long",
  month: "long",
  day: "numeric",
  timeZone: "UTC",
});

export type ZipDeliveryEstimate = DeliveryEstimate & {
  /** "Thursday, May 28" — bold-ready label for the PDP badge. */
  arrivalLabel: string;
  /** True when the zip prefix nudged the window. Purely informational. */
  adjusted: boolean;
};

/** Add N business days (skips Sat/Sun) to a UTC date. */
function addBusinessDays(start: Date, days: number): Date {
  const d = new Date(start.getTime());
  let added = 0;
  while (added < days) {
    d.setUTCDate(d.getUTCDate() + 1);
    const dow = d.getUTCDay();
    if (dow !== 0 && dow !== 6) added += 1;
  }
  return d;
}

/**
 * Coastal adjustment for US destinations (days added to the base US window).
 *  - '0' / '1' (Northeast)   → -1 day (faster final-mile via JFK/EWR)
 *  - '9'        (West Coast) → +1 day (extra cross-country leg)
 *  - everything else         →  0
 */
function coastalAdjustment(zip: string): number {
  const prefix = zip.charAt(0);
  if (prefix === "0" || prefix === "1") return -1;
  if (prefix === "9") return 1;
  return 0;
}

/**
 * Build a delivery estimate for a US shopper given their zip + the
 * product's vendor. Returns null if we can't resolve a shipping origin
 * for the vendor (rather than guessing).
 */
export function estimateDeliveryForZip(
  vendor: string | null | undefined,
  zip: string,
  now: Date = new Date(),
): ZipDeliveryEstimate | null {
  const origin = getShippingOrigin(vendor);
  if (!origin) return null;
  return estimateForOriginAndZip(origin, zip, now);
}

/** Same as above but with an explicit origin (used when vendor lookup is done elsewhere). */
export function estimateForOriginAndZip(
  origin: ShippingOrigin,
  zip: string,
  now: Date = new Date(),
): ZipDeliveryEstimate {
  const base = estimateDelivery(origin, "US", now);
  const delta = coastalAdjustment(zip);
  const minDays = Math.max(1, base.minDays + delta);
  const maxDays = Math.max(minDays + 1, base.maxDays + delta);
  const earliest = addBusinessDays(now, minDays);
  const latest = addBusinessDays(now, maxDays);
  return {
    origin,
    minDays,
    maxDays,
    earliestArrival: earliest,
    latestArrival: latest,
    label: base.label,
    latestArrivalIso: latest.toISOString().slice(0, 10),
    arrivalLabel: WEEKDAY_FMT.format(latest),
    adjusted: delta !== 0,
  };
}
