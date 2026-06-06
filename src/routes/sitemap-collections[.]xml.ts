import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { fetchCollections } from "@/lib/shopify";
import { canonicalCollectionHandle } from "@/lib/collection-canonical";
import { renderSitemap, sitemapResponse, guardCanonicalSitemapHost, type UrlEntry } from "@/lib/sitemap-xml";

export const Route = createFileRoute("/sitemap-collections.xml")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const blocked = guardCanonicalSitemapHost(request);
        if (blocked) return blocked;
        const entries: UrlEntry[] = [];
        try {
          const collections = await fetchCollections(500);
          const seenHandles = new Set<string>();
          for (const c of collections) {
            const canonical = canonicalCollectionHandle(c.handle);
            if (seenHandles.has(canonical)) continue;
            seenHandles.add(canonical);
            entries.push({
              path: `/collections/${canonical}`,
              lastmod: c.updatedAt,
              changefreq: "daily",
              priority: "0.8",
            });
          }
        } catch (e) {
          console.warn("[sitemap-collections] fetch failed", e);
        }
        return sitemapResponse(renderSitemap(entries));
      },
    },
  },
});
