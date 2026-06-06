/**
 * Market-aware tax/duties micro-line copy.
 *
 * Used by the header country selector and the PDP price area to communicate
 * the tax structure shoppers will see at checkout — VAT-inclusive for EU/UK
 * and a "duties at checkout" line for everywhere else. Buyer-confidence and
 * conversion transparency lever for international markets.
 */
import type { Market } from "@/stores/market-store";

/** Markets where Shopify Markets is configured for tax-inclusive pricing. */
const VAT_COUNTRIES = new Set<string>([
  "GB", "FR", "DE", "IT", "ES", "NL", "BE", "SE", "NO", "DK", "CH", "AT",
  "IE", "FI", "PT", "PL",
]);

/** Markets where we land duties at the door (DDP) — no checkout surprise. */
const DDP_COUNTRIES = new Set<string>(["US", "CA", "AU", "JP", "HK", "SG", "AE", "KR"]);

export function marketTaxNote(market: Market): string {
  if (VAT_COUNTRIES.has(market.country)) return "VAT incl. where applicable";
  if (DDP_COUNTRIES.has(market.country)) return "Duties & import taxes included";
  return "Duties & taxes calculated at checkout";
}
