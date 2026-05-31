
CREATE TABLE public.meta_ab_exposures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_type text NOT NULL,
  page_path text,
  bucket smallint NOT NULL,
  variant text NOT NULL,
  session_id text,
  is_bot boolean NOT NULL DEFAULT false,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT INSERT ON public.meta_ab_exposures TO anon, authenticated;
GRANT SELECT ON public.meta_ab_exposures TO authenticated;
GRANT ALL ON public.meta_ab_exposures TO service_role;

ALTER TABLE public.meta_ab_exposures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can record meta ab exposures"
  ON public.meta_ab_exposures FOR INSERT TO anon, authenticated
  WITH CHECK (
    page_type IN ('home','collection') AND
    length(page_type) <= 32 AND
    bucket IN (0,1) AND
    variant IN ('A','B') AND
    (page_path IS NULL OR length(page_path) <= 500) AND
    (session_id IS NULL OR length(session_id) <= 128) AND
    (user_agent IS NULL OR length(user_agent) <= 500)
  );

CREATE POLICY "Admins can read meta ab exposures"
  ON public.meta_ab_exposures FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_meta_ab_exposures_lookup
  ON public.meta_ab_exposures (page_type, variant, created_at DESC);

CREATE TABLE public.meta_ab_conversions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_type text NOT NULL,
  bucket smallint NOT NULL,
  variant text NOT NULL,
  event_type text NOT NULL,
  session_id text,
  value_usd numeric,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT INSERT ON public.meta_ab_conversions TO anon, authenticated;
GRANT SELECT ON public.meta_ab_conversions TO authenticated;
GRANT ALL ON public.meta_ab_conversions TO service_role;

ALTER TABLE public.meta_ab_conversions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can record meta ab conversions"
  ON public.meta_ab_conversions FOR INSERT TO anon, authenticated
  WITH CHECK (
    page_type IN ('home','collection') AND
    bucket IN (0,1) AND
    variant IN ('A','B') AND
    event_type IN ('add_to_cart','checkout_started','reached_checkout','purchase') AND
    length(event_type) <= 64 AND
    (session_id IS NULL OR length(session_id) <= 128) AND
    (value_usd IS NULL OR (value_usd >= 0 AND value_usd <= 1000000))
  );

CREATE POLICY "Admins can read meta ab conversions"
  ON public.meta_ab_conversions FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_meta_ab_conversions_lookup
  ON public.meta_ab_conversions (page_type, variant, event_type, created_at DESC);
