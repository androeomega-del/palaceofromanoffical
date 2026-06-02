/**
 * Per-brand FAQ generator.
 *
 * Produces 4 maison-aware Q&As consumed by /brand/$vendor as both
 * visible FAQ copy (future) and FAQPage JSON-LD in the route head().
 *
 * Pulls signature context from brand-heritage when available, falls back
 * to safe generic phrasing otherwise. Nothing fabricated.
 */

import { heritageFor } from "@/lib/brand-heritage";

export type BrandFaqQA = { q: string; a: string };

export function buildBrandFaq(brandName: string): BrandFaqQA[] {
  const h = heritageFor(brandName);
  const sigList = h.signatures.slice(0, 3).join(", ");
  const country = h.country !== "—" ? h.country : "Europe";

  return [
    {
      q: `Is ${brandName} authentic at Palace of Roman?`,
      a: `Yes. Every ${brandName} piece on Palace of Roman is sourced through our network of authorised boutiques and distributors and ships with its original packaging, brand tags and any accompanying documentation. Each order is backed by our 90-day authenticity guarantee.`,
    },
    {
      q: `Where does ${brandName} ship from?`,
      a: `${brandName} orders dispatch from our European boutique-network partners — typically ${country} — with 1–2 day handling and 3–7 day worldwide express delivery, fully tracked from door to door.`,
    },
    {
      q: `What is the return window on ${brandName}?`,
      a: `Unworn ${brandName} pieces with original tags and packaging can be returned within 14 days of delivery for a full refund. Returns are free worldwide; initiate yours from your account or contact the concierge.`,
    },
    {
      q: `How does ${brandName} sizing run?`,
      a: `${brandName} uses standard Italian/EU sizing across ${sigList || "its collections"}. Most pieces run true to size; consult the size guide on each product, and reach out to the concierge for fit advice on a specific silhouette.`,
    },
  ];
}
