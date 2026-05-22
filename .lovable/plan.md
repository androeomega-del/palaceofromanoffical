
# Palace of Roman — Growth OS (8-figure scale, $0 SaaS)

A single in-house operating system that replaces the entire paid martech stack and is engineered to handle 7–8 figure monthly volume. Built on what you already own: Lovable Cloud, Lovable AI Gateway, Shopify Admin API, HeyGen MCP, TikTok connector, Lovable Emails.

## What it replaces

| Category | Paid tool ($/mo at scale) | In-house module |
|---|---|---|
| AI blog publishing | Click from AI, Bramework, Koala ($49–$500) | **Editorial Engine** |
| AI social pilot | Xyla, Ocoya, Predis ($39–$299) | **Social Pilot** (IG, Pinterest, X, Threads, TikTok) |
| Email/SMS marketing | Klaviyo ($150–$2,500 at 100k contacts) | **Lifecycle Autopilot** (uses your Lovable Emails) |
| AI UGC / avatars | HeyGen ($29–$330), Arcads ($110+) | **UGC Studio** (HeyGen MCP + Nano Banana + Gemini Veo prompts) |
| Programmatic SEO | Bramework, Byword ($59–$499) | **SEO Content Factory** |
| Influencer outreach | Modash, Aspire ($299+) | **Outreach CRM** (Gmail connector + Instantly-style sequencer) |
| Ads creative testing | AdCreative.ai, Pencil ($109–$649) | **Ad Forge** (static + video variants → Meta/TikTok ad library) |
| Reviews + UGC | Yotpo, Okendo ($79–$799) | **Review Orchestrator** (post-purchase trigger → real customer asks only) |
| Analytics + attribution | Triple Whale, Northbeam ($129–$1,000+) | **Attribution Lens** (UTM + cart events you already track) |
| CRO / on-site personalization | Nosto, Rebuy ($99–$899) | **Personalization Layer** (extends your existing interaction store) |
| Influencer affiliate | Refersion, GoAffPro ($99+) | **Affiliate Console** (Shopify discount codes + tracked links) |
| Loyalty / VIP | Smile, LoyaltyLion ($49+) | **VIP Tier System** (Shopify customer tags + gated drops) |

**Estimated annual SaaS savings at scale: $30k–$120k.**

## North-star architecture

```text
                    ┌─────────────────────────────┐
                    │  /admin/growth-os           │
                    │  ─ Command center           │
                    │  ─ 12 modules, 1 inbox      │
                    └──────────┬──────────────────┘
                               │ approve / schedule / reject
                               ▼
              ┌──────────────────────────────────────┐
              │  content_queue  (single source)      │
              │  growth_jobs    (workers)            │
              │  ai_usage_ledger  (cost guard)       │
              │  audience_segments (live RFM)        │
              │  growth_metrics  (north-star KPIs)   │
              └──────┬──────────┬──────────┬─────────┘
                     │          │          │
              pg_cron + Inngest-style worker queue
                     │          │          │
                     ▼          ▼          ▼
              Shopify    Social APIs    Email/SMS
              (blog,     (IG, Pin, X,   (Lovable
              products,  Threads,       Emails +
              orders,    TikTok)        Twilio
              discounts)                 SMS)
```

## The 12 modules

