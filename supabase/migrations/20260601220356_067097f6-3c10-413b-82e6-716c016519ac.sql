
-- GSC monitoring tables.

CREATE TABLE public.gsc_daily_snapshots (
  snapshot_date date PRIMARY KEY,
  clicks integer NOT NULL DEFAULT 0,
  impressions integer NOT NULL DEFAULT 0,
  ctr numeric NOT NULL DEFAULT 0,
  position numeric NOT NULL DEFAULT 0,
  indexed_count integer,
  sitemap_errors integer NOT NULL DEFAULT 0,
  sitemap_warnings integer NOT NULL DEFAULT 0,
  top_queries jsonb NOT NULL DEFAULT '[]'::jsonb,
  top_pages jsonb NOT NULL DEFAULT '[]'::jsonb,
  raw jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.gsc_daily_snapshots TO authenticated;
GRANT ALL ON public.gsc_daily_snapshots TO service_role;
ALTER TABLE public.gsc_daily_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read gsc_daily_snapshots" ON public.gsc_daily_snapshots
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TABLE public.gsc_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type text NOT NULL,
  severity text NOT NULL CHECK (severity IN ('info','warning','critical')),
  title text NOT NULL,
  message text NOT NULL,
  metric_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  emailed boolean NOT NULL DEFAULT false,
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX gsc_alerts_created_idx ON public.gsc_alerts (created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.gsc_alerts TO authenticated;
GRANT ALL ON public.gsc_alerts TO service_role;
ALTER TABLE public.gsc_alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read gsc_alerts" ON public.gsc_alerts
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins update gsc_alerts" ON public.gsc_alerts
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TABLE public.gsc_weekly_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  week_start date NOT NULL UNIQUE,
  clicks integer NOT NULL DEFAULT 0,
  impressions integer NOT NULL DEFAULT 0,
  ctr numeric NOT NULL DEFAULT 0,
  position numeric NOT NULL DEFAULT 0,
  clicks_wow_pct numeric,
  impressions_wow_pct numeric,
  top_queries jsonb NOT NULL DEFAULT '[]'::jsonb,
  top_pages jsonb NOT NULL DEFAULT '[]'::jsonb,
  action_items jsonb NOT NULL DEFAULT '[]'::jsonb,
  summary text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX gsc_weekly_week_idx ON public.gsc_weekly_reviews (week_start DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.gsc_weekly_reviews TO authenticated;
GRANT ALL ON public.gsc_weekly_reviews TO service_role;
ALTER TABLE public.gsc_weekly_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read gsc_weekly_reviews" ON public.gsc_weekly_reviews
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));
