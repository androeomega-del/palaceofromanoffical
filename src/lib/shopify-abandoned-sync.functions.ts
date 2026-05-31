import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin-middleware";
import { syncShopifyAbandonedCheckoutsImpl } from "@/lib/shopify-abandoned-sync.server";

export const syncShopifyAbandonedCheckouts = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator(
    (input: { days?: number } | undefined) =>
      z
        .object({ days: z.number().int().min(1).max(90).optional() })
        .parse(input ?? {}),
  )
  .handler(async ({ data }) => {
    return syncShopifyAbandonedCheckoutsImpl({ days: data.days });
  });
