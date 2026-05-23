// Conservative delivery-window estimator for the BG dropship model.
//
// Inputs:
//   - origin: the BG warehouse country (IT / SE / DE)
//   - destCountry: ISO 3166-1 alpha-2 of where the shopper is shipping to
//   - now: shopper's local "now" (used to skip weekends / today's cutoff)
//
// Output: a {minDays, maxDays, earliestArrival, latestArrival, label}
// envelope in BUSINESS days. Numbers are conservative DHL Express estimates
// that the AI concierge surfaces explicitly as estimates — never promises.
//
// Why business days: the BG dispatch SLA is "1 business day in-warehouse"
// and the courier networks (DHL Express / FedEx International Priority)
// only move on weekdays for customs clearance.

import type { ShippingOrigin } from "@/lib/shipping-origin";

type Range = { minDays: number; maxDays: number };

// Region buckets for the destination side. Anything not listed falls into
// "row" (rest-of-world) with a wider window so we never under-promise.
type DestRegion = "domestic" | "eu" | "uk" | "us-ca" | "row";

const EU_CODES = new Set([
  "AT","BE","BG","HR","CY","CZ","DK","EE","FI","FR","DE","GR","HU","IE","IT",
  "LV","LT","LU","MT","NL","PL","PT","RO","SK","SI","ES","SE","IS","LI","NO","CH",
]);
const US_CA = new Set(["US","CA","MX"]);
const UK = new Set(["GB","UK"]);

function regionOf(origin: ShippingOrigin, dest: string): DestRegion {
  const d = dest.toUpperCase();
  if (d === origin.countryCode) return "domestic";
  if (EU_CODES.has(d)) return "eu";
  if (UK.has(d)) return "uk";
  if (US_CA.has(d)) return "us-ca";
  return "row";
}

// Business-day windows per (origin, destRegion). Conservative DHL Express
// estimates — always presented as estimates, never guaranteed.
const TABLE: Record<ShippingOrigin["countryCode"], Record<DestRegion, Range>> = {
  IT: {
    domestic: { minDays: 2, maxDays: 4 },
    eu:       { minDays: 3, maxDays: 5 },
    uk:       { minDays: 4, maxDays: 7 },
    "us-ca":  { minDays: 5, maxDays: 8 },
    row:      { minDays: 7, maxDays: 12 },
  },
  SE: {
    domestic: { minDays: 2, maxDays: 4 },
    eu:       { minDays: 3, maxDays: 6 },
    uk:       { minDays: 4, maxDays: 7 },
    "us-ca":  { minDays: 6, maxDays: 9 },
    row:      { minDays: 8, maxDays: 13 },
  },
  DE: {
    domestic: { minDays: 2, maxDays: 4 },
    eu:       { minDays: 3, maxDays: 5 },
    uk:       { minDays: 4, maxDays: 7 },
    "us-ca":  { minDays: 5, maxDays: 9 },
    row:      { minDays: 8, maxDays: 12 },
  },
};

/** Add N business days to a date (skips Sat/Sun). UTC-stable. */
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

export type DeliveryEstimate = {
  origin: ShippingOrigin;
  minDays: number;
  maxDays: number;
  earliestArrival: Date;
  latestArrival: Date;
  /** "Arrives roughly Dec 1 – Dec 5" — for AI context / UI. */
  label: string;
  /** ISO date string for the latest arrival — easy for the LLM to compare. */
  latestArrivalIso: string;
};

const FMT = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});

export function estimateDelivery(
  origin: ShippingOrigin,
  destCountry: string,
  now: Date = new Date(),
): DeliveryEstimate {
  const region = regionOf(origin, destCountry);
  const range = TABLE[origin.countryCode][region];
  const earliest = addBusinessDays(now, range.minDays);
  const latest = addBusinessDays(now, range.maxDays);
  return {
    origin,
    minDays: range.minDays,
    maxDays: range.maxDays,
    earliestArrival: earliest,
    latestArrival: latest,
    label: `Arrives roughly ${FMT.format(earliest)} – ${FMT.format(latest)}`,
    latestArrivalIso: latest.toISOString().slice(0, 10),
  };
}
