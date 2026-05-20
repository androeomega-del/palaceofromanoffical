import { createFileRoute } from "@tanstack/react-router";
import { fetchHomepageAndCheck } from "@/lib/seo-health";

export const Route = createFileRoute("/api/public/seo-health")({
  server: {
    handlers: {
      GET: async () => {
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
          return new Response(
            JSON.stringify({
              ok: false,
              error: error instanceof Error ? error.message : String(error),
              checkedAt: new Date().toISOString(),
            }),
            { status: 500, headers: { "content-type": "application/json" } },
          );
        }
      },
    },
  },
});
