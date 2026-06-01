/**
 * GSC monitoring extras — server-only.
 *
 *  - Sitemap → monitored URL sync
 *  - Per-page-group alert thresholds
 *  - Legacy /products redirect-status audit (301 vs 404 vs 200, by locale)
 *  - URL Inspection capture (via GSC API where exposed, manual fallback)
 *
 * Must not be imported from client code.
 */
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const SITE_ORIGIN = "https://palaceofromanofficial.com";
const SITEMAP_INDEX = `${SITE_ORIGIN}/sitemap.xml`;
const PRODUCTS_SITEMAP = `${SITE_ORIGIN}/sitemap-products.xml`;
const GSC_GATEWAY = "https://connector-gateway.lovable.dev/google_search_console";
const SITE = "sc-domain:palaceofromanofficial.com";
const SITE_ENCODED = encodeURIComponent(SITE);
const LOCALES = ["es", "fr", "ja", "it", "de"] as const;

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

// ────────────────────────────────────────────────────────────────────────────
// 1. Sitemap sync
// ────────────────────────────────────────────────────────────────────────────

function extractLocs(xml: string): string[] {
  const out: string[] = [];
  const re = /<loc>\s*([^<\s]+)\s*<\/loc>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml)) !== null) out.push(m[1]);
  return out;
}

async function fetchText(url: string): Promise<string> {
  const res = await fetch(url, { headers: { "User-Agent": "PORGscMonitor/1.0" } });
  if (!res.ok) throw new Error(`fetch ${url} → ${res.status}`);
  return res.text();
}

function classifyPath(url: string): { page_group: string; locale: string | null } {
  try {
    const u = new URL(url);
    const path = u.pathname;
    let locale: string | null = null;
    let rest = path;
    const seg = path.split("/").filter(Boolean);
    if (seg.length && (LOCALES as readonly string[]).includes(seg[0])) {
      locale = seg[0];
      rest = "/" + seg.slice(1).join("/");
    }
    if (rest.startsWith("/product/") || rest === "/product") return { page_group: "product", locale };
    if (rest.startsWith("/products/") || rest === "/products") return { page_group: "legacy-products", locale };
    if (rest.startsWith("/collection/") || rest === "/collection") return { page_group: "collection", locale };
    if (rest.startsWith("/brand/") || rest === "/brand") return { page_group: "brand", locale };
    if (rest.startsWith("/journal")) return { page_group: "journal", locale };
    if (rest === "/" || rest === "") return { page_group: "home", locale };
    return { page_group: "other", locale };
  } catch {
    return { page_group: "other", locale: null };
  }
}

export interface SitemapSyncResult {
  fetched: number;
  upserted: number;
  by_group: Record<string, number>;
}

export async function syncSitemapUrls(): Promise<SitemapSyncResult> {
  // Pull the index and follow product sitemaps; cap to 5k urls.
  const allUrls = new Set<string>();
  try {
    const indexXml = await fetchText(SITEMAP_INDEX);
    const subSitemaps = extractLocs(indexXml).filter(
      (u) => u.includes("sitemap-product") || u.endsWith("/sitemap-products.xml"),
    );
    if (subSitemaps.length === 0) subSitemaps.push(PRODUCTS_SITEMAP);
    for (const sm of subSitemaps.slice(0, 10)) {
      try {
        const xml = await fetchText(sm);
        for (const loc of extractLocs(xml)) allUrls.add(loc);
        if (allUrls.size >= 5000) break;
      } catch (e) {
        console.error("[sitemap-sync] sub sitemap failed", sm, e);
      }
    }
  } catch (e) {
    console.error("[sitemap-sync] index failed, falling back to products", e);
    try {
      const xml = await fetchText(PRODUCTS_SITEMAP);
      for (const loc of extractLocs(xml)) allUrls.add(loc);
    } catch (e2) {
      console.error("[sitemap-sync] products sitemap failed too", e2);
    }
  }

  const rows = Array.from(allUrls)
    .slice(0, 5000)
    .map((url) => {
      const { page_group, locale } = classifyPath(url);
      return {
        url,
        page_group,
        locale,
        source: "sitemap",
        active: true,
        last_synced_at: new Date().toISOString(),
      };
    });

  const by_group: Record<string, number> = {};
  for (const r of rows) by_group[r.page_group] = (by_group[r.page_group] ?? 0) + 1;

  // Upsert in chunks of 500.
  let upserted = 0;
  for (let i = 0; i < rows.length; i += 500) {
    const chunk = rows.slice(i, i + 500);
    const { error, count } = await supabaseAdmin
      .from("gsc_monitored_urls")
      .upsert(chunk, { onConflict: "url", count: "exact" });
    if (error) {
      console.error("[sitemap-sync] upsert failed", error);
      throw new Error(`Sitemap upsert failed: ${error.message}`);
    }
    upserted += count ?? chunk.length;
  }

  return { fetched: rows.length, upserted, by_group };
}

