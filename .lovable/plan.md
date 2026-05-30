# Farfetch-style desktop redesign + trending landing pages

Goal: port Farfetch's clean two-row IA to PoR's desktop header, then add a system for editorial landing pages keyed to trending topics. PoR voice throughout (serif logo, ink/canvas/bronze, restrained curatorial copy). AI sections stay — they get cleaner slots.

Scope is the **header + a reusable trend-landing template + 3 initial landing pages**. Homepage body, PLP, PDP unchanged this pass. Per staged-launches: nothing exposed in nav until its assets, copy, products and SEO are ready in the same batch.

---

## 1. Desktop header — new shape

Two rows, centered logo (Farfetch's structure), PoR tokens.

```text
┌──────────────────────────────────────────────────────────────────────┐
│  announcement bar (existing, unchanged)                              │
├──────────────────────────────────────────────────────────────────────┤
│  WOMEN  MEN          PALACE OF ROMAN          USD ▾  ♡  ◌  🛍       │  ← row 1: dept tabs + serif logo + utility
├──────────────────────────────────────────────────────────────────────┤
│  Sale  New In  Vacation  Brands  Clothing  Shoes  Bags  Accessories  │
│  Watches  Lifestyle          🔎  search the maisons…                 │  ← row 2: category rail + inline search (per active dept)
└──────────────────────────────────────────────────────────────────────┘
```

Behavior
- **Row 1 left** — `Women` / `Men` tabs (active = ink, inactive = ink/45, underline indicator). Switching tabs swaps row 2's category list to that department's columns. Default: Women. Persists in `sessionStorage` so reloads keep the tab.
- **Row 1 center** — serif "Palace of Roman" wordmark, links to `/`.
- **Row 1 right** — DeliverTo, CurrencySwitcher, ReducedMotionToggle, Wishlist, Account, Cart. Unchanged behavior, just regrouped.
- **Row 2 left** — flat category rail derived from the active department: `Sale` (bronze, only if a live sale handle exists), `New In`, `Vacation`, `Brands`, then the dept's column headings (Clothing, Shoes, Bags, Accessories, …) drawn from the Shopify-built `MegaDepartment.columns`. Hover any rail item → existing megamenu panel anchored under that item with its sub-collections + a single editorial feature tile. Brands panel = existing brand A–Z + 2 hero tiles.
- **Row 2 right** — inline search input (replaces the search icon at desktop ≥ lg). Click/focus expands into the existing `SearchOverlay`; small viewports keep the icon-only behavior already in place.
- **Hero brands (D&G + Emilio Pucci)** — surfaced as the 2 feature tiles inside the `Brands` megamenu panel only (not as their own rail items). When we add brand landing pages later, these tiles deep-link to them.

Removals from the current header
- `FLAT_LEFT` / `FLAT_RIGHT` arrays (Shop, Best Sellers, Collections, Style Quiz, Journal, Limited Finds, New Arrivals) — these stop being top-level rail items. Their entry points move to: Style Quiz → row 1 utility cluster (small text link to the right of cart), Journal → footer + inline within Trends landing pages, Best Sellers / New Arrivals / Collections → first rail items inside each dept ("New In" already covers New Arrivals). Limited Finds → bronze tile inside the "Sale" panel if active, else footer.

Files
- `src/components/site-header.tsx` — rewrite layout (two rows, dept tabs, inline search slot). Keep existing state (cart, search overlay, announcement dismiss).
- `src/components/megamenu.tsx` — `DesktopMegamenu` refactored: accepts `activeDept` + `categoryHeading` and renders the panel anchored to whichever rail item is hovered. Brands panel gains 2 hero tile slots driven by a new `HERO_BRANDS` const.
- `src/lib/nav-config.ts` — add `HERO_BRANDS = [{ vendor: "Dolce & Gabbana", … }, { vendor: "Emilio Pucci", … }]` with placeholder hero image refs that we wire in step 3.

---

## 2. Trend-landing template (reusable)

One file, configured per landing page. Mirrors Farfetch's "Beach bound" treatment: full-bleed hero, manifesto, then shoppable rails of real Shopify products.

Template sections
1. **Hero** — full-bleed brand-accurate image (per imagery-QA rules: fetched + verified), centered eyebrow + serif title + 1–2 line PoR manifesto + single CTA ("Shop the edit").
2. **The Edit grid** — 8–12 verified catalog products (existing `ProductCard`), filtered via a Shopify query string passed in as prop. No products = section hidden, not faked.
3. **AI styling slot** — `AiRecommendations` (existing) seeded with the page's tag/vendor context. Stays an AI section, just framed cleaner.
4. **Story chapters** (optional 1–3) — `ThemedChapter` blocks with shoppable hotspots, per themed-edits + always-tag rules.
5. **Outro CTAs** — 3–4 buttons to adjacent collections.
6. **SEO** — full `routeHead` + Article JSON-LD, per SEO playbook.

Files
- `src/components/trend-landing.tsx` — reusable shell taking `{ slug, eyebrow, title, manifesto, hero, query, chapters?, outroCtas }`.
- `src/routes/trends/$slug.tsx` — dynamic route that reads from a registry, OR per-slug routes if we want hand-tuned heads (recommend per-slug routes for SEO + share images).

---

## 3. Three initial trending landing pages (Edits)

Picked to leverage what's already in catalog + match current search trends.

| Slug                         | Title                       | Query / source                                   | Hero focus                              |
|------------------------------|-----------------------------|--------------------------------------------------|-----------------------------------------|
| `/trends/quiet-luxury`       | Quiet Luxury                | `vendor:"Brunello Cucinelli" OR vendor:"Tom Ford" OR vendor:"Loro Piana"` filtered to muted neutrals | Cashmere + linen, palazzo light         |
| `/trends/dolce-gabbana-icons`| Dolce & Gabbana Icons       | `vendor:"Dolce & Gabbana"`                       | Sicilian baroque, hero brand #1         |
| `/trends/pucci-prints`       | Emilio Pucci Prints         | `vendor:"Emilio Pucci"`                          | Capri kaleidoscope silk, hero brand #2  |

Pre-flight per page (per catalog-truth + product-imagery-QA rules):
1. Verify the vendor query returns ≥ 6 live products before page exists.
2. Pull 2–3 product CDN photos as references for `edit_image`.
3. Generate hero with brand-accurate signatures (D&G: leopard / corsets / lace / DG hardware; Pucci: pucci print / chiffon / kaleidoscopic geometric).
4. Post-gen visual QA: color, pattern, material, hardware, logo.

Exposure
- D&G + Pucci pages link from the Brands megamenu hero tiles.
- Quiet Luxury links from the Vacation/Lifestyle rail panel.
- All three appear in footer "Trends" column.
- Nothing goes live in nav until its hero + grid + copy + SEO are committed in the same batch.

---

## Approval gates (per-item, per working-mode memory)

I'll stop and wait at each gate:

1. ✅ Plan approved (this step).
2. Header rewrite → I ship `site-header.tsx` + `megamenu.tsx` changes, you eyeball at desktop + mobile, then approve.
3. `trend-landing.tsx` template + `/trends/quiet-luxury` (no D&G/Pucci yet → no brand-imagery risk) → approve.
4. D&G page: I do the pre-flight (product count + CDN refs), generate hero, post-gen QA, show you before linking from nav.
5. Pucci page: same.
6. Footer "Trends" column + Brands hero tiles wired only after pages 3–5 ship.

## Technical notes

- Header rewrite preserves cart-store, cart-drawer, use-cart-sync, formatCheckoutUrl (per checkout lockdown).
- Dept tab state lives in a tiny new Zustand store (`useDeptStore`) so megamenu + future PLP filters can read it.
- Trend pages use `createFileRoute("/trends/$slug")` — dynamic param, validated against a registry; unknown slugs `throw notFound()`.
- Each trend route sets its own `head()` (title, description, og:image = hero), per route-architecture rule.
- No new BG imports, no fulfillment changes, no fabricated reviews. USD prices throughout.

---

**Approve and I'll start with gate 2 (header rewrite).** If anything in the structure is wrong — different rail items, different dept tabs (e.g. add Kids later), different first trend topics — call it out now and I'll revise the plan before touching code.