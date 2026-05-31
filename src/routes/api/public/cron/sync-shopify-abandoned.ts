// Cron endpoint: pulls Shopify abandoned checkouts (last 30 days) into the
// `abandoned_carts` table so they show up in the admin dashboard and flow
// through the existing recovery-email cadence.
//
// Schedule hourly via pg_cron.

import { createFileRoute } from "@tanstack/react-router";
import { checkWebhookSecret } from "@/lib/webhook-secret";
import { syncShopifyAbandonedCheckoutsImpl } from "@/lib/shopify-abandoned-sync.server";

export const Route = createFileRoute("/api/public/cron/sync-shopify-abandoned")(
  {
    server: {
      handlers: {
        POST: async ({ request }) => {
          const unauthorized = checkWebhookSecret(request);
          if (unauthorized) return unauthorized;
          const result = await syncShopifyAbandonedCheckoutsImpl({ days: 30 });
          return Response.json(result, {
            status: result.ok ? 200 : 500,
          });
        },
      },
    },
  },
);
