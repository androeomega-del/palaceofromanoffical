import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { storefrontApiRequest } from "@/lib/shopify";
import { guardCanonicalSitemapHost, SITE_URL, xmlEscape, sitemapResponse } from "@/lib/sitemap-xml";

const MAX_PRODUCTS = 5000;
const PAGE_SIZE = 100;

const PRODUCT_IMAGES_QUERY = `
  query ProductImages($first: Int!, $after: String) {
    products(first: $first, after: $after, sortKey: UPDATED_AT, reverse: true) {
      pageInfo { hasNextPage endCursor }
      edges {
        node {
          handle
          updatedAt
          title
          images(first: 20) { edges { node { url altText } } }
        }
      }
    }
  }
`;

async function fetchAllProductsWithImages() {
  const out: Array<{ handle: string; updatedAt: string; title: string; images: { url: string; altText: string | null }[] }> = [];
  let after: string | null = null;
  while (out.length < MAX_PRODUCTS) {
    const res: any = await storefrontApiRequest<any>(PRODUCT_IMAGES_QUERY, {
      first: Math.min(PAGE_SIZE, MAX_PRODUCTS - out.length),
      after,
    });
    const page: any = res?.data?.products;
    if (!page) break;
    for (const e of page.edges as any[]) {
      out.push({
        handle: e.node.handle,
        updatedAt: e.node.updatedAt,
        title: e.node.title,
        images: (e.node.images?.edges ?? []).map((ie: any) => ie.node),
      });
    }
    if (!page.pageInfo.hasNextPage) break;
    after = page.pageInfo.endCursor;
  }
  return out;
}

export const Route = createFileRoute("/sitemap-product-images.xml")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const blocked = guardCanonicalSitemapHost(request);
        if (blocked) return blocked;

        const urls: string[] = [];
        try {
          const products = await fetchAllProductsWithImages();
          for (const p of products) {
            if (!p.images.length) continue;
            const imageBlocks = p.images
              .filter((img) => img.url)
              .map((img) =>
                [
                  `    <image:image>`,
                  `      <image:loc>${xmlEscape(img.url)}</image:loc>`,
                  img.altText ? `      <image:title>${xmlEscape(img.altText)}</image:title>` : null,
                  `    </image:image>`,
                ]
                  .filter(Boolean)
                  .join("\n"),
              )
              .join("\n");
            urls.push(
              [
                `  <url>`,
                `    <loc>${xmlEscape(`${SITE_URL}/product/${p.handle}`)}</loc>`,
                `    <lastmod>${p.updatedAt}</lastmod>`,
                imageBlocks,
                `  </url>`,
              ].join("\n"),
            );
          }
        } catch (e) {
          console.warn("[sitemap-product-images] fetch failed", e);
        }

        const xml = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">`,
          ...urls,
          `</urlset>`,
        ].join("\n");

        return sitemapResponse(xml);
      },
    },
  },
});