1. **Editorial Engine** — Auto-drafts SEO blogs from real catalog + trends. Article schema, internal linking graph, hero image. Target: 4 posts/week.
2. **Social Pilot** — One brief → 6-channel pack (IG carousel, Pin SEO, X thread, Threads post, TikTok script, LinkedIn). Posts via connectors.
3. **Lifecycle Autopilot** — Welcome, browse abandon, cart abandon, post-purchase, replenishment, win-back, VIP drops, segment campaigns. RFM segmentation calculated nightly.
4. **UGC Studio** — Image-to-video product shorts (Nano Banana), avatar talking-product (HeyGen MCP), voiceover scripts, B-roll shotlists, English/ES/FR/IT/AR localization.
5. **SEO Content Factory** — Programmatic landing pages: `/edit/best-{cat}-under-{price}`, `/heritage/{brand}`, `/style/{occasion}`, `/gift-guides/{persona}`. Built on top of catalog with internal link graph.
6. **Outreach CRM** — Influencer + press list, AI-personalized cold emails via your Gmail connector, sequence + reply detection, gifted-product offer codes.
7. **Ad Forge** — Daily AI-generated ad variants (5 static + 2 video), brand-safe copy, ready-to-paste for Meta Ads Manager + TikTok Ads Manager. Tracks which creative drove which order via UTM.
8. **Review Orchestrator** — Post-purchase trigger (real customers only, no fabrication) asks for review + UGC photo via email. Approved reviews surface on PDP.
9. **Attribution Lens** — Multi-touch attribution from your existing `interaction_events` + `cart_events` + UTMs. CAC, LTV, channel ROAS, payback period.
10. **Personalization Layer** — Homepage hero, PDP cross-sells, cart upsells, email content all served from same `audience_segments` table. A/B test framework built in.
11. **Affiliate Console** — Creator dashboard with unique discount codes, real-time sales attribution, automated commission payouts via Shopify discount API.
12. **VIP Tier System** — Lifetime spend → Bronze / Silver / Gold / Maison. Auto-tags Shopify customers, gates early-access drops, triggers concierge emails.

## Data model (new tables)

- `content_queue` (id, kind, channel, payload jsonb, status, scheduled_for, approved_by, cost_cents, parent_id)
- `growth_jobs` (worker queue with retry + dead-letter)
- `ai_usage_ledger` (every gateway call: model, tokens, cost, module) → **enforces $160 hard cap**
- `audience_segments` (customer_id, recency, frequency, monetary, ltv, tier, computed_at)
- `growth_metrics` (date, channel, impressions, clicks, sessions, orders, revenue, attributed_to)
- `outreach_contacts` + `outreach_sequences` + `outreach_messages`
- `ad_creatives` + `ad_variants` + `ad_performance`
- `reviews` + `review_requests`
- `affiliate_creators` + `affiliate_orders`
- `vip_tiers` + `vip_perks_unlocked`

## Budget & guardrails ($160/mo cap)

- Every AI call writes to `ai_usage_ledger` first. If MTD spend + estimated cost > $160 → **block + alert**.
- Model cascade: Gemini Flash Lite (classify/short) → Flash (social/email) → Pro (long-form editorial) → GPT-5 (only when explicitly needed for tone).
- Image gen rate-limited: 50/day default, configurable per module.
- All long-form generations cached by content hash (dedup on regenerate).
- Live dashboard widget: MTD spend, projection to month-end, per-module breakdown.

## Build sequence (you approve module-by-module so we don't drown)

**Wave 1 — foundation + first revenue engine (this turn if you say go)**
1. `growth-os` schema (content_queue, ai_usage_ledger, growth_jobs, audience_segments, growth_metrics)
2. `/admin/growth-os` dashboard shell with budget widget
3. Editorial Engine (live: drafts → approve → publishes to Shopify blog + `/journal`)

**Wave 2 — distribution**
4. Social Pilot (IG, Pinterest, X/Threads, TikTok scripts)
5. UGC Studio (HeyGen MCP + Nano Banana image-to-video)

**Wave 3 — retention**
6. Lifecycle Autopilot + RFM segments
7. Review Orchestrator
8. VIP Tier System

**Wave 4 — acquisition & scale**
9. SEO Content Factory (programmatic pages)
10. Ad Forge (Meta + TikTok creative variants)
11. Outreach CRM (influencer + press)
12. Affiliate Console
13. Attribution Lens (unifies everything)
14. Personalization Layer (last — feeds on data from all prior modules)

## Realistic timeline

- **Wave 1:** today's turn
- **Wave 2–3:** next 2–4 build sessions
- **Wave 4:** next 4–6 build sessions

This is genuinely the scope of a 6-person product team — the only way it works in one repo is by reusing your existing infra (Shopify, Lovable Emails, interaction store, HeyGen MCP, TikTok connector) and keeping all generation server-side with a single approval queue.

## What I need from you to start Wave 1

Just a **yes**. I'll build the schema, the dashboard shell, the budget guard, and a working Editorial Engine that drafts and publishes its first AI blog post end-to-end in this turn. Future waves will need you to connect Pinterest + Meta + (optionally) Twilio for SMS — I'll prompt you exactly when needed.

**Approve and ship Wave 1?**
