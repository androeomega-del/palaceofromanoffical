CREATE TABLE public.acquired_leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  state TEXT,
  city TEXT,
  source TEXT NOT NULL DEFAULT 'acquired_list',
  segment TEXT,
  status TEXT NOT NULL DEFAULT 'new',
  import_batch_id UUID,
  notes TEXT,
  re_permission_sent_at TIMESTAMP WITH TIME ZONE,
  opted_in_at TIMESTAMP WITH TIME ZONE,
  suppressed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT acquired_leads_email_unique UNIQUE (email),
  CONSTRAINT acquired_leads_status_check CHECK (status IN ('new','re_permission_sent','opted_in','suppressed','bounced'))
);

CREATE INDEX idx_acquired_leads_status ON public.acquired_leads(status);
CREATE INDEX idx_acquired_leads_state ON public.acquired_leads(state);
CREATE INDEX idx_acquired_leads_batch ON public.acquired_leads(import_batch_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.acquired_leads TO authenticated;
GRANT ALL ON public.acquired_leads TO service_role;

ALTER TABLE public.acquired_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage acquired_leads"
  ON public.acquired_leads
  FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_acquired_leads_updated_at
  BEFORE UPDATE ON public.acquired_leads
  FOR EACH ROW
  EXECUTE FUNCTION public.touch_abandoned_carts_updated_at();