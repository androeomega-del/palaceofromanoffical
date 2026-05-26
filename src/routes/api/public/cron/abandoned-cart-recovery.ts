// Cron endpoint: sends cart-abandonment recovery emails.
// Single source of truth for the cart-recovery workflow.
// Scheduled hourly via pg_cron.
//
// Cadence (measured from last_activity_at, per spec):
//   • Email 1 — +1h   (variant 1: soft reminder)
//   • Email 2 — +24h  (variant 2: concierge offer, no discount)
//   • Email 3 — +72h  (variant 3: scarcity close, no discount)
//
// The next email for a given cart is gated by:
//   recovery_email_count + last_activity_at age >= threshold

import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { sendGmail } from "@/lib/gmail-send";
import { renderCartAbandonmentEmail } from "@/lib/cart-abandonment-email-template";
import { checkWebhookSecret } from "@/lib/webhook-secret";

const HOUR_MS = 60 * 60 * 1000;
const THRESHOLDS_MS = [1 * HOUR_MS, 24 * HOUR_MS, 72 * HOUR_MS];

export const Route = createFileRoute("/api/public/cron/abandoned-cart-recovery")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const unauthorized = checkWebhookSecret(request);
        if (unauthorized) return unauthorized;

        const now = Date.now();
        // Pull anything not yet at 3 sends, not recovered, with items, that
        // last moved at least 1h ago. Per-cart cadence is enforced in JS.
        const { data: carts, error } = await supabaseAdmin
          .from("abandoned_carts")
          .select(
            "id, email, customer_name, items, total_usd, item_count, checkout_url, recovery_email_count, last_activity_at",
          )
          .is("recovered_at", null)
          .gt("item_count", 0)
          .lt("recovery_email_count", 3)
          .lte("last_activity_at", new Date(now - THRESHOLDS_MS[0]).toISOString())
          .order("last_activity_at", { ascending: true })
          .limit(100);

        if (error) {
          console.error("[cart-recovery] query failed:", error.message);
          return new Response("DB error", { status: 500 });
        }

        let sent = 0;
        let failed = 0;
        let skipped = 0;

        for (const cart of carts ?? []) {
          const count = cart.recovery_email_count ?? 0;
          if (count >= 3) {
            skipped++;
            continue;
          }
          const threshold = THRESHOLDS_MS[count];
          const lastActivity = new Date(cart.last_activity_at).getTime();
          if (now - lastActivity < threshold) {
            skipped++;
            continue;
          }

          const variant = (count + 1) as 1 | 2 | 3;
          const rawItems = (cart.items ?? []) as Array<{
            title?: string;
            variant_title?: string | null;
            image?: string | null;
            price_usd?: number;
            quantity?: number;
          }>;
          const lines = rawItems.map((item) => ({
            title: item.title ?? "Item",
            variant: item.variant_title ?? null,
            image: item.image ?? null,
            price: `USD ${Number(item.price_usd ?? 0).toFixed(2)}`,
            quantity: item.quantity ?? 1,
          }));

          const totalStr =
            cart.total_usd != null
              ? `USD ${Number(cart.total_usd).toFixed(2)}`
              : "USD 0.00";

          try {
            const { subject, html, text } = renderCartAbandonmentEmail({
              firstName: cart.customer_name ?? null,
              lines,
              total: totalStr,
              checkoutUrl: cart.checkout_url ?? null,
              variant,
            });
            await sendGmail(cart.email, subject, html, text);

            await supabaseAdmin
              .from("abandoned_carts")
              .update({
                recovery_email_sent_at: new Date().toISOString(),
                recovery_email_count: count + 1,
              })
              .eq("id", cart.id);

            await supabaseAdmin.from("email_dispatch_log").insert({
              template_name: `cart-recovery-${variant}`,
              recipient_email: cart.email,
              status: "sent",
              cart_id: cart.id,
              metadata: { variant, item_count: cart.item_count, total_usd: cart.total_usd },
            });

            sent++;
          } catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            console.error(`[cart-recovery] send failed for ${cart.id}:`, msg);
            await supabaseAdmin.from("email_dispatch_log").insert({
              template_name: `cart-recovery-${variant}`,
              recipient_email: cart.email,
              status: "failed",
              error_message: msg.slice(0, 2000),
              cart_id: cart.id,
              metadata: { variant },
            });
            failed++;
          }
        }

        return Response.json({
          ok: true,
          checked: (carts ?? []).length,
          sent,
          failed,
          skipped,
        });
      },
    },
  },
});
