import { createServerFn } from "@tanstack/react-start";
import { requireAdmin } from "@/lib/admin-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export type Severity = "ok" | "warn" | "critical";

export interface Anomaly {
  id: "abandonment" | "vitals" | "email_cvr";
  title: string;
  severity: Severity;
  headline: string;
  detail: string;
  metric: { label: string; value: string; threshold: string };
  fixes: string[];
}

export interface ProductFriction {
  handle: string;
  title: string | null;
  views: number;
  adds: number;
  atc_rate: number; // %
}

export interface VitalsBreakdown {
  metric: "LCP" | "INP" | "CLS";
  device: "mobile" | "desktop" | "tablet";
  p75: number;
  samples: number;
  rating: "good" | "needs-improvement" | "poor";
}

export interface SalesDiagnostic {
  generatedAt: string;
  windowHours: number;
  anomalies: Anomaly[];
  abandonment: {
    add_to_cart: number;
    reached_checkout: number;
    abandonment_rate: number; // %
    abandoned_carts_with_email: number;
    abandoned_value_usd: number;
  };
  vitals: VitalsBreakdown[];
  emailCvr: {
    this_week_sessions: number;
    this_week_conversions: number;
    this_week_cvr: number; // %
    last_week_sessions: number;
    last_week_conversions: number;
    last_week_cvr: number;
    delta_pct: number;
  };
  topFriction: ProductFriction[];
}

const HOUR = 60 * 60 * 1000;

// Recommendation packs keyed to the trigger that fired.
const FIX_PACKS = {
  abandonment: [
    "Enable Shopify 1-page checkout and surface shipping cost on the PDP, not at the last step.",
    "Add Shop Pay, Apple Pay, and Google Pay as express checkout buttons above the cart summary.",
    "Allow guest checkout — never force account creation before payment.",
    "Trigger an abandoned-cart recovery email at +1h with a discount-light, free-shipping reminder.",
  ],
  vitals: [
    "Compress hero / PDP imagery to WebP/AVIF; cap at 1600px on mobile.",
    "Run a Shopify Theme Speed Audit and remove unused apps that inject render-blocking JS.",
    "Defer non-critical scripts (chat widgets, analytics) to load after first input.",
    "Reserve width/height on every above-the-fold image to eliminate CLS.",
  ],
  email_cvr: [
    "A/B test the email subject line and preheader against last week's winner.",
    "Verify deep-link UTMs land on a stocked, on-brand collection (not a 404 / empty filter).",
    "Audit the landing PDP for out-of-stock variants — pause the campaign or swap the hero product.",
    "Re-time the send window to match the day-of-week / hour that converted last month.",
  ],
};

function pct(n: number, d: number): number {
  return d > 0 ? Math.round((n / d) * 1000) / 10 : 0;
}

function p75(values: number[]): number {
  if (values.length === 0) return 0;
  const s = [...values].sort((a, b) => a - b);
  const idx = Math.min(s.length - 1, Math.floor(s.length * 0.75));
  return Math.round(s[idx] * 100) / 100;
}

function rateMetric(metric: "LCP" | "INP" | "CLS", val: number): "good" | "needs-improvement" | "poor" {
  // Google Core Web Vitals thresholds.
  if (metric === "LCP") return val <= 2500 ? "good" : val <= 4000 ? "needs-improvement" : "poor";
  if (metric === "INP") return val <= 200 ? "good" : val <= 500 ? "needs-improvement" : "poor";
  return val <= 0.1 ? "good" : val <= 0.25 ? "needs-improvement" : "poor";
}

