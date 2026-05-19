## Goal
Turn the 99 uploaded editorial images into real content across the site so it reads like a finished luxury multi-brand boutique — not a demo. Original copy in the existing Palace of Roman voice; no Lorem ipsum, no "placeholder" text.

## Asset plan
- Copy all 99 PNGs into `src/assets/editorial/library/1.png` … `99.png`.
- Curate small named subsets (about, journal stories, hero strips, category banners) by index — no duplicate images across sections where avoidable.
- All images imported via `import.meta.glob` so we get hashed URLs and lazy loading for free.

## What gets built

### 1. Homepage expansions (`src/routes/index.tsx`)
Add three new sections between existing ones, all using uploaded imagery:
- **"The Edit" signature row** — 3-up editorial cards (Resort tailoring, The new evening, Leather seasonless) linking to journal stories and curated searches.
- **Brand spotlight strip** — single full-bleed image + quote about a featured maison this month.
- **"The Concierge" band** — three icon-free columns (Private appointments, Authentication, Worldwide delivery) replacing the silent gap above the footer.
- Polished newsletter band with a real image background instead of the footer's tiny inline form.

### 2. New routes
Each gets its own `head()` with route-specific title/description/og:image and shared `SiteHeader` + `SiteFooter`.

- `src/routes/journal.tsx` — editorial hub. Hero + grid of story cards (May 2026 + two new ones below). Filter chips by season/theme are non-functional for now (visual only) but the chips link to anchored sections.
- `src/routes/editorial.resort-2026.tsx` — "Resort 2026: Light as Architecture". Long-form story with EditorialHotspots image (reuses existing component, hotspots pointing to real Shopify product handles), pull quotes, and 6 image columns.
- `src/routes/editorial.the-new-evening.tsx` — "The New Evening". Same template, different imagery and product handles.
- `src/routes/about.tsx` — "House Notes". 4 stacked editorial sections: origin, curation philosophy, the boutique experience, the team (no fake names — atelier titles only).
- `src/routes/contact.tsx` — Two-column: editorial portrait + a real contact form (name, email, subject, message) using react-hook-form + zod. Submits to a new server function that stores leads in a `contact_messages` table on Lovable Cloud. Email/phone/hours block below.
- `src/routes/shipping-returns.tsx` — Accordion of real shipping zones, lead times, returns window, exchange policy, customs, packaging notes.
- `src/routes/authentication.tsx` — Our authentication process, what we check, certificate of authenticity, post-purchase verification, brand partnerships.
- `src/routes/privacy.tsx` — Standard luxury-boutique privacy policy (data we collect, how it's used, cookies, third parties, your rights, contact).
- `src/routes/terms.tsx` — Terms of sale and use (orders, pricing, availability, payment, IP, governing law).

### 3. Catalog polish
- `src/routes/collections.index.tsx` — Add an editorial hero (image + headline + intro paragraph) above the existing collection grid.
- `src/routes/collections.$handle.tsx` — When a collection has results, render a slim editorial banner at the top with a tailored caption per collection (women's clothing, women's shoes, men's clothing, men's shoes, new-arrivals — fallback for others). Improve the empty state with a centered editorial image + suggestion to browse other collections.
- `src/routes/shop.tsx` — Same hero treatment; one paragraph about the curation method.

### 4. Footer + header wiring
- Footer: replace all `href="#"` with real `<Link>` to the new routes (Shipping & Returns, Authentication, Contact, Privacy, Terms). "Order Tracking" links to /contact for now.
- Header: keep current nav. Add a "Journal" link if there's room (next to existing nav items).

### 5. Backend (Lovable Cloud)
Migration creates a `contact_messages` table:
- columns: id (uuid pk), name, email, subject, message, created_at
- RLS enabled, no public select; INSERT allowed via the server function path (the server function uses the admin client after validating zod schema and a basic rate-limit by IP via a 60-second key in memory).
A `submitContactMessage` server function (`src/lib/contact.functions.ts`) validates input with zod (lengths, email format) and inserts via `supabaseAdmin`. Returns `{ ok: true }`.

## Out of scope (call out, don't build)
- Order tracking (needs Shopify Order API and auth); placeholder routes to /contact instead.
- Sending email notifications for contact form (no email connector connected yet); only DB persistence.
- Per-collection editorial routes beyond the two named stories.

## Technical notes
- Image bundling: `const images = import.meta.glob('@/assets/editorial/library/*.png', { eager: true, query: '?url', import: 'default' })` then index by filename.
- Reuse `EditorialHotspots` for both new stories with hand-picked Shopify handles (verified via existing `fetchProducts` paths — fall back to any real product if a handle 404s; loader is forgiving).
- Contact form uses existing shadcn `Form`, `Input`, `Textarea`, `Button`.
- All new routes use semantic tokens (`bg-canvas`, `text-ink`, `text-muted-foreground`, `text-bronze`) — no raw colors.
- No changes to `src/routeTree.gen.ts`; it regenerates from the new route files.

## Order of execution
1. Copy assets + build a tiny image-loader util.
2. Migration for `contact_messages` + server function.
3. Static legal/info routes (privacy, terms, shipping-returns, authentication).
4. About + Contact routes.
5. Journal hub + 2 editorial stories.
6. Homepage expansions.
7. Catalog polish (collections index, $handle, shop).
8. Footer/header wiring.
9. Verify build + visual spot-check homepage and one new route.
