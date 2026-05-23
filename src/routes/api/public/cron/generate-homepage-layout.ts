// Cron endpoint: regenerates the active homepage blueprint via the AI
// Creative Director. Scheduled by pg_cron every 48h. Also callable
// on-demand by the admin "Run now" button via the in-app server fn
// (which uses `regenerateHomepageLayout` — not this route).
//
// SECURITY: shared-secret/apikey via `checkWebhookSecret`.

import { createFileRoute } from "@tanstack/react-router";
import { checkWebhookSecret } from "@/lib/webhook-secret";
import { generateHomepageLayout } from "@/lib/homepage-layout-generator.server";

export const Route = createFileRoute("/api/public/cron/generate-homepage-layout")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const unauthorized = checkWebhookSecret(request);
        if (unauthorized) return unauthorized;

        try {
          const result = await generateHomepageLayout();
          return Response.json({ ok: true, ...result });
        } catch (e) {
          console.error("[generate-homepage-layout] failed:", (e as Error).message);
          return new Response(
            JSON.stringify({ ok: false, error: (e as Error).message }),
            { status: 500, headers: { "Content-Type": "application/json" } },
          );
        }
      },
    },
  },
});
