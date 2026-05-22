// Cron endpoint: sends win-back re-engagement emails to customers
// who have not purchased in 60+ days.
// Expected to be called by an external cron service daily.
//
// Data-driven recommendations: picks 3 random in-stock products from bg_products.

import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { sendGmail } from "@/lib/gmail-send";
import { renderWinBackEmail } from "@/lib/win-back-email-template";
import { checkWebhookSecret } from "@/lib/webhook-secret";

const EUR_TO_USD = 1.08;

function formatPrice(centsEur: number | null): string {
  const usd = (centsEur ?? 1) * EUR_TO_USD;
  return `USD ${usd.toFixed(2)}`;
}

async function getRecommendations(): Promise<
  { title: string; handle: string; image: string | null; price: string; vendor: string | null }[]
> {
  const { data: products } = await supabaseAdmin
    .from("bg_products")
    .select("name, handle, main_picture, retail_price, brand")
    .not("main_picture", "is", null)
    .gt("retail_price", 0)
    .limit(200);

  const pool = (products ?? []).filter((p) => p.handle && p.name);
  if (pool.length === 0) return [];

  // Shuffle and pick 3
  const shuffled = pool.sort(() => Math.random() - 0.5);
  const picked = shuffled.slice(0, 3);

  return picked.map((p) => ({
    title: p.name ?? "Piece",
    handle: p.handle,
    image: p.main_picture,
    price: formatPrice(p.retail_price),
    vendor: p.brand ?? null,
  }));
}

export const Route = createFileRoute("/api/public/cron/win-back-emails")({
  server: {
    handlers: {
      POST: async () => {
        const cutoff = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString();

        // 1. Get all thank-you emails older than cutoff.
        const { data: oldOrders, error: q1 } = await supabaseAdmin
          .from("order_emails_sent")
          .select("recipient_email, sent_at")
          .eq("email_type", "thank_you")
          .lt("sent_at", cutoff)
          .order("sent_at", { ascending: false });

        if (q1) {
          console.error("[win-back-cron] query failed:", q1.message);
          return new Response("DB error", { status: 500 });
        }

        // 2. Keep most recent per email.
        const latestByEmail = new Map<string, string>();
        for (const o of (oldOrders ?? [])) {
          if (!o.recipient_email || !o.sent_at) continue;
          if (!latestByEmail.has(o.recipient_email)) {
            latestByEmail.set(o.recipient_email, o.sent_at);
          }
        }

        // 3. Exclude emails already sent a win-back.
        const { data: alreadySent } = await supabaseAdmin
          .from("win_back_emails_sent")
          .select("recipient_email");
        const sentSet = new Set((alreadySent ?? []).map((r) => r.recipient_email));

        const candidates: { email: string; lastOrderDate: string | null }[] = [];
        for (const [email, sentAt] of latestByEmail) {
          if (!sentSet.has(email)) {
            const d = new Date(sentAt);
            candidates.push({
              email,
              lastOrderDate: d.toLocaleDateString("en-US", { month: "long", year: "numeric" }),
            });
          }
        }

        const recommendations = await getRecommendations();
        if (recommendations.length === 0) {
          return Response.json({ ok: true, sent: 0, reason: "no_recommendations" });
        }

        let sent = 0;
        let failed = 0;

        for (const c of candidates.slice(0, 50)) {
          try {
            const { subject, html, text } = renderWinBackEmail({
              firstName: null,
              recommendations,
              lastOrderDate: c.lastOrderDate,
            });
            await sendGmail(c.email, subject, html, text);

            await supabaseAdmin.from("win_back_emails_sent").insert({
              recipient_email: c.email,
              recommendation_handles: recommendations.map((r) => r.handle),
            });

            sent++;
          } catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            console.error(`[win-back-cron] send failed for ${c.email}:`, msg);
            failed++;
          }
        }

        return Response.json({ ok: true, sent, failed, checked: candidates.length });
      },
    },
  },
});
