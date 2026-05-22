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
  priceUsd = 0,
  onSale = false,
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

  // Single-variant products (one-size pieces — bags, fragrance, accessories)
  // can't be tiered by variant count without misleading the customer.
  if (totalVariants <= 1) {
    if (priceUsd >= 1800 && availableCount === 1) {
      return {
        tier: "archive",
        label: "Archive Edition",
        headline: "Archive Edition · acquire now",
        rationale:
          "Sourced from a closed seasonal allocation. Once this unit ships, the piece returns to the archive.",
      };
    }
    return { tier: "none", label: "", headline: "", rationale: "" };
  }

  // Markdown + scarcity is the strongest combined signal — handle first.
  if (onSale && availableCount <= 4 && availableCount > 0) {
    return {
      tier: "lastMarkdown",
      label: `Last ${availableCount} at this price`,
      headline: `Final ${availableCount} pieces at markdown`,
      rationale:
        "The remaining units at this revised price. Once they ship, the piece returns to full retail or sells through entirely.",
      remaining: availableCount,
    };
  }

  if (availableCount === 1) {
    return {
      tier: "finalPiece",
      label: "Final Piece",
      headline: "Final piece — last size available",
      rationale:
        "A single unit remains across every size in our partner inventory. Replenishment of this exact colourway is not confirmed.",
      remaining: 1,
    };
  }

  if (availableCount <= 3) {
    if (priceUsd >= 1800) {
      return {
        tier: "archive",
        label: `Only ${availableCount} Worldwide`,
        headline: `Rare find · ${availableCount} pieces remaining`,
        rationale:
          "A high-value allocation that rarely re-stocks in the same fabric and colour. Acquire while the size run is intact.",
        remaining: availableCount,
      };
    }
    return {
      tier: "rareFind",
      label: `Rare — ${availableCount} Left`,
      headline: `Rare find · only ${availableCount} pieces left`,
      rationale:
        "Limited reserve from our partner distributor. Sizes have been selling through over the past 14 days.",
      remaining: availableCount,
    };
  }

  if (availableCount <= 6) {
    return {
      tier: "limited",
      label: "Limited Availability",
      headline: "Limited availability",
      rationale:
        "A short remaining run across sizes. Pieces in this category typically sell out before re-supply windows open.",
      remaining: availableCount,
    };
  }

  return { tier: "none", label: "", headline: "", rationale: "" };
}
