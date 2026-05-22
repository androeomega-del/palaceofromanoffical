// Cron-triggered cart recovery dispatcher.
//
// Called every 15 minutes by pg_cron via pg_net with the Supabase anon key
// in the `apikey` header. Bypass-auth route (under /api/public/*).
//
// Strategy: send ONE editorial recovery email per abandoned cart, between
// 1h and 24h after the last cart activity. Sender is the connected Gmail
// account (notify@palaceofromanofficial.com) via the connector gateway.

import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { checkWebhookSecret } from "@/lib/webhook-secret";

const GMAIL_GATEWAY = "https://connector-gateway.lovable.dev/google_mail/gmail/v1";
const FROM = "Palace of Roman <notify@palaceofromanofficial.com>";
const SITE = "https://palaceofromanofficial.com";

interface CartItem {
  handle: string | null;
  title: string | null;
  variant_title: string | null;
  image: string | null;
  price_usd: number;
  quantity: number;
}

interface AbandonedCart {
  id: string;
  session_id: string;
  email: string;
  items: CartItem[];
  total_usd: number;
  item_count: number;
  checkout_url: string | null;
  recovery_email_count: number;
  last_activity_at: string;
}

function b64url(s: string): string {
  return btoa(unescape(encodeURIComponent(s)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function escapeHtml(s: string | null): string {
  if (!s) return "";
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderItems(items: CartItem[]): string {
  return items
    .slice(0, 3)
    .map(
      (i) => `
      <tr>
        <td style="padding:12px 0;width:96px;vertical-align:top;">
          ${
            i.image
              ? `<img src="${escapeHtml(i.image)}" width="88" height="110" alt="" style="display:block;border:0;object-fit:cover;border-radius:2px;" />`
              : ""
          }
        </td>
        <td style="padding:12px 16px;vertical-align:top;font-family:'Cormorant Garamond',Georgia,serif;color:#1a1a1a;">
          <div style="font-size:18px;line-height:1.3;">${escapeHtml(i.title)}</div>
          ${i.variant_title ? `<div style="font-size:13px;color:#7a6a55;font-family:Karla,Helvetica,sans-serif;margin-top:4px;letter-spacing:0.04em;">${escapeHtml(i.variant_title)}</div>` : ""}
          <div style="font-size:14px;color:#1a1a1a;font-family:Karla,Helvetica,sans-serif;margin-top:8px;">USD ${i.price_usd.toFixed(2)}</div>
        </td>
      </tr>`,
    )
    .join("");
}

function renderEmail(cart: AbandonedCart): { subject: string; html: string; text: string } {
  const url = cart.checkout_url || `${SITE}/cart`;
  const subject = "Your selection at Palace of Roman";
  const itemsHtml = renderItems(cart.items);
  const more =
    cart.items.length > 3
      ? `<div style="font-family:Karla,Helvetica,sans-serif;font-size:13px;color:#7a6a55;padding:4px 0 16px;">and ${cart.items.length - 3} more</div>`
      : "";

  const html = `<!doctype html>
<html><body style="margin:0;padding:0;background:#f7f3ec;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f7f3ec;padding:48px 16px;">
    <tr><td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="background:#fffaf2;padding:48px 40px;max-width:560px;">
        <tr><td align="center" style="font-family:'Cormorant Garamond',Georgia,serif;font-size:14px;letter-spacing:0.4em;color:#7a6a55;text-transform:uppercase;padding-bottom:32px;">Palace of Roman</td></tr>
        <tr><td style="font-family:'Cormorant Garamond',Georgia,serif;font-size:28px;line-height:1.2;color:#1a1a1a;padding-bottom:16px;">Your selection awaits.</td></tr>
        <tr><td style="font-family:Karla,Helvetica,sans-serif;font-size:15px;line-height:1.7;color:#3a3328;padding-bottom:32px;">
          The pieces you set aside are still reserved for you. When you're ready, your selection is a moment away.
        </td></tr>
        <tr><td>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #e8dfc9;border-bottom:1px solid #e8dfc9;">
            ${itemsHtml}
          </table>
          ${more}
        </td></tr>
        <tr><td align="center" style="padding:40px 0 8px;">
          <a href="${escapeHtml(url)}" style="display:inline-block;background:#1a1a1a;color:#fffaf2;text-decoration:none;font-family:Karla,Helvetica,sans-serif;font-size:13px;letter-spacing:0.24em;text-transform:uppercase;padding:16px 36px;">Return to your selection</a>
        </td></tr>
        <tr><td align="center" style="font-family:Karla,Helvetica,sans-serif;font-size:12px;color:#9c8c70;padding:32px 0 0;line-height:1.6;">
          100% authentic. Sourced from the brands or their authorised distributors.<br/>
          <a href="${SITE}" style="color:#7a6a55;text-decoration:none;">palaceofromanofficial.com</a>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

  const text =
    `Your selection awaits.\n\nThe pieces you set aside are still reserved for you.\n\nReturn to your selection: ${url}\n\nPalace of Roman — ${SITE}\n`;
  return { subject, html, text };
}

function buildRfc2822(to: string, subject: string, html: string, text: string): string {
  const boundary = `por_${Date.now().toString(36)}`;
  return [
    `From: ${FROM}`,
    `To: ${to}`,
    `Subject: ${subject}`,
    `MIME-Version: 1.0`,
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    ``,
    `--${boundary}`,
    `Content-Type: text/plain; charset="UTF-8"`,
    `Content-Transfer-Encoding: 7bit`,
    ``,
    text,
    ``,
    `--${boundary}`,
    `Content-Type: text/html; charset="UTF-8"`,
    `Content-Transfer-Encoding: 7bit`,
    ``,
    html,
    ``,
    `--${boundary}--`,
    ``,
  ].join("\r\n");
}

async function sendGmail(to: string, subject: string, html: string, text: string) {
  const LOVABLE_API_KEY = process.env.LOVABLE_API_KEY;
  const GOOGLE_MAIL_API_KEY = process.env.GOOGLE_MAIL_API_KEY;
  if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");
  if (!GOOGLE_MAIL_API_KEY) throw new Error("GOOGLE_MAIL_API_KEY is not configured");

  const raw = b64url(buildRfc2822(to, subject, html, text));
  const res = await fetch(`${GMAIL_GATEWAY}/users/me/messages/send`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "X-Connection-Api-Key": GOOGLE_MAIL_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ raw }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Gmail send failed [${res.status}]: ${body.slice(0, 500)}`);
  }
  return res.json();
}

export const Route = createFileRoute("/api/public/hooks/dispatch-cart-recovery")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const unauthorized = checkWebhookSecret(request);
        if (unauthorized) return unauthorized;
        // Find carts that have been quiet for 1h-24h, have items, and have
        // not yet received a recovery email.
        const nowMs = Date.now();
        const oneHourAgo = new Date(nowMs - 60 * 60 * 1000).toISOString();
        const twentyFourHoursAgo = new Date(nowMs - 24 * 60 * 60 * 1000).toISOString();

        const { data: carts, error } = await supabaseAdmin
          .from("abandoned_carts")
          .select(
            "id, session_id, email, items, total_usd, item_count, checkout_url, recovery_email_count, last_activity_at",
          )
          .is("recovery_email_sent_at", null)
          .is("recovered_at", null)
          .gt("item_count", 0)
          .lte("last_activity_at", oneHourAgo)
          .gte("last_activity_at", twentyFourHoursAgo)
          .order("last_activity_at", { ascending: true })
          .limit(25);

        if (error) {
          console.error("[cart-recovery] query failed:", error.message);
          return new Response(JSON.stringify({ ok: false, error: "Internal error" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }

        const results: Array<{ id: string; sent: boolean; error?: string }> = [];
        for (const cart of (carts ?? []) as unknown as AbandonedCart[]) {
          try {
            const { subject, html, text } = renderEmail(cart);
            await sendGmail(cart.email, subject, html, text);
            await supabaseAdmin
              .from("abandoned_carts")
              .update({
                recovery_email_sent_at: new Date().toISOString(),
                recovery_email_count: cart.recovery_email_count + 1,
              })
              .eq("id", cart.id);
            await supabaseAdmin.from("email_dispatch_log").insert({
              template_name: "cart-recovery",
              recipient_email: cart.email,
              status: "sent",
              cart_id: cart.id,
              metadata: { item_count: cart.item_count, total_usd: cart.total_usd },
            });
            results.push({ id: cart.id, sent: true });
          } catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            console.error(`[cart-recovery] send failed for ${cart.id}:`, msg);
            await supabaseAdmin.from("email_dispatch_log").insert({
              template_name: "cart-recovery",
              recipient_email: cart.email,
              status: "failed",
              error_message: msg.slice(0, 2000),
              cart_id: cart.id,
              metadata: { item_count: cart.item_count, total_usd: cart.total_usd },
            });
            results.push({ id: cart.id, sent: false, error: msg });
          }
        }

        return new Response(
          JSON.stringify({ ok: true, processed: results.length, results }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      },
    },
  },
});
