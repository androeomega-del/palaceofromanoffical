import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import {
  storefrontApiRequest,
  fetchCollections,
} from "@/lib/shopify";
import { SITE_URL } from "@/lib/seo";
import { canonicalCollectionHandle } from "@/lib/collection-canonical";

// Static, public, indexable routes. Auth flows, cart, checkout, account and
// API routes are intentionally omitted.
const STATIC_ROUTES: Array<{ path: string; changefreq?: string; priority?: string }> = [
  { path: "/", changefreq: "daily", priority: "1.0" },
  { path: "/shop", changefreq: "daily", priority: "0.9" },
  { path: "/collections", changefreq: "weekly", priority: "0.8" },
  { path: "/brands", changefreq: "weekly", priority: "0.7" },
  { path: "/swim", changefreq: "weekly", priority: "0.7" },
  { path: "/journal", changefreq: "weekly", priority: "0.6" },
  { path: "/links", changefreq: "monthly", priority: "0.4" },
  { path: "/editorial/may-2026", changefreq: "monthly", priority: "0.6" },
  { path: "/editorial/resort-2026", changefreq: "monthly", priority: "0.6" },
  { path: "/editorial/the-new-evening", changefreq: "monthly", priority: "0.6" },
  { path: "/about", changefreq: "monthly", priority: "0.5" },
  { path: "/authentication", changefreq: "monthly", priority: "0.5" },
  { path: "/shipping-returns", changefreq: "monthly", priority: "0.5" },
  { path: "/contact", changefreq: "monthly", priority: "0.5" },
  { path: "/faq", changefreq: "monthly", priority: "0.4" },
  { path: "/privacy", changefreq: "yearly", priority: "0.2" },
  { path: "/terms", changefreq: "yearly", priority: "0.2" },
  { path: "/legal-notice", changefreq: "yearly", priority: "0.2" },
];

// Cap on dynamic product entries we emit in a single sitemap response so the
// Cloudflare worker stays well under its CPU budget. 5,000 entries comfortably
// covers Google's per-sitemap limit (50k) without spending 60s of CPU
// paginating the full ~15k-product catalogue on every crawl.
const MAX_PRODUCTS = 5000;
const PRODUCT_PAGE_SIZE = 250;

const PRODUCT_SLUGS_QUERY = `
  query GetProductSlugs($first: Int!, $after: String) {
    products(first: $first, after: $after, sortKey: UPDATED_AT, reverse: true) {
      pageInfo { hasNextPage endCursor }
      edges { cursor node { handle updatedAt vendor } }
    }
  }
`;

async function fetchAllProductSlugs(): Promise<Array<{ handle: string; updatedAt: string; vendor: string }>> {
  const out: Array<{ handle: string; updatedAt: string; vendor: string }> = [];
  let after: string | null = null;
  while (out.length < MAX_PRODUCTS) {
    const res: any = await storefrontApiRequest<any>(PRODUCT_SLUGS_QUERY, {
      first: Math.min(PRODUCT_PAGE_SIZE, MAX_PRODUCTS - out.length),
      after,
    });
    const page: any = res?.data?.products;
    if (!page) break;
    for (const e of page.edges as any[]) {
      out.push({
        handle: e.node.handle,
        updatedAt: e.node.updatedAt,
        vendor: e.node.vendor,
      });
    }
    if (!page.pageInfo.hasNextPage) break;
    after = page.pageInfo.endCursor;
  }
  return out;
}

function xmlEscape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function urlEntry(opts: { path: string; lastmod?: string; changefreq?: string; priority?: string }): string {
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

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const entries: string[] = [];

        for (const r of STATIC_ROUTES) entries.push(urlEntry(r));

        try {
          const collections = await fetchCollections(500);
          const seenHandles = new Set<string>();
          for (const c of collections) {
            const canonical = canonicalCollectionHandle(c.handle);
            if (seenHandles.has(canonical)) continue;
            seenHandles.add(canonical);
            entries.push(
              urlEntry({
                path: `/collections/${canonical}`,
                lastmod: c.updatedAt,
                changefreq: "daily",
                priority: "0.8",
              }),
            );
          }
        } catch (e) {
          console.warn("[sitemap] collections fetch failed", e);
        }

        try {
          const products = await fetchAllProductSlugs();
          const seenVendors = new Set<string>();
          for (const p of products) {
            entries.push(
              urlEntry({
                path: `/product/${p.handle}`,
                lastmod: p.updatedAt,
                changefreq: "weekly",
                priority: "0.7",
              }),
            );
            if (p.vendor) {
              const slug = p.vendor.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
              if (slug && !seenVendors.has(slug)) {
                seenVendors.add(slug);
                entries.push(
                  urlEntry({
                    path: `/brand/${slug}`,
                    changefreq: "weekly",
                    priority: "0.6",
                  }),
                );
              }
            }
          }
        } catch (e) {
          console.warn("[sitemap] products fetch failed", e);
        }

        const xml = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
          ...entries,
          `</urlset>`,
        ].join("\n");

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
