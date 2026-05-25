CREATE TABLE public.homepage_layout_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  edition_id uuid NULL,
  action text NOT NULL,
  actor text NULL,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_homepage_layout_audit_created_at
  ON public.homepage_layout_audit (created_at DESC);

ALTER TABLE public.homepage_layout_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read homepage layout audit"
  ON public.homepage_layout_audit
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));
