CREATE TABLE IF NOT EXISTS public.web_vitals (
  id          bigserial PRIMARY KEY,
  session_id  text NOT NULL CHECK (length(session_id) BETWEEN 1 AND 128),
  path        text NOT NULL CHECK (length(path) BETWEEN 1 AND 500),
  metric      text NOT NULL CHECK (metric IN ('LCP','INP','CLS','FCP','TTFB')),
  value       double precision NOT NULL CHECK (value >= 0 AND value <= 600000),
  rating      text CHECK (rating IN ('good','needs-improvement','poor')),
  device      text CHECK (device IS NULL OR length(device) <= 16),
  user_agent  text CHECK (user_agent IS NULL OR length(user_agent) <= 500),
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_web_vitals_created_at ON public.web_vitals (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_web_vitals_metric_created ON public.web_vitals (metric, created_at DESC);

GRANT SELECT ON public.web_vitals TO authenticated;
GRANT INSERT ON public.web_vitals TO anon, authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.web_vitals_id_seq TO anon, authenticated;
GRANT ALL ON public.web_vitals TO service_role;

ALTER TABLE public.web_vitals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert web vitals"
  ON public.web_vitals FOR INSERT TO anon, authenticated
  WITH CHECK (
    length(session_id) BETWEEN 1 AND 128
    AND length(path) BETWEEN 1 AND 500
    AND metric IN ('LCP','INP','CLS','FCP','TTFB')
    AND value >= 0 AND value <= 600000
  );

CREATE POLICY "Admins can read web vitals"
  ON public.web_vitals FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));