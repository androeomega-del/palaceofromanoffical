# Email Capture System — Implementation Plan

Goal: take subscribers from 2 → meaningful list by capturing emails at every high-intent moment, without violating GDPR/CAN-SPAM or the cart-drawer lockdown.

Existing infra we'll reuse:
- `newsletter_subscribers` table (already exists, public insert allowed)
- `stock_alert_subscriptions` table (already exists, unused)
- `abandoned_carts` table (already exists)
- Lovable Emails not yet configured — we'll set it up in Phase 2

---

## Phase 1 — High-ROI captures (ship first)

**1. Restock / "Notify me" on sold-out variants**
- New component `<NotifyMeForm />` rendered on PDP when a variant is `available: false`
- Replaces the disabled "Add to Cart" with email field + "Notify when available"
- Server fn `subscribeToStockAlert` → inserts into `stock_alert_subscriptions`
- New RLS policy: allow anon INSERT (with email/handle length validation)

**2. Exit-intent "Private Client" modal**
- New `<ExitIntentModal />` mounted in `__root.tsx`
- Triggers on `mouseleave` toward top of viewport (desktop) + 30s + scroll-up (mobile)
- Shown once per session via `sessionStorage`, suppressed if already subscribed (localStorage flag set on submit)
- Copy: "Reserve your place on the Atelier List — first access to new arrivals and private edits"
- Server fn `subscribeToNewsletter({source: 'exit_intent'})`

**3. Footer "Atelier List" form (always-visible)**
- New `<AtelierListForm />` added to existing footer
- Replaces any generic newsletter copy with the editorial framing
- Same server fn as #2 with `source: 'footer'`

**4. Cart drawer email capture — SAFE pattern**
- Per checkout-protocol lockdown: do NOT modify `cart-store`, `cart-drawer`, `use-cart-sync`, or checkout URL logic
- Instead, create a separate `<CartEmailCapture />` component that the cart-drawer already-allowed slot can render (we'll add ONE slot at the bottom of cart-drawer above the checkout button — read-only above that line)
- If user enters email → insert into `abandoned_carts` with current cart items snapshot
- This unlocks future cart recovery emails without changing checkout flow

---

## Phase 2 — Email infrastructure + automated sends

**5. Set up Lovable Emails domain + infra**
- Email setup dialog (sender domain on `notify.palaceofroman.com`)
- Scaffold transactional email templates (atelier welcome, restock alert, cart recovery, win-back)
- Templates use Palace of Roman brand styling (ivory bg, serif headings, bronze accents)

**6. Restock alert sender (server fn + cron)**
- Daily cron: query `stock_alert_subscriptions` where `notified_at IS NULL`, check Shopify variant availability, send + mark notified
- Wired through existing pgmq email queue

**7. Welcome email on subscribe**
- Triggered from `subscribeToNewsletter` server fn
- "Welcome to the Atelier List" + first-look CTA

---

## Phase 3 — Content-driven captures

**8. Style quiz**
- New route `/atelier/signature` — 4-question quiz (silhouette, palette, occasion, season)
- Results emailed (email required) + on-page result reveal with 6 curated catalog products

**9. Gated "Roman Edit" lookbook**
- New route `/atelier/lookbook` — email gate → reveals current editorial PDF (we'll generate from existing editorial library)
- Single-field form, downloads PDF after subscribe

---

## Technical details

```
New files (Phase 1):
  src/components/atelier/NotifyMeForm.tsx
  src/components/atelier/ExitIntentModal.tsx
  src/components/atelier/AtelierListForm.tsx
  src/components/atelier/CartEmailCapture.tsx
  src/lib/atelier.functions.ts   ← subscribeToNewsletter, subscribeToStockAlert, captureAbandonedCart

Migration (Phase 1):
  - Add INSERT policy on stock_alert_subscriptions (anon, with validation)
  - Add INSERT policy on abandoned_carts (anon, with validation)
  - Add 'source' check constraint values to newsletter_subscribers
```

All server fns validate with Zod (email regex, length caps) and rate-limit-friendly (no auth required, but length+format constraints in RLS).

Cart-drawer change: a single one-line render slot added above the existing checkout button — no changes to cart-store, mutations, or checkout URL logic. I'll show the diff for approval before touching it.

---

## What I need from you

Reply with one of:
- **"Ship Phase 1"** → I implement #1–#4 now (Phase 2/3 later turns)
- **"Ship all phases"** → I do everything across multiple turns, asking for approval at each phase boundary
- **"Adjust"** → tell me what to change/drop/reorder

I recommend Phase 1 first — those four alone will move the needle, and we'll have real subscriber volume before investing in the email automation infrastructure.