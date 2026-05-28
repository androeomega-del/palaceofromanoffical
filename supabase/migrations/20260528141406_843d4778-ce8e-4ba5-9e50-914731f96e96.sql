-- Add source dimension to product_image_reviews so the same SKU can exist
-- separately for the BrandsGateway catalog vs the live Shopify catalog.
ALTER TABLE public.product_image_reviews
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'bg_products';

ALTER TABLE public.product_image_reviews
  DROP CONSTRAINT IF EXISTS product_image_reviews_pkey;

ALTER TABLE public.product_image_reviews
  ADD CONSTRAINT product_image_reviews_pkey PRIMARY KEY (sku, source);

ALTER TABLE public.product_image_reviews
  DROP CONSTRAINT IF EXISTS product_image_reviews_source_check;

ALTER TABLE public.product_image_reviews
  ADD CONSTRAINT product_image_reviews_source_check
  CHECK (source IN ('bg_products', 'shopify'));

CREATE INDEX IF NOT EXISTS idx_product_image_reviews_source_status
  ON public.product_image_reviews (source, status);