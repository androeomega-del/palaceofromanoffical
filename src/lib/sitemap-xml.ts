// Shared sitemap XML helpers for the sitemap-index sub-sitemap routes.

export const SITE_URL = "https://palaceofromanofficial.com";
export const CANONICAL_HOST = "palaceofromanofficial.com";

/**
 * Sitemaps are only served from the canonical apex host
 * (palaceofromanofficial.com). The same app is reachable via other hostnames
 * — checkout.palaceofromanofficial.com (Shopify checkout subdomain),
 * palaceofroman.com (302-redirects to the canonical), and the lovable.app
 * preview hosts. None of those should expose a sitemap, because Google would
 * see duplicate URLs that redirect and demote them.
 *
 * Returns a 404 Response when the request host is not canonical, or null
 * when the request should proceed.
 */
export function guardCanonicalSitemapHost(request: Request): Response | null {
  try {
    const host = (
      request.headers.get("x-forwarded-host") ??
      request.headers.get("host") ??
      new URL(request.url).host
    )
      .toLowerCase()
      .split(":")[0];

    // Allow canonical apex + local dev + lovable preview hosts (so previews
    // still render the XML for QA), but block any other production host
    // — notably checkout.palaceofromanofficial.com and palaceofroman.com.
    const allowed =
      host === CANONICAL_HOST ||
      host === "localhost" ||
      host === "127.0.0.1" ||
      host.endsWith(".lovable.app") ||
      host.endsWith(".lovable.dev");

    if (!allowed) {
      return new Response("Not Found", {
        status: 404,
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      });
    }
    return null;
  } catch {
    return null;
  }
}

export function xmlEscape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export interface UrlEntry {
  path: string;
  lastmod?: string;
  changefreq?: string;
  priority?: string;
}

export function renderUrlEntry(opts: UrlEntry): string {
  const lines = [
    `  <url>`,
    `    <loc>${xmlEscape(`${SITE_URL}${opts.path}`)}</loc>`,
    opts.lastmod ? `    <lastmod>${opts.lastmod}</lastmod>` : null,
    opts.changefreq ? `    <changefreq>${opts.changefreq}</changefreq>` : null,
    opts.priority ? `    <priority>${opts.priority}</priority>` : null,
    `  </url>`,
  ];
  return lines.filter(Boolean).join("\n");
}

export function renderSitemap(entries: UrlEntry[]): string {
  const xml = [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
    ...entries.map(renderUrlEntry),
    `</urlset>`,
  ];
  return xml.join("\n");
}

export function sitemapResponse(xml: string): Response {
  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=21600",
    },
  });
}
