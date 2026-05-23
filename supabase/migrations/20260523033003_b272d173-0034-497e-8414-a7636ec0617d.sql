
CREATE TABLE public.product_origins (
  handle text PRIMARY KEY,
  country_code text,
  country text,
  city text,
  location_id text,
  total_stock integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.product_origins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "product_origins public read"
  ON public.product_origins
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Admins manage product_origins"
  ON public.product_origins
  FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_product_origins_country_code ON public.product_origins(country_code);
