// Shopify orders/create webhook → editorial post-purchase thank-you email.
//
// Security:
//   - Verifies the X-Shopify-Hmac-Sha256 header against SHOPIFY_WEBHOOK_SECRET
//     using a timing-safe comparison.
//   - Deduplicates on order id via the order_emails_sent table so retries
//     never trigger a second send.
//
// Sender: notify@palaceofromanofficial.com via the connected Gmail account.

import { createFileRoute } from "@tanstack/react-router";
import { createHmac, timingSafeEqual } from "crypto";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { sendGmail } from "@/lib/gmail-send";
import {
  renderPostPurchaseEmail,
  type OrderLineForEmail,
} from "@/lib/post-purchase-email-template";
import {
  generateStylistNote,
  createStyleVibeDiscount,
  type StylistNoteLine,
} from "@/lib/stylist-note.server";
import { renderStylistNoteEmail } from "@/lib/stylist-note-email-template";


interface ShopifyLineItem {
  title?: string | null;
  variant_title?: string | null;
  quantity?: number | null;
  price?: string | null;
  price_set?: { shop_money?: { amount?: string; currency_code?: string } };
  variant_id?: number | string | null;
  product_id?: number | string | null;
}

interface ShopifyOrder {
  id?: number | string;
  name?: string;
  email?: string | null;
  contact_email?: string | null;
  customer?: { first_name?: string | null; email?: string | null } | null;
  current_total_price?: string;
  total_price?: string;
  currency?: string;
  line_items?: ShopifyLineItem[];
}

// Resolve numeric Shopify variant ids → product handle via shopify_variant_map.
async function resolveHandles(
  items: ShopifyLineItem[],
): Promise<Map<string, string>> {
  const gids = items
    .map((li) => (li.variant_id ? `gid://shopify/ProductVariant/${li.variant_id}` : null))
    .filter((g): g is string => g !== null);
  if (gids.length === 0) return new Map();
  const { data } = await supabaseAdmin
    .from("shopify_variant_map")
    .select("variant_gid, product_handle")
    .in("variant_gid", gids);
  const map = new Map<string, string>();
  for (const r of data ?? []) {
    if (r.product_handle) map.set(r.variant_gid, r.product_handle);
  }
  return map;
}

function formatMoney(amount: string | undefined, currency: string | undefined): string {
  const n = Number(amount ?? 0);
  const cur = (currency || "USD").toUpperCase();
  return `${cur} ${n.toFixed(2)}`;
}

function toLines(order: ShopifyOrder): OrderLineForEmail[] {
  const cur = order.currency || "USD";
  return (order.line_items ?? []).map((li) => ({
    title: li.title ?? null,
    variant_title: li.variant_title ?? null,
    image: null, // Shopify webhook payload does not include image URLs
    price: formatMoney(li.price ?? li.price_set?.shop_money?.amount, cur),
    quantity: li.quantity ?? 1,
  }));
}

export const Route = createFileRoute("/api/public/hooks/shopify-order-created")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env.SHOPIFY_WEBHOOK_SECRET;
        if (!secret) {
          console.error("[shopify-order-created] SHOPIFY_WEBHOOK_SECRET missing");
          return new Response("Server not configured", { status: 500 });
        }

        const signature = request.headers.get("x-shopify-hmac-sha256");
        const body = await request.text();
        if (!signature) {
          return new Response("Missing signature", { status: 401 });
        }

        const expected = createHmac("sha256", secret).update(body, "utf8").digest("base64");
        let valid = false;
        try {
          const a = Buffer.from(signature);
          const b = Buffer.from(expected);
          valid = a.length === b.length && timingSafeEqual(a, b);
        } catch {
          valid = false;
        }
        if (!valid) {
          return new Response("Invalid signature", { status: 401 });
        }

        let order: ShopifyOrder;
        try {
          order = JSON.parse(body);
        } catch {
          return new Response("Invalid JSON", { status: 400 });
        }

        const orderId = order.id != null ? String(order.id) : null;
        const recipient = order.email || order.contact_email || order.customer?.email || null;
        if (!orderId || !recipient) {
          // Acknowledge so Shopify does not retry — nothing we can do.
          return new Response(JSON.stringify({ ok: true, skipped: "missing id or email" }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        }

        // Idempotency: claim this (order, email_type) row before sending.
        const { error: insertError } = await supabaseAdmin
          .from("order_emails_sent")
          .insert({
            order_id: orderId,
            email_type: "thank_you",
            recipient_email: recipient,
          });
        if (insertError) {
          // Unique-violation → already sent; ack and exit.
          if ((insertError as { code?: string }).code === "23505") {
            return new Response(JSON.stringify({ ok: true, deduped: true }), {
              status: 200,
              headers: { "Content-Type": "application/json" },
            });
          }
          console.error("[shopify-order-created] dedup insert failed:", insertError.message);
          return new Response("DB error", { status: 500 });
        }

        // Mark any abandoned cart for this customer as recovered.
        try {
          await supabaseAdmin
            .from("abandoned_carts")
            .update({ recovered_at: new Date().toISOString() })
            .eq("email", recipient)
            .is("recovered_at", null);
        } catch {
          // Non-blocking — recovery is best-effort.
        }

        try {
          const { subject, html, text } = renderPostPurchaseEmail({
            firstName: order.customer?.first_name ?? null,
            orderName: order.name || `#${orderId}`,
            total: formatMoney(
              order.current_total_price ?? order.total_price,
              order.currency,
            ),
            lines: toLines(order),
          });
          await sendGmail(recipient, subject, html, text);
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          console.error(`[shopify-order-created] send failed for ${orderId}:`, msg);
          // Roll back the dedup claim so a future retry can try again.
          await supabaseAdmin
            .from("order_emails_sent")
            .delete()
            .eq("order_id", orderId)
            .eq("email_type", "thank_you");
          return new Response("Send failed", { status: 500 });
        }

        // Enqueue T+10d review-request email. Best-effort — failures here
        // must not block the 200 response back to Shopify.
        try {
          const handleMap = await resolveHandles(order.line_items ?? []);
          const reviewLines = (order.line_items ?? [])
            .map((li) => {
              const gid = li.variant_id
                ? `gid://shopify/ProductVariant/${li.variant_id}`
                : null;
              const handle = gid ? handleMap.get(gid) : undefined;
              if (!handle || !li.title) return null;
              return { handle, title: li.title };
            })
            .filter((l): l is { handle: string; title: string } => l !== null);

          if (reviewLines.length > 0) {
            const runAfter = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString();
            await supabaseAdmin.from("growth_jobs").insert({
              job_type: "send_review_request",
              status: "pending",
              run_after: runAfter,
              max_attempts: 3,
              payload: {
                orderId,
                recipient,
                firstName: order.customer?.first_name ?? null,
                orderName: order.name || `#${orderId}`,
                lines: reviewLines,
              },
            });
          }
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          console.error(`[shopify-order-created] review enqueue failed for ${orderId}:`, msg);
        }

        return new Response(JSON.stringify({ ok: true, order_id: orderId }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      },
    },
  },
});
