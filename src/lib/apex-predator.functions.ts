/**
 * Apex Predator — admin server functions.
 *
 * All functions are admin-guarded via `requireAdmin`. They orchestrate the
 * Semrush connector gateway + Lovable AI Gateway to power the command-center UI.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import {
  fetchCompetitorBacklinks,
  fetchCompetitorTopPages,
  fetchUrlTopKeywords,
  fetchKeywordDifficulty,
  fetchSemrushQuota,
  fetchPageExcerpt,
  ctrLiftToTop3,
  impactScore,
  getCompetitorDomain,
  SemrushQuotaError,
} from "@/lib/apex-predator.server";
import { callAi, BudgetExceededError } from "@/lib/ai-gateway.server";

/** Safely convert any date-ish value to an ISO string; falls back to now() on parse failure. */
function safeISO(input?: string | number | Date | null): string {
  try {
    if (input === undefined || input === null || input === "") return new Date().toISOString();
    const d = input instanceof Date ? input : new Date(input);
    const t = d.getTime();
    if (!Number.isFinite(t)) return new Date().toISOString();
    return d.toISOString();
  } catch {
    return new Date().toISOString();
  }
}

// =================================================================
// Status header (shared)
// =================================================================

export type ApexStatus = {
  competitor: string;
  semrushQuota: { used: number; limit: number } | null;
  lastRuns: { module: string; created_at: string; status: string; rows_processed: number | null; message: string | null }[];
};

export const getApexStatus = createServerFn({ method: "GET" })
  .middleware([requireAdmin])
  .handler(async (): Promise<ApexStatus> => {
    const [quota, runs] = await Promise.all([
      fetchSemrushQuota(),
      supabaseAdmin
        .from("apex_run_log")
        .select("module, created_at, status, rows_processed, message")
        .order("created_at", { ascending: false })
        .limit(8),
    ]);
    return {
      competitor: getCompetitorDomain(),
      semrushQuota: quota,
      lastRuns: (runs.data ?? []) as ApexStatus["lastRuns"],
    };
  });

async function logRun(module: string, status: "ok" | "error" | "quota", message: string | null, rows: number | null) {
  await supabaseAdmin.from("apex_run_log").insert({ module, status, message, rows_processed: rows });
}

// =================================================================
// MODULE 1 — Poacher Protocol
// =================================================================

export type PoacherRow = {
  id: string;
  source_url: string;
  source_domain: string;
  target_url: string | null;
  anchor: string | null;
  page_ascore: number | null;
  is_nofollow: boolean;
  is_net_new: boolean;
  first_seen_at: string;
  pitch_subject: string | null;
  pitch_body: string | null;
  pitch_generated_at: string | null;
  status: string;
};

const POACHER_SEEDS: PoacherRow[] = [
  {
    id: "seed-vogue", source_url: "https://www.vogue.com/article/luxury-resale-guide",
    source_domain: "vogue.com", target_url: "https://palaceofromanofficial.com/", anchor: "Palace of Roman",
    page_ascore: 92, is_nofollow: false, is_net_new: true,
    first_seen_at: new Date(Date.now() - 86_400_000).toISOString(),
    pitch_subject: null, pitch_body: null, pitch_generated_at: null, status: "seed",
  },
  {
    id: "seed-gq", source_url: "https://www.gq.com/story/best-designer-bags-2026",
    source_domain: "gq.com", target_url: "https://palaceofromanofficial.com/collections/bags", anchor: "designer leather goods",
    page_ascore: 88, is_nofollow: false, is_net_new: true,
    first_seen_at: new Date(Date.now() - 2 * 86_400_000).toISOString(),
    pitch_subject: null, pitch_body: null, pitch_generated_at: null, status: "seed",
  },
  {
    id: "seed-hb", source_url: "https://www.harpersbazaar.com/fashion/trends/loewe-spring-edit",
    source_domain: "harpersbazaar.com", target_url: "https://palaceofromanofficial.com/collections/loewe", anchor: "Loewe edit",
    page_ascore: 84, is_nofollow: true, is_net_new: false,
    first_seen_at: new Date(Date.now() - 5 * 86_400_000).toISOString(),
    pitch_subject: null, pitch_body: null, pitch_generated_at: null, status: "seed",
  },
];

export type PoacherFeedResponse = { rows: PoacherRow[]; error: string | null; seeded: boolean };

