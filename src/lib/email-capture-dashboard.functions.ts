import { createServerFn } from "@tanstack/react-start";
import { requireAdmin } from "@/lib/admin-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const DAY = 24 * 60 * 60 * 1000;

function pct(num: number, denom: number): number {
  if (denom <= 0) return 0;
  return Number(((num / denom) * 100).toFixed(1));
}

export const getEmailCaptureDashboard = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .handler(async () => {
    const now = Date.now();
    const since30d = new Date(now - 30 * DAY).toISOString();
    const since7d = new Date(now - 7 * DAY).toISOString();

    // ---------- Stock alerts ----------
    const { data: alertsRaw } = await supabaseAdmin
      .from("stock_alert_subscriptions")
      .select(
        "id, email, product_handle, product_title, variant_title, notified_at, created_at"
      )
      .order("created_at", { ascending: false })
      .limit(1000);
    const alerts = alertsRaw ?? [];
    const alertsTotal = alerts.length;
    const alerts7d = alerts.filter((a) => a.created_at >= since7d).length;
    const alerts30d = alerts.filter((a) => a.created_at >= since30d).length;
    const alertsNotified = alerts.filter((a) => a.notified_at).length;
    const alertsPending = alertsTotal - alertsNotified;
    const uniqueAlertEmails = new Set(alerts.map((a) => a.email.toLowerCase()))
      .size;

    // ---------- Newsletter / exit-intent ----------
    const { data: subsRaw } = await supabaseAdmin
      .from("newsletter_subscribers")
      .select("id, email, source, marketing_consent, created_at")
      .order("created_at", { ascending: false })
      .limit(2000);
    const subs = subsRaw ?? [];
    const subsTotal = subs.length;
    const subs7d = subs.filter((s) => s.created_at >= since7d).length;
    const subs30d = subs.filter((s) => s.created_at >= since30d).length;
    const optedIn = subs.filter((s) => s.marketing_consent).length;

    const sourceMap = new Map<string, number>();
    for (const s of subs) {
      const key = (s.source ?? "unknown").toLowerCase();
      sourceMap.set(key, (sourceMap.get(key) ?? 0) + 1);
    }
    const bySource = Array.from(sourceMap.entries())
      .map(([source, count]) => ({ source, count }))
      .sort((a, b) => b.count - a.count);

    const isExitIntent = (s: string | null | undefined) =>
      !!s && /exit|stylist|atelier/i.test(s);
    const exitIntentTotal = subs.filter((s) => isExitIntent(s.source)).length;
    const exitIntent7d = subs.filter(
      (s) => isExitIntent(s.source) && s.created_at >= since7d
    ).length;

    // ---------- Abandoned carts ----------
    const { data: cartsRaw } = await supabaseAdmin
      .from("abandoned_carts")
      .select(
        "id, email, total_usd, item_count, recovery_email_sent_at, recovery_email_count, recovered_at, last_activity_at, created_at"
      )
      .order("created_at", { ascending: false })
      .limit(1000);
    const carts = cartsRaw ?? [];
    const cartsTotal = carts.length;
    const carts7d = carts.filter((c) => c.created_at >= since7d).length;
    const cartsEmailed = carts.filter((c) => c.recovery_email_sent_at).length;
    const cartsRecovered = carts.filter((c) => c.recovered_at).length;
    const cartsEligibleNow = carts.filter((c) => {
      if (c.recovery_email_sent_at || c.recovered_at) return false;
      const age = now - new Date(c.last_activity_at).getTime();
      return (
        age >= 60 * 60 * 1000 && age <= 24 * DAY && (c.item_count ?? 0) > 0
      );
    }).length;
    const recoveredValue = carts
      .filter((c) => c.recovered_at)
      .reduce((s, c) => s + Number(c.total_usd || 0), 0);

    // ---------- Dispatch log ----------
    const { data: dispatchRaw } = await supabaseAdmin
      .from("email_dispatch_log")
      .select(
        "id, template_name, recipient_email, status, error_message, created_at"
      )
      .gte("created_at", since30d)
      .order("created_at", { ascending: false })
      .limit(1000);
    const dispatch = dispatchRaw ?? [];

    type TemplateAgg = {
      template: string;
      sent: number;
      failed: number;
      total: number;
    };
    const templateMap = new Map<string, TemplateAgg>();
    for (const d of dispatch) {
      const key = d.template_name || "unknown";
      const cur =
        templateMap.get(key) ??
        { template: key, sent: 0, failed: 0, total: 0 };
      cur.total += 1;
      if (d.status === "sent") cur.sent += 1;
      else if (d.status === "failed") cur.failed += 1;
      templateMap.set(key, cur);
    }
    const byTemplate = Array.from(templateMap.values()).sort(
      (a, b) => b.total - a.total
    );

    const sent7d = dispatch.filter(
      (d) => d.status === "sent" && d.created_at >= since7d
    ).length;
    const failed7d = dispatch.filter(
      (d) => d.status === "failed" && d.created_at >= since7d
    ).length;
    const recentFailures = dispatch
      .filter((d) => d.status === "failed")
      .slice(0, 15);
    const recentSends = dispatch.slice(0, 30);

    return {
      generatedAt: new Date().toISOString(),
      stockAlerts: {
        total: alertsTotal,
        last7d: alerts7d,
        last30d: alerts30d,
        notified: alertsNotified,
        pending: alertsPending,
        uniqueEmails: uniqueAlertEmails,
        notifyRate: pct(alertsNotified, alertsTotal),
        recent: alerts.slice(0, 20),
      },
      newsletter: {
        total: subsTotal,
        last7d: subs7d,
        last30d: subs30d,
        optedIn,
        optInRate: pct(optedIn, subsTotal),
        bySource,
        exitIntent: {
          total: exitIntentTotal,
          last7d: exitIntent7d,
          share: pct(exitIntentTotal, subsTotal),
        },
        recent: subs.slice(0, 20),
      },
      abandonedCarts: {
        total: cartsTotal,
        last7d: carts7d,
        emailed: cartsEmailed,
        recovered: cartsRecovered,
        eligibleNow: cartsEligibleNow,
        recoveredValueUsd: Number(recoveredValue.toFixed(2)),
        captureToEmailRate: pct(cartsEmailed, cartsTotal),
        recoveryRate: pct(cartsRecovered, cartsEmailed),
        overallConversion: pct(cartsRecovered, cartsTotal),
      },
      dispatch: {
        total: dispatch.length,
        sent7d,
        failed7d,
        byTemplate,
        recentFailures,
        recentSends,
      },
    };
  });
