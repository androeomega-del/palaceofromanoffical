## Goal

Read-only typography/spacing/contrast audit across the editorial surface + homepage rails. **No code changes.** Deliverable is a structured report that doubles as the draft type-scale for a follow-up tokenization task.

## Scope (in)

**Editorial (`src/components/`):**
- `editorial-story.tsx`
- `editors-edition.tsx`
- `editorial-page-shell.tsx`
- `editorial-hotspots.tsx`
- `hero-focal-overlay.tsx`
- `shop-the-story-strip.tsx`
- `journal-shop-rail.tsx`
- `campaign-video.tsx`
- `themed-edit.tsx`
- `craftsmanship-article.tsx`
- `farfetch-edition-body.tsx`, `default-edition-body.tsx` (composition shells — audit any local type/spacing they apply, not children twice)

**Homepage rails (`src/components/sections/`):**
- `product-rail.tsx` (canonical — most rail copy lives here)
- `new-this-week-rail.tsx`, `best-sellers-rail.tsx`, `on-sale-rail.tsx`
- `brands-of-the-moment.tsx`
- `trending-now-strip.tsx`

**Out of scope:** PDP, cart, header/footer, admin, product-card internals (image-crop task owns that).

## Breakpoints

375, 390, 768, 1280, 1440. Captured via `browser--set_viewport_size` against `/`, `/men`, `/women`, plus one representative editorial route (`/editorial.versace`) and one themed-edit route (`/edits.the-prada-effect`) to hit ThemedEdit + EditorialStory live.

## Method

For each component × breakpoint, read the source file and inspect the live render. Record for every typographic role present (eyebrow / headline / subhead / body / CTA-label) and every section-level spacing value:

```text
component           | breakpoint | role     | property        | current                  | source            | proposed canonical
editorial-story     | 390        | headline | font-size       | text-[34px]              | arbitrary         | 36px  (--text-display-sm)
editorial-story     | 390        | headline | letter-spacing  | tracking-[-0.02em]       | arbitrary         | -0.04em
editorial-story     | 390        | headline | line-height     | leading-tight (1.25)     | utility           | 1.05
editorial-story     | 390        | section  | py              | py-16                    | utility           | py-20 (--space-section-md)
...
```

Flag rules:
- Any arbitrary `[Npx]` / `[N.Nrem]` / `[-N.NNem]` = **deviation**, must propose a canonical value.
- Tailwind utilities = note as-is; only propose change if value clashes with the emerging scale.
- Contrast: sample each text color against its actual rendered background using DPR-aware screenshot crop + manual oklch math against `--ink`, `--bronze-deep`, `--muted-foreground` on `--canvas` and `--canvas` on `.noir`. Flag <4.5:1 body, <3:1 ≥24px/≥19px-bold.

## Display-type guidance (per user)

Cormorant 400, never 700. Proposed canonical for display heads at mobile:
- single-line display: `line-height: 1.0–1.05`, `letter-spacing: -0.04em to -0.05em`
- two-line display: `line-height: 1.10–1.15`, `letter-spacing: -0.03em`
- desktop scales up size only; tracking loosens to -0.02em at ≥1280

These are proposals the audit will validate against what each component is currently doing.

## Deliverable

A single markdown report written to `/mnt/documents/editorial-typography-audit.md` with three sections:

1. **Per-component table** (the rows above) — full deviation log, one component per subsection.
2. **Proposed canonical scale** — grouped by role across all components, e.g.:
   ```
   --text-eyebrow:    11px / 0.18em / uppercase / Karla 500
   --text-display-sm: 36px / -0.04em / 1.05 / Cormorant 400  (mobile hero)
   --text-display-lg: 72px / -0.03em / 1.0  / Cormorant 400  (desktop hero)
   --space-section-sm: 48px
   --space-section-md: 80px
   --space-section-lg: 120px
   ```
   Values derived from the most common / most considered usage observed, not invented.
3. **Contrast failures** — list with component, role, measured ratio, proposed fix.

Plus a short **follow-up task brief** at the bottom: "Define these tokens in `src/styles.css`, do find-replace against the deviation log, ship in one PR."

## Out of scope for this task

- Editing any component file.
- Adding tokens to `styles.css`.
- Font-weight changes (Cormorant stays 400 — confirmed).
- ProductCard image-crop (separate task).
- Rail analytics (separate task).

## Verification

After the report is written, re-screenshot 2 spot-check breakpoints (390 + 1280) to confirm the live values match what I recorded from source. Note any source-vs-render drift in the report.
