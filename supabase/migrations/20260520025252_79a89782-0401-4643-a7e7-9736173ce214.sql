-- Enable trigram extension for fast ILIKE searches
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Composite index matching the default BEST_SELLING sort
-- (in_stock DESC, total_stock DESC, modified_at DESC)
-- Partial on in_stock=true since that's the bulk of useful results
CREATE INDEX IF NOT EXISTS idx_bg_products_bestselling
  ON public.bg_products (total_stock DESC, modified_at DESC NULLS LAST)
  WHERE in_stock = true;

-- Full sort fallback (covers in_stock=false tail)
CREATE INDEX IF NOT EXISTS idx_bg_products_sort_all
  ON public.bg_products (in_stock DESC, total_stock DESC, modified_at DESC NULLS LAST);

-- Trigram GIN indexes for fast ILIKE %...% search
CREATE INDEX IF NOT EXISTS idx_bg_products_name_trgm
  ON public.bg_products USING gin (name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_bg_products_brand_trgm
  ON public.bg_products USING gin (brand gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_bg_products_category_trgm
  ON public.bg_products USING gin (category gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_bg_products_subcategory_trgm
  ON public.bg_products USING gin (subcategory gin_trgm_ops);

-- Analyze so planner picks up new stats immediately
ANALYZE public.bg_products;