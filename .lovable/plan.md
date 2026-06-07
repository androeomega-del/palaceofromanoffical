
# Apex Predator — SEO command terminal

A new admin surface that turns the existing SEO tooling (GSC monitor, Growth OS, Semrush) into an aggressive competitor-surveillance terminal for `palaceofromanofficial.com`. Four modules, one shared shell.

## Prerequisite (one-time, before module 1 works)

The Semrush connector is **not yet linked** to this project — only Gmail and Google Search Console are. Modules 1–3 all depend on Semrush gateway data. As soon as you approve this plan I'll trigger the Semrush connect modal so you can authorize your Semrush account on the spot. Your existing Semrush subscription tier determines depth — Pro is fine for backlink + domain + keyword reports; Guru/Business adds historical depth.

LOVABLE_API_KEY is already provisioned, so the LLM drafting (poacher pitches, content blueprints, metadata rewrites) needs no further setup.

## Module 1 — Poacher Protocol (backlink intercept)

- New server fn `apex-predator.functions.ts → fetchCompetitorBacklinks(domain, sinceDays)` calling the Semrush connector gateway (`/backlinks/backlinks`, `/backlinks/backlinks_refdomains`, `/backlinks/backlinks_overview`) for `palaceofromanofficial.com`.
- Stores a rolling snapshot in a new `competitor_backlinks` table; on each refresh we diff against the previous snapshot to surface **net-new** referring domains (the "interception feed"), filtered to premium links (AS ≥ 40, dofollow, no spam TLDs).
- For each net-new link, a "Draft Pitch" action calls Lovable AI (`google/gemini-3-flash-preview` for speed, `openai/gpt-5-mini` toggle for higher polish) with: linking page URL + extracted page summary (fetched server-side via `fetch` + readability strip) + Palace of Roman positioning brief. Output is a 4-paragraph editor-grade outreach email with subject + angle hook.
- Pitch is saved to the row so the operator can re-open it; "Copy" + "Open in Gmail" actions ship next to it (Gmail connector is already linked).

## Module 2 — Hijack Feed (traffic reverse-engineering)

- Server fn `fetchTopRankingPages(domain)` → Semrush `/domains/domain_organic_unique` (top URLs) + `/url/url_organic` per URL (highest-traffic keywords). Cached server-side for 6 h.
- UI: ranked table of competitor URLs (slot, est. traffic, top kw, KD, volume, CPC) — up to 100 rows, sortable.
- "Generate Content Blueprint" button on each row → Lovable AI structured-output call returning `{ targetKeyword, intent, semanticTerms[], outline[ {h2, h3[], evidence} ], internalLinks[], schemaTypes[], wordCount, eatSignals[] }`. Rendered as an expandable panel + one-click "Export as Markdown" download to `/mnt/documents/blueprint-<slug>.md`.

## Module 3 — Striking-Distance Impact Pipeline

- Reuses existing `gsc-monitor.server.ts` data (positions 4–11) — no new GSC plumbing.
- Adds an **Impact Score** = `impressions × ctrLift(position) × (1 / max(KD, 10)) × 100`, where `ctrLift` is the modeled CTR delta between current position and position 3, and `KD` comes from a batched Semrush `/keywords/phrase_these` lookup (cached 24 h to stay inside quota).
- Ranked queue, top N highlighted in neon green ("low-hanging predator" tier).
- For the top 10, a "Generate Strike Plan" action returns: rewritten `<title>` (≤60c), meta description (≤155c), revised H1, 3 internal-link source pages from our own catalog (drawn from `shop-taxonomy` + live collections), and a 2-sentence on-page rationale. JSON saved to row + one-click "Copy patch" and "Export .md".

## Module 4 — Prestige Dark Terminal UI

- New route `src/routes/admin.apex-predator.tsx` behind the existing admin guard.
- New tokens scoped to the surface (added to `src/styles.css` under `:root[data-surface="apex"]`):
  - `--apex-bg`: near-black slate (`oklch(0.14 0.012 250)`)
  - `--apex-surface`: `oklch(0.18 0.014 250)`
  - `--apex-grid`: `oklch(0.24 0.012 250)` (1px grid lines)
  - `--apex-neon`: `oklch(0.86 0.22 145)` (high-priority opportunity — Bloomberg green)
  - `--apex-amber`: `oklch(0.78 0.18 70)` (competitive alert)
  - `--apex-ink`: `oklch(0.96 0.005 250)` (foreground)
  - `--apex-muted`: `oklch(0.62 0.01 250)`
  - Mono numerics: `JetBrains Mono` already in the stack.
- Layout: fixed left module nav (Poacher / Hijack / Striking) + top status bar (last sync, Semrush quota remaining, run-count) + main grid. Every row has a single primary action button on the right ("Deploy Fix" / "Export Outreach" / "Generate Counter-Strategy"). Subtle scanline + cursor blink on the status bar — no decorative animation in tables (legibility first).
- Entirely scoped — does not touch the storefront design tokens.

## Backend / data

- One new migration: `competitor_backlinks` and `apex_run_log` tables (RLS: admin-only via `has_role(auth.uid(),'admin')`, GRANTs for `authenticated` + `service_role` per project convention).
- All Semrush calls go through `connector-gateway.lovable.dev/semrush/...` with `Authorization: Bearer ${LOVABLE_API_KEY}` + `X-Connection-Api-Key: ${SEMRUSH_API_KEY}`; quota-error body `ERROR 134 :: TOTAL LIMIT EXCEEDED` surfaces as a top-bar warning, not a silent failure.
- All LLM calls go through Lovable AI Gateway via the existing `ai-gateway.server.ts` helper.

## Technical notes (build order)

```text
1. Trigger Semrush connect modal (once approved)
2. supabase migration: competitor_backlinks + apex_run_log + RLS + GRANTs
3. src/lib/apex-predator.server.ts  — Semrush gateway client, scoring fns
4. src/lib/apex-predator.functions.ts — createServerFn wrappers (admin-guarded)
5. src/styles.css — add :root[data-surface="apex"] tokens
6. src/components/apex/* — Shell, StatusBar, ModuleNav, PoacherFeed,
   HijackTable, StrikingQueue, ActionButton, BlueprintPanel
7. src/routes/admin.apex-predator.tsx — route + head() + module switcher
8. Wire admin nav link into existing admin index/menu
```

## What's intentionally NOT in scope

- No scheduled background jobs / pg_cron — refresh is operator-triggered on this pass (avoids burning Semrush quota during dev). Easy to add later.
- No public-facing surface; admin-only.
- No changes to storefront design tokens, megamenu, PDP, or checkout protocol.
- No changes to existing GSC monitor / Growth OS pages (this surface reads from them, doesn't replace them).

Reply with **approve** to proceed, or tell me what to drop / add — e.g. "skip module 1 for now", "add a pg_cron daily refresh", "use Gemini Pro for blueprints instead of Flash", etc.
