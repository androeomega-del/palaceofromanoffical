import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/apps/seo-sitemaps/mwuwqi-vy/pages-sitemap.xml")({
  server: {
    handlers: {
      GET: async () =>
        Response.redirect("https://palaceofromanofficial.com/sitemap.xml", 301),
    },
  },
});
