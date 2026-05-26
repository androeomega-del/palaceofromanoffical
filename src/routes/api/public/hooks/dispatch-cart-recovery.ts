// Deprecated. The cart-recovery workflow now lives entirely in
// /api/public/cron/abandoned-cart-recovery, scheduled hourly by pg_cron
// with the +1h / +24h / +72h cadence.
//
// This stub remains so any external caller still hitting the old URL gets
// a clean 410 instead of a 404, and so the route file is not silently
// removed from history.

import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/hooks/dispatch-cart-recovery")({
  server: {
    handlers: {
      POST: async () => {
        return Response.json(
          {
            ok: false,
            deprecated: true,
            replacement: "/api/public/cron/abandoned-cart-recovery",
          },
          { status: 410 },
        );
      },
    },
  },
});
