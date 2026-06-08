/**
 * Master sitemap — single, consolidated XML feed.
 *
 * Replaces the previous sitemap-index pattern (sitemap-static,
 * sitemap-collections, sitemap-brands, sitemap-products,
 * sitemap-product-images, sitemap-destinations). All URLs — static
 * routes, Shopify collections, vendor/brand pages, product pages with
 * inline image entries, and vacation destinations — are emitted in
 * one <urlset>.
 */
import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { fetchCollections, storefrontApiRequest } from "@/lib/shopify";
import { canonicalCollectionHandle } from "@/lib/collection-canonical";
import { fetchActiveDestinations } from "@/lib/vacation-destinations.server";
import {
  SITE_URL,
  xmlEscape,
  guardCanonicalSitemapHost,
} from "@/lib/sitemap-xml";

const MAX_PRODUCTS = 5000;
const PRODUCT_PAGE_SIZE = 100;

const STATIC_ROUTES: Array<{
  path: string;
  changefreq?: string;
  priority?: string;
}> = [
  { path: "/", changefreq: "daily", priority: "1.0" },
  { path: "/shop", changefreq: "daily", priority: "0.9" },
  { path: "/collections", changefreq: "weekly", priority: "0.8" },
  { path: "/brands", changefreq: "weekly", priority: "0.7" },
  { path: "/designers", changefreq: "weekly", priority: "0.7" },
  { path: "/limited-finds", changefreq: "daily", priority: "0.8" },
  { path: "/style-quiz", changefreq: "monthly", priority: "0.5" },
  { path: "/swim", changefreq: "weekly", priority: "0.7" },
  { path: "/journal", changefreq: "weekly", priority: "0.6" },
  { path: "/links", changefreq: "monthly", priority: "0.4" },
  { path: "/in-rome", changefreq: "weekly", priority: "0.8" },
  { path: "/brand/dolce-gabbana/in-rome", changefreq: "weekly", priority: "0.7" },
  { path: "/brand/brunello-cucinelli/in-rome", changefreq: "weekly", priority: "0.7" },
  { path: "/brand/prada/in-rome", changefreq: "weekly", priority: "0.7" },
  { path: "/brand/versace/in-rome", changefreq: "weekly", priority: "0.7" },
  { path: "/brand/ferragamo/in-rome", changefreq: "weekly", priority: "0.7" },
  { path: "/brand/tom-ford/in-rome", changefreq: "weekly", priority: "0.7" },
  { path: "/brand/jacquemus/in-rome", changefreq: "weekly", priority: "0.7" },
  { path: "/brand/gucci/in-rome", changefreq: "weekly", priority: "0.7" },
  { path: "/brand/moncler/in-rome", changefreq: "weekly", priority: "0.7" },
  { path: "/brand/zegna/in-rome", changefreq: "weekly", priority: "0.7" },
  { path: "/men", changefreq: "weekly", priority: "0.8" },
  { path: "/women", changefreq: "weekly", priority: "0.8" },
  { path: "/about", changefreq: "monthly", priority: "0.5" },
  { path: "/authentication", changefreq: "monthly", priority: "0.5" },
  { path: "/shipping-returns", changefreq: "monthly", priority: "0.5" },
  { path: "/contact", changefreq: "monthly", priority: "0.5" },
  { path: "/faq", changefreq: "monthly", priority: "0.4" },
  { path: "/privacy", changefreq: "yearly", priority: "0.2" },
  { path: "/terms", changefreq: "yearly", priority: "0.2" },
  { path: "/legal-notice", changefreq: "yearly", priority: "0.2" },
  { path: "/editorial/may-2026", changefreq: "monthly", priority: "0.6" },
  { path: "/editorial/resort-2026", changefreq: "monthly", priority: "0.6" },
  { path: "/editorial/the-new-evening", changefreq: "monthly", priority: "0.6" },
  { path: "/editorial/summer-edit", changefreq: "monthly", priority: "0.6" },
  { path: "/editorial/mens-edit", changefreq: "monthly", priority: "0.6" },
  { path: "/editorial/womens-edit", changefreq: "monthly", priority: "0.6" },
  { path: "/editorial/versace", changefreq: "monthly", priority: "0.6" },
  { path: "/editorial/versace-now", changefreq: "monthly", priority: "0.6" },
  { path: "/editorial/accessories", changefreq: "monthly", priority: "0.6" },
  { path: "/editorial/shoreline-perspective", changefreq: "monthly", priority: "0.6" },
  { path: "/edits/yacht-edit", changefreq: "monthly", priority: "0.6" },
  { path: "/edits/the-prada-effect", changefreq: "monthly", priority: "0.6" },
  { path: "/edits/the-cucinelli-edit", changefreq: "monthly", priority: "0.6" },
  { path: "/edits/the-bag-vault", changefreq: "monthly", priority: "0.6" },
  { path: "/edits/dolce-romana", changefreq: "monthly", priority: "0.6" },
  { path: "/edits/charter-capsule", changefreq: "monthly", priority: "0.6" },
  { path: "/trends/tom-ford-essentials", changefreq: "monthly", priority: "0.6" },
  { path: "/trends/dolce-gabbana-icons", changefreq: "monthly", priority: "0.6" },
  { path: "/trends/pucci-eyewear", changefreq: "monthly", priority: "0.6" },
  { path: "/campaign/mens-swim", changefreq: "weekly", priority: "0.7" },
  { path: "/journal/craftsmanship/spot-real-italian-leather", changefreq: "monthly", priority: "0.7" },
  { path: "/journal/craftsmanship/made-in-italy-vs-designed-in-italy", changefreq: "monthly", priority: "0.7" },
  { path: "/journal/craftsmanship/caring-for-fine-leather", changefreq: "monthly", priority: "0.7" },
  { path: "/journal/craftsmanship/leather-quality-guide", changefreq: "monthly", priority: "0.7" },
  { path: "/journal/style/the-investment-sunglasses-edit", changefreq: "monthly", priority: "0.7" },
  { path: "/journal/style/luxury-sneakers-as-modern-tailoring", changefreq: "monthly", priority: "0.7" },
  { path: "/journal/style/the-cashmere-field-guide", changefreq: "monthly", priority: "0.7" },
  { path: "/collections/italian-leather-wallets", changefreq: "weekly", priority: "0.8" },
  { path: "/collections/italian-leather-loafers", changefreq: "weekly", priority: "0.8" },
  { path: "/collections/designer-mens-shirts", changefreq: "weekly", priority: "0.8" },
  { path: "/collections/italian-leather-handbags", changefreq: "weekly", priority: "0.8" },
  { path: "/collections/designer-sunglasses", changefreq: "weekly", priority: "0.8" },
  { path: "/collections/luxury-sneakers", changefreq: "weekly", priority: "0.8" },
  { path: "/collections/designer-belts", changefreq: "weekly", priority: "0.8" },
  { path: "/collections/cashmere-sweaters", changefreq: "weekly", priority: "0.8" },
  { path: "/collections/silk-scarves", changefreq: "weekly", priority: "0.8" },
  { path: "/collections/designer-crossbody-bags", changefreq: "weekly", priority: "0.8" },
  { path: "/maison", changefreq: "monthly", priority: "0.7" },
  { path: "/maison/brunello-cucinelli", changefreq: "monthly", priority: "0.8" },
  { path: "/maison/prada", changefreq: "monthly", priority: "0.8" },
  { path: "/maison/gucci", changefreq: "monthly", priority: "0.8" },
  { path: "/maison/bottega-veneta", changefreq: "monthly", priority: "0.8" },
  { path: "/maison/tom-ford", changefreq: "monthly", priority: "0.8" },
  { path: "/maison/dolce-gabbana", changefreq: "monthly", priority: "0.8" },
  { path: "/maison/ferragamo", changefreq: "monthly", priority: "0.8" },
  { path: "/preloved", changefreq: "weekly", priority: "0.8" },
  { path: "/preloved/pristine", changefreq: "weekly", priority: "0.7" },
  { path: "/preloved/excellent", changefreq: "weekly", priority: "0.7" },
  { path: "/women/ss26", changefreq: "weekly", priority: "0.7" },
  { path: "/men/ss26", changefreq: "weekly", priority: "0.7" },
  { path: "/vacation-stylist", changefreq: "monthly", priority: "0.6" },
  { path: "/trends/section-samples", changefreq: "monthly", priority: "0.3" },
  { path: "/designer-fashion-new-york", changefreq: "monthly", priority: "0.7" },
  { path: "/designer-fashion-los-angeles", changefreq: "monthly", priority: "0.7" },
  { path: "/designer-fashion-miami", changefreq: "monthly", priority: "0.7" },
  { path: "/designer-fashion-san-francisco", changefreq: "monthly", priority: "0.7" },
  { path: "/luxury-designer-fashion", changefreq: "weekly", priority: "0.8" },
];

