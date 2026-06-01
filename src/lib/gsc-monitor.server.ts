/**
 * Google Search Console monitoring.
 *
 * - Pulls performance + sitemap data via the Lovable connector gateway
 *   (uses LOVABLE_API_KEY + GOOGLE_SEARCH_CONSOLE_API_KEY).
 * - Stores daily snapshots in `gsc_daily_snapshots`.
 * - Detects spikes (impression/click drops, sitemap errors) → `gsc_alerts`.
 * - Generates weekly review with WoW deltas → `gsc_weekly_reviews`.
 * - Emails admin via the existing Gmail helper.
 *
 * Server-only — must not be imported from client code.
 */
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { sendGmail } from "@/lib/gmail-send";

const GSC_GATEWAY = "https://connector-gateway.lovable.dev/google_search_console";
const SITE = "sc-domain:palaceofromanofficial.com";
const ALERT_RECIPIENT = "notify@palaceofromanofficial.com";
const SITE_ENCODED = encodeURIComponent(SITE);

interface GscRow {
  keys?: string[];
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

interface SearchAnalyticsResponse {
  rows?: GscRow[];
}

interface SitemapEntry {
  path: string;
  errors?: string | number;
  warnings?: string | number;
  lastDownloaded?: string;
}

interface SitemapsListResponse {
  sitemap?: SitemapEntry[];
}

function gscHeaders(): HeadersInit {
  const LOVABLE_API_KEY = process.env.LOVABLE_API_KEY;
  const GOOGLE_SEARCH_CONSOLE_API_KEY = process.env.GOOGLE_SEARCH_CONSOLE_API_KEY;
  if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");
  if (!GOOGLE_SEARCH_CONSOLE_API_KEY) {
    throw new Error("GOOGLE_SEARCH_CONSOLE_API_KEY is not configured");
  }
  return {
    Authorization: `Bearer ${LOVABLE_API_KEY}`,
    "X-Connection-Api-Key": GOOGLE_SEARCH_CONSOLE_API_KEY,
    "Content-Type": "application/json",
  };
}

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}
function daysAgo(n: number): Date {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
  return d;
}

async function searchAnalytics(body: Record<string, unknown>): Promise<SearchAnalyticsResponse> {
  const res = await fetch(
    `${GSC_GATEWAY}/webmasters/v3/sites/${SITE_ENCODED}/searchAnalytics/query`,
    { method: "POST", headers: gscHeaders(), body: JSON.stringify(body) },
  );
  if (!res.ok) {
    throw new Error(`GSC searchAnalytics ${res.status}: ${await res.text()}`);
  }
  return res.json();
}

async function listSitemaps(): Promise<SitemapsListResponse> {
  const res = await fetch(`${GSC_GATEWAY}/webmasters/v3/sites/${SITE_ENCODED}/sitemaps`, {
    headers: gscHeaders(),
  });
  if (!res.ok) {
    throw new Error(`GSC sitemaps ${res.status}: ${await res.text()}`);
  }
  return res.json();
}

// ──────────────────────────────────────────────────────────────────────────────
// Daily snapshot + spike detection
// ──────────────────────────────────────────────────────────────────────────────

export interface DailyMonitorResult {
  snapshot_date: string;
  clicks: number;
  impressions: number;
  alerts_created: number;
}

/**
 * GSC data lags by ~2 days, so we snapshot the day-3-ago totals.
 * Compares against the trailing 7-day average and writes alerts on
 * material drops (>40%) or sitemap errors.
 */
