import { createFileRoute } from "@tanstack/react-router";
import { checkWebhookSecret } from "@/lib/webhook-secret";
import { runDailyMonitor } from "@/lib/gsc-monitor.server";

export const Route = createFileRoute("/api/public/hooks/gsc-daily-monitor")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const unauthorized = checkWebhookSecret(request);
        if (unauthorized) return unauthorized;
        try {
          const result = await runDailyMonitor();
          return new Response(JSON.stringify(result), {
            headers: { "Content-Type": "application/json" },
          });
        } catch (e) {
          console.error("[gsc-daily-monitor] failed", e);
          return new Response(
            JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
            { status: 500, headers: { "Content-Type": "application/json" } },
          );
        }
      },
    },
  },
});
