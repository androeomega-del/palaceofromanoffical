import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import {
  renderSitemap,
  sitemapResponse,
  guardCanonicalSitemapHost,
  type UrlEntry,
} from "@/lib/sitemap-xml";
import { listVacationDestinations } from "@/lib/vacation-destinations";

export const Route = createFileRoute("/sitemap-destinations.xml")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const blocked = guardCanonicalSitemapHost(request);
        if (blocked) return blocked;

        const destinations = listVacationDestinations();
        const entries: UrlEntry[] = [
          { path: "/vacation-stylist", changefreq: "weekly", priority: "0.8" },
          ...destinations.map((d) => ({
            path: `/vacation-stylist/${d.slug}`,
            changefreq: "weekly" as const,
            priority: "0.7" as const,
          })),
        ];

        return sitemapResponse(renderSitemap(entries));
      },
    },
  },
});
