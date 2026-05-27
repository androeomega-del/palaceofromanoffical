/**
 * Availability Urgency for designer retail.
 *
 * Inventory at Palace of Roman is genuinely limited — BrandsGateway stock
 * for any single SKU is typically a handful of units across all sizes, and
 * once a piece is gone it rarely returns in the same colourway. This module
 * translates *real* variant availability into restrained, curatorial
 * urgency copy (no fabricated countdowns, no fake "23 people viewing").
 *
 * Tiers are intentionally conservative so the signal stays trustworthy:
 *   - finalPiece   → exactly one variant left in the entire run
 *   - rareFind     → 2–3 variants left
 *   - limited      → 4–6 variants left
 *   - archive      → high-ticket (≥ $1800) AND ≤ 6 left → "Archive Edition"
 *   - lastMarkdown → on sale AND ≤ 4 left → "Last markdown pieces"
 *   - none         → healthy stock; no urgency shown
 *
 * Designer-retail marketing tactic stack referenced:
 *   • Availability urgency (Cialdini: scarcity principle, applied to *real*
 *     stock so it doesn't erode trust the way fake timers do).
 *   • Curator framing — "Archive Edition", "Final Piece" — borrowed from
 *     auction-house and concept-store copy (Dover Street Market, SSENSE
 *     archive, Yoox The Reserve).
 *   • Exclusivity over discount — luxury shoppers respond to "rare" before
 *     they respond to "cheap"; the markdown variant is the *only* tier
 *     that mentions price reduction.
 */

export type ScarcityTier =
  | "finalPiece"
  | "rareFind"
  | "limited"
  | "archive"
  | "lastMarkdown"
  | "soldOut"
  | "none";

export type ScarcitySignal = {
  tier: ScarcityTier;
  /** Compact label for product cards (≤ 24 chars). */
  label: string;
  /** Expanded headline for the PDP buy box. */
  headline: string;
  /** One-line supporting sentence, curatorial voice. */
  rationale: string;
  /** Available variant count, when known and meaningful. */
  remaining?: number;
};

type Input = {
  availableCount: number;
  totalVariants: number;
  priceUsd?: number;
  onSale?: boolean;
};

export function computeScarcitySignal({
  availableCount,
  totalVariants,
  priceUsd: _priceUsd = 0,
  onSale: _onSale = false,
}: Input): ScarcitySignal {
  if (totalVariants > 0 && availableCount === 0) {
    return {
      tier: "soldOut",
      label: "Sold Out",
      headline: "No longer available",
      rationale:
        "This piece has sold through our distributor allocation. Add to wishlist — we will notify you if it returns.",
    };
  }

  // Top-tier luxury restraint: NAP/MR PORTER reserve scarcity tags for the
  // genuinely-final piece only. Showing "Limited availability" on most cards
  // in a row turns the signal into noise — so we now only badge when exactly
  // one variant remains in the entire size run. Tier name kept as "limited"
  // so downstream visual treatments (bronze halo, buy-box accent) keep
  // mapping cleanly without a sweep through call sites.
  if (availableCount === 1) {
    return {
      tier: "limited",
      label: "Final piece",
      headline: "Final piece",
      rationale:
        "One remaining unit across the entire size run — once gone, this colourway rarely returns.",
      remaining: 1,
    };
  }

  return { tier: "none", label: "", headline: "", rationale: "" };
}
