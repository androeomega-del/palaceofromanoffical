// SEO helpers — keep all canonical URL + meta truncation logic in one place.

export const SITE_URL = "https://palaceofroman.com";
export const SITE_NAME = "Palace of Roman";

/** Build an absolute URL from a site-relative path. */
export function absoluteUrl(path: string): string {
  if (!path) return SITE_URL;
  if (/^https?:\/\//i.test(path)) return path;
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

/** Strip HTML tags + collapse whitespace. */
export function stripHtml(input: string | null | undefined): string {
  if (!input) return "";
  return input
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

/** Truncate at a word boundary under `max` chars and append an ellipsis if cut. */
export function truncate(input: string, max: number): string {
  const t = (input ?? "").trim();
  if (t.length <= max) return t;
  const cut = t.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).trim()}…`;
}

/** Title under 60 chars including the store name. */
export function pageTitle(main: string, max = 60): string {
  const suffix = ` — ${SITE_NAME}`;
  const budget = max - suffix.length;
  return `${truncate(main, budget)}${suffix}`;
}

/** Meta description under 160 chars. */
export function metaDescription(input: string, max = 158): string {
  return truncate(stripHtml(input), max);
}
