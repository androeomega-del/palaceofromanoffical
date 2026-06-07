/**
 * Apex Predator — server-only helpers.
 *
 * - Semrush connector gateway client (backlinks, domain organic, keyword
 *   difficulty lookups). All requests go through
 *   https://connector-gateway.lovable.dev/semrush/... with the
 *   LOVABLE_API_KEY + SEMRUSH_API_KEY headers.
 * - Light HTML-text extractor for the Poacher module (so the LLM can pitch
 *   based on the actual linking page's topic, not just the URL).
 * - Scoring helpers (impact score, CTR-by-position curve).
 *
 * Never import from client-side files.
 */

const COMPETITOR_DOMAIN = "palaceofromanofficial.com";
const GATEWAY_BASE = "https://connector-gateway.lovable.dev/semrush";

export function getCompetitorDomain() {
  return COMPETITOR_DOMAIN;
}

function readEnv(name: string): string {
  const v = typeof process !== "undefined" ? process.env?.[name] : undefined;
  if (!v) throw new Error(`Missing env ${name}`);
  return v;
}

export class SemrushQuotaError extends Error {
  constructor(public bodyText: string) {
    super("Semrush quota exhausted (ERROR 134). Reset on the Semrush plan cycle or upgrade.");
    this.name = "SemrushQuotaError";
  }
}

export type SemrushTable = {
  columnNames: string[];
  rows: string[][];
};