export const getPoacherFeed = createServerFn({ method: "GET" })
  .middleware([requireAdmin])
  .handler(async (): Promise<PoacherFeedResponse> => {
    try {
      const { data, error } = await supabaseAdmin
        .from("apex_competitor_backlinks")
        .select("id, source_url, source_domain, target_url, anchor, page_ascore, is_nofollow, is_net_new, first_seen_at, pitch_subject, pitch_body, pitch_generated_at, status")
        .order("page_ascore", { ascending: false })
        .order("first_seen_at", { ascending: false })
        .limit(200);
      if (error) {
        console.error("[apex/poacher] db error:", error.message);
        return { rows: POACHER_SEEDS, error: `DB: ${error.message}`, seeded: true };
      }
      const rows = (data ?? []) as PoacherRow[];
      if (rows.length === 0) return { rows: POACHER_SEEDS, error: null, seeded: true };
      return { rows, error: null, seeded: false };
    } catch (e) {
      console.error("[apex/poacher] unhandled:", (e as Error).message);
      return { rows: POACHER_SEEDS, error: (e as Error).message, seeded: true };
    }
  });

export const refreshPoacherFeed = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .handler(async () => {
    const competitor = getCompetitorDomain();
    try {
      const fresh = await fetchCompetitorBacklinks({ limit: 100 });
      // Snapshot known set BEFORE upsert so we can mark net-new accurately.
      const { data: existing } = await supabaseAdmin
        .from("apex_competitor_backlinks")
        .select("source_url")
        .eq("competitor_domain", competitor);
      const known = new Set((existing ?? []).map((r) => r.source_url));

      let inserted = 0;
      let updated = 0;
      for (const link of fresh) {
        if (!link.source_url) continue;
        const isNew = !known.has(link.source_url);
        const { error } = await supabaseAdmin
          .from("apex_competitor_backlinks")
          .upsert(
            {
              competitor_domain: competitor,
              source_url: link.source_url,
              source_domain: link.source_domain,
              target_url: link.target_url || null,
              anchor: link.anchor || null,
              page_ascore: link.page_ascore || null,
              is_nofollow: link.is_nofollow,
              first_seen_at: safeISO(link.first_seen),
              last_seen_at: safeISO(),
              is_net_new: isNew,
            },
            { onConflict: "competitor_domain,source_url" },
          );
        if (error) {
          console.warn("[apex/poacher] upsert failed:", error.message);
          continue;
        }
        if (isNew) inserted += 1;
        else updated += 1;
      }

      await logRun("poacher", "ok", `${inserted} new, ${updated} known`, fresh.length);
      return { inserted, updated, total: fresh.length };
    } catch (e) {
      const isQuota = e instanceof SemrushQuotaError;
      await logRun("poacher", isQuota ? "quota" : "error", (e as Error).message, 0);
      throw e;
    }
  });

const POR_BRIEF = `Palace of Roman is a luxury fashion boutique sourcing from a global network of authorised boutiques and distributors. Catalog includes maisons such as Gucci, Prada, Saint Laurent, Bottega Veneta, Loewe, Off-White, Balenciaga, Maison Margiela, Comme des Garçons, and other heritage and contemporary houses. Free worldwide shipping, authenticated stock, USD pricing. Site: palaceofroman.com.`;

