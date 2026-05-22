import { createFileRoute } from "@tanstack/react-router";
import { fetchProductByHandle, fetchProducts } from "@/lib/shopify";

export const Route = createFileRoute("/api/public/ai/recommendations")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = await request.json().catch(() => ({}));
          const handle = body?.handle as string | undefined;
          let product = body?.product ?? null;
          if (!product && handle) product = await fetchProductByHandle(handle);
          if (!product) {
            return new Response(JSON.stringify({ error: "missing product handle or product data" }), {
              status: 400,
              headers: { "content-type": "application/json; charset=utf-8" },
            });
          }

          const vendor = (product.vendor || "").toString();
          const productType = (product.productType || "").toString();

          // Vendor-related items
          const related = (await fetchProducts({ first: 8, query: `vendor:${vendor}` }))
            .filter((e) => e.node.handle !== product.handle)
            .slice(0, 4);

          // Cross-vendor style picks
          const style = (await fetchProducts({ first: 16, query: `-vendor:\"${vendor}\"` }))
            .filter((e) => e.node.handle !== product.handle)
            .slice(0, 6);

          // Same product type alternatives
          const sameType = productType
            ? (await fetchProducts({ first: 8, query: `productType:${productType}` }))
                .filter((e) => e.node.handle !== product.handle)
                .slice(0, 4)
            : [];

          const picks = [...style.slice(0, 3), ...related.slice(0, 1), ...sameType.slice(0, 2)].slice(0, 6);

          function reasonFor(candidate: any) {
            try {
              if (product.productType && candidate.productType && product.productType !== candidate.productType) {
                return `Pairs ${product.productType.toLowerCase()} with ${candidate.productType.toLowerCase()} from ${candidate.vendor}`;
              }
              return `Recommended by style — ${candidate.vendor}`;
            } catch {
              return `Recommended`;
            }
          }

          const recommendations = picks.map((p) => ({ product: p.node, reason: reasonFor(p.node) }));

          return new Response(JSON.stringify({ recommendations }), {
            status: 200,
            headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
          });
        } catch (error) {
          console.error("[ai.recommendations] error:", error);
          return new Response(
            JSON.stringify({ error: "An internal error occurred" }),
            { status: 500, headers: { "content-type": "application/json; charset=utf-8" } },
          );
        }
      },
    },
  },
});
