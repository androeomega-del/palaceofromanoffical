import { createServerFn } from "@tanstack/react-start";
import { requireAdmin } from "@/lib/admin-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export interface DailyPoint {
  date: string;
  pageviews: number;
  visitors: number;
  add_to_cart: number;
  checkout_started: number;
  reached_checkout: number;
  revenue: number;
}

export interface LandingPage {
  path: string;
  pageviews: number;
  visitors: number;
}

export interface AnalyticsDashboard {
  windowDays: number;
  generatedAt: string;
  kpis: {
    pageviews: number;
    visitors: number;
    add_to_cart: number;
    checkout_started: number;
    reached_checkout: number;
    estimated_gmv: number;
    atc_rate: number; // ATC / visitors
    cart_to_checkout: number; // checkout / atc
    checkout_to_reached: number; // reached / checkout
    conversion_rate: number; // reached / visitors
    abandonment_rate: number; // (atc - reached) / atc
  };
  daily: DailyPoint[];
  topLandingPages: LandingPage[];
  topReferrers: Array<{ referrer: string; count: number }>;
  funnel: Array<{ stage: string; count: number; pct: number; dropoff: number }>;
  email: {
    sent: number;
    failed: number;
    opened: number;
    clicked: number;
    open_rate: number;
    click_rate: number;
    ctor: number; // click / open
    daily: Array<{ date: string; sent: number; opened: number; clicked: number }>;
    byTemplate: Array<{ template: string; sent: number; opened: number; clicked: number }>;
  };
  subscribers: {
    total: number;
    new_in_window: number;
    opted_in: number;
    opt_in_rate: number;
    daily: Array<{ date: string; subs: number }>;
  };
}

function dayKey(iso: string): string {
  return iso.slice(0, 10);
}

function pct(num: number, denom: number): number {
  return denom > 0 ? Math.round((num / denom) * 1000) / 10 : 0;
}