export const draftPoacherPitch = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const { data: row, error } = await supabaseAdmin
      .from("apex_competitor_backlinks")
      .select("id, source_url, source_domain, anchor, target_url, page_excerpt")
      .eq("id", data.id)
      .single();
    if (error || !row) throw new Error("Backlink not found");

    let excerpt = row.page_excerpt;
    if (!excerpt) {
      excerpt = await fetchPageExcerpt(row.source_url);
      if (excerpt) {
        await supabaseAdmin.from("apex_competitor_backlinks").update({ page_excerpt: excerpt }).eq("id", row.id);
      }
    }

    const sys = `You write concise, editor-grade outreach emails for a luxury fashion publication's editor. Tone: confident, restrained, never spammy. Never mention Palace of Roman's wholesale source. Output JSON only with keys: subject (<=70 chars), body (180-260 words, 3 paragraphs, no greeting beyond first line, no signature line, plain text, no markdown).`;
    const user = `Brand brief:\n${POR_BRIEF}\n\nLinking page: ${row.source_url}\nLinking domain: ${row.source_domain}\nAnchor used for competitor: ${row.anchor || "(none)"}\nCompetitor target on that page: ${row.target_url || "(unknown)"}\n\nPage excerpt:\n${excerpt || "(no excerpt available — write a topic-agnostic pitch that flatters the publication and offers an editorial angle.)"}\n\nDraft a personalised pitch to the editor of this page asking them to either add or swap-in a link to a relevant Palace of Roman collection. Reference one specific detail from the page excerpt. Offer one exclusive editorial angle (e.g. a curated edit, an interview, a behind-the-craft note) the publication can run with. Do NOT mention the competitor by name.`;

    try {
      const res = await callAi({
        module: "apex/poacher",
        model: "google/gemini-3-flash-preview",
        system: sys,
        user,
        json: true,
        maxTokens: 700,
        temperature: 0.6,
      });
      let parsed: { subject?: string; body?: string } = {};
      try { parsed = JSON.parse(res.content); } catch { /* keep empty */ }
      const subject = (parsed.subject || "").slice(0, 120) || `Editorial collaboration — Palace of Roman`;
      const body = (parsed.body || "").trim() || res.content.trim();

      await supabaseAdmin
        .from("apex_competitor_backlinks")
        .update({
          pitch_subject: subject,
          pitch_body: body,
          pitch_generated_at: new Date().toISOString(),
          pitch_model: "google/gemini-3-flash-preview",
          status: "pitch_drafted",
        })
        .eq("id", row.id);
      return { subject, body };
    } catch (e) {
      if (e instanceof BudgetExceededError) throw e;
      throw e;
    }
  });

// =================================================================
// MODULE 2 — Hijack Feed (top ranking pages + blueprints)
// =================================================================

let _hijackCache: { at: number; rows: TopRankingPageEnriched[] } | null = null;
const HIJACK_TTL_MS = 6 * 60 * 60 * 1000; // 6h

export type TopRankingPageEnriched = {
  url: string;
  est_traffic: number;
  keyword_count: number;
  top_keyword: string;
  top_keyword_position: number;
  top_keyword_volume: number;
  top_keyword_kd: number;
  top_keyword_cpc: number;
};

const HIJACK_SEEDS: TopRankingPageEnriched[] = [
  { url: "https://palaceofromanofficial.com/collections/gucci", est_traffic: 4820, keyword_count: 312,
    top_keyword: "gucci handbags sale", top_keyword_position: 6, top_keyword_volume: 18100, top_keyword_kd: 71, top_keyword_cpc: 2.4 },
  { url: "https://palaceofromanofficial.com/collections/loewe-bags", est_traffic: 2640, keyword_count: 187,
    top_keyword: "loewe puzzle bag", top_keyword_position: 5, top_keyword_volume: 9900, top_keyword_kd: 64, top_keyword_cpc: 3.1 },
  { url: "https://palaceofromanofficial.com/collections/bottega-veneta", est_traffic: 1980, keyword_count: 142,
    top_keyword: "bottega veneta cassette", top_keyword_position: 8, top_keyword_volume: 6600, top_keyword_kd: 58, top_keyword_cpc: 2.0 },
];

export const getHijackFeed = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((d: unknown) => z.object({ force: z.boolean().optional() }).parse(d ?? {}))
  .handler(async ({ data }): Promise<{ rows: TopRankingPageEnriched[]; cachedAt: string; error: string | null; seeded: boolean }> => {
    if (!data.force && _hijackCache && Date.now() - _hijackCache.at < HIJACK_TTL_MS) {
      return { rows: _hijackCache.rows, cachedAt: new Date(_hijackCache.at).toISOString(), error: null, seeded: false };
    }
    try {
      const pages = await fetchCompetitorTopPages({ limit: 50 });
      const enriched: TopRankingPageEnriched[] = [];
      const TOP_N = Math.min(25, pages.length);
      for (let i = 0; i < TOP_N; i++) {
        const p = pages[i];
        try {
          const kws = await fetchUrlTopKeywords({ url: p.url, limit: 1 });
          const top = kws[0];
          enriched.push({
            ...p,
            top_keyword: top?.keyword ?? "",
            top_keyword_position: top?.position ?? 0,
            top_keyword_volume: top?.volume ?? 0,
            top_keyword_kd: top?.kd ?? 0,
            top_keyword_cpc: top?.cpc ?? 0,
          });
        } catch (innerErr) {
          if (innerErr instanceof SemrushQuotaError) throw innerErr;
          enriched.push(p);
        }
      }
      for (let i = TOP_N; i < pages.length; i++) enriched.push(pages[i]);

      if (enriched.length === 0) {
        await logRun("hijack", "ok", "empty result, served seeds", 0);
        return { rows: HIJACK_SEEDS, cachedAt: new Date().toISOString(), error: null, seeded: true };
      }
      _hijackCache = { at: Date.now(), rows: enriched };
      await logRun("hijack", "ok", `fetched ${enriched.length} pages`, enriched.length);
      return { rows: enriched, cachedAt: new Date().toISOString(), error: null, seeded: false };
    } catch (e) {
      const isQuota = e instanceof SemrushQuotaError;
      const msg = (e as Error).message;
      console.error("[apex/hijack] error:", msg);
      await logRun("hijack", isQuota ? "quota" : "error", msg, 0);
      return { rows: HIJACK_SEEDS, cachedAt: new Date().toISOString(), error: msg, seeded: true };
    }
  });

