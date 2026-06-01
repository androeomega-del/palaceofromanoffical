import { createFileRoute } from "@tanstack/react-router";

// Legacy Shopify storefront URLs (/products/<handle>) → canonical /product/<handle>.
// Strips ?variant, ?country, ?currency, etc. Google follows 301 to the new URL;
// if the handle no longer exists, /product/<handle> serves a real 404.
export const Route = createFileRoute("/products/$handle")({
  server: {
    handlers: {
      GET: async ({ params }) => {
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