const PRODUCTS_QUERY = `
  query AllProducts($first: Int!, $after: String) {
    products(first: $first, after: $after, sortKey: UPDATED_AT, reverse: true) {
      pageInfo { hasNextPage endCursor }
      edges {
        node {
          handle
          updatedAt
          vendor
          images(first: 20) { edges { node { url altText } } }
        }
      }
    }
  }
`;

interface ProductRow {
  handle: string;
  updatedAt: string;
  vendor: string;
  images: { url: string; altText: string | null }[];
}

async function fetchAllProducts(): Promise<ProductRow[]> {
  const out: ProductRow[] = [];
  let after: string | null = null;
  while (out.length < MAX_PRODUCTS) {
    const res: any = await storefrontApiRequest<any>(PRODUCTS_QUERY, {
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
        images: (e.node.images?.edges ?? []).map((ie: any) => ie.node),
      });
    }
    if (!page.pageInfo.hasNextPage) break;
    after = page.pageInfo.endCursor;
  }
  return out;
}

function renderUrl(
  loc: string,
  opts: { lastmod?: string; changefreq?: string; priority?: string; imageBlocks?: string } = {},
): string {
  return [
    `  <url>`,
    `    <loc>${xmlEscape(loc)}</loc>`,
    opts.lastmod ? `    <lastmod>${opts.lastmod}</lastmod>` : null,
    opts.changefreq ? `    <changefreq>${opts.changefreq}</changefreq>` : null,
    opts.priority ? `    <priority>${opts.priority}</priority>` : null,
    opts.imageBlocks || null,
    `  </url>`,
  ]
    .filter(Boolean)
    .join("\n");
}

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const blocked = guardCanonicalSitemapHost(request);
        if (blocked) return blocked;

        const urls: string[] = [];

        // Static routes
        for (const e of STATIC_ROUTES) {
          urls.push(
            renderUrl(`${SITE_URL}${e.path}`, {
              changefreq: e.changefreq,
              priority: e.priority,
            }),
          );
        }

        // Collections
        try {
          const collections = await fetchCollections(500);
          const seen = new Set<string>();
          for (const c of collections) {
            const canonical = canonicalCollectionHandle(c.handle);
            if (seen.has(canonical)) continue;
            seen.add(canonical);
            urls.push(
              renderUrl(`${SITE_URL}/collections/${canonical}`, {
                lastmod: c.updatedAt,
                changefreq: "daily",
                priority: "0.8",
              }),
            );
          }
        } catch (e) {
          console.warn("[sitemap] collections fetch failed", e);
        }

        // Products + brand vendor pages + inline image entries
        try {
          const products = await fetchAllProducts();
          const seenVendors = new Set<string>();
          for (const p of products) {
            const imageBlocks = p.images.length
              ? p.images
                  .filter((img) => img.url)
                  .map((img) =>
                    [
                      `    <image:image>`,
                      `      <image:loc>${xmlEscape(img.url)}</image:loc>`,
                      img.altText
                        ? `      <image:title>${xmlEscape(img.altText)}</image:title>`
                        : null,
                      `    </image:image>`,
                    ]
                      .filter(Boolean)
                      .join("\n"),
                  )
                  .join("\n")
              : undefined;

            urls.push(
              renderUrl(`${SITE_URL}/product/${p.handle}`, {
                lastmod: p.updatedAt,
                changefreq: "weekly",
                priority: "0.7",
                imageBlocks,
              }),
            );

            if (p.vendor) {
              const slug = p.vendor
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/(^-|-$)/g, "");
              if (slug && !seenVendors.has(slug)) {
                seenVendors.add(slug);
                urls.push(
                  renderUrl(`${SITE_URL}/brand/${slug}`, {
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

        // Vacation destinations
        try {
          const destinations = await fetchActiveDestinations();
          for (const d of destinations) {
            urls.push(
              renderUrl(`${SITE_URL}/vacation-stylist/${d.slug}`, {
                lastmod: d.updatedAt,
                changefreq: "weekly",
                priority: "0.7",
              }),
            );
          }
        } catch (e) {
          console.warn("[sitemap] destinations fetch failed", e);
        }

        const xml = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">`,
          ...urls,
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
