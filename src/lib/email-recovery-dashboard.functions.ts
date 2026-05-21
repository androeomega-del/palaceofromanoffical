import { createServerFn } from "@tanstack/react-start";
import { requireAdmin } from "@/lib/admin-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const getEmailRecoveryDashboard = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .handler(async () => {
    const now = Date.now();
    const since30d = new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString();
    const since7d = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString();

    // Cart recovery funnel (last 30 days)
    const { data: carts } = await supabaseAdmin
      .from("abandoned_carts")
      .select("id, email, total_usd, item_count, recovery_email_sent_at, recovered_at, last_activity_at, created_at")
      .gte("created_at", since30d)
      .order("last_activity_at", { ascending: false })
      .limit(1000);

    const cartsList = carts ?? [];
    const totalCarts = cartsList.length;
    const emailsSent = cartsList.filter((c) => c.recovery_email_sent_at).length;
    const recovered = cartsList.filter((c) => c.recovered_at).length;
    const eligibleNow = cartsList.filter((c) => {
      if (c.recovery_email_sent_at || c.recovered_at) return false;
      const age = now - new Date(c.last_activity_at).getTime();
      return age >= 60 * 60 * 1000 && age <= 24 * 60 * 60 * 1000 && (c.item_count ?? 0) > 0;
    }).length;
    const recoveredValue = cartsList
      .filter((c) => c.recovered_at)
      .reduce((s, c) => s + Number(c.total_usd || 0), 0);
    const recoveryRate = emailsSent > 0 ? (recovered / emailsSent) * 100 : 0;

    // Dispatch log
    const { data: dispatchRows } = await supabaseAdmin
      .from("email_dispatch_log")
      .select("id, template_name, recipient_email, status, error_message, cart_id, created_at")
      .gte("created_at", since30d)
      .order("created_at", { ascending: false })
      .limit(500);

    const dispatch = dispatchRows ?? [];
    const sentCount = dispatch.filter((d) => d.status === "sent").length;
    const failedCount = dispatch.filter((d) => d.status === "failed").length;
    const sentLast7d = dispatch.filter(
      (d) => d.status === "sent" && d.created_at >= since7d
    ).length;
    const failedLast7d = dispatch.filter(
      (d) => d.status === "failed" && d.created_at >= since7d
    ).length;
    const recentErrors = dispatch.filter((d) => d.status === "failed").slice(0, 20);
    const recentSends = dispatch.slice(0, 30);

    // Newsletter / opt-in stats
    const { data: subscribers } = await supabaseAdmin
      .from("newsletter_subscribers")
      .select("id, email, source, marketing_consent, created_at")
      .order("created_at", { ascending: false })
      .limit(1000);

    const subs = subscribers ?? [];
    const totalSubs = subs.length;
    const optedIn = subs.filter((s) => s.marketing_consent).length;
    const optedOut = totalSubs - optedIn;
    const optInRate = totalSubs > 0 ? (optedIn / totalSubs) * 100 : 0;
    const subsLast7d = subs.filter((s) => s.created_at >= since7d).length;
    const subsLast30d = subs.filter((s) => s.created_at >= since30d).length;

    return {
      generatedAt: new Date().toISOString(),
      cartRecovery: {
        totalCarts,
        emailsSent,
        recovered,
        eligibleNow,
        recoveredValueUsd: Number(recoveredValue.toFixed(2)),
        recoveryRate: Number(recoveryRate.toFixed(1)),
      },
      dispatch: {
        sentCount,
        failedCount,
        sentLast7d,
        failedLast7d,
        recentErrors,
        recentSends,
      },
      newsletter: {
        totalSubs,
        optedIn,
        optedOut,
        optInRate: Number(optInRate.toFixed(1)),
        subsLast7d,
        subsLast30d,
      },
    };
  });
