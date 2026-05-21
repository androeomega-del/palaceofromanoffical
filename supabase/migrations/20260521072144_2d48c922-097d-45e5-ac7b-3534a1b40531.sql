CREATE TABLE public.order_emails_sent (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id text NOT NULL,
  email_type text NOT NULL,
  sent_at timestamptz NOT NULL DEFAULT now(),
  recipient_email text,
  UNIQUE (order_id, email_type)
);

ALTER TABLE public.order_emails_sent ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read order_emails_sent"
ON public.order_emails_sent
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_order_emails_sent_order ON public.order_emails_sent(order_id);