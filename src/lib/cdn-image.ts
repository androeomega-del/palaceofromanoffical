/**
 * Append Shopify CDN transform params for smaller, modern images.
 * Additive only — passes non-Shopify URLs through untouched, and never
 * mutates existing query params the URL already carries.
 *
 * Shopify CDN supports `?width=`, `?height=`, and `?format=webp` natively
 * on any cdn.shopify.com image URL — same effect as the GraphQL `transform:`
 * argument but applied at render time so we don't need to touch the
 * Storefront queries / generated types.
 */
export function cdnImage(
  url: string | null | undefined,
  opts: { width?: number; height?: number; format?: "webp" | "jpg" } = {},
): string {
  if (!url) return "";
  try {
    const u = new URL(url);
    if (!u.hostname.includes("cdn.shopify.com")) return url;
    if (opts.width && !u.searchParams.has("width"))
      u.searchParams.set("width", String(opts.width));
    if (opts.height && !u.searchParams.has("height"))
      u.searchParams.set("height", String(opts.height));
    const format = opts.format ?? "webp";
    if (!u.searchParams.has("format")) u.searchParams.set("format", format);
    return u.toString();
  } catch {
    return url;
  }
}

/**
 * Build a responsive `srcset` string for a Shopify CDN image at the given
 * widths. Pass to `<img srcSet={...} sizes="..." />` alongside `src` for
 * width-aware delivery. Non-Shopify URLs return an empty string (the
 * caller falls back to plain `src`).
 */
export function cdnSrcSet(
  url: string | null | undefined,
  widths: number[] = [400, 700, 1000, 1400],
): string {
  if (!url) return "";
  try {
    const u = new URL(url);
    if (!u.hostname.includes("cdn.shopify.com")) return "";
  } catch {
    return "";
  }
  return widths
    .map((w) => `${cdnImage(url, { width: w })} ${w}w`)
    .join(", ");
}
