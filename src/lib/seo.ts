// SEO helpers — keep all canonical URL + meta truncation logic in one place.

export const SITE_URL = "https://palaceofromanofficial.com";
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

/**
 * Build a standard set of og:* + twitter:* meta tags plus a canonical link
 * for a route. `title` and `description` should already be the final strings
 * (use pageTitle()/metaDescription() upstream if needed). `image` may be
 * site-relative or absolute; it is normalised to an absolute URL.
 */
export function routeHead(opts: {
  path: string;
  title: string;
  description: string;
  image?: string | null;
  type?: "website" | "article" | "product";
}) {
  const url = absoluteUrl(opts.path);
  const type = opts.type ?? "website";
  const meta: Array<Record<string, string>> = [
    { property: "og:title", content: opts.title },
    { property: "og:description", content: opts.description },
    { property: "og:url", content: url },
    { property: "og:type", content: type },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: opts.title },
    { name: "twitter:description", content: opts.description },
  ];
  if (opts.image) {
    const imgUrl = absoluteUrl(opts.image);
    meta.push({ property: "og:image", content: imgUrl });
    meta.push({ name: "twitter:image", content: imgUrl });
  }
  return {
    meta,
    links: [{ rel: "canonical", href: url }],
  };
}
