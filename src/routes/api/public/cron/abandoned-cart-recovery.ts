// Cron endpoint: sends cart-abandonment recovery emails.
// Expected to be called by an external cron service every hour.
//
// Logic:
//   1. Find abandoned_carts that are > 1 hour old, not recovered,
//      and have fewer than 3 recovery emails sent.
//   2. Send a curated recovery email via Gmail.
//   3. Update recovery_email_sent_at and increment count.

import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { sendGmail } from "@/lib/gmail-send";
import { renderCartAbandonmentEmail } from "@/lib/cart-abandonment-email-template";

const EUR_TO_USD = 1.08;

function priceMoney(centsEur: number | null): string {
  const usd = (centsEur ?? 1) * EUR_TO_USD;
  return `USD ${usd.toFixed(2)}`;
}

export const Route = createFileRoute("/api/public/cron/abandoned-cart-recovery")({
  server: {
    handlers: {
      POST: async () => {
        const { data: carts, error } = await supabaseAdmin
          .from("abandoned_carts")
          .select("id, email, customer_name, items, total_usd, checkout_url, recovery_email_count, recovery_email_sent_at")
          .is("recovered_at", null)
          .lt("recovery_email_count", 3)
          .or(
            `recovery_email_sent_at.lt.${new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()},recovery_email_sent_at.is.null`,
          )
          .lt("created_at", new Date(Date.now() - 60 * 60 * 1000).toISOString())
          .order("created_at", { ascending: false })
          .limit(50);

        if (error) {
          console.error("[abandoned-cart-cron] query failed:", error.message);
          return new Response("DB error", { status: 500 });
        }

        let sent = 0;
        let failed =  0;

        for (const cart of (carts ?? [])) {
          const rawItems = (cart.items ?? []) as any[];
          const lines = rawItems.map((item) => ({
            title: item.title ?? "Item",
            variant: item.variant_title ?? null,
            image: item.image ?? null,
            price: priceMoney(item.price_usd ? Math.round(item.price_usd * 100) : null),
            quantity: item.quantity ?? 1,
          }));

          const totalStr = cart.total_usd != null
            ? `USD ${Number(cart.total_usd).toFixed(2)}`
            : "USD 0.00";

          try {
            const { subject, html, text } = renderCartAbandonmentEmail({
              firstName: cart.customer_name ?? null,
              lines,
              total: totalStr,
              checkoutUrl: cart.checkout_url ?? null,
            });
            await sendGmail(cart.email, subject, html, text);

            await supabaseAdmin
              .from("abandoned_carts")
              .update({
                recovery_email_sent_at: new Date().toISOString(),
                recovery_email_count: (cart.recovery_email_count ?? 1) + 1,
              })
              .eq("id", cart.id);

            sent++;
          } catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            console.error(`[abandoned-cart-cron] send failed for ${cart.id}:`, msg);
            failed++;
          }
        }

        return Response.json({ ok: true, sent, failed, checked: (carts ?? []).length });
      },
    },
  },
});
