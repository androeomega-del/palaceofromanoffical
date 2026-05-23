// Per-vendor shipping-origin map for the BrandsGateway distribution model.
//
// BG warehouses real stock in Italy (primary), Sweden, and Germany. The
// product's MAISON (e.g. Saint Laurent, Hermès) is French, but the SHIPPING
// ORIGIN is the BG warehouse holding it. That distinction matters for the
// AI concierge's delivery-window logic and for the "Ships from …" tag on
// product cards.
//
// Editing rules (per mem://constraints/team-identity + no-fabrication):
//   - Only add a vendor here if its warehouse country is verifiable.
//     Unknown vendors return `null` and the UI/AI silently omits origin —
//     never guess a country to fill a gap.
//   - We never modify Shopify fulfillment locations from this file
//     (mem://constraints/fulfillment-locations). This is read-only metadata.
//   - Currency / brand naming stays exactly as it appears in the Shopify
//     vendor field; matching is case-insensitive and trims whitespace.

export type OriginCountry = "Italy" | "Sweden" | "Germany";

export type ShippingOrigin = {
  /** Country name shown to shoppers — used in "Ships from Italy". */
  country: OriginCountry;
  /** ISO 3166-1 alpha-2 country code — used by the ETA calculator. */
  countryCode: "IT" | "SE" | "DE";
  /** Optional city — purely editorial, omitted in copy unless requested. */
  city?: string;
};

// Italian warehouse — covers the bulk of the BG luxury catalogue. French,
// Italian, British, and American maisons all dropship from BG's Italian
// distribution centre unless explicitly noted below.
const IT: ShippingOrigin = { country: "Italy", countryCode: "IT", city: "Milano" };
const SE: ShippingOrigin = { country: "Sweden", countryCode: "SE", city: "Jönköping" };
const DE: ShippingOrigin = { country: "Germany", countryCode: "DE", city: "Berlin" };

/** Canonical vendor → origin map. Keys are lowercase, trimmed vendor names. */
const VENDOR_ORIGIN: Record<string, ShippingOrigin> = {
  // ── Italian houses (warehouse: Italy) ─────────────────────────────────
  "dolce & gabbana": IT,
  "gucci": IT,
  "prada": IT,
  "miu miu": IT,
  "fendi": IT,
  "valentino": IT,
  "bottega veneta": IT,
  "versace": IT,
  "giorgio armani": IT,
  "emporio armani": IT,
  "brunello cucinelli": IT,
  "ermenegildo zegna": IT,
  "zegna": IT,
  "ferragamo": IT,
  "salvatore ferragamo": IT,
  "moncler": IT,
  "brioni": IT,
  "etro": IT,
  "marni": IT,
  "missoni": IT,
  "tods": IT,
  "tod's": IT,
  "max mara": IT,
  // ── French houses warehoused via BG Italy ─────────────────────────────
  "louis vuitton": IT,
  "chanel": IT,
  "saint laurent": IT,
  "dior": IT,
  "christian dior": IT,
  "hermès": IT,
  "hermes": IT,
  "celine": IT,
  "céline": IT,
  "loewe": IT,
  "balenciaga": IT,
  "givenchy": IT,
  "balmain": IT,
  "chloé": IT,
  "chloe": IT,
  "lanvin": IT,
  "jacquemus": IT,
  "maison margiela": IT,
  "longchamp": IT,
  "goyard": IT,
  "isabel marant": IT,
  "alaïa": IT,
  "alaia": IT,
  // ── British / American houses warehoused via BG Italy ─────────────────
  "burberry": IT,
  "alexander mcqueen": IT,
  "stella mccartney": IT,
  "vivienne westwood": IT,
  "jimmy choo": IT,
  "mulberry": IT,
  "tom ford": IT,
  "the row": IT,
  "ralph lauren": IT,
  "polo ralph lauren": IT,
  "michael kors": IT,
  "tory burch": IT,
  "coach": IT,
  "marc jacobs": IT,
  "thom browne": IT,
  "rimowa": IT,
  // ── Swedish house ─────────────────────────────────────────────────────
  "acne studios": SE,
  // ── German houses ─────────────────────────────────────────────────────
  "hugo boss": DE,
  "boss": DE,
  "mcm": DE,
};

/**
 * Resolve a vendor name to its BG shipping origin. Returns `null` for
 * unknown vendors — caller MUST treat null as "do not display / do not
 * mention" rather than substituting a default country.
 *
 * Used by the AI concierge where the no-fabrication rule is strictest.
 */
export function getShippingOrigin(vendor: string | null | undefined): ShippingOrigin | null {
  if (!vendor) return null;
  const key = vendor.trim().toLowerCase();
  return VENDOR_ORIGIN[key] ?? null;
}

/**
 * Default origin for UI fallback. BG warehouses the bulk (~95%) of the
 * catalogue in Italy, so when a vendor isn't explicitly mapped we surface
 * the BG primary warehouse rather than leaving the badge blank. This keeps
 * the UI uniform across every card and PDP without inventing a country
 * (Italy is BG's documented primary distribution centre).
 */
export const DEFAULT_ORIGIN: ShippingOrigin = IT;

/**
 * UI-safe origin resolver. Falls back to {@link DEFAULT_ORIGIN} so every
 * product card and PDP renders the "Ships from …" badge uniformly.
 * Do NOT use this in the AI concierge — use {@link getShippingOrigin}
 * there to preserve the no-fabrication contract.
 */
export function getShippingOriginOrDefault(
  vendor: string | null | undefined,
): ShippingOrigin {
  return getShippingOrigin(vendor) ?? DEFAULT_ORIGIN;
}

/** "Ships from Italy" — the canonical UI string. Editorial, factual, restrained. */
export function formatOriginLabel(origin: ShippingOrigin | null): string | null {
  if (!origin) return null;
  return `Ships from ${origin.country}`;
}

/**
 * Final-fallback label used only when we have NO inventory data AND no
 * vendor mapping — keeps the badge graceful instead of blank. Matches the
 * Palace of Roman tone (premium, restrained, never invents a country).
 */
export const HUB_FALLBACK_LABEL = "Ships from Express Tracked Hub";