// ────────────────────────────────────────────────────────────────────────────
// 2. Thresholds
// ────────────────────────────────────────────────────────────────────────────

export type AlertThreshold = {
  id: string;
  scope_type: "global" | "page_group";
  scope_value: string | null;
  impressions_drop_pct: number;
  clicks_drop_pct: number;
  sitemap_error_min: number;
  position_warn_above: number | null;
  min_impressions_floor: number;
  min_clicks_floor: number;
  active: boolean;
};

export async function getThresholds(): Promise<AlertThreshold[]> {
  const { data, error } = await supabaseAdmin
    .from("gsc_alert_thresholds")
    .select(
      "id, scope_type, scope_value, impressions_drop_pct, clicks_drop_pct, sitemap_error_min, position_warn_above, min_impressions_floor, min_clicks_floor, active",
    )
    .order("scope_type", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as AlertThreshold[];
}

export async function getGlobalThreshold(): Promise<AlertThreshold> {
  const all = await getThresholds();
  const g = all.find((t) => t.scope_type === "global" && t.active);
  if (g) return g;
  // Synthesize default if missing.
  return {
    id: "default",
    scope_type: "global",
    scope_value: null,
    impressions_drop_pct: 40,
    clicks_drop_pct: 50,
    sitemap_error_min: 1,
    position_warn_above: null,
    min_impressions_floor: 20,
    min_clicks_floor: 5,
    active: true,
  };
}

export type UpsertThresholdInput = {
  id?: string;
  scope_type: "global" | "page_group";
  scope_value: string | null;
  impressions_drop_pct: number;
  clicks_drop_pct: number;
  sitemap_error_min: number;
  position_warn_above: number | null;
  min_impressions_floor: number;
  min_clicks_floor: number;
  active: boolean;
};

export async function upsertThreshold(input: UpsertThresholdInput): Promise<void> {
  const row = {
    scope_type: input.scope_type,
    scope_value: input.scope_type === "global" ? null : input.scope_value,
    impressions_drop_pct: Math.max(0, Math.min(100, input.impressions_drop_pct)),
    clicks_drop_pct: Math.max(0, Math.min(100, input.clicks_drop_pct)),
    sitemap_error_min: Math.max(0, Math.floor(input.sitemap_error_min)),
    position_warn_above: input.position_warn_above,
    min_impressions_floor: Math.max(0, Math.floor(input.min_impressions_floor)),
    min_clicks_floor: Math.max(0, Math.floor(input.min_clicks_floor)),
    active: input.active,
    updated_at: new Date().toISOString(),
  };
  if (input.id && input.id !== "default") {
    const { error } = await supabaseAdmin
      .from("gsc_alert_thresholds")
      .update(row)
      .eq("id", input.id);
    if (error) throw new Error(error.message);
    return;
  }
  const { error } = await supabaseAdmin
    .from("gsc_alert_thresholds")
    .upsert(row, { onConflict: "scope_type,scope_value" });
  if (error) throw new Error(error.message);
}

export async function deleteThreshold(id: string): Promise<void> {
  const { error } = await supabaseAdmin.from("gsc_alert_thresholds").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

// ────────────────────────────────────────────────────────────────────────────
// 3. Redirect audit
// ────────────────────────────────────────────────────────────────────────────

async function checkRedirect(url: string): Promise<{
  url: string;
  status: number;
  location: string | null;
  locale: string | null;
}> {
  const locale = classifyPath(url).locale;
  try {
    const res = await fetch(url, {
      method: "HEAD",
      redirect: "manual",
      headers: { "User-Agent": "PORGscMonitor/1.0 RedirectAudit" },
    });
    return {
      url,
      status: res.status,
      location: res.headers.get("location"),
      locale,
    };
  } catch (e) {
    console.error("[redirect-audit]", url, e);
    return { url, status: 0, location: null, locale };
  }
}

async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let i = 0;
  async function worker() {
    while (true) {
      const idx = i++;
      if (idx >= items.length) return;
      out[idx] = await fn(items[idx]);
    }
  }
  await Promise.all(Array.from({ length: limit }, () => worker()));
  return out;
}

export interface RedirectAuditResult {
  id: string;
  total: number;
  status_301: number;
  status_404: number;
  status_200: number;
  status_other: number;
  by_locale: Record<string, { total: number; "301": number; "404": number; "200": number; other: number }>;
  results: Array<{ url: string; status: number; location: string | null; locale: string | null }>;
}

/**
 * Build a sample of legacy /products and /{locale}/products URLs by rewriting
 * the canonical /product/ URLs from the monitored set. HEAD-checks each.
 */
export async function runRedirectAudit(limit = 60): Promise<RedirectAuditResult> {
  const { data: monitored, error } = await supabaseAdmin
    .from("gsc_monitored_urls")
    .select("url")
    .eq("page_group", "product")
    .eq("active", true)
    .order("last_synced_at", { ascending: false })
    .limit(Math.max(1, Math.min(50, Math.floor(limit / (1 + LOCALES.length)))));
  if (error) throw new Error(error.message);

  const handles = new Set<string>();
  for (const r of monitored ?? []) {
    try {
      const u = new URL(r.url);
      const seg = u.pathname.split("/").filter(Boolean);
      const i = seg.indexOf("product");
      if (i >= 0 && seg[i + 1]) handles.add(seg[i + 1]);
    } catch {
      /* skip */
    }
  }

  const candidates: string[] = [];
  for (const h of handles) {
    candidates.push(`${SITE_ORIGIN}/products/${h}`);
    for (const loc of LOCALES) candidates.push(`${SITE_ORIGIN}/${loc}/products/${h}`);
  }
  const slice = candidates.slice(0, Math.max(1, limit));

  const results = await mapWithConcurrency(slice, 8, checkRedirect);

  let s301 = 0,
    s404 = 0,
    s200 = 0,
    sOther = 0;
  const byLocale: RedirectAuditResult["by_locale"] = {};
  for (const r of results) {
    const key = r.locale ?? "default";
    const bucket =
      byLocale[key] ?? (byLocale[key] = { total: 0, "301": 0, "404": 0, "200": 0, other: 0 });
    bucket.total++;
    if (r.status === 301 || r.status === 302 || r.status === 308) {
      s301++;
      bucket["301"]++;
    } else if (r.status === 404) {
      s404++;
      bucket["404"]++;
    } else if (r.status === 200) {
      s200++;
      bucket["200"]++;
    } else {
      sOther++;
      bucket.other++;
    }
  }

  const { data: inserted, error: insErr } = await supabaseAdmin
    .from("gsc_redirect_audits")
    .insert({
      total: results.length,
      status_301: s301,
      status_404: s404,
      status_200: s200,
      status_other: sOther,
      by_locale: byLocale,
      results,
    })
    .select("id")
    .single();
  if (insErr) throw new Error(insErr.message);

  return {
    id: inserted!.id as string,
    total: results.length,
    status_301: s301,
    status_404: s404,
    status_200: s200,
    status_other: sOther,
    by_locale: byLocale,
    results,
  };
}

export async function getLatestRedirectAudit(): Promise<{
  id: string;
  run_at: string;
  total: number;
  status_301: number;
  status_404: number;
  status_200: number;
  status_other: number;
  by_locale: Record<string, unknown>;
  results: Array<{ url: string; status: number; location: string | null; locale: string | null }>;
} | null> {
  const { data, error } = await supabaseAdmin
    .from("gsc_redirect_audits")
    .select("id, run_at, total, status_301, status_404, status_200, status_other, by_locale, results")
    .order("run_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return data as any;
}

// ────────────────────────────────────────────────────────────────────────────
// 4. URL Inspection
// ────────────────────────────────────────────────────────────────────────────

/**
 * Attempt a URL Inspection via the Lovable connector gateway.
 * The gateway exposes /webmasters/v3/ and /siteVerification/v1/; URL inspection
 * lives under /v1/urlInspection/index:inspect. Try it and fall back to manual.
 */
export async function tryInspectUrl(url: string): Promise<{
  ok: boolean;
  data?: unknown;
  error?: string;
}> {
  const endpoint = `${GSC_GATEWAY}/v1/urlInspection/index:inspect`;
  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: gscHeaders(),
      body: JSON.stringify({ inspectionUrl: url, siteUrl: SITE }),
    });
    if (!res.ok) {
      const text = await res.text();
      return { ok: false, error: `HTTP ${res.status}: ${text.slice(0, 300)}` };
    }
    return { ok: true, data: await res.json() };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "unknown" };
  }
}

