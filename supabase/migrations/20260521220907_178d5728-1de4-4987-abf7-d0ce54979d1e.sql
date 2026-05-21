CREATE TABLE public.email_dispatch_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_name text NOT NULL,
  recipient_email text NOT NULL,
  status text NOT NULL CHECK (status IN ('sent','failed')),
  error_message text,
  cart_id uuid,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.email_dispatch_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read email dispatch log"
ON public.email_dispatch_log FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_email_dispatch_log_created_at ON public.email_dispatch_log (created_at DESC);
CREATE INDEX idx_email_dispatch_log_status ON public.email_dispatch_log (status);
CREATE INDEX idx_email_dispatch_log_template ON public.email_dispatch_log (template_name);