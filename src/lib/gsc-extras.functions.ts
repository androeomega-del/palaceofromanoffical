/**
 * Admin server functions for GSC monitoring extras.
 * Thin wrapper around helpers in gsc-extras.server.ts (per tss-serverfn-split rule).
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import {
  syncSitemapUrls,
  getThresholds,
  upsertThreshold,
  deleteThreshold,
  runRedirectAudit,
  getLatestRedirectAudit,
  captureUrlInspection,
} from "@/lib/gsc-extras.server";

// ── Sitemap sync ────────────────────────────────────────────────────────────

export const syncSitemapNow = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .handler(async () => syncSitemapUrls());

export type MonitoredUrlRow = {
  url: string;
  page_group: string;
  locale: string | null;
  source: string;
  active: boolean;
  last_synced_at: string;
};

export const getMonitoredUrls = createServerFn({ method: "GET" })
  .middleware([requireAdmin])
  .handler(async (): Promise<{ rows: MonitoredUrlRow[]; total: number; by_group: Record<string, number> }> => {
    const { data, error, count } = await supabaseAdmin
      .from("gsc_monitored_urls")
      .select("url, page_group, locale, source, active, last_synced_at", { count: "exact" })
      .order("last_synced_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    const by_group: Record<string, number> = {};
    for (const r of data ?? []) by_group[r.page_group] = (by_group[r.page_group] ?? 0) + 1;
    return { rows: (data ?? []) as MonitoredUrlRow[], total: count ?? 0, by_group };
  });

// ── Thresholds ──────────────────────────────────────────────────────────────

export const listThresholds = createServerFn({ method: "GET" })
  .middleware([requireAdmin])
  .handler(async () => getThresholds());

const thresholdInput = z.object({
  id: z.string().optional(),
  scope_type: z.enum(["global", "page_group"]),
  scope_value: z.string().nullable(),
  impressions_drop_pct: z.number().min(0).max(100),
  clicks_drop_pct: z.number().min(0).max(100),
  sitemap_error_min: z.number().int().min(0),
  position_warn_above: z.number().nullable(),
  min_impressions_floor: z.number().int().min(0),
  min_clicks_floor: z.number().int().min(0),
  active: z.boolean(),
});

export const saveThreshold = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((input: unknown) => thresholdInput.parse(input))
  .handler(async ({ data }) => {
    await upsertThreshold(data);
    return { ok: true };
  });

export const removeThreshold = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data }) => {
    await deleteThreshold(data.id);
    return { ok: true };
  });

// ── Redirect audit ──────────────────────────────────────────────────────────

export const runRedirectAuditNow = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((input: unknown) =>
    z.object({ limit: z.number().int().min(1).max(300).optional() }).parse(input ?? {}),
  )
  .handler(async ({ data }) => runRedirectAudit(data.limit ?? 60));

export const getRedirectAudit = createServerFn({ method: "GET" })
  .middleware([requireAdmin])
  .handler(async () => getLatestRedirectAudit());

// ── URL inspection ──────────────────────────────────────────────────────────

const inspectionInput = z.object({
  url: z.string().url().max(2048),
  manualResultJson: z.string().max(50000).optional(),
  notes: z.string().max(2000).optional(),
});

export const captureInspection = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((input: unknown) => inspectionInput.parse(input))
  .handler(async ({ data, context }) => {
    let manualResult: unknown = undefined;
    if (data.manualResultJson && data.manualResultJson.trim()) {
      try {
        manualResult = JSON.parse(data.manualResultJson);
      } catch {
        throw new Error("manualResultJson is not valid JSON");
      }
    }
    return captureUrlInspection({
      url: data.url,
      manualResult,
      notes: data.notes,
      capturedBy: context.userId,
    });
  });

export type InspectionRow = {
  id: string;
  url: string;
  verdict: string | null;
  coverage_state: string | null;
  indexing_state: string | null;
  last_crawl_time: string | null;
  page_fetch_state: string | null;
  capture_source: string;
  captured_at: string;
  notes: string | null;
};

export const listInspections = createServerFn({ method: "GET" })
  .middleware([requireAdmin])
  .handler(async (): Promise<InspectionRow[]> => {
    const { data, error } = await supabaseAdmin
      .from("gsc_url_inspections")
      .select(
        "id, url, verdict, coverage_state, indexing_state, last_crawl_time, page_fetch_state, capture_source, captured_at, notes",
      )
      .order("captured_at", { ascending: false })
      .limit(50);
    if (error) throw new Error(error.message);
    return (data ?? []) as InspectionRow[];
  });
