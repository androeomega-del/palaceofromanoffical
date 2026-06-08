import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/sitemap-destinations.xml")({
  server: {
    handlers: {
      GET: async () =>
        Response.redirect("https://palaceofromanofficial.com/sitemap.xml", 301),
    },
  },
});
