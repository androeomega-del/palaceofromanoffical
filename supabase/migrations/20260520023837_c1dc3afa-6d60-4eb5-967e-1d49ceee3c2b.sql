CREATE INDEX IF NOT EXISTS idx_bg_products_brand ON public.bg_products (brand);
CREATE INDEX IF NOT EXISTS idx_bg_products_gender ON public.bg_products (gender);
CREATE INDEX IF NOT EXISTS idx_bg_products_category ON public.bg_products (category);
CREATE INDEX IF NOT EXISTS idx_bg_products_subcategory ON public.bg_products (subcategory);
CREATE INDEX IF NOT EXISTS idx_bg_products_in_stock ON public.bg_products (in_stock) WHERE in_stock = true;
CREATE INDEX IF NOT EXISTS idx_bg_products_instock_brand ON public.bg_products (brand, gender, category) WHERE in_stock = true;
CREATE INDEX IF NOT EXISTS idx_bg_products_handle ON public.bg_products (handle);
CREATE INDEX IF NOT EXISTS idx_bg_variants_group_sku ON public.bg_variants (group_sku);