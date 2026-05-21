
# Abandoned cart recovery for Palace of Roman

## Split the problem first

| Stage | Who owns recovery | Action |
|---|---|---|
| Items in cart, never reached checkout (no Shopify email yet) | **We build it** (Lovable Emails) | Phases below |
| Reached Shopify checkout, entered email, abandoned | **Shopify built-in** | Enable + customize in Shopify admin, no code |
| Reached checkout, paid, then refunded/etc. | Out of scope | — |

I will only build the first row. For the second, I'll give you a one-paragraph briefing on what to toggle in the Shopify admin — Shopify's abandoned checkout email beats anything we'd custom-build for that stage because it includes the live checkout-recovery URL Shopify generates server-side.

## What needs to exist for pre-checkout recovery

Three pieces, in order:

### Phase 1 — Email + cart linkage (data foundation)
Right now the welcome modal stores emails in `newsletter_subscribers` with no session link. The cart store has no email. Without linkage, we cannot know *whose* cart was abandoned.

- New table `cart_sessions` (session_id, email, cart_snapshot JSON, last_activity_at, recovery_sent_at, recovered_at, opted_out_at)
- When the welcome modal captures an email → write `session_id` (from localStorage) into `cart_sessions` alongside the email
- When `cart-store` mutates → upsert latest snapshot (items, subtotal in USD, generated recovery URL) into the row for that session
- RLS: anon can INSERT/UPDATE their own session row only; admin can SELECT

### Phase 2 — Email infrastructure (prereq for sending anything)
You don't have Lovable Emails set up yet. This is a one-time setup:
1. Email domain on `notify.palaceofromanofficial.com` (delegated NS — needs DNS records added at your registrar; DNS can verify in background, sending starts once verified)
2. `setup_email_infra` — provisions the email queue, suppression list, unsubscribe tokens, cron dispatcher
3. `scaffold_transactional_email` — creates the generic sender route + unsubscribe page

If you'd rather route through an existing provider (e.g. Klaviyo, Mailchimp, Brevo) tell me and I'll wire that instead — but Lovable Emails is the lowest-friction default and matches the editorial brand voice without a third bill.

### Phase 3 — Editorial recovery templates + dispatch
- Two React Email templates in `src/lib/email-templates/`, both styled to match the site (Cormorant Garamond + Karla, ivory/bronze palette, the actual product images from the snapshot):
  - **`cart-recovery-1h.tsx`** — "Your selection awaits" — 1 hour after abandonment, soft tone, shows up to 3 items with image/name/price, single "Return to your selection" button
  - **`cart-recovery-24h.tsx`** — "A quiet reminder from the boutique" — 24 hours after, slightly warmer, same items, single button. **No discount code** — Palace of Roman doesn't discount; we use scarcity + service language instead. (If you ever want a discount variant, that's a separate decision and I'd want your approval before adding it.)
- New cron-triggered server route `/api/public/hooks/dispatch-cart-recovery` (pg_cron, every 15 min):
  - Find `cart_sessions` where `last_activity_at` is between 1h–2h ago AND `recovery_sent_at IS NULL` AND `opted_out_at IS NULL` AND `email IS NOT NULL` AND cart_snapshot has items → send 1h template, set `recovery_sent_at`
  - Find rows where 1h email sent >23h ago AND no second email → send 24h template, set `recovery_sent_at_2`
  - Skip any row whose `session_id` shows a successful Shopify checkout (we already track this via cart-store on checkout button click — we'd extend it to write `checkout_started_at` so we can suppress)
- Idempotency keys: `cart-recovery-1h-{session_id}`, `cart-recovery-24h-{session_id}` — Lovable Email's queue dedupes automatically

### Suppression + compliance
- Lovable Emails appends the unsubscribe footer automatically
- An unsubscribe writes to `suppressed_emails` and the dispatcher skips suppressed addresses
- Welcome modal copy already implies marketing consent; I'll add a tiny "you'll also receive cart reminders" line so this is clean under GDPR/CAN-SPAM

## Shopify-side briefing (one-time, no code)

In Shopify admin → **Settings → Notifications → Customer notifications → Abandoned checkout** — enable, set to send at 1 hour and 24 hours, and customize the template HTML to match the boutique aesthetic. This covers every shopper who got far enough to type their email into the Shopify checkout. I'll write you the exact HTML to paste in once you say go.

## Open decisions I need from you before I build

1. **Scope confirmation** — build Phase 1+2+3 for pre-checkout recovery, leaving Shopify to handle post-checkout? Or do you want me to skip the pre-checkout build entirely (since your traffic is still ramping) and just give you the Shopify customization?
2. **Email provider** — Lovable Emails (recommended) or another?
3. **Sending subdomain** — confirm `notify.palaceofromanofficial.com`?
4. **Tone of the 24h email** — pure editorial reminder (my recommendation, on brand), or do you want to test a soft offer like "complimentary shipping" or "concierge styling call"?
5. **Consent line wording** — happy to draft, but want your approval since it touches the welcome modal users already see

## Technical notes (you can skip)

- Cart snapshot stored as JSONB to survive product deletions/price changes
- Recovery URL is `https://palaceofromanofficial.com/cart?recover={session_id}` — a tiny client effect rehydrates cart-store from the snapshot if local cart is empty
- Cron schedule kept at 15 min, not 5 min, to stay well under pg_net quotas
- Server route lives at `/api/public/hooks/dispatch-cart-recovery` with `apikey` header (standard cron auth pattern), not a custom shared secret
- All admin views (`/admin/cart-recovery`) gated by `has_role(auth.uid(), 'admin')` like existing admin routes
- No new dependencies — uses existing `@react-email/components`, pg_cron, Lovable Email queue

Awaiting your call on the five questions above before I start.
