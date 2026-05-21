// Cron endpoint: sends win-back re-engagement emails to customers
// who have not purchased in 60+ days.
// Expected to be called by an external cron service daily.
//
// Data-driven recommendations: picks 3 random in-stock products from bg_products.

import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { sendGmail } from "@/lib/gmail-send";
import { renderWinBackEmail } from "@/lib/win-back-email-template";

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
    title: p.name,
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
        // Find customers whose last thank-you email was 60+ days ago
        // and who have not received a win-back email yet.
        const cutoff = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString();

        const { data: lapsed, error } = await supabaseAdmin.rpc("get_lapsed_customers", {
          cutoff_date: cutoff,
        });

        if (error) {
          console.error("[win-back-cron] query failed:", error.message);
          return new Response("DB error", { status: 500 });
        }

        const recommendations = await getRecommendations();
        if (recommendations.length ===  0) {
          return Response.json({ ok: true, sent: 0, reason: "no_recommendations" });
        }

        let sent = 0;
        let failed = 0;

        const rows = (lapsed ?? []) as { recipient_email: string; last_order_date: string | null; first_name: string | null }[];

        for (const row of rows.slice(0, 50)) {
          try {
            const { subject, html, text } = renderWinBackEmail({
              firstName: row.first_name,
              recommendations,
              lastOrderDate: row.last_order_date,
            });
            await sendGmail(row.recipient_email, subject, html, text);

            await supabaseAdmin.from("win_back_emails_sent").insert({
              recipient_email: row.recipient_email,
              recommendation_handles: recommendations.map((r) => r.handle),
            });

            sent++;
          } catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            console.error(`[win-back-cron] send failed for ${row.recipient_email}:`, msg);
            failed++;
          }
        }

        return Response.json({ ok: true, sent, failed, checked: rows.length });
      },
    },
  },
});