export interface CaptureInspectionInput {
  url: string;
  // For manual capture, raw JSON from GSC's URL Inspection panel.
  manualResult?: unknown;
  notes?: string;
  capturedBy?: string;
}

export async function captureUrlInspection(
  input: CaptureInspectionInput,
): Promise<{ id: string; capture_source: "api" | "manual"; verdict: string | null }> {
  let result: unknown = input.manualResult;
  let source: "api" | "manual" = input.manualResult ? "manual" : "api";

  if (!input.manualResult) {
    const r = await tryInspectUrl(input.url);
    if (!r.ok) {
      throw new Error(
        `URL Inspection API not reachable (${r.error ?? "unknown"}). Paste the result from GSC manually instead.`,
      );
    }
    result = r.data;
    source = "api";
  }

  // Extract common fields from URL Inspection schema.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const r = result as any;
  const indexStatus = r?.inspectionResult?.indexStatusResult ?? r?.indexStatusResult ?? null;

  const verdict = indexStatus?.verdict ?? null;
  const coverage_state = indexStatus?.coverageState ?? null;
  const indexing_state = indexStatus?.indexingState ?? null;
  const last_crawl_time = indexStatus?.lastCrawlTime ?? null;
  const page_fetch_state = indexStatus?.pageFetchState ?? null;
  const robots_txt_state = indexStatus?.robotsTxtState ?? null;

  const { data, error } = await supabaseAdmin
    .from("gsc_url_inspections")
    .insert({
      url: input.url,
      inspection_result: result ?? {},
      verdict,
      coverage_state,
      indexing_state,
      last_crawl_time,
      page_fetch_state,
      robots_txt_state,
      capture_source: source,
      captured_by: input.capturedBy ?? null,
      notes: input.notes ?? null,
    })
    .select("id, capture_source, verdict")
    .single();
  if (error) throw new Error(error.message);
  return {
    id: data!.id as string,
    capture_source: data!.capture_source as "api" | "manual",
    verdict: (data!.verdict as string | null) ?? null,
  };
}

