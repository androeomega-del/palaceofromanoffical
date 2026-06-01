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
      .select(
        "id, session_id, email, customer_name, total_usd, item_count, items, page_path, checkout_url, user_agent, recovery_email_sent_at, recovery_email_count, recovered_at, last_activity_at, created_at, updated_at"
      )
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

    // Pull cart_events for the same sessions to build per-cart behavioral timelines
    const sessionIds = Array.from(
      new Set(cartsList.map((c) => c.session_id).filter((s): s is string => !!s))
    ).slice(0, 200);

    const eventsResp = sessionIds.length
      ? await supabaseAdmin
          .from("cart_events")
          .select(
            "id, session_id, event_type, product_handle, product_title, variant_title, variant_id, quantity, price_usd, page_path, created_at"
          )
          .in("session_id", sessionIds)
          .gte("created_at", since30d)
          .order("created_at", { ascending: true })
          .limit(5000)
      : { data: [] };
    const eventsRows = (eventsResp.data ?? []) as Array<{
      id: string;
      session_id: string;
      event_type: string;
      product_handle: string | null;
      product_title: string | null;
      variant_title: string | null;
      variant_id: string | null;
      quantity: number;
      price_usd: number | null;
      page_path: string | null;
      created_at: string;
    }>;

    const eventsBySession = new Map<string, typeof eventsRows>();
    for (const ev of eventsRows) {
      if (!ev.session_id) continue;
      const list = eventsBySession.get(ev.session_id) ?? [];
      list.push(ev);
      eventsBySession.set(ev.session_id, list);
    }

    // Cohort timing metrics
    const minutesBetween = (a: string | null, b: string | null) =>
      a && b ? Math.max(0, (new Date(b).getTime() - new Date(a).getTime()) / 60000) : null;
    const median = (arr: number[]) => {
      if (!arr.length) return 0;
      const s = [...arr].sort((a, b) => a - b);
      const mid = Math.floor(s.length / 2);
      return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
    };
    const ageMinutes: number[] = [];
    const timeToFirstEmail: number[] = [];
    const timeToRecover: number[] = [];
    for (const c of cartsList) {
      const a = minutesBetween(c.created_at, c.last_activity_at);
      if (a !== null) ageMinutes.push(a);
      const t1 = minutesBetween(c.created_at, c.recovery_email_sent_at);
      if (t1 !== null) timeToFirstEmail.push(t1);
      const t2 = minutesBetween(c.recovery_email_sent_at, c.recovered_at);
      if (t2 !== null) timeToRecover.push(t2);
    }

    // Per-cart detail (latest 100) with full timeline
    const cartsDetail = cartsList.slice(0, 100).map((c) => {
      const events = eventsBySession.get(c.session_id ?? "") ?? [];
      const firstAdd = events.find((e) => e.event_type === "add_to_cart");
      const lastAdd = [...events].reverse().find((e) => e.event_type === "add_to_cart");
      const checkoutStarted = events.find((e) => e.event_type === "checkout_started");
      const reachedCheckout = events.find((e) => e.event_type === "reached_checkout");
      return {
        id: c.id,
        email: c.email,
        customer_name: c.customer_name,
        session_id: c.session_id,
        total_usd: Number(c.total_usd || 0),
        item_count: c.item_count ?? 0,
        items: c.items,
        page_path: c.page_path,
        user_agent: c.user_agent,
        checkout_url: c.checkout_url,
        created_at: c.created_at,
        last_activity_at: c.last_activity_at,
        updated_at: c.updated_at,
        first_add_at: firstAdd?.created_at ?? null,
        last_add_at: lastAdd?.created_at ?? null,
        checkout_started_at: checkoutStarted?.created_at ?? null,
        reached_checkout_at: reachedCheckout?.created_at ?? null,
        recovery_email_sent_at: c.recovery_email_sent_at,
        recovery_email_count: c.recovery_email_count ?? 0,
        recovered_at: c.recovered_at,
        event_count: events.length,
        events: events.slice(-30),
      };
    });

    const cohort = {
      medianAgeMin: Math.round(median(ageMinutes)),
      medianTimeToFirstEmailMin: Math.round(median(timeToFirstEmail)),
      medianTimeToRecoverMin: Math.round(median(timeToRecover)),
      withCheckoutStarted: cartsDetail.filter((c) => c.checkout_started_at).length,
      withReachedCheckout: cartsDetail.filter((c) => c.reached_checkout_at).length,
    };

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
      cohort,
      cartsDetail,
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
