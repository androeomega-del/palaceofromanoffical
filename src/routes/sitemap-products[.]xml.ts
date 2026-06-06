import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { storefrontApiRequest } from "@/lib/shopify";
import { renderSitemap, sitemapResponse, guardCanonicalSitemapHost, type UrlEntry } from "@/lib/sitemap-xml";

const MAX_PRODUCTS = 5000;
const PRODUCT_PAGE_SIZE = 250;

const PRODUCT_SLUGS_QUERY = `
  query GetProductSlugs($first: Int!, $after: String) {
    products(first: $first, after: $after, sortKey: UPDATED_AT, reverse: true) {
      pageInfo { hasNextPage endCursor }
      edges { cursor node { handle updatedAt } }
    }
  }
`;

async function fetchAllProductSlugs(): Promise<Array<{ handle: string; updatedAt: string }>> {
  const out: Array<{ handle: string; updatedAt: string }> = [];
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
      });
    }
    if (!page.pageInfo.hasNextPage) break;
    after = page.pageInfo.endCursor;
  }
  return out;
}

export const Route = createFileRoute("/sitemap-products.xml")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const blocked = guardCanonicalSitemapHost(request);
        if (blocked) return blocked;
        const entries: UrlEntry[] = [];
        try {
          const products = await fetchAllProductSlugs();
          for (const p of products) {
            entries.push({
              path: `/product/${p.handle}`,
              lastmod: p.updatedAt,
              changefreq: "weekly",
              priority: "0.7",
            });
          }
        } catch (e) {
          console.warn("[sitemap-products] fetch failed", e);
        }
        return sitemapResponse(renderSitemap(entries));
      },
    },
  },
});
