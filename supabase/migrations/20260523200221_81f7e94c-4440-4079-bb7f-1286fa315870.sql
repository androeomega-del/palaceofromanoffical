
CREATE TABLE public.homepage_daily_layout (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  generated_at timestamptz NOT NULL DEFAULT now(),
  layout_json jsonb NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_homepage_daily_layout_active
  ON public.homepage_daily_layout (is_active, generated_at DESC);

ALTER TABLE public.homepage_daily_layout ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read active homepage layout"
  ON public.homepage_daily_layout
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

CREATE POLICY "Admins manage homepage layout"
  ON public.homepage_daily_layout
  FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
