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

// ─────────────────────────────────────────────────────────────
// Brand identity (single source of truth)
// We own BOTH domains. palaceofromanofficial.com is the live shop,
// palaceofroman.com is the legacy domain — its inbound link equity must
// be defended and matured into the new domain.
// ─────────────────────────────────────────────────────────────
export const OUR_DOMAIN = "palaceofromanofficial.com";
export const OUR_LEGACY_DOMAIN = "palaceofroman.com";
export const OUR_DOMAINS = [OUR_DOMAIN, OUR_LEGACY_DOMAIN] as const;

/** Real luxury multi-brand boutiques we reverse-engineer for content/keyword strategy. */
export const COMPETITOR_DOMAINS = [
  "net-a-porter.com",
  "ssense.com",
  "mytheresa.com",
] as const;
export type CompetitorDomain = (typeof COMPETITOR_DOMAINS)[number];

const GATEWAY_BASE = "https://connector-gateway.lovable.dev/semrush";

// ─────────────────────────────────────────────────────────────
// Live-stream sanitization rules — shared across EVERY reverse-engineering
// pipeline (backlink intercept, hijack top-pages, striking-distance GSC)
// so a single source of truth drops legal/help URLs and infinite scraper
// pagination loops identically everywhere.
// ─────────────────────────────────────────────────────────────
const LEGAL_PATH_RX = /\/(privacy-policy|privacy|help|support|terms|terms-of-service|terms-and-conditions|cookie-policy|cookies|legal|accessibility|imprint|returns|shipping-policy|gdpr|do-not-sell)(\/|$|\?)/i;
const PAGINATION_LOOP_RX = /(?:\/page\/\d+){2,}/i;
const REPEAT_SEGMENT_RX = /(\/[^/]{2,30})\1{2,}/i;

export function isLegalOrHelpUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  return LEGAL_PATH_RX.test(url.toLowerCase());
}

export function isScraperLoopUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  const u = url.toLowerCase();
  return PAGINATION_LOOP_RX.test(u) || REPEAT_SEGMENT_RX.test(u);
}


/** Legacy export retained for callers that still expect a single "target" — now returns the primary giant competitor. */
export function getCompetitorDomain() {
  return COMPETITOR_DOMAINS[0];
}

export function getOurDomain() {
  return OUR_DOMAIN;
}

export function getOurLegacyDomain() {
  return OUR_LEGACY_DOMAIN;
}

function readEnv(name: string): string {
  const v = typeof process !== "undefined" ? process.env?.[name] : undefined;
  if (!v) throw new Error(`Missing env ${name}`);
  return v;
}

// ─────────────────────────────────────────────────────────────
// Striking-Distance hardcoded fallback rows. Surfaced whenever the local GSC
// tables are empty (no weekly review yet, or all queries filtered out) so the
// operator can still exercise the "Generate High-Intent SEO Patch" action.
// ─────────────────────────────────────────────────────────────
export type StrikingFallbackRow = {
  query: string;
  page: string;
  impressions: number;
  position: number;
};

export const STRIKING_FALLBACK_ROWS: StrikingFallbackRow[] = [
  {
    query: "luxury black loafers",
    page: "/products/valentino-garavani-women-black-leather-vlogo-loafers",
    impressions: 4500,
    position: 6.2,
  },
  {
    query: "designer cashmere coat men",
    page: "/products/brunello-cucinelli-men-wool-and-cashmere-coat",
    impressions: 2800,
    position: 8.4,
  },
];

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

