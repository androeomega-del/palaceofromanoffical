/**
 * Product helpers — re-exports the luxury title formatter from the
 * canonical implementation so consumers can import from a stable
 * `@/utils/productHelpers` path.
 */
export { formatLuxuryTitle } from "@/lib/format-luxury-title";

interface MetaTagsInput {
  rawTitle: string;
  cleanTitle: string;
  brandName: string;
  categoryName?: string;
  rawDescription?: string;
}

/**
 * Dual-layer SEO architecture: keyword-dense titles/descriptions for
 * search indexers, polished "clean" titles for social share cards.
 * Strictly head-only — never bind to visible UI.
 */
export function generateLuxuryMetadata(input: MetaTagsInput) {
  const {
    rawTitle,
    cleanTitle,
    brandName,
    categoryName = "Luxury Apparel",
    rawDescription = "",
  } = input;

  const displayBrand = brandName ? `${brandName} ` : "";
  const seoMetaTitle = `${displayBrand}${rawTitle} | Palace of Roman`.trim();
  const socialOgTitle = `${displayBrand}${cleanTitle}`.trim();

  const stripped = rawDescription
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const genericKeywords = `Shop authentic ${brandName} ${categoryName}. Curated straight from premium European luxury networks. Duties cleared, express global transit.`;
  const seoMetaDescription = stripped
    ? `${stripped.slice(0, 120)}... Discover ${brandName} at Palace of Roman.`
    : genericKeywords;

  return { seoMetaTitle, socialOgTitle, seoMetaDescription };
}
