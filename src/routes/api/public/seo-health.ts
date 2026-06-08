import { createFileRoute } from "@tanstack/react-router";
import { fetchHomepageAndCheck } from "@/lib/seo-health";
import { checkWebhookSecret } from "@/lib/webhook-secret";

export const Route = createFileRoute("/api/public/seo-health")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const unauthorized = checkWebhookSecret(request);
        if (unauthorized) return unauthorized;
        try {
          const result = await fetchHomepageAndCheck();
          return new Response(JSON.stringify(result, null, 2), {
            status: result.ok ? 200 : 503,
            headers: {
              "content-type": "application/json; charset=utf-8",
              "cache-control": "no-store",
            },
          });
        } catch (error) {
          console.error("[seo-health] error:", error);
          return new Response(
            JSON.stringify({
              ok: false,
              error: "An internal error occurred",
              checkedAt: new Date().toISOString(),
            }),
            { status: 500, headers: { "content-type": "application/json" } },
          );
        }
      },
    },
  },
});
