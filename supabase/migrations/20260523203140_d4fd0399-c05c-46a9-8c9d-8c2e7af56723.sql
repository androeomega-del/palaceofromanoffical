-- 1. Stage/active/archived status on homepage layout
ALTER TABLE public.homepage_daily_layout
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('staged', 'active', 'archived'));

CREATE INDEX IF NOT EXISTS idx_homepage_daily_layout_status
  ON public.homepage_daily_layout(status, generated_at DESC);

-- 2. Dynamic landing pages
CREATE TABLE IF NOT EXISTS public.dynamic_landing_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL,
  signal_type text NOT NULL CHECK (signal_type IN ('search_spike', 'conversion_drop')),
  source_term text NOT NULL,
  priority_score numeric NOT NULL DEFAULT 0,
  blueprint_json jsonb NOT NULL,
  status text NOT NULL DEFAULT 'staged'
    CHECK (status IN ('staged', 'active', 'archived')),
  generated_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_dynamic_landing_pages_slug_active
  ON public.dynamic_landing_pages(slug)
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_dynamic_landing_pages_status
  ON public.dynamic_landing_pages(status, generated_at DESC);

ALTER TABLE public.dynamic_landing_pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read active landing pages"
  ON public.dynamic_landing_pages
  FOR SELECT
  TO anon, authenticated
  USING (status = 'active');

CREATE POLICY "Admins manage landing pages"
  ON public.dynamic_landing_pages
  FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));