export const getSalesDiagnostic = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((d: { hours?: number } | undefined) => ({
    hours: Math.max(1, Math.min(168, Number(d?.hours ?? 24))),
  }))
  .handler(async ({ data }): Promise<SalesDiagnostic> => {
    const hours = data.hours;
    const since = new Date(Date.now() - hours * HOUR).toISOString();
    const weekAgo = new Date(Date.now() - 7 * 24 * HOUR).toISOString();
    const twoWeeksAgo = new Date(Date.now() - 14 * 24 * HOUR).toISOString();

    // ── Abandonment & friction (cart_events) ───────────────────────────
    const { data: cartRows } = await supabaseAdmin
      .from("cart_events")
      .select("event_type,product_handle,product_title,price_usd,quantity,created_at")
      .gte("created_at", since)
      .limit(10000);

    const events = cartRows ?? [];
    const atc = events.filter((e) => e.event_type === "add_to_cart").length;
    const reached = events.filter((e) => e.event_type === "reached_checkout").length;
    const abandonmentRate = atc > 0 ? Math.round(((atc - reached) / atc) * 1000) / 10 : 0;

    // Pageviews per product handle to compute add-to-cart conversion friction.
    const { data: pvRows } = await supabaseAdmin
      .from("pageviews")
      .select("path,created_at")
      .gte("created_at", since)
      .like("path", "/product/%")
      .limit(20000);

    const viewsByHandle = new Map<string, number>();
    for (const r of pvRows ?? []) {
      const handle = r.path.replace(/^\/product\//, "").split("/")[0]?.split("?")[0];
      if (!handle) continue;
      viewsByHandle.set(handle, (viewsByHandle.get(handle) ?? 0) + 1);
    }
    const addsByHandle = new Map<string, { adds: number; title: string | null }>();
    for (const e of events) {
      if (e.event_type !== "add_to_cart" || !e.product_handle) continue;
      const entry = addsByHandle.get(e.product_handle) ?? { adds: 0, title: e.product_title };
      entry.adds++;
      if (!entry.title && e.product_title) entry.title = e.product_title;
      addsByHandle.set(e.product_handle, entry);
    }
    const topFriction: ProductFriction[] = [];
    for (const [handle, views] of viewsByHandle) {
      if (views < 10) continue; // need signal
      const adds = addsByHandle.get(handle)?.adds ?? 0;
      const rate = pct(adds, views);
      if (rate < 2 && views >= 20) {
        topFriction.push({
          handle,
          title: addsByHandle.get(handle)?.title ?? null,
          views,
          adds,
          atc_rate: rate,
        });
      }
    }
    topFriction.sort((a, b) => b.views - a.views);

    // Abandoned-cart value summary.
    const { data: ac } = await supabaseAdmin
      .from("abandoned_carts")
      .select("total_usd,recovered_at,last_activity_at")
      .gte("last_activity_at", since)
      .limit(1000);
    const acRows = (ac ?? []).filter((r) => !r.recovered_at);
    const abandonedValue =
      Math.round(acRows.reduce((s, r) => s + Number(r.total_usd ?? 0), 0) * 100) / 100;

    // ── Web Vitals ──────────────────────────────────────────────────────
    const { data: vitRows } = await supabaseAdmin
      .from("web_vitals")
      .select("metric,device,value,created_at")
      .gte("created_at", since)
      .in("metric", ["LCP", "INP", "CLS"])
      .limit(20000);

    const vBuckets = new Map<string, number[]>();
    for (const r of vitRows ?? []) {
      const dev = (r.device as "mobile" | "desktop" | "tablet" | null) ?? "desktop";
      const key = `${r.metric}|${dev}`;
      const arr = vBuckets.get(key) ?? [];
      arr.push(Number(r.value) || 0);
      vBuckets.set(key, arr);
    }
    const vitals: VitalsBreakdown[] = [];
    for (const [key, vals] of vBuckets) {
      const [m, dev] = key.split("|") as ["LCP" | "INP" | "CLS", "mobile" | "desktop" | "tablet"];
      const p = p75(vals);
      vitals.push({ metric: m, device: dev, p75: p, samples: vals.length, rating: rateMetric(m, p) });
    }
    vitals.sort((a, b) => (a.metric + a.device).localeCompare(b.metric + b.device));

    // ── Email-driven CVR week-over-week ─────────────────────────────────
    const { data: emailPv } = await supabaseAdmin
      .from("pageviews")
      .select("session_id,referrer,created_at")
      .gte("created_at", twoWeeksAgo)
      .limit(50000);
    const emailSessions = (emailPv ?? []).filter((r) => {
      const ref = (r.referrer ?? "").toLowerCase();
      return /utm_medium=email|utm_source=email|mailchimp|klaviyo|shopifyemail|sendgrid|resend/.test(ref);
    });
    const sessionsThisWeek = new Set<string>();
    const sessionsLastWeek = new Set<string>();
    for (const r of emailSessions) {
      const ts = new Date(r.created_at).getTime();
      if (ts >= new Date(weekAgo).getTime()) sessionsThisWeek.add(r.session_id);
      else sessionsLastWeek.add(r.session_id);
    }
    const reachedSessions = new Set<string>();
    const { data: reachedRows } = await supabaseAdmin
      .from("cart_events")
      .select("session_id,created_at")
      .eq("event_type", "reached_checkout")
      .gte("created_at", twoWeeksAgo)
      .limit(10000);
    for (const r of reachedRows ?? []) reachedSessions.add(r.session_id ?? "");
    let thisConv = 0;
    let lastConv = 0;
    for (const s of sessionsThisWeek) if (reachedSessions.has(s)) thisConv++;
    for (const s of sessionsLastWeek) if (reachedSessions.has(s)) lastConv++;
    const thisCvr = pct(thisConv, sessionsThisWeek.size);
    const lastCvr = pct(lastConv, sessionsLastWeek.size);
    const deltaPct = lastCvr > 0 ? Math.round(((thisCvr - lastCvr) / lastCvr) * 1000) / 10 : 0;

    // ── Anomaly triggers ────────────────────────────────────────────────
    const anomalies: Anomaly[] = [];

    if (atc >= 10 && abandonmentRate > 75) {
      anomalies.push({
        id: "abandonment",
        title: "Checkout abandonment spike",
        severity: abandonmentRate > 85 ? "critical" : "warn",
        headline: `Cart abandonment is ${abandonmentRate}% over the last ${hours}h.`,
        detail:
          "Spike in checkout abandonment at the final step. Likely causes: unexpected shipping cost surfaced at checkout, lack of express payment options, or mandatory account creation.",
        metric: { label: "Abandonment", value: `${abandonmentRate}%`, threshold: "≤ 75%" },
        fixes: FIX_PACKS.abandonment,
      });
    }

    const poorMobile = vitals.find(
      (v) => v.device === "mobile" && (v.metric === "LCP" || v.metric === "INP") && v.rating === "poor",
    );
    if (poorMobile && poorMobile.samples >= 10) {
      anomalies.push({
        id: "vitals",
        title: "Mobile performance degraded",
        severity: "warn",
        headline: `Mobile ${poorMobile.metric} p75 has slipped to ${poorMobile.p75}${poorMobile.metric === "CLS" ? "" : "ms"} (rated poor).`,
        detail:
          "Real-user performance on mobile PDPs dropped into the 'poor' band. Likely cause: unoptimized high-resolution imagery or excess third-party app scripts.",
        metric: {
          label: `Mobile ${poorMobile.metric} p75`,
          value: `${poorMobile.p75}${poorMobile.metric === "CLS" ? "" : "ms"}`,
          threshold: poorMobile.metric === "LCP" ? "≤ 2500ms" : poorMobile.metric === "INP" ? "≤ 200ms" : "≤ 0.1",
        },
        fixes: FIX_PACKS.vitals,
      });
    }

    if (sessionsLastWeek.size >= 20 && deltaPct <= -20) {
      anomalies.push({
        id: "email_cvr",
        title: "Email-driven conversion drop",
        severity: deltaPct <= -40 ? "critical" : "warn",
        headline: `Email-channel conversion is down ${Math.abs(deltaPct)}% week-over-week.`,
        detail:
          "Traffic arriving from email campaigns is converting at a lower rate than the prior 7-day window. Likely cause: messaging mismatch with the landing PDP, out-of-stock hero product, or stale send window.",
        metric: { label: "Email CVR Δ", value: `${deltaPct}%`, threshold: "> -20%" },
        fixes: FIX_PACKS.email_cvr,
      });
    }

    return {
      generatedAt: new Date().toISOString(),
      windowHours: hours,
      anomalies,
      abandonment: {
        add_to_cart: atc,
        reached_checkout: reached,
        abandonment_rate: abandonmentRate,
        abandoned_carts_with_email: acRows.length,
        abandoned_value_usd: abandonedValue,
      },
      vitals,
      emailCvr: {
        this_week_sessions: sessionsThisWeek.size,
        this_week_conversions: thisConv,
        this_week_cvr: thisCvr,
        last_week_sessions: sessionsLastWeek.size,
        last_week_conversions: lastConv,
        last_week_cvr: lastCvr,
        delta_pct: deltaPct,
      },
      topFriction: topFriction.slice(0, 8),
    };
  });
