CREATE TABLE public.vacation_destinations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  region text NOT NULL DEFAULT '',
  climate text NOT NULL,
  seasonal_notes text NOT NULL DEFAULT '',
  editorial_summary text NOT NULL,
  style_tags text[] NOT NULL DEFAULT '{}',
  default_vibe text NOT NULL DEFAULT 'resort-evening',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX vacation_destinations_slug_idx ON public.vacation_destinations (slug);
CREATE INDEX vacation_destinations_active_idx ON public.vacation_destinations (is_active) WHERE is_active = true;

GRANT SELECT ON public.vacation_destinations TO anon, authenticated;
GRANT ALL ON public.vacation_destinations TO service_role;

ALTER TABLE public.vacation_destinations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Active destinations are publicly readable"
  ON public.vacation_destinations FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins manage destinations"
  ON public.vacation_destinations FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE OR REPLACE FUNCTION public.touch_vacation_destinations_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER touch_vacation_destinations_updated_at
  BEFORE UPDATE ON public.vacation_destinations
  FOR EACH ROW EXECUTE FUNCTION public.touch_vacation_destinations_updated_at();