export async function runDailyMonitor(): Promise<DailyMonitorResult> {
  const target = daysAgo(3);
  const targetIso = isoDate(target);

  // Aggregate totals for target day.
  const totalsRes = await searchAnalytics({
    startDate: targetIso,
    endDate: targetIso,
    dimensions: [],
    rowLimit: 1,
  });
  const totals = totalsRes.rows?.[0] ?? { clicks: 0, impressions: 0, ctr: 0, position: 0 };

  // Top 10 queries + top 10 pages for that day.
  const [queriesRes, pagesRes] = await Promise.all([
    searchAnalytics({
      startDate: targetIso,
      endDate: targetIso,
      dimensions: ["query"],
      rowLimit: 10,
    }),
    searchAnalytics({
      startDate: targetIso,
      endDate: targetIso,
      dimensions: ["page"],
      rowLimit: 10,
    }),
  ]);

  // Sitemap status.
  let sitemap_errors = 0;
  let sitemap_warnings = 0;
  try {
    const sm = await listSitemaps();
    for (const s of sm.sitemap ?? []) {
      sitemap_errors += Number(s.errors ?? 0);
      sitemap_warnings += Number(s.warnings ?? 0);
    }
  } catch (e) {
    console.error("[gsc-monitor] sitemaps list failed", e);
  }

  const top_queries = (queriesRes.rows ?? []).map((r) => ({
    query: r.keys?.[0] ?? "",
    clicks: r.clicks,
    impressions: r.impressions,
    ctr: r.ctr,
    position: r.position,
  }));
  const top_pages = (pagesRes.rows ?? []).map((r) => ({
    page: r.keys?.[0] ?? "",
    clicks: r.clicks,
    impressions: r.impressions,
    ctr: r.ctr,
    position: r.position,
  }));

  // Upsert snapshot.
  await supabaseAdmin.from("gsc_daily_snapshots").upsert(
    {
      snapshot_date: targetIso,
      clicks: Math.round(totals.clicks),
      impressions: Math.round(totals.impressions),
      ctr: totals.ctr,
      position: totals.position,
      sitemap_errors,
      sitemap_warnings,
      top_queries,
      top_pages,
    },
    { onConflict: "snapshot_date" },
  );

  // Compare vs trailing 7-day avg (snapshots BEFORE target day).
  const { data: trailing } = await supabaseAdmin
    .from("gsc_daily_snapshots")
    .select("clicks, impressions")
    .lt("snapshot_date", targetIso)
    .gte("snapshot_date", isoDate(daysAgo(10)))
    .order("snapshot_date", { ascending: false })
    .limit(7);

  const alerts: Array<{
    alert_type: string;
    severity: "info" | "warning" | "critical";
    title: string;
    message: string;
    metric_data: Record<string, unknown>;
  }> = [];

  if (trailing && trailing.length >= 3) {
    const avgImpr =
      trailing.reduce((s, r) => s + (r.impressions ?? 0), 0) / trailing.length;
    const avgClicks =
      trailing.reduce((s, r) => s + (r.clicks ?? 0), 0) / trailing.length;

    if (avgImpr >= 20 && totals.impressions < avgImpr * 0.6) {
      const pct = Math.round((1 - totals.impressions / avgImpr) * 100);
      alerts.push({
        alert_type: "impressions_drop",
        severity: pct >= 70 ? "critical" : "warning",
        title: `Impressions dropped ${pct}% vs 7-day average`,
        message: `${targetIso}: ${Math.round(totals.impressions)} impressions vs ${Math.round(avgImpr)} avg.`,
        metric_data: { date: targetIso, value: totals.impressions, avg: avgImpr, drop_pct: pct },
      });
    }
    if (avgClicks >= 5 && totals.clicks < avgClicks * 0.5) {
      const pct = Math.round((1 - totals.clicks / avgClicks) * 100);
      alerts.push({
        alert_type: "clicks_drop",
        severity: pct >= 70 ? "critical" : "warning",
        title: `Clicks dropped ${pct}% vs 7-day average`,
        message: `${targetIso}: ${Math.round(totals.clicks)} clicks vs ${Math.round(avgClicks)} avg.`,
        metric_data: { date: targetIso, value: totals.clicks, avg: avgClicks, drop_pct: pct },
      });
    }
  }

  if (sitemap_errors > 0) {
    alerts.push({
      alert_type: "sitemap_errors",
      severity: "critical",
      title: `Sitemap reporting ${sitemap_errors} error(s)`,
      message: `GSC sitemap status shows ${sitemap_errors} error(s) and ${sitemap_warnings} warning(s).`,
      metric_data: { errors: sitemap_errors, warnings: sitemap_warnings },
    });
  }

  // Persist + email new alerts (dedupe against any alert created today
  // with the same alert_type so retries don't spam).
  let createdCount = 0;
  if (alerts.length > 0) {
    const todayStart = new Date();
    todayStart.setUTCHours(0, 0, 0, 0);
    const { data: existing } = await supabaseAdmin
      .from("gsc_alerts")
      .select("alert_type")
      .gte("created_at", todayStart.toISOString());
    const existingTypes = new Set((existing ?? []).map((r) => r.alert_type as string));

    const toInsert = alerts.filter((a) => !existingTypes.has(a.alert_type));
    if (toInsert.length > 0) {
      const { data: inserted } = await supabaseAdmin
        .from("gsc_alerts")
        .insert(toInsert)
        .select("id, alert_type, severity, title, message");
      createdCount = inserted?.length ?? 0;

      // Email a single digest covering all new alerts.
      if (inserted && inserted.length > 0) {
        try {
          await sendAlertDigest(inserted);
          await supabaseAdmin
            .from("gsc_alerts")
            .update({ emailed: true })
            .in(
              "id",
              inserted.map((r) => r.id as string),
            );
        } catch (e) {
          console.error("[gsc-monitor] alert email failed", e);
        }
      }
    }
  }

  return {
    snapshot_date: targetIso,
    clicks: Math.round(totals.clicks),
    impressions: Math.round(totals.impressions),
    alerts_created: createdCount,
  };
}

