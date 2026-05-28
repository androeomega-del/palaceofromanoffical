
CREATE TABLE public.product_image_reviews (
  sku text PRIMARY KEY,
  handle text NOT NULL,
  attributes jsonb NOT NULL DEFAULT '{}'::jsonb,
  prompt text NOT NULL,
  image_url text,
  image_path text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  reviewer_notes text,
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_image_reviews TO authenticated;
GRANT ALL ON public.product_image_reviews TO service_role;

ALTER TABLE public.product_image_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage product image reviews"
  ON public.product_image_reviews
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER touch_product_image_reviews_updated_at
  BEFORE UPDATE ON public.product_image_reviews
  FOR EACH ROW EXECUTE FUNCTION public.touch_growth_os_updated_at();

CREATE INDEX product_image_reviews_status_idx ON public.product_image_reviews(status, updated_at DESC);

-- Storage bucket for generated product imagery (SKU-anchored)
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;
