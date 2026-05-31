// Shared sitemap XML helpers for the sitemap-index sub-sitemap routes.

export const SITE_URL = "https://palaceofromanofficial.com";

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
