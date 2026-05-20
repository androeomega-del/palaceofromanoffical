# Three Trust Fixes + Brand Search Ranking

## What I found

1. **Contact page email** — currently shown as plain text `support@\npalaceofroman.com` (line-broken, not a mailto link). Footer mailto is correct; contact card isn't. Fix.
2. **Returns visibility** — "14 days" is in the shipping page accordion + PDP trust strip, but not surfaced as a hero number. Add an unmissable callout.
3. **Brand search ranking** — editorial pages have proper `<title>` ending in "Palace of Roman" and are in sitemap. The actual blocker is that **Google has never crawled the site**: Google Search Console isn't connected, so Google has no signal the site exists. Without GSC verification + sitemap submission, ranking for "Palace of Roman" is luck. Fixing on-page copy is secondary.

## Plan

### Fix 1 — Contact page: real, clickable email
File: `src/routes/contact.tsx` (lines 175–188)

Replace the broken plain-text email card with a proper `mailto:` link, and add a second WhatsApp/concierge row so the page has more than one reply path.

```text
Email           Reply time          WhatsApp (optional)
support@…       Same business day   wa.me/… (if you give a number)
[mailto link]   Mon–Sat
```

### Fix 2 — 14-Day Returns number, unmissably visible

Two surgical adds:

**A. Shipping page hero callout** — add a 3-tile strip directly under the page intro:
```text
┌──────────────┬──────────────┬──────────────┐
│   14 DAYS    │   3–5 DAYS   │   100%       │
│   Returns    │   Express    │   Authentic  │
│   from       │   Worldwide  │   Sealed,    │
│   delivery   │              │   tagged     │
└──────────────┴──────────────┴──────────────┘
```

**B. PDP — promote returns line above the fold.** Today the trust strip sits *after* variant selectors and accordions. I'll add a single inline line directly under the price (where eyes already are):
```text
$1,240
14-day returns · Ships in 3–5 days · 100% authentic
```
The existing trust-strip diamonds stay where they are.

### Fix 3 — Get the site actually discoverable for "Palace of Roman"

This is two parts. The on-page part I can do now; the Google submission needs your one-tap approval.

**3A. On-page (now)** — make sure every editorial page name-checks the brand in the H1 and in JSON-LD `publisher` (so Google links the editorial to the org). Spot-check the 3 editorial pages + journal index.

**3B. Google Search Console (needs you to connect the GSC integration once)**

Path:
1. You connect Google Search Console in Connectors (one click — uses your existing Google account).
2. I:
   - Request a verification token from the Site Verification API for `https://palaceofroman.com/`
   - Inject the `<meta name="google-site-verification">` tag in `src/routes/__root.tsx` head
   - Wait for your next deploy, then call verify
   - Add the site to Search Console and submit `https://palaceofroman.com/sitemap.xml`
3. Within 1–3 days Google indexes the site; within 1–2 weeks "Palace of Roman" should return your homepage + at least one editorial page as a sitelink.

Without 3B, nothing else on the site will move the brand ranking. **This is the single highest-leverage SEO action you can take.**

## What I need from you

Confirm one:

- **Go all 3** — I do fixes 1, 2, 3A now; you connect GSC after and I finish 3B
- **Skip GSC for now** — I do 1, 2, 3A only
- **Different order / different scope** — tell me

If you're going with the full plan, the only thing you'll need to do is click "Connect" on Google Search Console in Connectors when I tell you to.
