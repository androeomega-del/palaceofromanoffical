-- Bootstrap growth task seed for Palace of Roman.
-- All tasks are zero-budget, sales-generating. No paid-acquisition tasks.
-- Categories: seo, organic-social, outreach, cro, email, marketplaces, catalog, analytics

INSERT INTO public.daily_tasks (title, description, category, priority, recurrence, sort_order, status)
VALUES
  -- SEO (daily/weekly)
  ('Publish 1 long-tail SEO page', 'Editorial or PDP-supporting page targeting a specific long-tail luxury query (e.g. "pre-owned [brand] [item] [detail]"). Real catalog handles only.', 'seo', 'high', 'daily', 10, 'todo'),
  ('Refresh 3 existing PDPs for SEO', 'Rewrite title tag, meta description, and intro copy on 3 product pages with weakest impressions. Pull queries from Search Console.', 'seo', 'medium', 'daily', 20, 'todo'),
  ('Internal-link audit on new pages', 'Add 2–3 contextual internal links from older editorial/collection pages to anything published this week.', 'seo', 'medium', 'weekly', 30, 'todo'),
  ('Submit new URLs to Google', 'Search Console → URL inspection → request indexing for everything published in the last 7 days.', 'seo', 'medium', 'weekly', 40, 'todo'),

  -- Organic social (daily)
  ('Post 1 IG carousel or reel', 'Editorial-tone product story. Tag the maison. Link in bio to the actual PDP. No emojis, no "must-have" copy.', 'organic-social', 'high', 'daily', 50, 'todo'),
  ('Post 1 TikTok styling clip', 'Short-form: detail shot, hardware close-up, or styling triptych. Hook in first 1.5s. CTA: "link in bio".', 'organic-social', 'high', 'daily', 60, 'todo'),
  ('Pin 5 Pinterest images', 'Pin 5 product or editorial images to the right themed boards. Pinterest converts cold luxury intent for free — treat it as a search engine.', 'organic-social', 'medium', 'daily', 70, 'todo'),
  ('Reply to every comment + DM', 'Reply to all comments and DMs within 24h. Treat each as a styling consultation, not customer service.', 'organic-social', 'medium', 'daily', 80, 'todo'),

  -- Outreach (weekly)
  ('5 micro-influencer DMs', 'Cold-DM 5 micro-influencers (5k–50k, luxury/vintage/styling niche). Offer 1 piece in exchange for content. No mass templates.', 'outreach', 'high', 'weekly', 90, 'todo'),
  ('2 press / blog pitches', 'Pitch 2 niche fashion blogs, Substacks, or podcasts a story angle tied to a current edit or trend.', 'outreach', 'medium', 'weekly', 100, 'todo'),

  -- CRO (weekly/monthly)
  ('Mobile checkout walkthrough', 'Walk through the full mobile flow on a real device: discover → PDP → cart → checkout. Note every friction point. Fix 1 this week.', 'cro', 'high', 'weekly', 110, 'todo'),
  ('Review top 10 PDPs for trust', 'Authenticity language, sizing, returns clarity, shipping ETA, multiple photo angles. Patch the weakest one.', 'cro', 'medium', 'weekly', 120, 'todo'),
  ('Heatmap review (top 5 pages)', 'Review session recordings / heatmaps for top 5 entry pages. Identify one drop-off to address.', 'cro', 'medium', 'monthly', 130, 'todo'),

  -- Email (daily/weekly)
  ('Capture growth check', 'Confirm exit-intent, newsletter footer, and restock captures are firing. Check yesterday''s capture count vs. 7-day average.', 'email', 'medium', 'daily', 140, 'todo'),
  ('Send 1 editorial broadcast', 'Weekly editorial email: 1 story, 3–5 curated products. Voice: curatorial, restrained. No discount-led copy.', 'email', 'high', 'weekly', 150, 'todo'),
  ('Review flow performance', 'Welcome, abandoned cart, post-purchase, review-request, win-back. Check open/CTR/conversion. Tune subject line on weakest flow.', 'email', 'medium', 'weekly', 160, 'todo'),

  -- Marketplaces (weekly)
  ('Google Merchant Center sync check', 'Verify the free product feed is healthy: no disapprovals, all prices/availability current. Fix any flagged items.', 'marketplaces', 'high', 'weekly', 170, 'todo'),
  ('Pinterest catalog refresh', 'Confirm Pinterest product catalog is synced and shoppable pins are live for new arrivals.', 'marketplaces', 'medium', 'weekly', 180, 'todo'),

  -- Catalog (daily)
  ('Tag + QA today''s new arrivals', 'Verify every new product has: 3+ images, correct tags, brand collection mapping, complete copy, accurate measurements.', 'catalog', 'high', 'daily', 190, 'todo'),

  -- Analytics (weekly)
  ('Weekly conversion review', 'Sessions, conversion rate, AOV, top converting source, top converting PDP. Write 2-line takeaway. Decide next week''s focus.', 'analytics', 'high', 'weekly', 200, 'todo')
ON CONFLICT DO NOTHING;