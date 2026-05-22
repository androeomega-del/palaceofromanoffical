
-- 1. SECURITY LOCKDOWN — bg_products / bg_variants
DROP POLICY IF EXISTS "bg_products public read" ON public.bg_products;
DROP POLICY IF EXISTS "bg_variants public read" ON public.bg_variants;

CREATE POLICY "Admins can read bg_products"
  ON public.bg_products FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can read bg_variants"
  ON public.bg_variants FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- 2. URGENCY EVENT TYPES
DROP POLICY IF EXISTS "Anyone can record interaction events" ON public.interaction_events;

CREATE POLICY "Anyone can record interaction events"
  ON public.interaction_events FOR INSERT TO anon, authenticated
  WITH CHECK (
    (event_type = ANY (ARRAY[
      'impression'::text,'hover'::text,'click'::text,'pdp_view'::text,
      'wishlist'::text,'cart'::text,
      'scarcity_view'::text,'scarcity_click'::text,'scarcity_cart'::text
    ]))
    AND (handle IS NOT NULL)
    AND ((length(handle) >= 1) AND (length(handle) <= 255))
    AND ((vendor IS NULL) OR (length(vendor) <= 255))
    AND ((product_type IS NULL) OR (length(product_type) <= 255))
    AND ((session_id IS NULL) OR (length(session_id) <= 64))
    AND ((page_path IS NULL) OR (length(page_path) <= 500))
    AND ((user_agent IS NULL) OR (length(user_agent) <= 500))
  );

-- 3. PRODUCT REVIEWS
CREATE OR REPLACE FUNCTION public.touch_product_reviews_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TABLE IF NOT EXISTS public.product_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_handle text NOT NULL,
  rating integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title text,
  body text NOT NULL,
  author_name text NOT NULL,
  author_email text NOT NULL,
  verified_purchase boolean NOT NULL DEFAULT false,
  order_id text,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','approved','rejected')),
  approved_at timestamptz,
  approved_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS product_reviews_handle_status_idx
  ON public.product_reviews (product_handle, status);

ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read approved reviews"
  ON public.product_reviews FOR SELECT TO anon, authenticated
  USING (status = 'approved');

CREATE POLICY "Anyone can submit a review"
  ON public.product_reviews FOR INSERT TO anon, authenticated
  WITH CHECK (
    length(product_handle) BETWEEN 1 AND 255
    AND length(body) BETWEEN 10 AND 4000
    AND length(author_name) BETWEEN 1 AND 100
    AND length(author_email) BETWEEN 5 AND 320
    AND author_email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
    AND status = 'pending'
    AND approved_at IS NULL
    AND approved_by IS NULL
  );

CREATE POLICY "Admins manage reviews"
  ON public.product_reviews FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP TRIGGER IF EXISTS product_reviews_touch_updated_at ON public.product_reviews;
CREATE TRIGGER product_reviews_touch_updated_at
  BEFORE UPDATE ON public.product_reviews
  FOR EACH ROW EXECUTE FUNCTION public.touch_product_reviews_updated_at();
