import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/robots.txt")({
  server: {
    handlers: {
      GET: async () => {
        const body = `User-agent: *
Allow: /

Disallow: /cart
Disallow: /checkout
Disallow: /account
Disallow: /login
Disallow: /authentication
Disallow: /admin
Disallow: /admin/
Disallow: /api/
Disallow: /compare
Disallow: /wishlist
Disallow: /vault
Disallow: /order-confirmed
Disallow: /newsletter.confirm
Disallow: /preview
Disallow: /*?q=*

Sitemap: https://palaceofromanofficial.com/sitemap.xml
`;

        return new Response(body, {
          headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Cache-Control": "public, max-age=86400",
          },
        });
      },
    },
  },
});