async function sendAlertDigest(
  alerts: Array<{ severity: string; title: string; message: string }>,
): Promise<void> {
  const subject =
    alerts.length === 1
      ? `[GSC Alert] ${alerts[0].title}`
      : `[GSC Alert] ${alerts.length} issues detected`;
  const lines = alerts.map(
    (a) =>
      `• ${a.severity.toUpperCase()} — ${a.title}\n  ${a.message}`,
  );
  const text = `Google Search Console monitor flagged ${alerts.length} issue(s):\n\n${lines.join(
    "\n\n",
  )}\n\nReview: https://palaceofromanofficial.com/admin/gsc-monitor`;
  const html = `<p>Google Search Console monitor flagged <strong>${alerts.length}</strong> issue(s):</p>
<ul>${alerts
    .map(
      (a) =>
        `<li><strong>[${a.severity.toUpperCase()}]</strong> ${escapeHtml(a.title)}<br/><span style="color:#555">${escapeHtml(a.message)}</span></li>`,
    )
    .join("")}</ul>
<p><a href="https://palaceofromanofficial.com/admin/gsc-monitor">Open the GSC monitor dashboard →</a></p>`;
  await sendGmail(ALERT_RECIPIENT, subject, html, text);
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ──────────────────────────────────────────────────────────────────────────────
// Weekly review
// ──────────────────────────────────────────────────────────────────────────────

export interface WeeklyReviewResult {
  week_start: string;
  clicks: number;
  impressions: number;
  action_items: string[];
}

export async function runWeeklyReview(): Promise<WeeklyReviewResult> {
  // GSC lags ~2 days. Review the most recent fully-closed week
  // (start: 9 days ago, end: 3 days ago = 7-day window).
  const end = daysAgo(3);
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - 6);
  const prevEnd = new Date(start);
  prevEnd.setUTCDate(prevEnd.getUTCDate() - 1);
  const prevStart = new Date(prevEnd);
  prevStart.setUTCDate(prevStart.getUTCDate() - 6);

  const startIso = isoDate(start);
  const endIso = isoDate(end);
  const prevStartIso = isoDate(prevStart);
  const prevEndIso = isoDate(prevEnd);

  const [thisWk, prevWk, queries, pages] = await Promise.all([
    searchAnalytics({
      startDate: startIso,
      endDate: endIso,
      dimensions: [],
      rowLimit: 1,
    }),
    searchAnalytics({
      startDate: prevStartIso,
      endDate: prevEndIso,
      dimensions: [],
      rowLimit: 1,
    }),
    searchAnalytics({
      startDate: startIso,
      endDate: endIso,
      dimensions: ["query"],
      rowLimit: 25,
    }),
    searchAnalytics({
      startDate: startIso,
      endDate: endIso,
      dimensions: ["page"],
      rowLimit: 25,
    }),
  ]);

  const t = thisWk.rows?.[0] ?? { clicks: 0, impressions: 0, ctr: 0, position: 0 };
  const p = prevWk.rows?.[0] ?? { clicks: 0, impressions: 0, ctr: 0, position: 0 };

  const wow = (cur: number, prev: number): number | null =>
    prev > 0 ? Math.round(((cur - prev) / prev) * 1000) / 10 : null;

  const clicks_wow_pct = wow(t.clicks, p.clicks);
  const impressions_wow_pct = wow(t.impressions, p.impressions);

  const top_queries = (queries.rows ?? []).map((r) => ({
    query: r.keys?.[0] ?? "",
    clicks: r.clicks,
    impressions: r.impressions,
    ctr: r.ctr,
    position: Math.round(r.position * 10) / 10,
  }));
  const top_pages = (pages.rows ?? []).map((r) => ({
    page: r.keys?.[0] ?? "",
    clicks: r.clicks,
    impressions: r.impressions,
    ctr: r.ctr,
    position: Math.round(r.position * 10) / 10,
  }));

  // Sitemap status for the action list.
  let sitemap_errors = 0;
  let sitemap_warnings = 0;
  try {
    const sm = await listSitemaps();
    for (const s of sm.sitemap ?? []) {
      sitemap_errors += Number(s.errors ?? 0);
      sitemap_warnings += Number(s.warnings ?? 0);
    }
  } catch (e) {
    console.error("[gsc-weekly] sitemap fetch failed", e);
  }

  // Generate action items deterministically.
  const action_items: string[] = [];
  if (impressions_wow_pct !== null && impressions_wow_pct <= -20) {
    action_items.push(
      `Impressions down ${Math.abs(impressions_wow_pct)}% WoW — investigate top pages losing visibility.`,
    );
  }
  if (clicks_wow_pct !== null && clicks_wow_pct <= -20) {
    action_items.push(
      `Clicks down ${Math.abs(clicks_wow_pct)}% WoW — check CTR on top queries and titles/descriptions.`,
    );
  }
  if (t.position > 30) {
    action_items.push(
      `Avg position ${Math.round(t.position)} — focus on content depth + internal linking for top pages.`,
    );
  }
  if (sitemap_errors > 0) {
    action_items.push(
      `Fix ${sitemap_errors} sitemap error(s) reported by GSC (Indexing → Sitemaps).`,
    );
  }
  const lowCtr = top_queries
    .filter((q) => q.impressions >= 50 && q.ctr < 0.01)
    .slice(0, 3);
  for (const q of lowCtr) {
    action_items.push(
      `Query "${q.query}" has ${q.impressions} impressions but ${(q.ctr * 100).toFixed(2)}% CTR — rewrite title/meta on the ranking page.`,
    );
  }
  const topOpp = top_queries
    .filter((q) => q.position >= 8 && q.position <= 20 && q.impressions >= 30)
    .slice(0, 3);
  for (const q of topOpp) {
    action_items.push(
      `Query "${q.query}" ranks #${Math.round(q.position)} — strengthen the ranking page to push into the top 10.`,
    );
  }
  if (action_items.length === 0) {
    action_items.push("No urgent issues. Continue publishing editorial content and watch top-mover queries.");
  }

  const summary = `Week ${startIso} → ${endIso}: ${t.clicks} clicks (${
    clicks_wow_pct ?? "n/a"
  }% WoW), ${t.impressions} impressions (${
    impressions_wow_pct ?? "n/a"
  }% WoW), avg position ${Math.round(t.position * 10) / 10}.`;

  await supabaseAdmin.from("gsc_weekly_reviews").upsert(
    {
      week_start: startIso,
      clicks: Math.round(t.clicks),
      impressions: Math.round(t.impressions),
      ctr: t.ctr,
      position: t.position,
      clicks_wow_pct,
      impressions_wow_pct,
      top_queries,
      top_pages,
      action_items,
      summary,
    },
    { onConflict: "week_start" },
  );

  // Email weekly digest.
  try {
    await sendWeeklyDigest({
      startIso,
      endIso,
      clicks: t.clicks,
      impressions: t.impressions,
      position: t.position,
      ctr: t.ctr,
      clicks_wow_pct,
      impressions_wow_pct,
      action_items,
      top_queries: top_queries.slice(0, 10),
      top_pages: top_pages.slice(0, 10),
    });
  } catch (e) {
    console.error("[gsc-weekly] email failed", e);
  }

  return {
    week_start: startIso,
    clicks: Math.round(t.clicks),
    impressions: Math.round(t.impressions),
    action_items,
  };
}

