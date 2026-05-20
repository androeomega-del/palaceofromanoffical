
CREATE TABLE public.cart_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL CHECK (event_type IN ('add_to_cart','remove_from_cart','checkout_started')),
  product_handle TEXT,
  product_title TEXT,
  variant_id TEXT,
  variant_title TEXT,
  price_usd NUMERIC(12,2),
  quantity INTEGER NOT NULL DEFAULT 1,
  session_id TEXT,
  page_path TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.cart_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can record cart events"
ON public.cart_events
FOR INSERT
TO anon, authenticated
WITH CHECK (
  event_type IN ('add_to_cart','remove_from_cart','checkout_started')
  AND quantity > 0 AND quantity <= 100
  AND (price_usd IS NULL OR (price_usd >= 0 AND price_usd <= 1000000))
  AND (product_handle IS NULL OR length(product_handle) <= 255)
  AND (product_title IS NULL OR length(product_title) <= 500)
  AND (variant_id IS NULL OR length(variant_id) <= 255)
  AND (variant_title IS NULL OR length(variant_title) <= 255)
  AND (session_id IS NULL OR length(session_id) <= 64)
  AND (page_path IS NULL OR length(page_path) <= 500)
  AND (user_agent IS NULL OR length(user_agent) <= 500)
);

CREATE POLICY "Admins can read cart events"
ON public.cart_events
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'));

CREATE INDEX idx_cart_events_created_at ON public.cart_events (created_at DESC);
CREATE INDEX idx_cart_events_type_created ON public.cart_events (event_type, created_at DESC);
CREATE INDEX idx_cart_events_product_handle ON public.cart_events (product_handle);
