import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { SITE_URL, xmlEscape } from "@/lib/sitemap-xml";

const SITEMAPS = [
  "/sitemap-static.xml",
  "/sitemap-collections.xml",
  "/sitemap-brands.xml",
  "/sitemap-products.xml",
];

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const lines = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
          ...SITEMAPS.map(
            (path) =>
              `  <sitemap>\n    <loc>${xmlEscape(`${SITE_URL}${path}`)}</loc>\n  </sitemap>`,
          ),
          `</sitemapindex>`,
        ];
        const xml = lines.join("\n");
        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml; charset=utf-8",
            "Cache-Control": "public, max-age=3600, s-maxage=21600",
          },
        });
      },
    },
  },
});
