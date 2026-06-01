
-- 1. Monitored URLs (auto-synced from sitemap + manually pinned)
CREATE TABLE public.gsc_monitored_urls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  url text NOT NULL UNIQUE,
  page_group text NOT NULL DEFAULT 'product',
  source text NOT NULL DEFAULT 'sitemap', -- sitemap | manual | redirect-audit
  locale text,
  active boolean NOT NULL DEFAULT true,
  last_synced_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_gsc_monitored_urls_group ON public.gsc_monitored_urls(page_group);
CREATE INDEX idx_gsc_monitored_urls_active ON public.gsc_monitored_urls(active) WHERE active = true;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.gsc_monitored_urls TO authenticated;
GRANT ALL ON public.gsc_monitored_urls TO service_role;
ALTER TABLE public.gsc_monitored_urls ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage monitored urls" ON public.gsc_monitored_urls
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 2. Alert thresholds (global default + per-page-group overrides)
CREATE TABLE public.gsc_alert_thresholds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scope_type text NOT NULL DEFAULT 'global', -- global | page_group
  scope_value text, -- null for global, page_group name otherwise
  impressions_drop_pct numeric NOT NULL DEFAULT 40,
  clicks_drop_pct numeric NOT NULL DEFAULT 50,
  sitemap_error_min integer NOT NULL DEFAULT 1,
  position_warn_above numeric,
  min_impressions_floor integer NOT NULL DEFAULT 20,
  min_clicks_floor integer NOT NULL DEFAULT 5,
  active boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (scope_type, scope_value)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.gsc_alert_thresholds TO authenticated;
GRANT ALL ON public.gsc_alert_thresholds TO service_role;
ALTER TABLE public.gsc_alert_thresholds ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage thresholds" ON public.gsc_alert_thresholds
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Seed default global threshold
INSERT INTO public.gsc_alert_thresholds (scope_type, scope_value) VALUES ('global', NULL)
ON CONFLICT (scope_type, scope_value) DO NOTHING;

-- 3. Redirect-status audits for legacy /products URLs
CREATE TABLE public.gsc_redirect_audits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_at timestamptz NOT NULL DEFAULT now(),
  total integer NOT NULL DEFAULT 0,
  status_301 integer NOT NULL DEFAULT 0,
  status_404 integer NOT NULL DEFAULT 0,
  status_200 integer NOT NULL DEFAULT 0,
  status_other integer NOT NULL DEFAULT 0,
  by_locale jsonb NOT NULL DEFAULT '{}'::jsonb,
  results jsonb NOT NULL DEFAULT '[]'::jsonb,
  notes text
);
CREATE INDEX idx_gsc_redirect_audits_run_at ON public.gsc_redirect_audits(run_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.gsc_redirect_audits TO authenticated;
GRANT ALL ON public.gsc_redirect_audits TO service_role;
ALTER TABLE public.gsc_redirect_audits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read audits" ON public.gsc_redirect_audits
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins write audits" ON public.gsc_redirect_audits
  FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 4. URL Inspection captures (auto via GSC API where possible, else manual)
CREATE TABLE public.gsc_url_inspections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  url text NOT NULL,
  inspection_result jsonb NOT NULL DEFAULT '{}'::jsonb,
  verdict text, -- PASS | NEUTRAL | FAIL | UNKNOWN
  coverage_state text,
  indexing_state text,
  last_crawl_time timestamptz,
  page_fetch_state text,
  robots_txt_state text,
  capture_source text NOT NULL DEFAULT 'api', -- api | manual
  captured_at timestamptz NOT NULL DEFAULT now(),
  captured_by uuid,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_gsc_url_inspections_url ON public.gsc_url_inspections(url);
CREATE INDEX idx_gsc_url_inspections_captured_at ON public.gsc_url_inspections(captured_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.gsc_url_inspections TO authenticated;
GRANT ALL ON public.gsc_url_inspections TO service_role;
ALTER TABLE public.gsc_url_inspections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage inspections" ON public.gsc_url_inspections
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
