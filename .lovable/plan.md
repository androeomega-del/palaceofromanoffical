# Ongoing Homepage SEO Checklist

Add a repeatable check that verifies the live homepage at `https://palaceofroman.com` has the right `<title>`, meta description, canonical link, and Open Graph tags — so a regression (missing tag, wrong URL, truncated copy) is caught immediately instead of weeks later via Search Console.

## What gets checked

For each run, fetch the live homepage HTML and assert:

1. **`<title>`** — present, non-empty, ≤ 60 chars, matches the expected "Palace of Roman — Curated Luxury Fashion".
2. **`<meta name="description">`** — present, 50–160 chars, matches expected copy.
3. **`<link rel="canonical">`** — present, exactly `https://palaceofroman.com/` (no preview/lovable host, no trailing junk).
4. **Open Graph** — `og:title`, `og:description`, `og:type=website`, `og:url=https://palaceofroman.com/`, `og:image` (absolute https URL, reachable → HTTP 200).
5. **Twitter card** — `twitter:card=summary_large_image`, `twitter:title`, `twitter:description`, `twitter:image`.
6. **Robots** — `robots` meta does NOT contain `noindex` (catches accidental staging-style blocks).
7. **Google verification** — `google-site-verification` tag still present with the known token.

Each assertion returns pass / fail + the actual value, so a failure tells you exactly what changed.

## How it's delivered

Two surfaces, same underlying checker so logic stays in one place:

### 1. Admin page — `/admin/seo-health`
- New route `src/routes/admin.seo-health.tsx`, protected by the existing `admin-middleware` pattern used by `admin.analytics.tsx`.
- Calls a new server function `checkHomepageSeo` (in `src/lib/seo-health.functions.ts`) that fetches the live URL server-side and runs all assertions.
- Renders a clean editorial table: each check as a row with ✓ / ✗, the expected value, and the actual value pulled from the page. Single "Re-run checks" button.
- Lets you eyeball the state of production SEO at any time without leaving the admin.

### 2. Public health endpoint — `/api/public/seo-health`
- New server route `src/routes/api/public/seo-health.ts`.
- Returns JSON: `{ ok: boolean, checks: [{ id, label, ok, expected, actual }], checkedAt }`.
- Returns HTTP 200 when everything passes, 503 when one or more checks fail — so it can be wired into an external uptime monitor (UptimeRobot, BetterStack, cron-job.org) for true ongoing monitoring with email/Slack alerts. No secrets required, safe to expose.

## Technical details

- **Parser**: lightweight regex over the fetched HTML (no extra deps). `<title>` and meta tags are simple enough that a parser isn't worth the bundle cost; the checker already runs server-side on the Worker.
- **Source of truth for expected values**: a single `EXPECTED` const in `src/lib/seo-health.ts` (title, description, canonical, OG image URL). Update it once when copy changes; both the admin page and the API endpoint pick it up.
- **OG image reachability**: HEAD request to the `og:image` URL; flag if non-200 (covers the case where the GCS-hosted image is deleted or moved).
- **No edits to `__root.tsx`**: the existing tags there are already correct (confirmed in current code) — this work only adds verification, not changes to the tags themselves.
- **No new dependencies, no DB changes, no migrations.**

## Files

```text
src/lib/seo-health.ts                  # EXPECTED values + pure check functions
src/lib/seo-health.functions.ts        # createServerFn wrapper that fetches + runs checks
src/routes/admin.seo-health.tsx        # admin UI
src/routes/api/public/seo-health.ts    # JSON endpoint for external monitors
```

## Out of scope (ask if you want them added)

- Checking other routes (collections, product pages) — easy follow-up once the homepage checker is in place.
- Slack/email alerting from inside the app — recommend wiring the public endpoint to an external uptime monitor instead.
- Lighthouse / Core Web Vitals — different problem, handled by PageSpeed Insights.
