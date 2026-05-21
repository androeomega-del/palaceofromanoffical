CREATE TABLE public.abandoned_carts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL UNIQUE,
  email text NOT NULL,
  customer_name text,
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  total_usd numeric NOT NULL DEFAULT 0,
  item_count integer NOT NULL DEFAULT 0,
  checkout_url text,
  page_path text,
  user_agent text,
  last_activity_at timestamptz NOT NULL DEFAULT now(),
  recovery_email_sent_at timestamptz,
  recovery_email_count integer NOT NULL DEFAULT 0,
  recovered_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT abandoned_carts_email_format CHECK (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' AND length(email) <= 320),
  CONSTRAINT abandoned_carts_session_length CHECK (length(session_id) BETWEEN 1 AND 128),
  CONSTRAINT abandoned_carts_total_range CHECK (total_usd >= 0 AND total_usd <= 1000000),
  CONSTRAINT abandoned_carts_item_count_range CHECK (item_count >= 0 AND item_count <= 1000)
);

CREATE INDEX idx_abandoned_carts_last_activity ON public.abandoned_carts (last_activity_at);
CREATE INDEX idx_abandoned_carts_pending_recovery ON public.abandoned_carts (last_activity_at) WHERE recovery_email_sent_at IS NULL AND recovered_at IS NULL;
CREATE INDEX idx_abandoned_carts_email ON public.abandoned_carts (email);

ALTER TABLE public.abandoned_carts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can upsert their own abandoned cart"
ON public.abandoned_carts FOR INSERT
TO anon, authenticated
WITH CHECK (
  length(session_id) BETWEEN 1 AND 128
  AND length(email) BETWEEN 5 AND 320
  AND email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
  AND total_usd >= 0 AND total_usd <= 1000000
  AND item_count >= 0 AND item_count <= 1000
  AND (customer_name IS NULL OR length(customer_name) <= 200)
  AND (checkout_url IS NULL OR length(checkout_url) <= 1000)
  AND (page_path IS NULL OR length(page_path) <= 500)
  AND (user_agent IS NULL OR length(user_agent) <= 500)
  AND recovery_email_sent_at IS NULL
  AND recovered_at IS NULL
  AND recovery_email_count = 0
);

CREATE POLICY "Anyone can update their own abandoned cart by session"
ON public.abandoned_carts FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (
  length(email) BETWEEN 5 AND 320
  AND email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
  AND total_usd >= 0 AND total_usd <= 1000000
  AND item_count >= 0 AND item_count <= 1000
);

CREATE POLICY "Admins can read abandoned carts"
ON public.abandoned_carts FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE OR REPLACE FUNCTION public.touch_abandoned_carts_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_abandoned_carts_updated_at
BEFORE UPDATE ON public.abandoned_carts
FOR EACH ROW
EXECUTE FUNCTION public.touch_abandoned_carts_updated_at();