async function sendWeeklyDigest(args: {
  startIso: string;
  endIso: string;
  clicks: number;
  impressions: number;
  position: number;
  ctr: number;
  clicks_wow_pct: number | null;
  impressions_wow_pct: number | null;
  action_items: string[];
  top_queries: Array<{ query: string; clicks: number; impressions: number; position: number }>;
  top_pages: Array<{ page: string; clicks: number; impressions: number; position: number }>;
}): Promise<void> {
  const wowLabel = (n: number | null): string =>
    n === null ? "n/a" : n >= 0 ? `+${n}%` : `${n}%`;
  const subject = `[GSC Weekly] ${args.startIso} → ${args.endIso} · ${args.clicks} clicks · ${args.impressions} impressions`;
  const text = [
    `Google Search Console — weekly review`,
    `Week: ${args.startIso} → ${args.endIso}`,
    ``,
    `Clicks: ${args.clicks} (${wowLabel(args.clicks_wow_pct)} WoW)`,
    `Impressions: ${args.impressions} (${wowLabel(args.impressions_wow_pct)} WoW)`,
    `Avg position: ${Math.round(args.position * 10) / 10}`,
    `CTR: ${(args.ctr * 100).toFixed(2)}%`,
    ``,
    `Action list:`,
    ...args.action_items.map((a, i) => `  ${i + 1}. ${a}`),
    ``,
    `Top queries:`,
    ...args.top_queries.map(
      (q) => `  • ${q.query} — ${q.clicks} clicks · ${q.impressions} impressions · pos ${q.position}`,
    ),
    ``,
    `Top pages:`,
    ...args.top_pages.map(
      (p) => `  • ${p.page} — ${p.clicks} clicks · ${p.impressions} impressions · pos ${p.position}`,
    ),
    ``,
    `Dashboard: https://palaceofromanofficial.com/admin/gsc-monitor`,
  ].join("\n");

  const html = `
<h2 style="margin:0 0 8px;font-family:system-ui">GSC Weekly Review</h2>
<p style="color:#555;margin:0 0 16px">${args.startIso} → ${args.endIso}</p>
<table style="border-collapse:collapse;margin-bottom:16px">
  <tr><td style="padding:6px 12px"><strong>Clicks</strong></td><td style="padding:6px 12px">${args.clicks} <span style="color:#888">(${wowLabel(args.clicks_wow_pct)} WoW)</span></td></tr>
  <tr><td style="padding:6px 12px"><strong>Impressions</strong></td><td style="padding:6px 12px">${args.impressions} <span style="color:#888">(${wowLabel(args.impressions_wow_pct)} WoW)</span></td></tr>
  <tr><td style="padding:6px 12px"><strong>Avg position</strong></td><td style="padding:6px 12px">${Math.round(args.position * 10) / 10}</td></tr>
  <tr><td style="padding:6px 12px"><strong>CTR</strong></td><td style="padding:6px 12px">${(args.ctr * 100).toFixed(2)}%</td></tr>
</table>
<h3 style="font-family:system-ui">Action list</h3>
<ol>${args.action_items.map((a) => `<li>${escapeHtml(a)}</li>`).join("")}</ol>
<h3 style="font-family:system-ui">Top queries</h3>
<ul>${args.top_queries
    .map(
      (q) =>
        `<li><strong>${escapeHtml(q.query)}</strong> — ${q.clicks} clicks · ${q.impressions} impr · pos ${q.position}</li>`,
    )
    .join("")}</ul>
<h3 style="font-family:system-ui">Top pages</h3>
<ul>${args.top_pages
    .map(
      (p) =>
        `<li>${escapeHtml(p.page)} — ${p.clicks} clicks · ${p.impressions} impr · pos ${p.position}</li>`,
    )
    .join("")}</ul>
<p><a href="https://palaceofromanofficial.com/admin/gsc-monitor">Open the GSC monitor dashboard →</a></p>`;

  await sendGmail(ALERT_RECIPIENT, subject, html, text);
}