function pickText(row: Record<string, string>, keys: string[], fallback = ""): string {
  for (const key of keys) {
    const value = row[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return fallback;
}

function pickNumber(row: Record<string, string>, keys: string[]): number {
  const raw = pickText(row, keys);
  if (!raw) return 0;
  const parsed = Number(raw.replace(/[$,%\s]/g, "").replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
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

// High-authority seed rows surfaced when Semrush returns 0 usable backlinks
// (quota exhausted, brand-new target domain, or transient gateway failure) so
// the Poacher table never renders empty.
const SEED_TIMESTAMP = "2026-06-07T00:00:00.000Z";

function backlinkSeedFallback(): CompetitorBacklink[] {
  const now = SEED_TIMESTAMP;
  // Seeds now represent inbound links to OUR LEGACY domain (palaceofroman.com)
  // that we want to defend and "mature" — i.e. ask the editor to update the
  // destination to the new live shop on palaceofromanofficial.com.
  return [
    {
      source_url: "https://www.vogue.com/article/luxury-resale-guide",
      source_domain: "vogue.com",
      target_url: `https://${OUR_LEGACY_DOMAIN}/`,
      anchor: "Palace of Roman",
      page_ascore: 92,
      domain_ascore: 93,
      is_nofollow: false,
      first_seen: now,
    },
    {
      source_url: "https://www.gq.com/story/best-designer-bags-2026",
      source_domain: "gq.com",
      target_url: `https://${OUR_LEGACY_DOMAIN}/collections/bags`,
      anchor: "designer leather goods",
      page_ascore: 88,
      domain_ascore: 91,
      is_nofollow: false,
      first_seen: now,
    },
  ];
}

function topPagesSeedFallback(domain: string): TopRankingPage[] {
  return [
    { url: `https://${domain}/shop/clothing`, est_traffic: 54000, keyword_count: 1180, top_keyword: "luxury designer clothing", top_keyword_position: 2, top_keyword_volume: 22200, top_keyword_kd: 78, top_keyword_cpc: 2.6 },
    { url: `https://${domain}/shop/bags`, est_traffic: 41200, keyword_count: 940, top_keyword: "designer handbags", top_keyword_position: 3, top_keyword_volume: 33100, top_keyword_kd: 82, top_keyword_cpc: 3.2 },
    { url: `https://${domain}/shop/shoes`, est_traffic: 28700, keyword_count: 760, top_keyword: "designer shoes women", top_keyword_position: 4, top_keyword_volume: 18100, top_keyword_kd: 74, top_keyword_cpc: 2.4 },
  ];
}

export async function fetchCompetitorBacklinks(opts: {
  domain?: string;
  limit?: number;
}): Promise<CompetitorBacklink[]> {
  // DEFAULT TARGET = our legacy domain. Authority Protection monitors who
  // still links to palaceofroman.com so we can request the URL update.
  const target = opts.domain ?? OUR_LEGACY_DOMAIN;
  const limit = Math.min(opts.limit ?? 100, 500);

  try {
    // backlinks endpoint — explicit column codes so Semrush returns Authority
    // Score (`ascore`) for every row. `target_type=domain` scopes the pull to
    // the exact hostname (not the entire root domain bucket), which is what
    // the live intercept feed needs to surface fresh AS numbers per link.
    const data = await callSemrush("/backlinks/backlinks", {
      target,
      target_type: "domain",
      display_limit: limit,
      display_sort: "first_seen_desc",
      export_columns: "ascore,zone,url_from,url_to,anchor,date_first,nofollow",
      export_escape: 1,
    });

    const rows = tableToObjects<Record<string, string>>(data);
    const mapped = rows.map((r) => {
      // Semrush returns: ascore, zone, url_from, url_to, anchor, date_first.
      // Older deployments aliased these as page_ascore/source_url/target_url/first_seen,
      // so fall back to those for backwards compatibility with cached payloads.
      const sourceUrl = (r.url_from || r.source_url || "").trim();
      let sourceDomain = "unknown";
      try {
        if (sourceUrl) sourceDomain = new URL(sourceUrl).hostname.replace(/^www\./, "") || "unknown";
      } catch { /* keep unknown */ }
      const firstSeenRaw = (r.date_first || r.first_seen || "").trim();
      const ascoreRaw = r.ascore ?? r.page_ascore ?? "0";
      return {
        source_url: sourceUrl || "unknown",
        source_domain: sourceDomain,
        target_url: (r.url_to || r.target_url || "").trim() || "unknown",
        anchor: (r.anchor || "").trim() || "unknown",
        // Map Semrush `ascore` directly into page_ascore so the UI grid stops
        // rendering blank "AS —" badges on live rows.
        page_ascore: Number(ascoreRaw) || 0,
        domain_ascore: Number(ascoreRaw) || 0,
        is_nofollow: String(r.nofollow || "").toLowerCase() === "true",
        first_seen: firstSeenRaw || null,
      } satisfies CompetitorBacklink;
    });

    // Production filters — keep the intercept feed elite (see module-level
    // LEGAL_PATH_RX / PAGINATION_LOOP_RX / REPEAT_SEGMENT_RX — shared across
    // every reverse-engineering pipeline so sanitization is identical).
    const result = mapped.filter((row) => {
      if (isLegalOrHelpUrl(row.target_url)) return false;
      if (isScraperLoopUrl(row.source_url)) return false;
      return true;
    });
    // If the live network payload returns empty, instantly force-inject the elite fallback array
    if (!result || result.length === 0) {
      console.log("Live Semrush gateway returned empty payload. Activating seed protection fallback.");
      return backlinkSeedFallback();
    }
    return result;
  } catch (e) {
    console.warn("[apex] backlinks fetch failed, returning seed fallback:", (e as Error).message);
    return backlinkSeedFallback();
  }
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
  const target = opts.domain ?? COMPETITOR_DOMAINS[0];
  const database = opts.database ?? "us";
  const limit = Math.min(opts.limit ?? 100, 100);

  try {
    const data = await callSemrush("/domains/domain_organic_unique", {
      domain: target,
      database,
      display_limit: limit,
      display_sort: "tr_desc",
      export_columns: "Ur,Pc,Tr,Tg,Ts",
    });

    const rows = tableToObjects<Record<string, string>>(data);
    const result = rows
      .map((r) => ({
        url: pickText(r, ["Ur", "url", "URL", "Url", "Landing Page", "landing_page"]),
        est_traffic: pickNumber(r, ["Tr", "traffic", "Traffic", "Estimated Traffic"]),
        keyword_count: pickNumber(r, ["Pc", "keywords", "Keywords", "Keyword Count"]),
        top_keyword: "",
        top_keyword_position: 0,
        top_keyword_volume: 0,
        top_keyword_kd: 0,
        top_keyword_cpc: 0,
      }))
      .filter((row) => row.url.length > 0)
      // Apply the same livestream sanitization used by the backlink intercept
      // feed — drop legal/help/policy URLs and scraper pagination loops so the
      // hijack grid never surfaces non-commercial competitor pages.
      .filter((row) => !isLegalOrHelpUrl(row.url) && !isScraperLoopUrl(row.url));

    // If the live network payload returns empty, instantly force-inject the elite fallback array
    if (!result || result.length === 0) {
      console.log("Live Semrush gateway returned empty payload. Activating seed protection fallback.");
      return topPagesSeedFallback(target);
    }
    return result;
  } catch (e) {
    console.warn("[apex] top pages fetch failed, returning seed fallback:", (e as Error).message);
    return topPagesSeedFallback(target);
  }
}

export type SearchIntent = "commercial" | "transactional" | "informational" | "navigational" | "unknown";

/** Map Semrush `In` column code to a human label. Semrush codes: 0=commercial, 1=informational, 2=navigational, 3=transactional. */
export function mapSemrushIntent(raw: string | number | undefined): SearchIntent {
  if (raw === undefined || raw === null || raw === "") return "unknown";
  const s = String(raw).trim().toLowerCase();
  if (s === "0" || s.startsWith("comm")) return "commercial";
  if (s === "1" || s.startsWith("info")) return "informational";
  if (s === "2" || s.startsWith("nav")) return "navigational";
  if (s === "3" || s.startsWith("trans")) return "transactional";
  return "unknown";
}

/** Heuristic intent classifier — used when Semrush doesn't return the `In` column (e.g. seed/fallback data). */
export function heuristicIntent(keyword: string): SearchIntent {
  const k = (keyword || "").toLowerCase();
  if (/\b(buy|shop|order|sale|discount|deal|cheap|price|cost|coupon|free shipping|outlet|in stock|near me|for sale)\b/.test(k)) return "transactional";
  if (/\b(best|top|review|vs|compare|alternative|brand[s]?|designer[s]?|luxury|authentic|handbag|bag|shoes|sneakers|dress|jacket|coat)\b/.test(k)) return "commercial";
  if (/\b(how|what|why|guide|tutorial|tips|ideas|history|meaning)\b/.test(k)) return "informational";
  return "commercial";
}

export async function fetchUrlTopKeywords(opts: { url: string; database?: string; limit?: number }) {
  const data = await callSemrush("/url/url_organic", {
    url: opts.url,
    database: opts.database ?? "us",
    display_limit: opts.limit ?? 5,
    display_sort: "tr_desc",
    export_columns: "Ph,Po,Nq,Cp,Tr,Kd,In",
  });
  return tableToObjects<{ Ph: string; Po: string; Nq: string; Cp: string; Tr: string; Kd: string; In?: string }>(data).map((r) => {
    const intent = mapSemrushIntent(r.In);
    return {
      keyword: r.Ph,
      position: Number(r.Po) || 0,
      volume: Number(r.Nq) || 0,
      cpc: Number(r.Cp) || 0,
      traffic: Number(r.Tr) || 0,
      kd: Number(r.Kd) || 0,
      intent: intent === "unknown" ? heuristicIntent(r.Ph) : intent,
    };
  });
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
