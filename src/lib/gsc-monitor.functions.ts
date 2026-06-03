/**
 * Admin server functions for the GSC monitor dashboard.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { runDailyMonitor, runWeeklyReview } from "@/lib/gsc-monitor.server";

export type GscSnapshot = {
  snapshot_date: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
  sitemap_errors: number;
  sitemap_warnings: number;
};
export type GscAlert = {
  id: string;
  alert_type: string;
  severity: string;
  title: string;
  message: string;
  emailed: boolean;
  resolved_at: string | null;
  created_at: string;
};
export type GscWeeklyReview = {
  id: string;
  week_start: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
  clicks_wow_pct: number | null;
  impressions_wow_pct: number | null;
  action_items: string[];
  summary: string | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  top_queries: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  top_pages: any;
  created_at: string;
};
export interface GscDashboardData {
  snapshots: GscSnapshot[];
  alerts: GscAlert[];
  weeklyReviews: GscWeeklyReview[];
}

export const getGscDashboardData = createServerFn({ method: "GET" })
  .middleware([requireAdmin])
  .handler(async (): Promise<GscDashboardData> => {
    const [snaps, alerts, weeks] = await Promise.all([
      supabaseAdmin
        .from("gsc_daily_snapshots")
        .select(
          "snapshot_date, clicks, impressions, ctr, position, sitemap_errors, sitemap_warnings",
        )
        .order("snapshot_date", { ascending: false })
        .limit(60),
      supabaseAdmin
        .from("gsc_alerts")
        .select("id, alert_type, severity, title, message, emailed, resolved_at, created_at")
        .order("created_at", { ascending: false })
        .limit(50),
      supabaseAdmin
        .from("gsc_weekly_reviews")
        .select("*")
        .order("week_start", { ascending: false })
        .limit(12),
    ]);

    return {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      snapshots: (snaps.data ?? []) as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      alerts: (alerts.data ?? []) as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      weeklyReviews: (weeks.data ?? []) as any,
    };
  });

export const runGscMonitorNow = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .handler(async () => {
    return runDailyMonitor();
  });

export const runGscWeeklyReviewNow = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .handler(async () => {
    return runWeeklyReview();
  });

export const resolveGscAlert = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    await supabaseAdmin
      .from("gsc_alerts")
      .update({ resolved_at: new Date().toISOString() })
      .eq("id", data.id);
    return { ok: true };
  });