async function callSemrush(path: string, params: Record<string, string | number | undefined>): Promise<SemrushTable> {
  const lovableKey = readEnv("LOVABLE_API_KEY");
  const semrushKey = readEnv("SEMRUSH_API_KEY");

  const url = new URL(`${GATEWAY_BASE}${path}`);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, String(v));
  }

  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${lovableKey}`,
      "X-Connection-Api-Key": semrushKey,
      "Allow-Limit-Offset": "true",
    },
  });

  const text = await res.text();
  if (text.includes("ERROR 134 :: TOTAL LIMIT EXCEEDED") || text.includes('"error"')) {
    if (text.includes("ERROR 134")) throw new SemrushQuotaError(text);
  }

  if (!res.ok) {
    throw new Error(`Semrush gateway ${res.status} ${path}: ${text.slice(0, 240)}`);
  }

  let json: { data?: SemrushTable; status?: number; error?: string };
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error(`Semrush gateway non-JSON response on ${path}: ${text.slice(0, 240)}`);
  }
  if (json.error) {
    if (json.error.includes("ERROR 134")) throw new SemrushQuotaError(json.error);
    throw new Error(`Semrush ${path}: ${json.error}`);
  }
  if (!json.data) return { columnNames: [], rows: [] };
  return json.data;
}

function tableToObjects<T extends Record<string, string>>(table: SemrushTable): T[] {
  const cols = table.columnNames ?? [];
  return (table.rows ?? []).map((row) => {
    const o: Record<string, string> = {};
    cols.forEach((c, i) => {
      o[c] = row[i] ?? "";
    });
    return o as T;
  });
}

// =================================================================
// Backlinks
// =================================================================

export type CompetitorBacklink = {
  source_url: string;
  source_domain: string;
  target_url: string;
  anchor: string;
  page_ascore: number;
  domain_ascore: number;
  is_nofollow: boolean;
  first_seen: string | null;
};

export async function fetchCompetitorBacklinks(opts: {
  domain?: string;
  limit?: number;
}): Promise<CompetitorBacklink[]> {
  const target = opts.domain ?? COMPETITOR_DOMAIN;
  const limit = Math.min(opts.limit ?? 100, 500);

  // backlinks endpoint: returns source_url, anchor, ascore, nofollow, first_seen
  const data = await callSemrush("/backlinks/backlinks", {
    target,
    target_type: "root_domain",
    display_limit: limit,
    display_sort: "first_seen_desc",
    export_columns: "page_ascore,source_url,source_title,target_url,anchor,first_seen,nofollow",
  });

  const rows = tableToObjects<Record<string, string>>(data);
  return rows.map((r) => {
    const sourceUrl = (r.source_url || r["source_url"] || "").trim();
    let sourceDomain = "unknown";
    try {
      if (sourceUrl) sourceDomain = new URL(sourceUrl).hostname.replace(/^www\./, "") || "unknown";
    } catch { /* keep unknown */ }
    // Semrush may return dates as "YYYY-MM-DD HH:MM:SS" or empty strings — keep raw, parsing happens downstream via safeISO.
    const firstSeenRaw = (r.first_seen || "").trim();
    return {
      source_url: sourceUrl || "unknown",
      source_domain: sourceDomain,
      target_url: (r.target_url || "").trim() || "unknown",
      anchor: (r.anchor || "").trim() || "unknown",
      page_ascore: Number(r.page_ascore || 0) || 0,
      domain_ascore: 0,
      is_nofollow: String(r.nofollow || "").toLowerCase() === "true",
      first_seen: firstSeenRaw || null,
    } satisfies CompetitorBacklink;
  });
}

// =================================================================
// Domain organic — top URLs and their keywords
// =================================================================

export type TopRankingPage = {
  url: string;
  est_traffic: number;
  keyword_count: number;
  top_keyword: string;
  top_keyword_position: number;
  top_keyword_volume: number;
  top_keyword_kd: number;
  top_keyword_cpc: number;
};

export async function fetchCompetitorTopPages(opts: {
  domain?: string;
  database?: string;
  limit?: number;
}): Promise<TopRankingPage[]> {
  const target = opts.domain ?? COMPETITOR_DOMAIN;
  const database = opts.database ?? "us";
  const limit = Math.min(opts.limit ?? 100, 100);

  const data = await callSemrush("/domains/domain_organic_unique", {
    domain: target,
    database,
    display_limit: limit,
    display_sort: "tr_desc",
    export_columns: "Ur,Pc,Tr,Tg,Ts",
  });

  const rows = tableToObjects<Record<string, string>>(data);
  return rows.map((r) => ({
    url: r.Ur || "",
    est_traffic: Number(r.Tr || 0) || 0,
    keyword_count: Number(r.Pc || 0) || 0,
    top_keyword: "",
    top_keyword_position: 0,
    top_keyword_volume: 0,
    top_keyword_kd: 0,
    top_keyword_cpc: 0,
  }));
}

export async function fetchUrlTopKeywords(opts: { url: string; database?: string; limit?: number }) {
  const data = await callSemrush("/url/url_organic", {
    url: opts.url,
    database: opts.database ?? "us",
    display_limit: opts.limit ?? 5,
    display_sort: "tr_desc",
    export_columns: "Ph,Po,Nq,Cp,Tr,Kd",
  });
  return tableToObjects<{ Ph: string; Po: string; Nq: string; Cp: string; Tr: string; Kd: string }>(data).map((r) => ({
    keyword: r.Ph,
    position: Number(r.Po) || 0,
    volume: Number(r.Nq) || 0,
    cpc: Number(r.Cp) || 0,
    traffic: Number(r.Tr) || 0,
    kd: Number(r.Kd) || 0,
  }));
}

// =================================================================
// Keyword difficulty (batch) — phrase_these
// =================================================================

export async function fetchKeywordDifficulty(opts: { phrases: string[]; database?: string }): Promise<Map<string, { kd: number; volume: number; cpc: number }>> {
  const out = new Map<string, { kd: number; volume: number; cpc: number }>();
  if (opts.phrases.length === 0) return out;
  const batches: string[][] = [];
  for (let i = 0; i < opts.phrases.length; i += 100) batches.push(opts.phrases.slice(i, i + 100));
  for (const batch of batches) {
    const data = await callSemrush("/keywords/phrase_these", {
      phrase: batch.join(";"),
      database: opts.database ?? "us",
      export_columns: "Ph,Nq,Cp,Kd",
    });
    for (const r of tableToObjects<{ Ph: string; Nq: string; Cp: string; Kd: string }>(data)) {
      out.set(r.Ph.toLowerCase(), {
        kd: Number(r.Kd) || 0,
        volume: Number(r.Nq) || 0,
        cpc: Number(r.Cp) || 0,
      });
    }
  }
  return out;
}

// =================================================================
// Semrush account quota
// =================================================================

export async function fetchSemrushQuota(): Promise<{ used: number; limit: number } | null> {
  try {
    const data = await callSemrush("/user/limits", {});
    const rows = tableToObjects<Record<string, string>>(data);
    if (rows.length === 0) return null;
    const r = rows[0];
    const used = Number(r.units_used ?? r.daily_units_used ?? 0) || 0;
    const limit = Number(r.units_limit ?? r.daily_units_limit ?? 0) || 0;
    return { used, limit };
  } catch (e) {
    console.warn("[apex] semrush quota fetch failed:", (e as Error).message);
    return null;
  }
}

// =================================================================
// Lightweight HTML → text excerpt
// =================================================================

export async function fetchPageExcerpt(url: string, maxChars = 1500): Promise<string> {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; PalaceOfRomanBot/1.0)",
        Accept: "text/html,application/xhtml+xml",
      },
      // 10s budget — don't let one slow editor blog stall the run
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) return "";
    const html = await res.text();
    // Cheap readability: strip scripts/styles, then tags, collapse whitespace
    const cleaned = html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    return cleaned.slice(0, maxChars);
  } catch (e) {
    console.warn("[apex] excerpt fetch failed:", url, (e as Error).message);
    return "";
  }
}

// =================================================================
// Scoring
// =================================================================

// Estimated CTR by Google position (rough industry mean — used only for
// relative impact ranking, not absolute traffic claims).
const CTR_CURVE: Record<number, number> = {
  1: 0.318, 2: 0.158, 3: 0.099, 4: 0.069, 5: 0.052,
  6: 0.04, 7: 0.032, 8: 0.026, 9: 0.022, 10: 0.019,
  11: 0.015, 12: 0.012, 13: 0.010, 14: 0.009, 15: 0.008,
};

export function ctrAt(position: number): number {
  const p = Math.max(1, Math.min(15, Math.round(position)));
  return CTR_CURVE[p] ?? 0.005;
}

export function ctrLiftToTop3(position: number): number {
  const current = ctrAt(position);
  const top3 = ctrAt(3);
  return Math.max(0, top3 - current);
}

export function impactScore(opts: { impressions: number; position: number; kd: number }): number {
  const lift = ctrLiftToTop3(opts.position);
  const kdFactor = 1 / Math.max(opts.kd, 10);
  return Math.round(opts.impressions * lift * kdFactor * 100);
}
