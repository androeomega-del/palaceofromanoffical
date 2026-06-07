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
  heuristicIntent,
  isLegalOrHelpUrl,
  isScraperLoopUrl,
  OUR_DOMAIN,
  OUR_LEGACY_DOMAIN,
  COMPETITOR_DOMAINS,
  SemrushQuotaError,
  type SearchIntent,
  STRIKING_FALLBACK_ROWS,
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
  ourDomain: string;
  ourLegacyDomain: string;
  competitorDomains: readonly string[];
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
      ourDomain: OUR_DOMAIN,
      ourLegacyDomain: OUR_LEGACY_DOMAIN,
      competitorDomains: COMPETITOR_DOMAINS,
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
    source_domain: "vogue.com", target_url: `https://${OUR_LEGACY_DOMAIN}/`, anchor: "Palace of Roman",
    page_ascore: 92, is_nofollow: false, is_net_new: true,
    first_seen_at: new Date(Date.now() - 86_400_000).toISOString(),
    pitch_subject: null, pitch_body: null, pitch_generated_at: null, status: "seed",
  },
  {
    id: "seed-gq", source_url: "https://www.gq.com/story/best-designer-bags-2026",
    source_domain: "gq.com", target_url: `https://${OUR_LEGACY_DOMAIN}/collections/bags`, anchor: "designer leather goods",
    page_ascore: 88, is_nofollow: false, is_net_new: true,
    first_seen_at: new Date(Date.now() - 2 * 86_400_000).toISOString(),
    pitch_subject: null, pitch_body: null, pitch_generated_at: null, status: "seed",
  },
  {
    id: "seed-hb", source_url: "https://www.harpersbazaar.com/fashion/trends/loewe-spring-edit",
    source_domain: "harpersbazaar.com", target_url: `https://${OUR_LEGACY_DOMAIN}/collections/loewe`, anchor: "Loewe edit",
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

/** External competitor domains whose net-new backlinks we want to intercept. */
export const POACHER_TARGETS = ["ssense.com", "net-a-porter.com"] as const;

export const refreshPoacherFeed = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .handler(async () => {
    // Backlink Intercept: pull net-new inbound links earned by the giant
    // luxury retailers (SSENSE, Net-a-Porter). For every high-AS editorial
    // link we discover, we can pitch the editor to include or swap a link
    // to palaceofromanofficial.com for the same designer item.
    const monitored = [...POACHER_TARGETS];
    let totalInserted = 0;
    let totalUpdated = 0;
    let totalFetched = 0;

    for (const target of monitored) {
      try {
        const fresh = await fetchCompetitorBacklinks({ domain: target, limit: 100 });
        if (!fresh || fresh.length === 0) {
          console.log(`[apex/poacher] empty payload for ${target}`);
          continue;
        }
        totalFetched += fresh.length;

        const { data: existing } = await supabaseAdmin
          .from("apex_competitor_backlinks")
          .select("source_url")
          .eq("competitor_domain", target);
        const known = new Set((existing ?? []).map((r) => r.source_url));

        for (const link of fresh) {
          if (!link.source_url) continue;
          const isNew = !known.has(link.source_url);
          const { error } = await supabaseAdmin
            .from("apex_competitor_backlinks")
            .upsert(
              {
                competitor_domain: target,
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
          if (isNew) totalInserted += 1;
          else totalUpdated += 1;
        }
      } catch (e) {
        const isQuota = e instanceof SemrushQuotaError;
        await logRun("poacher", isQuota ? "quota" : "error", `${target}: ${(e as Error).message}`, 0);
        if (isQuota) throw e;
      }
    }

    await logRun(
      "poacher",
      "ok",
      `${totalInserted} new, ${totalUpdated} known across ${monitored.join(", ")}`,
      totalFetched,
    );
    return { inserted: totalInserted, updated: totalUpdated, total: totalFetched, targets: monitored };
  });

const POR_BRIEF = `Palace of Roman is a luxury fashion boutique sourcing from a global network of authorised boutiques and distributors. Catalog includes maisons such as Gucci, Prada, Saint Laurent, Bottega Veneta, Loewe, Off-White, Balenciaga, Maison Margiela, Comme des Garçons, and other heritage and contemporary houses. Free worldwide shipping, authenticated stock, USD pricing. Live shop: ${OUR_DOMAIN}. Legacy domain (still redirecting): ${OUR_LEGACY_DOMAIN}.`;

const PUBLICATION_NAMES: Record<string, string> = {
  "vogue.com": "Vogue",
  "gq.com": "GQ",
  "harpersbazaar.com": "Harper's Bazaar",
  "wmagazine.com": "W Magazine",
  "elle.com": "Elle",
  "vanityfair.com": "Vanity Fair",
  "thecut.com": "The Cut",
  "businessoffashion.com": "The Business of Fashion",
  "wwd.com": "WWD",
  "highsnobiety.com": "Highsnobiety",
  "hypebeast.com": "Hypebeast",
};

/** Derive a human-readable publication name from a source domain. */
export function publicationNameFromDomain(domain: string | null | undefined): string {
  if (!domain) return "your publication";
  const clean = domain.replace(/^www\./, "").toLowerCase();
  if (PUBLICATION_NAMES[clean]) return PUBLICATION_NAMES[clean];
  const root = clean.split(".")[0] || clean;
  return root.charAt(0).toUpperCase() + root.slice(1);
}

/**
 * Map a legacy palaceofroman.com URL to its new equivalent on
 * palaceofromanofficial.com. The path is preserved verbatim — 301 redirects
 * on our side handle the actual mapping; this is purely for the email copy.
 */
function maturedDestination(legacyUrl: string | null): string {
  if (!legacyUrl) return `https://${OUR_DOMAIN}/`;
  try {
    const u = new URL(legacyUrl);
    return `https://${OUR_DOMAIN}${u.pathname}${u.search}`;
  } catch {
    return `https://${OUR_DOMAIN}/`;
  }
}

function hostOf(url: string | null | undefined): string {
  if (!url) return "";
  try { return new URL(url).hostname.replace(/^www\./, "").toLowerCase(); } catch { return ""; }
}

/** Is this target_url pointing at one of the giant retailers we want to poach from? */
function isCompetitorTarget(targetUrl: string | null | undefined): boolean {
  const h = hostOf(targetUrl);
  return POACHER_TARGETS.some((c) => h === c || h.endsWith(`.${c}`));
}

/** Best-effort extraction of the designer + item from a competitor product URL slug. */
function extractDesignerItemFromUrl(targetUrl: string | null | undefined): { designer: string | null; item: string | null } {
  if (!targetUrl) return { designer: null, item: null };
  try {
    const u = new URL(targetUrl);
    const segs = u.pathname.split("/").filter(Boolean);
    const slug = segs[segs.length - 1] || "";
    const words = slug.replace(/\.html?$/i, "").replace(/[-_]+/g, " ").replace(/\b\d{4,}\b/g, "").trim();
    if (!words) return { designer: null, item: null };
    const tokens = words.split(/\s+/);
    // Heuristic: first 1-2 tokens are the designer, rest are the item.
    const designer = tokens.slice(0, Math.min(2, tokens.length)).map((t) => t[0].toUpperCase() + t.slice(1)).join(" ");
    const item = tokens.slice(Math.min(2, tokens.length)).join(" ");
    return { designer: designer || null, item: item || null };
  } catch {
    return { designer: null, item: null };
  }
}

/** Shared pitch prompt builder — routes to "Authority Maturing" or "Backlink Poach" based on the linked target. */
function buildPitchPrompts(args: {
  source_url: string;
  source_domain: string;
  anchor: string | null;
  target_url: string | null;
  excerpt: string | null;
}) {
  const publication = publicationNameFromDomain(args.source_domain);

  // ── BRANCH A — Backlink poach: editor linked to SSENSE / Net-a-Porter ──
  if (isCompetitorTarget(args.target_url)) {
    const competitorHost = hostOf(args.target_url);
    const competitorName = competitorHost.includes("ssense") ? "SSENSE" : competitorHost.includes("net-a-porter") ? "Net-a-Porter" : competitorHost;
    const { designer, item } = extractDesignerItemFromUrl(args.target_url);
    const itemLabel = [designer, item].filter(Boolean).join(" ") || "the featured designer piece";
    const sys = `You write concise, editor-grade outreach FROM Palace of Roman to a fashion editor.

Strict identity rules:
- WE ARE Palace of Roman (live shop: ${OUR_DOMAIN}). We are NOT ${competitorName}.
- The publication ("${publication}") has linked the featured piece to ${competitorName}. We want them to ADD an alternative link to Palace of Roman, or SWAP the existing link to us where editorially appropriate.
- Tone: warm, professional, never pushy. No discounts, no fake urgency, no flattery without specifics.
- FIRST sentence MUST name "${publication}" and reference the specific article + the designer item ("${itemLabel}").
- Acknowledge the existing ${competitorName} link respectfully — frame us as a complementary, smaller-house alternative readers may also appreciate.
- Highlight what makes Palace of Roman a credible alternative for this piece: curated multi-boutique sourcing, authenticated stock, free worldwide shipping, USD pricing, and a personal concierge touch (single-curator service vs. mass marketplace).
- Make the ask explicit: either ADD a secondary link to ${OUR_DOMAIN} or SWAP the ${competitorName} link where the piece is in stock with us.
- Keep it under 240 words. No markdown. No signature line.

Output JSON only with keys: subject (<=70 chars, e.g. "${itemLabel} — alternative source for your ${publication} readers"), body (160-240 words, 3 short paragraphs, plain text).`;
    const user = `Brand brief:\n${POR_BRIEF}\n\nPublication: ${publication}\nArticle URL: ${args.source_url}\nCurrent link destination: ${args.target_url} (${competitorName})\nAnchor text: ${args.anchor || "(none)"}\nDesigner/item inferred from URL: ${itemLabel}\nOur shop landing: https://${OUR_DOMAIN}/\n\nPage excerpt:\n${args.excerpt || "(no excerpt — keep the body topic-agnostic.)"}\n\nDraft the outreach. The opening sentence MUST name "${publication}" and the "${itemLabel}". Position Palace of Roman as a curated, concierge-led alternative to ${competitorName} for this designer piece — never as a discount or replacement.`;
    return { sys, user, publication, newTarget: `https://${OUR_DOMAIN}/`, mode: "poach" as const };
  }

  // ── BRANCH B — Authority maturing: editor already links to our legacy domain ──
  const newTarget = maturedDestination(args.target_url);
  const sys = `You write concise, editor-grade webmaster notices sent FROM Palace of Roman (the brand the article already links to) requesting an OFFICIAL URL UPDATE.

Strict identity rules:
- WE ARE Palace of Roman. Our live shop is ${OUR_DOMAIN}. ${OUR_LEGACY_DOMAIN} is our previous domain — it still 301-redirects, but we want the canonical URL updated for SEO authority hygiene.
- The publication ("${publication}") is NOT a competitor. They are an editorial partner who has already linked to us.
- Tone: professional, gracious, factual. No sales pitch, no offers, no flattery without specifics. Treat this as a routine URL-housekeeping request between professionals.
- FIRST sentence MUST address the publication by name and reference the specific article being updated.
- Mention that the existing link still resolves via redirect, but a direct link preserves full link equity and removes the redirect hop.
- Provide the exact OLD URL and the exact NEW URL on one line each so the webmaster can find-and-replace.

Output JSON only with keys: subject (<=70 chars, e.g. "URL update request — Palace of Roman feature in ${publication}"), body (180-260 words, 3 short paragraphs + the OLD→NEW URL block, no signature line, plain text, no markdown).`;
  const user = `Brand brief:\n${POR_BRIEF}\n\nPublication: ${publication}\nArticle URL: ${args.source_url}\nAnchor text currently used: ${args.anchor || "(none)"}\nOLD destination (legacy): ${args.target_url || `(unknown — assume https://${OUR_LEGACY_DOMAIN}/)`}\nNEW destination (live shop): ${newTarget}\n\nPage excerpt:\n${args.excerpt || "(no excerpt available — keep the body topic-agnostic.)"}\n\nDraft the webmaster notice. The opening sentence MUST name "${publication}" and reference the specific article. Include the OLD → NEW URL block verbatim. End by thanking them for the original feature.`;
  return { sys, user, publication, newTarget, mode: "maturing" as const };
}

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

    const { sys, user, publication } = buildPitchPrompts({
      source_url: row.source_url,
      source_domain: row.source_domain,
      anchor: row.anchor,
      target_url: row.target_url,
      excerpt,
    });

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
      const subject = (parsed.subject || "").slice(0, 120) || `URL update request — Palace of Roman feature in ${publication}`;
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

/**
 * Sandbox-mode pitch drafter. Accepts an inline row (no DB read/write) so the
 * Poacher UI can dry-run pitches against high-prestige test publications
 * (Vogue, GQ, Harper's Bazaar) without polluting the live backlink table.
 */
export const draftPoacherPitchInline = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((d: unknown) =>
    z.object({
      source_url: z.string().url().max(2048),
      source_domain: z.string().min(1).max(255),
      anchor: z.string().max(255).nullable().optional(),
      target_url: z.string().url().max(2048).nullable().optional(),
      page_title: z.string().max(500).nullable().optional(),
    }).parse(d),
  )
  .handler(async ({ data }) => {
    const excerpt = data.page_title ? `Page title: ${data.page_title}` : null;
    const { sys, user, publication } = buildPitchPrompts({
      source_url: data.source_url,
      source_domain: data.source_domain,
      anchor: data.anchor ?? null,
      target_url: data.target_url ?? null,
      excerpt,
    });
    try {
      const res = await callAi({
        module: "apex/poacher-sandbox",
        model: "google/gemini-3-flash-preview",
        system: sys,
        user,
        json: true,
        maxTokens: 700,
        temperature: 0.6,
      });
      let parsed: { subject?: string; body?: string } = {};
      try { parsed = JSON.parse(res.content); } catch { /* keep empty */ }
      const subject = (parsed.subject || "").slice(0, 120) || `URL update request — Palace of Roman feature in ${publication}`;
      const body = (parsed.body || "").trim() || res.content.trim();
      return { subject, body };
    } catch (e) {
      if (e instanceof BudgetExceededError) throw e;
      throw e;
    }
  });

// =================================================================
// MODULE 2 — Hijack Feed (top ranking pages + blueprints)
// =================================================================

const _hijackCacheByDomain = new Map<string, { at: number; rows: TopRankingPageEnriched[] }>();
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
  top_keyword_intent: SearchIntent;
};

function hijackSeedsFor(domain: string): TopRankingPageEnriched[] {
  return [
    { url: `https://www.${domain}/shop/clothing`, est_traffic: 54200, keyword_count: 1180,
      top_keyword: "luxury designer clothing", top_keyword_position: 2, top_keyword_volume: 22200, top_keyword_kd: 78, top_keyword_cpc: 2.6, top_keyword_intent: "commercial" },
    { url: `https://www.${domain}/shop/bags`, est_traffic: 41200, keyword_count: 940,
      top_keyword: "designer handbags", top_keyword_position: 3, top_keyword_volume: 33100, top_keyword_kd: 82, top_keyword_cpc: 3.2, top_keyword_intent: "commercial" },
    { url: `https://www.${domain}/shop/shoes`, est_traffic: 28700, keyword_count: 760,
      top_keyword: "designer shoes women", top_keyword_position: 4, top_keyword_volume: 18100, top_keyword_kd: 74, top_keyword_cpc: 2.4, top_keyword_intent: "commercial" },
    { url: `https://www.${domain}/shop/sale-bags`, est_traffic: 21300, keyword_count: 380,
      top_keyword: "buy gucci bag online", top_keyword_position: 2, top_keyword_volume: 9800, top_keyword_kd: 65, top_keyword_cpc: 4.1, top_keyword_intent: "transactional" },
  ];
}

export const getHijackFeed = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((d: unknown) => z.object({
    force: z.boolean().optional(),
    domain: z.enum(COMPETITOR_DOMAINS as unknown as [string, ...string[]]).optional(),
    /** When true, return only commercial/transactional rows (transaction-focused hijack feed). */
    transactionalOnly: z.boolean().optional(),
  }).parse(d ?? {}))
  .handler(async ({ data }): Promise<{ rows: TopRankingPageEnriched[]; domain: string; cachedAt: string; error: string | null; seeded: boolean; filteredOut: number }> => {
    const domain = data.domain ?? COMPETITOR_DOMAINS[0];
    const applyFilter = (rows: TopRankingPageEnriched[]) => {
      if (!data.transactionalOnly) return { rows, filteredOut: 0 };
      const kept = rows.filter((r) => r.top_keyword_intent === "commercial" || r.top_keyword_intent === "transactional");
      return { rows: kept, filteredOut: rows.length - kept.length };
    };
    const cached = _hijackCacheByDomain.get(domain);
    if (!data.force && cached && cached.rows.length > 0 && Date.now() - cached.at < HIJACK_TTL_MS) {
      const f = applyFilter(cached.rows);
      return { rows: f.rows, domain, cachedAt: new Date(cached.at).toISOString(), error: null, seeded: false, filteredOut: f.filteredOut };
    }
    try {
      const pages = await fetchCompetitorTopPages({ domain, limit: 50 });
      const enriched: TopRankingPageEnriched[] = [];
      const TOP_N = Math.min(25, pages.length);
      for (let i = 0; i < TOP_N; i++) {
        const p = pages[i];
        try {
          const kws = await fetchUrlTopKeywords({ url: p.url, limit: 1 });
          const top = kws[0];
          enriched.push({
            ...p,
            top_keyword: top?.keyword ?? p.top_keyword,
            top_keyword_position: top?.position ?? p.top_keyword_position,
            top_keyword_volume: top?.volume ?? p.top_keyword_volume,
            top_keyword_kd: top?.kd ?? p.top_keyword_kd,
            top_keyword_cpc: top?.cpc ?? p.top_keyword_cpc,
            top_keyword_intent: top?.intent ?? heuristicIntent(p.top_keyword),
          });
        } catch (innerErr) {
          if (innerErr instanceof SemrushQuotaError) throw innerErr;
          enriched.push({ ...p, top_keyword_intent: heuristicIntent(p.top_keyword) });
        }
      }
      for (let i = TOP_N; i < pages.length; i++) enriched.push({ ...pages[i], top_keyword_intent: heuristicIntent(pages[i].top_keyword) });

      const seeds = hijackSeedsFor(domain);
      const result = enriched && enriched.length > 0 ? enriched : seeds;
      if (!enriched || enriched.length === 0) {
        console.log(`[apex/hijack] empty payload for ${domain}, serving seeds.`);
        await logRun("hijack", "ok", `empty (${domain}), served seeds`, 0);
        const f = applyFilter(result);
        return { rows: f.rows, domain, cachedAt: new Date().toISOString(), error: null, seeded: true, filteredOut: f.filteredOut };
      }
      _hijackCacheByDomain.set(domain, { at: Date.now(), rows: result });
      await logRun("hijack", "ok", `fetched ${result.length} pages from ${domain}`, result.length);
      const f = applyFilter(result);
      return { rows: f.rows, domain, cachedAt: new Date().toISOString(), error: null, seeded: false, filteredOut: f.filteredOut };
    } catch (e) {
      const isQuota = e instanceof SemrushQuotaError;
      const msg = (e as Error).message;
      console.error("[apex/hijack] error:", msg);
      await logRun("hijack", isQuota ? "quota" : "error", `${domain}: ${msg}`, 0);
      const f = applyFilter(hijackSeedsFor(domain));
      return { rows: f.rows, domain, cachedAt: new Date().toISOString(), error: msg, seeded: true, filteredOut: f.filteredOut };
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
    const user = `Competitor URL to outrank: ${data.url}\nTarget keyword: ${target}\nOur site: ${OUR_DOMAIN} (Palace of Roman — luxury multi-brand boutique).\n\nReturn JSON with EXACTLY these keys:\n{\n  "targetKeyword": string,\n  "searchIntent": "transactional"|"commercial"|"informational"|"navigational",\n  "intentBrief": string (1-2 sentences),\n  "semanticTerms": string[] (12-20 entities/related terms a top-ranking page must cover),\n  "outline": [{ "h2": string, "h3s": string[], "evidence": string }] (5-8 sections),\n  "internalLinkTargets": string[] (5-8 Palace of Roman URL paths to link from this page, like "/collections/gucci"),\n  "schemaTypes": string[] (e.g. "Product", "BreadcrumbList", "ItemList"),\n  "wordCount": number,\n  "eatSignals": string[] (4-6 specific E-E-A-T enhancements like author bylines, sourcing notes, etc.)\n}`;

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
    // Hardcoded fallback rows — surfaced when no GSC weekly review exists yet
    // or when every query gets filtered out by sanitization. Lets the operator
    // exercise the "Generate High-Intent SEO Patch" action immediately.
    const fallbackRows = (): StrikingRow[] =>
      STRIKING_FALLBACK_ROWS.map((r) => ({
        query: r.query,
        page: r.page,
        position: r.position,
        impressions: r.impressions,
        clicks: 0,
        ctr: 0,
        kd: 50,
        impactScore: impactScore({ impressions: r.impressions, position: r.position, kd: 50 }),
      })).sort((a, b) => b.impactScore - a.impactScore);

    // Use the most recent weekly review's top_queries — that data is already
    // fetched from GSC by the existing weekly review job.
    const { data: weeks } = await supabaseAdmin
      .from("gsc_weekly_reviews")
      .select("week_start, top_queries")
      .order("week_start", { ascending: false })
      .limit(1);
    const latest = weeks?.[0];
    if (!latest) return { rows: fallbackRows(), weekStart: null, quotaWarning: null };

    const top = (latest.top_queries as Array<{ query: string; page?: string; position: number; impressions: number; clicks: number; ctr: number }>) ?? [];
    // Apply the same livestream sanitization rules used by the intercept feed
    // and hijack pipeline — drop GSC queries whose landing page is a legal /
    // help / policy URL or a scraper pagination loop.
    const sanitized = top.filter((q) => !isLegalOrHelpUrl(q.page) && !isScraperLoopUrl(q.page));
    const striking = sanitized.filter((q) => q.position >= 4 && q.position <= 11 && q.impressions >= 20);

    if (striking.length === 0) {
      return { rows: fallbackRows(), weekStart: latest.week_start, quotaWarning: null };
    }

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


// =================================================================
// MODULE 4 — High-Conversion Intent SEO Patch (product-page rewriter)
// =================================================================

export type HighIntentSeoPatch = {
  productTitle: string;
  productUrl: string | null;
  targetKeyword: string;
  secondaryKeywords: string[];
  newTitle: string;        // <title> tag, <= 60 chars, transactional intent
  newH1: string;           // <= 70 chars, brand + product + qualifier
  newMetaDescription: string; // <= 155 chars, action-forward CTA
  internalLinks: string[]; // 3 Palace of Roman collection paths to link from
  rationale: string;
  raw?: string;
};

/**
 * Rewrite a raw Shopify product title (e.g. "Burberry Women Black Leather Knight
 * Small Shoulder Bag 1") into commercially-tuned <title>, H1 and meta description
 * that target high-intent shopping queries ("Burberry Knight Bag", "buy designer
 * shoulder bag", etc.) instead of catalog-style strings.
 */
export const generateHighIntentSeoPatch = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((d: unknown) => z.object({
    productTitle: z.string().min(2).max(500),
    productUrl: z.string().max(2048).nullable().optional(),
    query: z.string().max(300).nullable().optional(),
  }).parse(d))
  .handler(async ({ data }): Promise<HighIntentSeoPatch> => {
    const sys = `You are a conversion-focused SEO copywriter for ${OUR_DOMAIN} (Palace of Roman — luxury multi-brand boutique, USD pricing, authenticated, worldwide shipping). Output JSON only. No fluff.

Strict rules:
- Strip catalog noise from raw product titles (trailing numbers like " 1", gendered phrasing like "Women", filler words "with", duplicated brand mentions).
- Lead with BRAND + iconic product name (e.g. "Burberry Knight Small Shoulder Bag"), then a high-intent commercial qualifier ("Authenticated Luxury", "Shop Designer", "Free Worldwide Shipping").
- Target buyer search intent — phrases shoppers actually type when ready to purchase. Prioritise transactional and commercial-investigation queries over informational.
- NEVER fabricate prices, discounts, "in stock" claims, sale dates, or review counts.
- NEVER include the legacy domain or any competitor name.`;

    const user = `Raw product title: "${data.productTitle}"
Product URL (path or full): ${data.productUrl || "(unknown — leave canonical pathing alone)"}
${data.query ? `Existing high-impression GSC query: "${data.query}"` : ""}

Return JSON with EXACTLY these keys:
{
  "targetKeyword": string (the single high-intent query this page should own, e.g. "burberry knight bag"),
  "secondaryKeywords": string[] (3-6 supporting commercial/transactional queries),
  "newTitle": string (<= 60 chars, "Brand Product Name | Commercial Qualifier" pattern, includes target keyword),
  "newH1": string (<= 70 chars, clean product name + brief authenticity/luxury qualifier),
  "newMetaDescription": string (<= 155 chars, action-forward, references authentication + worldwide shipping, ends with soft CTA like "Shop now."),
  "internalLinks": string[] (EXACTLY 3 Palace of Roman collection page paths, e.g. "/collections/loafers", to link from to pass authority),
  "rationale": string (2 sentences: which catalog-noise was stripped, and which buyer intent the rewrite captures)
}`;

    const res = await callAi({
      module: "apex/high-intent-patch",
      model: "google/gemini-3-flash-preview",
      system: sys,
      user,
      json: true,
      maxTokens: 700,
      temperature: 0.3,
    });

    try {
      const parsed = JSON.parse(res.content) as Partial<HighIntentSeoPatch>;
      return {
        productTitle: data.productTitle,
        productUrl: data.productUrl ?? null,
        targetKeyword: parsed.targetKeyword ?? "",
        secondaryKeywords: parsed.secondaryKeywords ?? [],
        newTitle: (parsed.newTitle ?? "").slice(0, 70),
        newH1: (parsed.newH1 ?? "").slice(0, 90),
        newMetaDescription: (parsed.newMetaDescription ?? "").slice(0, 170),
        internalLinks: Array.isArray(parsed.internalLinks) ? parsed.internalLinks.slice(0, 5) : [],
        rationale: parsed.rationale ?? "",
      };
    } catch {
      return {
        productTitle: data.productTitle,
        productUrl: data.productUrl ?? null,
        targetKeyword: "", secondaryKeywords: [],
        newTitle: "", newH1: "", newMetaDescription: "",
        internalLinks: [],
        rationale: "",
        raw: res.content,
      };
    }
  });