export type ContentBlueprint = {
  targetKeyword: string;
  searchIntent: string;
  intentBrief: string;
  semanticTerms: string[];
  outline: Array<{ h2: string; h3s: string[]; evidence: string }>;
  internalLinkTargets: string[];
  schemaTypes: string[];
  wordCount: number;
  eatSignals: string[];
  raw?: string;
};

export const generateContentBlueprint = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((d: unknown) => z.object({ url: z.string().url(), targetKeyword: z.string().optional() }).parse(d))
  .handler(async ({ data }): Promise<ContentBlueprint> => {
    let target = data.targetKeyword;
    if (!target) {
      try {
        const kws = await fetchUrlTopKeywords({ url: data.url, limit: 1 });
        target = kws[0]?.keyword;
      } catch { /* ignore */ }
    }
    if (!target) target = "luxury designer fashion";

    const sys = `You are an SEO content strategist for a luxury fashion boutique. Output JSON only.`;
    const user = `Competitor URL to outrank: ${data.url}\nTarget keyword: ${target}\nOur site: palaceofroman.com (Palace of Roman — luxury multi-brand boutique).\n\nReturn JSON with EXACTLY these keys:\n{\n  "targetKeyword": string,\n  "searchIntent": "transactional"|"commercial"|"informational"|"navigational",\n  "intentBrief": string (1-2 sentences),\n  "semanticTerms": string[] (12-20 entities/related terms a top-ranking page must cover),\n  "outline": [{ "h2": string, "h3s": string[], "evidence": string }] (5-8 sections),\n  "internalLinkTargets": string[] (5-8 Palace of Roman URL paths to link from this page, like "/collections/gucci"),\n  "schemaTypes": string[] (e.g. "Product", "BreadcrumbList", "ItemList"),\n  "wordCount": number,\n  "eatSignals": string[] (4-6 specific E-E-A-T enhancements like author bylines, sourcing notes, etc.)\n}`;

    const res = await callAi({
      module: "apex/hijack-blueprint",
      model: "google/gemini-3-flash-preview",
      system: sys,
      user,
      json: true,
      maxTokens: 1800,
      temperature: 0.4,
    });
    try {
      const parsed = JSON.parse(res.content) as Partial<ContentBlueprint>;
      return {
        targetKeyword: parsed.targetKeyword ?? target,
        searchIntent: parsed.searchIntent ?? "commercial",
        intentBrief: parsed.intentBrief ?? "",
        semanticTerms: parsed.semanticTerms ?? [],
        outline: parsed.outline ?? [],
        internalLinkTargets: parsed.internalLinkTargets ?? [],
        schemaTypes: parsed.schemaTypes ?? [],
        wordCount: parsed.wordCount ?? 0,
        eatSignals: parsed.eatSignals ?? [],
      };
    } catch {
      return {
        targetKeyword: target, searchIntent: "", intentBrief: "", semanticTerms: [],
        outline: [], internalLinkTargets: [], schemaTypes: [], wordCount: 0, eatSignals: [],
        raw: res.content,
      };
    }
  });


// =================================================================
// MODULE 3 — Striking-Distance Impact Pipeline
// =================================================================

export type StrikingRow = {
  query: string;
  page: string | null;
  position: number;
  impressions: number;
  clicks: number;
  ctr: number;
  kd: number;
  impactScore: number;
};

