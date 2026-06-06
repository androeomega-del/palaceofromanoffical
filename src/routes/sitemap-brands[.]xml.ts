import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { storefrontApiRequest } from "@/lib/shopify";
import { renderSitemap, sitemapResponse, guardCanonicalSitemapHost, type UrlEntry } from "@/lib/sitemap-xml";

const MAX_PRODUCTS = 5000;
const PRODUCT_PAGE_SIZE = 250;

const VENDOR_SLUGS_QUERY = `
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
    const res: any = await storefrontApiRequest<any>(VENDOR_SLUGS_QUERY, {
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

export const Route = createFileRoute("/sitemap-brands.xml")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const blocked = guardCanonicalSitemapHost(request);
        if (blocked) return blocked;
        const entries: UrlEntry[] = [];
        try {
          const products = await fetchAllProductSlugs();
          const seenVendors = new Set<string>();
          for (const p of products) {
            if (p.vendor) {
              const slug = p.vendor.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
              if (slug && !seenVendors.has(slug)) {
                seenVendors.add(slug);
                entries.push({
                  path: `/brand/${slug}`,
                  changefreq: "weekly",
                  priority: "0.6",
                });
              }
            }
          }
        } catch (e) {
          console.warn("[sitemap-brands] fetch failed", e);
        }
        return sitemapResponse(renderSitemap(entries));
      },
    },
  },
});
