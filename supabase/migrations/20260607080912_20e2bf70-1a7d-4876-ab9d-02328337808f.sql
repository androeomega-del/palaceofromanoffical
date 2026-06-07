
-- =========================================================
-- Apex Predator: competitor backlinks snapshot
-- =========================================================
CREATE TABLE public.apex_competitor_backlinks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  competitor_domain TEXT NOT NULL,
  source_url TEXT NOT NULL,
  source_domain TEXT NOT NULL,
  target_url TEXT,
  anchor TEXT,
  page_ascore INTEGER,
  domain_ascore INTEGER,
  is_nofollow BOOLEAN NOT NULL DEFAULT false,
  first_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_net_new BOOLEAN NOT NULL DEFAULT true,
  page_excerpt TEXT,
  pitch_subject TEXT,
  pitch_body TEXT,
  pitch_generated_at TIMESTAMPTZ,
  pitch_model TEXT,
  status TEXT NOT NULL DEFAULT 'new',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (competitor_domain, source_url)
);

CREATE INDEX apex_backlinks_competitor_idx ON public.apex_competitor_backlinks (competitor_domain, first_seen_at DESC);
CREATE INDEX apex_backlinks_ascore_idx ON public.apex_competitor_backlinks (page_ascore DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.apex_competitor_backlinks TO authenticated;
GRANT ALL ON public.apex_competitor_backlinks TO service_role;

ALTER TABLE public.apex_competitor_backlinks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage apex backlinks"
  ON public.apex_competitor_backlinks
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- =========================================================
-- Apex Predator: run log
-- =========================================================
CREATE TABLE public.apex_run_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  module TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'ok',
  message TEXT,
  semrush_units_used INTEGER,
  ai_cost_usd NUMERIC(10,4),
  rows_processed INTEGER,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX apex_run_log_module_idx ON public.apex_run_log (module, created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.apex_run_log TO authenticated;
GRANT ALL ON public.apex_run_log TO service_role;

ALTER TABLE public.apex_run_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage apex run log"
  ON public.apex_run_log
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- updated_at trigger for backlinks
CREATE OR REPLACE FUNCTION public.touch_apex_backlinks_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER apex_backlinks_touch_updated
BEFORE UPDATE ON public.apex_competitor_backlinks
FOR EACH ROW EXECUTE FUNCTION public.touch_apex_backlinks_updated_at();
