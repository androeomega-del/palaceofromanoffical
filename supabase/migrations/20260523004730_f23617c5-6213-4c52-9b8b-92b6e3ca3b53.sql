CREATE TABLE public.trending_brands (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_name text NOT NULL UNIQUE,
  category text NOT NULL,
  trend_status text NOT NULL,
  key_aesthetic text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_trending_brands_brand_lower ON public.trending_brands (lower(brand_name));
CREATE INDEX idx_trending_brands_status ON public.trending_brands (trend_status);

ALTER TABLE public.trending_brands ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read trending brands"
ON public.trending_brands FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Admins manage trending brands"
ON public.trending_brands FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_trending_brands_updated_at
BEFORE UPDATE ON public.trending_brands
FOR EACH ROW EXECUTE FUNCTION public.touch_growth_os_updated_at();