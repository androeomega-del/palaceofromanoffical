## Goal
Translate the audience research (affluent 25–44, NYC/LA/Miami/SF, female-skewed, authenticity-first) into (1) a permanent internal playbook, (2) homepage + key collection meta rewrites, (3) four city SEO landing pages — shipped as a single staged batch per project rules.

## Important caveat from Semrush
City-modifier terms like *"designer clothing new york"* / *"designer fashion los angeles"* show **0/mo volume** in Semrush US data. Versace and category terms (*"luxury italian shirts"* 110, *"italian leather wallets for women"* 110) carry real demand. City pages will therefore be **conversion landers** (linkable from paid social/ads + footer, geo-targeted PPC) rather than pure organic plays. Recommended; flagging so expectations are right.

## 1. Memory — save audience playbook

New file `mem://business/audience-icp` (type: feature) containing:
- Cohort splits (Millennials 41%, GenX/GenZ 20.5%, Boomers 10.3%)
- Demo: 25–44 leads, female 60/40, $100K+ 70%
- Top metros: NYC, LA, Miami, SF Bay
- Hard-coded messaging pillars: authenticity proof, express worldwide delivery, exclusivity, craftsmanship, curated multi-brand
- Objection map (counterfeits, price, try-on, delivery, personalization) → on-page answer for each
- Cognitive biases to use (Scarcity, Social Proof, Authority, Halo, Anchoring)
- Persona summaries (Aficionado / Fashion-Forward Pro / Sophisticated Gifter)
- "Do NOT use" list: hype words, fake urgency, fabricated reviews, generic stock claims

Add a one-liner Core rule to `mem://index.md`:
> All customer-facing copy, ads, and SEO must answer the 5 objections (counterfeit, price, try-on, delivery, personalization) and lead with authenticity + express worldwide delivery. See mem://business/audience-icp.

And a Memories entry pointing at the new file.

## 2. Homepage meta — refresh A/B variants

Edit `src/lib/meta-ab.ts` → `HOME` array. Keep the A/B framework intact; just rewrite both variants so the canonical (bucket 0) leads with audience-aligned language.

```
A (default, indexed):
  title: "Palace of Roman | Authentic Luxury Designer Fashion, Worldwide"
  description: "Curated luxury fashion from Versace, Prada, Gucci, Dolce & Gabbana and the maisons that matter — 100% authenticated, expressly shipped worldwide."

B (test, noindex):
  title: "Authenticated Designer Fashion — Express Worldwide | Palace of Roman"
  description: "A curated multi-brand boutique for collectors of luxury fashion. Authenticated provenance, express worldwide delivery, 14-day returns."
```

Both stay ≤60 / ≤160. No structural / loader / canonical changes.

## 3. Landing collection default recipe

Same file — update `COLLECTION_RECIPES._default` variant B so every collection PLP without a custom recipe leans on the authenticity + delivery cues:

```
B: "{{title}} — Authentic Designer Edit, Shipped Worldwide | Palace of Roman"
   description: "Authenticated {{title}} from the maisons that matter. Express worldwide delivery, 14-day returns. {{description}}"
```

Leaves per-collection custom recipes alone.

## 4. Four city SEO landing pages (staged launch)

New routes — built and linked all in one batch:

- `src/routes/designer-fashion-new-york.tsx`
- `src/routes/designer-fashion-los-angeles.tsx`
- `src/routes/designer-fashion-miami.tsx`
- `src/routes/designer-fashion-san-francisco.tsx`

Each route:
- `head()` with unique `title`, `description`, `og:title`, `og:description`, `og:url`, `og:image` (uses existing `home-hero.jpg`), self-canonical, JSON-LD `BreadcrumbList` + `LocalBusiness`-style `Store` schema with `areaServed` = the metro.
- Shared component `<CityLandingPage>` in `src/components/city-landing-page.tsx` so the 4 routes stay thin and consistent (eyebrow → H1 → intro → 3-section body answering the 5 objections → FAQ → product rail of New-In Men + Women → CTA strip).
- Copy: localized by metro ("Manhattan to Tribeca", "Beverly Hills to West Hollywood", "Design District to South Beach", "Pacific Heights to Palo Alto") but every piece authentic — no fabricated showrooms, no fake try-on, no in-person services (founder-identity constraint).
- Product rail reuses `newThisWeekQueryOptions("Men")` + Women — no new data layer.
- Bottom CTA links into the curated edits / brands index.

### Linkage (so they're not orphans)

- Add a discrete "Shop By City" group to `src/components/site-footer.tsx` — 4 links, footer only. **No header / megamenu / homepage tile changes.** This satisfies the staged-launch rule without pulling them into the main IA before they prove out.
- Add the 4 paths to `src/routes/sitemap[.]xml.tsx` (or whatever file owns the sitemap — will read it before editing).

### What I will NOT touch

- Cart, checkout, Shopify integration, fulfillment locations
- `routeTree.gen.ts` (auto-generated)
- Existing landing collection routes (`designer-belts`, `designer-mens-shirts`, etc.) beyond what the default recipe in step 3 produces
- Brand/in-rome routes (`brand.$vendor.in-rome.tsx`) — those are a separate playbook
- Header nav, homepage tiles, megamenu

## 5. Verification

After writing:
- Read each new route file to confirm `head()` shape compiles (TanStack-style: `meta`/`links`/`scripts` only).
- Verify the 4 paths appear in the sitemap loader output.
- No DB / no migrations / no secrets changes.

## Technical notes

- All copy follows `mem://constraints/no-bg-mention` ("global network of authorised boutiques and distributors") and the team-identity constraint (solo founder — no atelier, no in-person appointments).
- City pages target conversion + paid-traffic landers, not organic-search wins (Semrush shows ~0 volume on the head terms). Documented in plan caveat so you can decide later whether to expand or repurpose them.
- Total new files: 1 component + 4 routes + 1 memory file. Total edits: meta-ab.ts, site-footer.tsx, sitemap route, mem://index.md. ~9 files.