export const getStrikingPipeline = createServerFn({ method: "GET" })
  .middleware([requireAdmin])
  .handler(async (): Promise<{ rows: StrikingRow[]; weekStart: string | null; quotaWarning: string | null }> => {
    // Use the most recent weekly review's top_queries — that data is already
    // fetched from GSC by the existing weekly review job.
    const { data: weeks } = await supabaseAdmin
      .from("gsc_weekly_reviews")
      .select("week_start, top_queries")
      .order("week_start", { ascending: false })
      .limit(1);
    const latest = weeks?.[0];
    if (!latest) return { rows: [], weekStart: null, quotaWarning: "No GSC weekly review available — run the weekly review first." };

    const top = (latest.top_queries as Array<{ query: string; page?: string; position: number; impressions: number; clicks: number; ctr: number }>) ?? [];
    const striking = top.filter((q) => q.position >= 4 && q.position <= 11 && q.impressions >= 20);

    // Batch Semrush KD lookup for these queries — caps API spend at one call per ~100 phrases.
    let kdMap = new Map<string, { kd: number; volume: number; cpc: number }>();
    let quotaWarning: string | null = null;
    try {
      kdMap = await fetchKeywordDifficulty({ phrases: striking.map((q) => q.query) });
    } catch (e) {
      quotaWarning = e instanceof SemrushQuotaError ? e.message : `Semrush KD lookup failed: ${(e as Error).message}`;
    }

    const rows: StrikingRow[] = striking
      .map((q) => {
        const kdEntry = kdMap.get(q.query.toLowerCase());
        const kd = kdEntry?.kd ?? 50;
        return {
          query: q.query,
          page: q.page ?? null,
          position: q.position,
          impressions: q.impressions,
          clicks: q.clicks,
          ctr: q.ctr,
          kd,
          impactScore: impactScore({ impressions: q.impressions, position: q.position, kd }),
        } satisfies StrikingRow;
      })
      .sort((a, b) => b.impactScore - a.impactScore);

    return { rows, weekStart: latest.week_start, quotaWarning };
  });

export type StrikePlan = {
  newTitle: string;
  newMetaDescription: string;
  newH1: string;
  internalLinkSources: Array<{ fromPath: string; anchorText: string }>;
  rationale: string;
  raw?: string;
};

export const generateStrikePlan = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((d: unknown) => z.object({
    query: z.string().min(1),
    page: z.string().nullable(),
    position: z.number(),
    impressions: z.number(),
    kd: z.number(),
  }).parse(d))
  .handler(async ({ data }): Promise<StrikePlan> => {
    const sys = `You are an SEO operator for a luxury fashion site. Output JSON only. No fluff.`;
    const user = `We rank position ${data.position.toFixed(1)} for "${data.query}" with ${data.impressions} monthly impressions and Semrush KD ${data.kd}. Page: ${data.page || "(unknown — pick the most relevant Palace of Roman URL)"}.\n\nCTR lift opportunity to top 3: +${(ctrLiftToTop3(data.position) * 100).toFixed(1)}%.\n\nReturn JSON with EXACTLY:\n{\n  "newTitle": string (<= 60 chars, includes the target query naturally),\n  "newMetaDescription": string (<= 155 chars, action-forward, ends with a soft CTA),\n  "newH1": string (<= 70 chars),\n  "internalLinkSources": [{ "fromPath": string (Palace of Roman URL path like "/collections/gucci-handbags"), "anchorText": string }] (exactly 3),\n  "rationale": string (2 sentences explaining the on-page fix that will push this to top 3)\n}`;
    const res = await callAi({
      module: "apex/strike-plan",
      model: "google/gemini-3-flash-preview",
      system: sys,
      user,
      json: true,
      maxTokens: 800,
      temperature: 0.4,
    });
    try {
      const parsed = JSON.parse(res.content) as Partial<StrikePlan>;
      return {
        newTitle: parsed.newTitle ?? "",
        newMetaDescription: parsed.newMetaDescription ?? "",
        newH1: parsed.newH1 ?? "",
        internalLinkSources: parsed.internalLinkSources ?? [],
        rationale: parsed.rationale ?? "",
      };
    } catch {
      return { newTitle: "", newMetaDescription: "", newH1: "", internalLinkSources: [], rationale: "", raw: res.content };
    }
  });

