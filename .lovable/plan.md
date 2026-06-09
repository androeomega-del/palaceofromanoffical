# Add real LocalBusiness schema to city landing pages

## Confirmed inputs (from you)

- Base locality: **West Hollywood, California, US** (general area, no street — GBP service-area business)
- Phone: **+1-213-991-4069**
- Hours: **Online 24/7**
- GBP share URL: already saved in `src/lib/social-proof.ts` as `GBP_BUSINESS_URL`
- sameAs: you've opted not to paste; I'll wire only the verified GBP URL we already have and leave a clearly-marked placeholder array you can extend later
- Schema choice: **LocalBusiness with service area** — keeps the local SEO signal (matches how Google itself treats your GBP) while truthfully omitting a street address. Service area = California → United States → Worldwide (since you ship globally).

## What gets edited

Single file: `**src/components/city-landing-page.tsx**` → rewrite the existing `cityStoreJsonLd(city, metro, path)` helper.

No route files change — all four city pages (`designer-fashion-new-york.tsx`, `-los-angeles.tsx`, `-miami.tsx`, `-san-francisco.tsx`) already call this helper, so they auto-pick up the new output.New JSON-LD shape (per city route)

```json
{
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "@id": "https://palaceofromanofficial.com<path>#store",
  "name": "Palace of Roman",
  "url": "https://palaceofromanofficial.com<path>",
  "image": "https://palaceofromanofficial.com/assets/og-default.png",
  "logo":  "https://palaceofromanofficial.com/favicon.ico",
  "telephone": "+1-213-991-4069",
  "priceRange": "$$$",
  "description": "Authenticated luxury designer fashion shipped to <metro>. Online-only boutique based in West Hollywood, California, shipping worldwide.",
  "address": {
    "@type": "PostalAddress",
    "addressLocality": "West Hollywood",
    "addressRegion": "CA",
    "addressCountry": "US"
  },
  "areaServed": [
    { "@type": "City",    "name": "<city>" },
    { "@type": "State",   "name": "California" },
    { "@type": "Country", "name": "United States" },
    { "@type": "Place",   "name": "Worldwide" }
  ],
  "hoursAvailable": {
    "@type": "OpeningHoursSpecification",
    "dayOfWeek": ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"],
    "opens":  "00:00",
    "closes": "23:59"
  },
  "paymentAccepted": "Visa, Mastercard, Amex, Apple Pay, Shop Pay, Klarna",
  "currenciesAccepted": "USD",
  "sameAs": [
    "https://share.google/CZeLml2jcRi9MtNqP"
  ]
}
```

Notes:

- `address` carries only locality + region + country (no `streetAddress`, no `postalCode`) — valid PostalAddress, matches your GBP "service area, hide address" setting, and avoids fabricating a storefront.
- `areaServed` is an array so each city page emits its own city while still asserting CA / US / Worldwide — this is what gives Meta/Google a clean local + international signal without you having to maintain 50 city schemas.
- `hoursAvailable` reflects "Online 24/7".
- `priceRange` set to `$$$` (luxury) — tell me if you want `$$$$`.
- `sameAs` ships with just the GBP share link. When you're ready, paste IG/TikTok/Pinterest URLs and I'll append them in one edit.

## Why LocalBusiness (not OnlineStore-only)

- You already have a verified GBP — Google expects the on-site schema to match it; `LocalBusiness` + service area is the documented pattern for hide-my-address businesses.
- It preserves local-pack eligibility for "designer fashion West Hollywood / Los Angeles" queries.
- It does not claim a physical storefront (no streetAddress, no geo), so it stays compliant with your founder-identity constraint.

## Not in scope (call out if you want them next)

- Adding sameAs URLs (need you to paste them)
- A separate `/west-hollywood` landing page
- `Organization` schema on the homepage (currently lives in `__root.tsx` / SEO lib — happy to audit in a follow-up)

Reply "go" and I'll switch to build mode and ship the single-file edit.