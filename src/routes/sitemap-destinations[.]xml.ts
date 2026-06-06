import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import {
  renderSitemap,
  sitemapResponse,
  guardCanonicalSitemapHost,
  type UrlEntry,
} from "@/lib/sitemap-xml";
import { fetchActiveDestinations } from "@/lib/vacation-destinations.server";

export const Route = createFileRoute("/sitemap-destinations.xml")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const blocked = guardCanonicalSitemapHost(request);
        if (blocked) return blocked;

        const destinations = await fetchActiveDestinations();
        const latest =
          destinations.reduce<string | undefined>((acc, d) => {
            if (!acc || d.updatedAt > acc) return d.updatedAt;
            return acc;
          }, undefined) ?? new Date().toISOString();

        const entries: UrlEntry[] = [
          {
            path: "/vacation-stylist",
            changefreq: "weekly",
            priority: "0.8",
            lastmod: latest,
          },
          ...destinations.map((d) => ({
            path: `/vacation-stylist/${d.slug}`,
            changefreq: "weekly" as const,
            priority: "0.7" as const,
            lastmod: d.updatedAt,
          })),
        ];

        return sitemapResponse(renderSitemap(entries));
      },
    },
  },
});