export const getAnalyticsDashboard = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((d: { days?: number } | undefined) => ({
    days: Math.max(1, Math.min(365, Number(d?.days ?? 30))),
  }))
  .handler(async ({ data }): Promise<AnalyticsDashboard> => {
    const days = data.days;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

    // Build empty daily series
    const daily = new Map<string, DailyPoint>();
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      daily.set(d, {
        date: d,
        pageviews: 0,
        visitors: 0,
        add_to_cart: 0,
        checkout_started: 0,
        reached_checkout: 0,
        revenue: 0,
      });
    }

    // ------- Pageviews -------
    const { data: pvRows } = await supabaseAdmin
      .from("pageviews")
      .select("path, referrer, session_id, created_at")
      .gte("created_at", since)
      .limit(50_000);

    const pv = pvRows ?? [];
    const pathStats = new Map<string, { pageviews: number; visitors: Set<string> }>();
    const refStats = new Map<string, number>();
    const visitorsByDay = new Map<string, Set<string>>();
    const totalVisitors = new Set<string>();

    for (const r of pv) {
      const d = dayKey(r.created_at);
      const day = daily.get(d);
      if (day) day.pageviews++;
      totalVisitors.add(r.session_id);

      let dvs = visitorsByDay.get(d);
      if (!dvs) {
        dvs = new Set();
        visitorsByDay.set(d, dvs);
      }
      dvs.add(r.session_id);

      const ps = pathStats.get(r.path) ?? { pageviews: 0, visitors: new Set<string>() };
      ps.pageviews++;
      ps.visitors.add(r.session_id);
      pathStats.set(r.path, ps);

      if (r.referrer) {
        try {
          const host = new URL(r.referrer).host.replace(/^www\./, "");
          if (host) refStats.set(host, (refStats.get(host) ?? 0) + 1);
        } catch {
          /* ignore */
        }
      }
    }
    for (const [d, set] of visitorsByDay) {
      const day = daily.get(d);
      if (day) day.visitors = set.size;
    }

    const topLandingPages: LandingPage[] = Array.from(pathStats.entries())
      .map(([path, s]) => ({ path, pageviews: s.pageviews, visitors: s.visitors.size }))
      .sort((a, b) => b.pageviews - a.pageviews)
      .slice(0, 15);

    const topReferrers = Array.from(refStats.entries())
      .map(([referrer, count]) => ({ referrer, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // ------- Cart events -------
    const { data: ceRows } = await supabaseAdmin
      .from("cart_events")
      .select("event_type, price_usd, quantity, session_id, created_at")
      .gte("created_at", since)
      .limit(50_000);

    const ce = ceRows ?? [];
    let atc = 0,
      cos = 0,
      reached = 0,
      gmv = 0;

    for (const r of ce) {
      const d = dayKey(r.created_at);
      const day = daily.get(d);
      if (r.event_type === "add_to_cart") {
        atc++;
        if (day) day.add_to_cart++;
        const rev = Number(r.price_usd ?? 0) * Number(r.quantity ?? 1);
        gmv += rev;
        if (day) day.revenue += rev;
      } else if (r.event_type === "checkout_started") {
        cos++;
        if (day) day.checkout_started++;
      } else if (r.event_type === "reached_checkout") {
        reached++;
        if (day) day.reached_checkout++;
      }
    }

    const visitors = totalVisitors.size;
    const pageviews = pv.length;

    const kpis = {
      pageviews,
      visitors,
      add_to_cart: atc,
      checkout_started: cos,
      reached_checkout: reached,
      estimated_gmv: Math.round(gmv * 100) / 100,
      atc_rate: pct(atc, visitors),
      cart_to_checkout: pct(cos, atc),
      checkout_to_reached: pct(reached, cos),
      conversion_rate: pct(reached, visitors),
      abandonment_rate: atc > 0 ? Math.round(((atc - reached) / atc) * 1000) / 10 : 0,
    };

    const funnelBase = Math.max(visitors, 1);
    const funnel = [
      { stage: "Visitors", count: visitors, pct: 100, dropoff: 0 },
      {
        stage: "Add to Cart",
        count: atc,
        pct: pct(atc, funnelBase),
        dropoff: pct(visitors - atc, funnelBase),
      },
      {
        stage: "Checkout Started",
        count: cos,
        pct: pct(cos, funnelBase),
        dropoff: pct(atc - cos, funnelBase),
      },
      {
        stage: "Reached Checkout",
        count: reached,
        pct: pct(reached, funnelBase),
        dropoff: pct(cos - reached, funnelBase),
      },
    ];

    // ------- Email -------
    const { data: emRows } = await supabaseAdmin
      .from("email_dispatch_log")
      .select("template_name, status, opened_at, clicked_at, created_at")
      .gte("created_at", since)
      .limit(20_000);

    const em = emRows ?? [];
    let sent = 0,
      failed = 0,
      opened = 0,
      clicked = 0;
    const emailDaily = new Map<string, { sent: number; opened: number; clicked: number }>();
    const byTemplate = new Map<string, { sent: number; opened: number; clicked: number }>();
    for (const d of Array.from(daily.keys())) {
      emailDaily.set(d, { sent: 0, opened: 0, clicked: 0 });
    }

    for (const r of em) {
      const d = dayKey(r.created_at);
      const day = emailDaily.get(d);
      const tpl = r.template_name ?? "unknown";
      const tb = byTemplate.get(tpl) ?? { sent: 0, opened: 0, clicked: 0 };

      if (r.status === "sent") {
        sent++;
        if (day) day.sent++;
        tb.sent++;
      } else if (r.status === "failed" || r.status === "dlq") {
        failed++;
      }
      if (r.opened_at) {
        opened++;
        if (day) day.opened++;
        tb.opened++;
      }
      if (r.clicked_at) {
        clicked++;
        if (day) day.clicked++;
        tb.clicked++;
      }
      byTemplate.set(tpl, tb);
    }

    // ------- Subscribers -------
    const { data: subRows } = await supabaseAdmin
      .from("newsletter_subscribers")
      .select("marketing_consent, created_at");

    const subs = subRows ?? [];
    const total = subs.length;
    const optedIn = subs.filter((s) => s.marketing_consent).length;
    const newInWindow = subs.filter((s) => s.created_at >= since).length;
    const subDaily = new Map<string, number>();
    for (const d of Array.from(daily.keys())) subDaily.set(d, 0);
    for (const s of subs) {
      if (s.created_at < since) continue;
      const d = dayKey(s.created_at);
      subDaily.set(d, (subDaily.get(d) ?? 0) + 1);
    }

    return {
      windowDays: days,
      generatedAt: new Date().toISOString(),
      kpis,
      daily: Array.from(daily.values()),
      topLandingPages,
      topReferrers,
      funnel,
      email: {
        sent,
        failed,
        opened,
        clicked,
        open_rate: pct(opened, sent),
        click_rate: pct(clicked, sent),
        ctor: pct(clicked, opened),
        daily: Array.from(emailDaily.entries()).map(([date, v]) => ({ date, ...v })),
        byTemplate: Array.from(byTemplate.entries())
          .map(([template, v]) => ({ template, ...v }))
          .sort((a, b) => b.sent - a.sent),
      },
      subscribers: {
        total,
        new_in_window: newInWindow,
        opted_in: optedIn,
        opt_in_rate: pct(optedIn, total),
        daily: Array.from(subDaily.entries()).map(([date, subs]) => ({ date, subs })),
      },
    };
  });
