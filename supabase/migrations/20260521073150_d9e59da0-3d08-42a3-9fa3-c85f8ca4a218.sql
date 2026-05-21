-- Win-back email tracking
CREATE TABLE public.win_back_emails_sent (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_email text NOT NULL,
  sent_at timestamptz NOT NULL DEFAULT now(),
  recommendation_handles text[]
);

ALTER TABLE public.win_back_emails_sent ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read win_back_emails_sent"
ON public.win_back_emails_sent
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_win_back_sent_email ON public.win_back_emails_sent(recipient_email);
CREATE INDEX idx_win_back_sent_at ON public.win_back_emails_sent(sent_at);

-- Stock alert subscriptions
CREATE TABLE public.stock_alert_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  variant_gid text NOT NULL,
  product_handle text NOT NULL,
  product_title text NOT NULL,
  variant_title text,
  image_url text,
  price_usd text,
  notified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.stock_alert_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read stock_alert_subscriptions"
ON public.stock_alert_subscriptions
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE UNIQUE INDEX idx_stock_alert_unique ON public.stock_alert_subscriptions(email, variant_gid);
CREATE INDEX idx_stock_alert_variant ON public.stock_alert_subscriptions(variant_gid);
CREATE INDEX idx_stock_alert_notified ON public.stock_alert_subscriptions(notified_at) WHERE notified_at IS NULL;