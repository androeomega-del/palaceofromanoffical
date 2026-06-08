
-- Enum for funnel source
DO $$ BEGIN
  CREATE TYPE public.funnel_source AS ENUM ('Checkout_Vault', 'Vacation_Stylist');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 1) TABLE
CREATE TABLE IF NOT EXISTS public.funnel_leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  funnel_source public.funnel_source NOT NULL,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  verification_token TEXT NOT NULL DEFAULT encode(gen_random_bytes(24), 'hex'),
  verified_at TIMESTAMPTZ,
  departure_date DATE,
  reminder_trigger_date TIMESTAMPTZ,
  product_handle TEXT,
  notes TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT funnel_leads_email_lower CHECK (email = lower(email)),
  CONSTRAINT funnel_leads_email_per_funnel UNIQUE (email, funnel_source)
);

CREATE INDEX IF NOT EXISTS funnel_leads_funnel_source_idx
  ON public.funnel_leads (funnel_source);
CREATE INDEX IF NOT EXISTS funnel_leads_is_verified_idx
  ON public.funnel_leads (is_verified);
CREATE INDEX IF NOT EXISTS funnel_leads_reminder_trigger_idx
  ON public.funnel_leads (reminder_trigger_date)
  WHERE is_verified = true AND reminder_trigger_date IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS funnel_leads_verification_token_idx
  ON public.funnel_leads (verification_token);

-- 2) GRANTS
-- anon + authenticated: only INSERT (capture forms run unauthenticated).
-- service_role: full access (admin server fns + external integrations).
GRANT INSERT ON public.funnel_leads TO anon;
GRANT INSERT ON public.funnel_leads TO authenticated;
GRANT ALL ON public.funnel_leads TO service_role;

-- 3) RLS
ALTER TABLE public.funnel_leads ENABLE ROW LEVEL SECURITY;

-- 4) POLICIES
-- Anyone can insert a new lead via the capture forms. The check enforces
-- shape (lowercase email, optional departure date) so no one can plant
-- bogus rows with arbitrary verified=true or fabricated reminder dates.
CREATE POLICY "anon_can_insert_lead"
  ON public.funnel_leads
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    email = lower(email)
    AND is_verified = false
    AND verified_at IS NULL
    AND (
      funnel_source = 'Checkout_Vault'
      OR (funnel_source = 'Vacation_Stylist' AND departure_date IS NOT NULL)
    )
  );

-- Service role bypasses RLS but we keep an explicit policy for clarity.
CREATE POLICY "service_role_full_access"
  ON public.funnel_leads
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 5) DATE UTILITY: maintain reminder_trigger_date = departure_date - 14 days
CREATE OR REPLACE FUNCTION public.funnel_leads_set_reminder()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at := now();
  IF NEW.departure_date IS NOT NULL THEN
    -- Anchor reminder to 09:00 UTC on (departure - 14 days)
    NEW.reminder_trigger_date := (NEW.departure_date - INTERVAL '14 days')::date
                                 + TIME '09:00:00' AT TIME ZONE 'UTC';
  ELSE
    NEW.reminder_trigger_date := NULL;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS funnel_leads_set_reminder_trg ON public.funnel_leads;
CREATE TRIGGER funnel_leads_set_reminder_trg
  BEFORE INSERT OR UPDATE OF departure_date ON public.funnel_leads
  FOR EACH ROW EXECUTE FUNCTION public.funnel_leads_set_reminder();

-- 6) AUTOMATION VIEW: verified vacation stylist leads inside the 7-day
-- send window leading up to their 14-day reminder anchor. Klaviyo / webhook
-- consumers query this view with the service role.
CREATE OR REPLACE VIEW public.funnel_leads_reminder_window
WITH (security_invoker = true)
AS
  SELECT
    id,
    email,
    funnel_source,
    departure_date,
    reminder_trigger_date,
    product_handle,
    verified_at,
    metadata,
    created_at
  FROM public.funnel_leads
  WHERE funnel_source = 'Vacation_Stylist'
    AND is_verified = true
    AND reminder_trigger_date IS NOT NULL
    AND reminder_trigger_date >= now()
    AND reminder_trigger_date <= now() + INTERVAL '7 days'
  ORDER BY reminder_trigger_date ASC;

GRANT SELECT ON public.funnel_leads_reminder_window TO service_role;
