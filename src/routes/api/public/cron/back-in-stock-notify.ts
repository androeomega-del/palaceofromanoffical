// Cron endpoint: checks stock_alert_subscriptions and sends
// back-in-stock emails when items become available again.
// Expected to be called by an external cron service every 30 minutes.

import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { sendGmail } from "@/lib/gmail-send";
import { renderBackInStockEmail } from "@/lib/back-in-stock-email-template";
import { checkWebhookSecret } from "@/lib/webhook-secret";

export const Route = createFileRoute("/api/public/cron/back-in-stock-notify")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const unauthorized = checkWebhookSecret(request);
        if (unauthorized) return unauthorized;
        // Get pending subscriptions
        const { data: subs, error: subError } = await supabaseAdmin
          .from("stock_alert_subscriptions")
          .select("id, email, variant_gid, product_handle, product_title, variant_title, image_url, price_usd")
          .is("notified_at", null)
          .limit(100);

        if (subError) {
          console.error("[back-in-stock-cron] query failed:", subError.message);
          return new Response("DB error", { status: 500 });
        }

        if (!subs || subs.length === 0) {
          return Response.json({ ok: true, sent: 0, reason: "no_pending_subscriptions" });
        }

        // Check availability via shopify_variant_map
        const variantGids = subs.map((s) => s.variant_gid);
        const { data: availabilities } = await supabaseAdmin
          .from("shopify_variant_map")
          .select("variant_gid, available")
          .in("variant_gid", variantGids);

        const availableMap = new Map(
          (availabilities ?? []).map((a) => [a.variant_gid, a.available]),
        );

        let sent = 0;
        let failed = 0;

        for (const sub of subs) {
          const isAvailable = availableMap.get(sub.variant_gid);
          if (!isAvailable) continue;

          try {
            const { subject, html, text } = renderBackInStockEmail({
              firstName: null,
              productTitle: sub.product_title,
              variantTitle: sub.variant_title,
              productHandle: sub.product_handle,
              image: sub.image_url,
              price: sub.price_usd ?? "USD 0.00",
            });
            await sendGmail(sub.email, subject, html, text);

            await supabaseAdmin
              .from("stock_alert_subscriptions")
              .update({ notified_at: new Date().toISOString() })
              .eq("id", sub.id);

            sent++;
          } catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            console.error(`[back-in-stock-cron] send failed for ${sub.id}:`, msg);
            failed++;
          }
        }

        return Response.json({ ok: true, sent, failed, checked: subs.length });
      },
    },
  },
});
