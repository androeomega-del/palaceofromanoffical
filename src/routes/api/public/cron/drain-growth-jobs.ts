// Cron endpoint: drains the `growth_jobs` queue.
//
// AUDIT: returns only counts + per-job ids/types/error-strings. No PII.
// SECURITY: shared-secret header via `checkWebhookSecret` (SYNC_WEBHOOK_SECRET).
//   Called every 5 min by pg_cron + on-demand by the admin "Run queue now"
//   button (which uses the in-app `drainGrowthJobsNow` server fn — not this
//   route).

import { createFileRoute } from "@tanstack/react-router";
import { checkWebhookSecret } from "@/lib/webhook-secret";
import { drainGrowthJobs } from "@/lib/growth-jobs-worker.server";

export const Route = createFileRoute("/api/public/cron/drain-growth-jobs")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const unauthorized = checkWebhookSecret(request);
        if (unauthorized) return unauthorized;

        try {
          const result = await drainGrowthJobs({ batchSize: 25 });
          return Response.json({ ok: true, ...result });
        } catch (e) {
          console.error("[drain-growth-jobs] failed:", (e as Error).message);
          return new Response(JSON.stringify({ ok: false, error: "Internal error" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
    },
  },
});
