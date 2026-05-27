/**
 * Parse composition + care information from a product description.
 *
 * BrandsGateway descriptions are inconsistent but usually contain one of:
 *   - "Composition: 100% Cotton"
 *   - "Material: Wool 80%, Polyamide 20%"
 *   - bullet lines like "• 100% Silk" or "- Cotton 95% / Elastane 5%"
 *   - "Care: Dry clean only"
 *
 * This is read-only / defensive: we only surface signals we can find. If
 * nothing matches, the PDP accordion is hidden entirely — never invented.
 */

export type ParsedComposition = {
  /** Single-line composition string (e.g. "100% Cotton") or null. */
  composition: string | null;
  /** Care instruction line (e.g. "Dry clean only") or null. */
  care: string | null;
  /** Country of manufacture (e.g. "Made in Italy") or null. */
  madeIn: string | null;
};

const PCT_LINE = /([A-Z][A-Za-z]+(?:\s[A-Za-z]+)?\s\d{1,3}%(?:\s*[,/]\s*[A-Z][A-Za-z]+(?:\s[A-Za-z]+)?\s\d{1,3}%)*)/;
const PCT_FIRST = /(\d{1,3}%\s[A-Z][A-Za-z]+(?:\s*[,/]\s*\d{1,3}%\s[A-Z][A-Za-z]+)*)/;
const CARE_LINE = /(?:^|\n)\s*(?:Care|Wash(?:ing)?|Cleaning)\s*[:\-–]\s*([^\n]+)/i;
const MADE_IN = /(Made in [A-Z][A-Za-z]+(?: [A-Z][A-Za-z]+)?)/;
const COMP_TAG = /(?:^|\n)\s*(?:Composition|Material|Fabric|Outer|Lining)\s*[:\-–]\s*([^\n]+)/i;

function clean(s: string): string {
  return s.replace(/\s+/g, " ").trim().replace(/[.;]+$/, "");
}

export function parseComposition(description: string): ParsedComposition {
  if (!description) return { composition: null, care: null, madeIn: null };

  let composition: string | null = null;
  const tagged = description.match(COMP_TAG);
  if (tagged?.[1]) composition = clean(tagged[1]);
  if (!composition) {
    const m = description.match(PCT_FIRST) ?? description.match(PCT_LINE);
    if (m?.[1]) composition = clean(m[1]);
  }
  // Sanity guard — composition lines should be short.
  if (composition && composition.length > 160) composition = null;

  const careMatch = description.match(CARE_LINE);
  const care = careMatch?.[1] ? clean(careMatch[1]) : null;

  const madeInMatch = description.match(MADE_IN);
  const madeIn = madeInMatch?.[1] ? clean(madeInMatch[1]) : null;

  return { composition, care, madeIn };
}

export function hasCompositionInfo(p: ParsedComposition): boolean {
  return Boolean(p.composition || p.care || p.madeIn);
}
