import { createFileRoute } from "@tanstack/react-router";

const LEGACY_LOCALES = new Set(["es", "fr", "ja", "it", "de"]);

// Legacy locale-prefixed Shopify URLs (/es/products/<handle>, /fr/products/<handle>, …)
// → canonical /product/<handle>. Unknown locales fall through to a 404.
export const Route = createFileRoute("/$locale/products/$handle")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        if (!LEGACY_LOCALES.has(params.locale)) {
          return new Response("Not found", { status: 404 });
        }
        const handle = encodeURIComponent(params.handle);
        return new Response(null, {
          status: 301,
          headers: {
            Location: `/product/${handle}`,
            "Cache-Control": "public, max-age=86400",
          },
        });
      },
    },
  },
});
