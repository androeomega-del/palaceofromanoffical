/**
 * Season-keyword parsing — shared utility for product cards, PLPs, search
 * results, and any surface that needs to badge a piece as "New Season".
 *
 * Source of truth: the season token written into each product's description
 * (e.g. "SS26", "Spring/Summer 2026", "FW26", "Fall/Winter 2026",
 * "Resort 2027", "Pre-Fall 2026", "Cruise 2027").
 *
 * Today (May 2026) the current season is Spring-Summer 2026 and the upcoming
 * seasons are Pre-Fall 2026, Fall-Winter 2026, and Resort/Cruise 2027.
 * Update this allow-list when the calendar rolls.
 */

export const NEW_SEASON_PATTERNS: RegExp[] = [
  // SS26 / S/S 26 / Spring-Summer 2026
  /\bs[\s/.-]?s[\s/.-]?(?:20)?26\b/i,
  /\bspring[\s/-]?summer\s*(?:20)?26\b/i,
  // FW26 / AW26 / A/W 26 / Fall-Winter 2026 / Autumn-Winter 2026
  /\b(?:f[\s/.-]?w|a[\s/.-]?w)[\s/.-]?(?:20)?26\b/i,
  /\b(?:fall|autumn)[\s/-]?winter\s*(?:20)?26\b/i,
  // Pre-Fall 2026
  /\bpre[\s-]?fall\s*(?:20)?26\b/i,
  // Resort / Cruise 2027
  /\b(?:resort|cruise)\s*(?:20)?27\b/i,
];

/** Strip HTML tags so tokens inside rich-text descriptions still match. */
function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, " ");
}

/**
 * Returns `true` when the description contains a current or upcoming season
 * token. Safe to call with `null` / `undefined` — returns `false`.
 */
export function isCurrentOrUpcomingSeason(
  description?: string | null,
): boolean {
  if (!description) return false;
  const text = stripHtml(description);
  return NEW_SEASON_PATTERNS.some((re) => re.test(text));
}
