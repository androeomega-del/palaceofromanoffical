## Goal

Capture bottom-funnel buyers Googling "Farfetch alternative", "is Mytheresa worth it", "SSENSE vs ...", "Net-a-Porter alternative". These shoppers already trust the category — they're just choosing where to spend. Honest comparison pages convert at multiples of generic SEO traffic.

## Scope (v1)

Four comparison pages, one per major competitor:

```
/compare/farfetch         — Palace of Roman vs Farfetch
/compare/mytheresa        — Palace of Roman vs Mytheresa
/compare/ssense           — Palace of Roman vs SSENSE
/compare/net-a-porter     — Palace of Roman vs Net-a-Porter
```

Plus one hub:

```
/compare                  — index of all comparisons
```

Why these four: highest search volume in "luxury multi-brand boutique alternative" queries, and each has a distinct angle we can honestly differentiate against (see angles below).

## Route files

```
src/routes/compare.tsx                    (hub layout + Outlet)
src/routes/compare.index.tsx              (/compare hub)
src/routes/compare.farfetch.tsx
src/routes/compare.mytheresa.tsx
src/routes/compare.ssense.tsx
src/routes/compare.net-a-porter.tsx
```

Shared data lives in `src/lib/comparisons.ts` — one object per competitor with: name, tagline, our-angle, their-angle, comparison rows, FAQ entries, and the 3–5 product handles we feature as "see what we carry that they don't" / "same brands, our terms".

## Page structure (per comparison)

1. **Hero** — H1: `Palace of Roman vs {Competitor} — An Honest Comparison`. Subhead names the specific tradeoffs.
2. **The honest take** (200–300 words) — what each does best, plainly. No trash-talk; that destroys trust with luxury buyers. Frame ourselves as the curated, boutique-network alternative to their scale.
3. **Comparison table** — 10–12 rows: shipping origin, duties handling, return policy, authentication guarantee, brand breadth, price positioning, customer-service style, exclusives, payment options, loyalty program, sustainability disclosure, founding model. Two columns: them vs us. Honest entries — when they win on something (e.g. Farfetch on sheer brand count), say so.
4. **When to choose them / when to choose us** — explicit decision guide. Builds enormous trust.
5. **Shoppable strip** — 6–8 real products from our catalog using verified handles (satisfies the "always tag catalog products" rule). Pulled live via `fetchProductsPage` with a curated query (e.g. `vendor:"Gucci" OR vendor:"Prada"`).
6. **FAQ** — 5–6 Q&As, each targeting a long-tail query ("Is Palace of Roman cheaper than {them}?", "Does Palace of Roman ship to the US?", "Are Palace of Roman items authentic?"). Wired as JSON-LD `FAQPage`.
7. **CTA strip** — link to `/brands`, `/in-rome`, and the most relevant editorial.

## Honest angles (per competitor)

- **vs Farfetch** — Farfetch wins on sheer breadth (3000+ boutiques). We win on curation, single shipping origin (Italy), no surprise duties on EU/US orders, and one editorial voice instead of 3000.
- **vs Mytheresa** — Mytheresa wins on exclusives and brand partnerships. We win on price (no markup over RRP on most pieces), faster EU shipping, and a tighter Italian-house focus.
- **vs SSENSE** — SSENSE wins on contemporary/streetwear breadth and editorial photography. We win on classic Italian luxury depth and tracked Italy-origin shipping.
- **vs Net-a-Porter** — NAP wins on white-glove packaging and same-day London. We win on price (no platform premium), founder-curated edit instead of buying-team-by-committee.

## SEO

Per route `head()` using `routeHead()`:

- `title`: `Palace of Roman vs Farfetch — Honest Comparison (2026)` (under 60 chars)
- `description`: One sentence naming the top 2 tradeoffs + ship-from-Italy hook (under 158 chars)
- `keywords`: `farfetch alternative, farfetch vs, is farfetch worth it, buy designer online, luxury boutique alternative`
- Canonical on leaf only (per head-meta rules)
- JSON-LD: `FAQPage` + `BreadcrumbList`
- No `og:image` on root; per-page OG image is the comparison-table thumbnail (use an existing editorial library asset for v1; can upgrade later)

## Internal linking

- New `/compare` link added to footer ONLY in v1 (not main nav) — preserves the staged-launch rule until we measure engagement
- Each comparison page links to its 3 sibling comparison pages at the bottom
- `/brands` hub gets a single "Compare us to other boutiques →" link below the H1
- Sitemap: add `/compare` and the 4 leaves to `sitemap-static.xml.ts`

## Constraints honored

- **Real copy only** — I'll write all 4 pages in Palace of Roman voice; no Lorem
- **No BG mention** — sourcing framed as "global boutique network"
- **No fabricated team** — "we" voice, no "our buying team in Milan"
- **Tag catalog products** — every page includes a 6–8 product strip from live Shopify
- **Staged launch** — footer-only exposure in v1; promote to main nav after 2 weeks of GSC data
- **No fabricated reviews** — comparison claims are factual (shipping origin, return windows) not testimonial-based

## Out of scope (v1)

- Comparisons vs Saks / Bergdorf / Matches / 24S — can add as v2 once v1 indexes
- A/B variations of headlines
- Submitting URLs via IndexNow (separate decision pending)

## Technical notes

- `src/lib/comparisons.ts` exports `COMPARISONS: Record<slug, Comparison>` so the hub page can iterate without hardcoding
- Each leaf route uses the same `<ComparisonPage>` component (in `src/components/comparison-page.tsx`) driven by data — keeps copy in one file, layout in another
- Product strip uses existing `fetchProductsPage` with `BEST_SELLING` sort; graceful empty-state if 0 results
- Reuse existing `ProductCard` component

## Files created

```
src/lib/comparisons.ts                          (data + types, ~400 lines of real copy)
src/components/comparison-page.tsx              (shared layout component)
src/routes/compare.tsx                          (layout wrapper with <Outlet />)
src/routes/compare.index.tsx                    (hub)
src/routes/compare.farfetch.tsx
src/routes/compare.mytheresa.tsx
src/routes/compare.ssense.tsx
src/routes/compare.net-a-porter.tsx
```

## Files edited

```
src/routes/sitemap-static[.]xml.ts              (add 5 new URLs)
src/components/site-footer.tsx (or equivalent)  (add "Compare" link)
```

## Verification after build

- Visit all 5 routes, confirm tables render and product strips populate
- View source on one leaf: confirm canonical, FAQPage JSON-LD, BreadcrumbList present
- `/compare` hub lists all 4 with working links
- Footer shows "Compare" link; main nav unchanged
- Sitemap includes new routes
