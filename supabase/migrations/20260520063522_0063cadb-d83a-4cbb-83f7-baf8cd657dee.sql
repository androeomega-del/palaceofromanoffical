CREATE TABLE IF NOT EXISTS public.shopify_variant_map (
  sku TEXT PRIMARY KEY,
  variant_gid TEXT NOT NULL,
  product_gid TEXT,
  product_handle TEXT,
  available BOOLEAN NOT NULL DEFAULT true,
  synced_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.shopify_variant_map ENABLE ROW LEVEL SECURITY;

CREATE POLICY "shopify_variant_map public read"
  ON public.shopify_variant_map
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE INDEX IF NOT EXISTS idx_shopify_variant_map_handle ON public.shopify_variant_map(product_handle);