export type UrlInspectionRow = {
  id: string;
  url: string;
  verdict: string | null;
  coverage_state: string | null;
  indexing_state: string | null;
  last_crawl_time: string | null;
  page_fetch_state: string | null;
  robots_txt_state: string | null;
  capture_source: string;
  captured_at: string;
  notes: string | null;
};

export async function listInspections(limit = 50): Promise<UrlInspectionRow[]> {
  const { data, error } = await supabaseAdmin
    .from("gsc_url_inspections")
    .select(
      "id, url, verdict, coverage_state, indexing_state, last_crawl_time, page_fetch_state, robots_txt_state, capture_source, captured_at, notes",
    )
    .order("captured_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return (data ?? []) as UrlInspectionRow[];
}

// ────────────────────────────────────────────────────────────────────────────
// Monitored URL helpers (for dashboard listing)
// ────────────────────────────────────────────────────────────────────────────

export type MonitoredUrlRow = {
  id: string;
  url: string;
  page_group: string;
  locale: string | null;
  source: string;
  active: boolean;
  last_synced_at: string;
};

export async function listMonitoredUrls(args: {
  page_group?: string;
  limit?: number;
}): Promise<{ rows: MonitoredUrlRow[]; counts: Record<string, number>; total: number }> {
  const { data: counts } = await supabaseAdmin
    .from("gsc_monitored_urls")
    .select("page_group", { count: "exact", head: false });
  const cMap: Record<string, number> = {};
  for (const r of counts ?? []) cMap[r.page_group as string] = (cMap[r.page_group as string] ?? 0) + 1;

  let q = supabaseAdmin
    .from("gsc_monitored_urls")
    .select("id, url, page_group, locale, source, active, last_synced_at")
    .order("last_synced_at", { ascending: false })
    .limit(args.limit ?? 100);
  if (args.page_group) q = q.eq("page_group", args.page_group);
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return {
    rows: (data ?? []) as MonitoredUrlRow[],
    counts: cMap,
    total: Object.values(cMap).reduce((s, n) => s + n, 0),
  };
}
