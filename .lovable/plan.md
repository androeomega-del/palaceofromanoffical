# Launch plan

Three phases: security pass → SEO pass → publish + custom domain.

## 1. Security scan + fix

- Run a full security scan against the Lovable Cloud backend (RLS, exposed data, auth misconfig).
- Triage findings:
  - **Auto-fix** anything mechanical: missing RLS policies, public tables that should be owner-scoped, missing input validation on server functions, leaked-password protection toggle.
  - **Ignore with reason** anything intentionally public (e.g. the storefront product reads, the `/api/public/*` sitemap route).
- Re-run scan to confirm clean (or down to known-accepted items).

## 2. SEO scan + fix

- Trigger an SEO review. While it runs (~1 min), do a manual sweep of the high-impact items the scanner usually flags:
  - Verify each route file has its own `head()` with route-specific `title`, `description`, `og:title`, `og:description`, `og:url`, and canonical `<link>` (root has defaults only — never canonical).
  - Verify `og:image` is wired on routes with a hero image (home, swim, campaign, editorial, brand, product, collection).
  - Confirm `public/robots.txt` and `src/routes/sitemap[.]xml.ts` reflect every current public route (home, shop, swim, swim/size-guide, campaign/dolce-gabbana-swim, brands, brand/$vendor, collections, collections/$handle, product/$handle, editorial/*, journal, about, contact, faq, authentication, shipping-returns, privacy, terms).
  - Spot-check image `alt` text on the home bento, swim hero, and campaign page.
  - JSON-LD: `Organization` at root, `Product` on product page, `BreadcrumbList` on deep routes, `FAQPage` on `/faq`.
- Apply fixes, mark findings resolved.

## 3. Publish + custom domain

- Make sure the latest preview build is green (no TS errors, no console errors on `/`, `/shop`, `/swim`, `/campaign/dolce-gabbana-swim`, a product page).
- Surface the **Publish** button so you can push the latest version live to `*.lovable.app`.
- Connect your custom domain. You said you already own it — here's what we need:
  - **Domain name** — you didn't include one in your reply. I'll prompt for it in chat before we wire DNS.
  - I'll walk you through adding the records at your registrar:
    - `A` `@` → `185.158.133.1`
    - `A` `www` → `185.158.133.1`
    - `TXT` `_lovable` → verification value shown in the Domains dialog
  - If your DNS is behind Cloudflare/proxy, we'll use the CNAME-based "Advanced → proxy" flow instead.
- After DNS verifies (minutes to hours), Lovable auto-provisions SSL and the domain goes Active. We then update `BASE_URL` in the sitemap and the canonical/`og:url` tags to the new domain.

## What I still need from you

- The exact domain you want to launch on (e.g. `palaceofroman.com`). I'll ask once we hit step 3 if you haven't sent it by then.

## Out of scope for this plan

- Claiming the Shopify store / starting the 30-day trial — that's a separate action from your side when you're ready to take real orders.
- Buying a new domain through Lovable (you said you already own one).
