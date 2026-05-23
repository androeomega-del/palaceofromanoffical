// US-zip-aware delivery estimate built on top of `estimateDelivery`.
//
// Honest framing per mem://constraints/team-identity: all pieces dispatch
// from our European partners (Italy / Sweden / Germany). The US zip code
// only nudges the final-mile window within the existing carrier range —
// East Coast (0/1 prefixes) lands a touch sooner via JFK/EWR; West Coast
// (9 prefix) adds a day for the cross-country leg. We never imply a US
// warehouse or "domestic" shipping.
//
// BG official SLA layered on top of the carrier table:
//   - 24–48h warehouse handling (1–2 business days) — already baked into
//     the conservative window in shipping-eta.ts
//   - Weekends + the origin country's bank holidays do not count as
//     business days (warehouses and freight partners are closed)
//   - We do not ship to RU / BY / UA (war-related restriction); callers
//     that pass one of those destination codes get { blocked: true }.

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
  /** True for restricted destinations (RU/BY/UA). UI should hide the date. */
  blocked?: boolean;
};

/**
 * 2026 public / bank holidays per origin country, in YYYY-MM-DD (UTC).
 * Conservative subset — only the dates warehouses and carriers are reliably
 * closed. Extendable per country without touching call sites.
 */
const HOLIDAYS_2026: Record<ShippingOrigin["countryCode"], Set<string>> = {
  IT: new Set([
    "2026-01-01", // New Year
    "2026-01-06", // Epiphany
    "2026-04-05", // Easter Sunday
    "2026-04-06", // Easter Monday
    "2026-04-25", // Liberation Day
    "2026-05-01", // Labour Day
    "2026-06-02", // Republic Day
    "2026-08-15", // Ferragosto
    "2026-11-01", // All Saints
    "2026-12-08", // Immaculate Conception
    "2026-12-25", // Christmas
    "2026-12-26", // St. Stephen's Day
  ]),
  DE: new Set([
    "2026-01-01",
    "2026-04-03", // Good Friday
    "2026-04-06", // Easter Monday
    "2026-05-01",
    "2026-05-14", // Ascension
    "2026-05-25", // Whit Monday
    "2026-10-03", // German Unity
    "2026-12-25",
    "2026-12-26",
  ]),
  SE: new Set([
    "2026-01-01",
    "2026-01-06",
    "2026-04-03",
    "2026-04-06",
    "2026-05-01",
    "2026-05-14",
    "2026-06-06", // National Day
    "2026-06-19", // Midsummer Eve (observed)
    "2026-12-24",
    "2026-12-25",
    "2026-12-26",
  ]),
};

const RESTRICTED_DESTINATIONS = new Set(["RU", "BY", "UA"]);

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/**
 * Add N business days to `start`, skipping weekends AND the origin
 * country's bank holidays (warehouses + carriers closed). UTC-stable.
 */
function addBusinessDaysWithHolidays(
  start: Date,
  days: number,
  originCode: ShippingOrigin["countryCode"],
): Date {
  const holidays = HOLIDAYS_2026[originCode] ?? new Set<string>();
  const d = new Date(start.getTime());
  let added = 0;
  while (added < days) {
    d.setUTCDate(d.getUTCDate() + 1);
    const dow = d.getUTCDay();
    if (dow === 0 || dow === 6) continue;
    if (holidays.has(isoDate(d))) continue;
    added += 1;
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

/**
 * Same as above but with an explicit origin. Optional `destCountry` lets
 * callers signal a restricted destination (RU/BY/UA) — when set, the
 * returned estimate has `blocked: true` and the UI hides the date.
 */
export function estimateForOriginAndZip(
  origin: ShippingOrigin,
  zip: string,
  now: Date = new Date(),
  destCountry: string = "US",
): ZipDeliveryEstimate {
  const code = destCountry.toUpperCase();
  if (RESTRICTED_DESTINATIONS.has(code)) {
    // Placeholder window kept so the type stays consistent; UI must check
    // `blocked` and replace the date with the restricted-region copy.
    return {
      origin,
      minDays: 0,
      maxDays: 0,
      earliestArrival: now,
      latestArrival: now,
      label: "We do not currently ship to this region.",
      latestArrivalIso: isoDate(now),
      arrivalLabel: "Not available for shipment",
      adjusted: false,
      blocked: true,
    };
  }

  const base = estimateDelivery(origin, "US", now);
  const delta = coastalAdjustment(zip);
  const minDays = Math.max(1, base.minDays + delta);
  const maxDays = Math.max(minDays + 1, base.maxDays + delta);
  const earliest = addBusinessDaysWithHolidays(now, minDays, origin.countryCode);
  const latest = addBusinessDaysWithHolidays(now, maxDays, origin.countryCode);
  return {
    origin,
    minDays,
    maxDays,
    earliestArrival: earliest,
    latestArrival: latest,
    label: base.label,
    latestArrivalIso: isoDate(latest),
    arrivalLabel: WEEKDAY_FMT.format(latest),
    adjusted: delta !== 0,
  };
}
