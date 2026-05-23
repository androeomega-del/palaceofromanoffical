// Cron endpoint: regenerates the active homepage blueprint via the AI
// Creative Director. Scheduled by pg_cron every 48h. Also callable
// on-demand by the admin "Run now" button via the in-app server fn
// (which uses `regenerateHomepageLayout` — not this route).
//
// SECURITY: shared-secret/apikey via `checkWebhookSecret`.

import { createFileRoute } from "@tanstack/react-router";
import { checkWebhookSecret } from "@/lib/webhook-secret";
import { generateHomepageLayout } from "@/lib/homepage-layout-generator.server";
import { generateDynamicLandingPage } from "@/lib/landing-page-generator.server";

export const Route = createFileRoute("/api/public/cron/generate-homepage-layout")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const unauthorized = checkWebhookSecret(request);
        if (unauthorized) return unauthorized;

        // Run both generators independently. A failure in one never blocks
        // the other — and the previous active rows keep serving anyway
        // because both generators use stage-then-promote atomic swaps.
        const [homepage, landing] = await Promise.allSettled([
          generateHomepageLayout(),
          generateDynamicLandingPage(),
        ]);

        return Response.json({
          ok: true,
          homepage:
            homepage.status === "fulfilled"
              ? { ok: true, ...homepage.value }
              : { ok: false, error: (homepage.reason as Error)?.message ?? "unknown" },
          landing:
            landing.status === "fulfilled"
              ? landing.value
                ? { ok: true, ...landing.value }
                : { ok: true, skipped: "no qualifying signal" }
              : { ok: false, error: (landing.reason as Error)?.message ?? "unknown" },
        });
      },
    },
  },
});
