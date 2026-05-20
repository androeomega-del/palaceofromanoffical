
CREATE TABLE public.bg_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  handle text NOT NULL UNIQUE,
  group_sku text NOT NULL UNIQUE,
  brand text,
  name text,
  description text,
  description_plain text,
  gender text,
  category text,
  subcategory text,
  subsubcategory text,
  color text,
  material text,
  origin text,
  main_picture text,
  pictures text[] NOT NULL DEFAULT '{}',
  retail_price numeric,
  wholesale_price numeric,
  currency text,
  product_condition text,
  total_stock integer NOT NULL DEFAULT 0,
  in_stock boolean NOT NULL DEFAULT false,
  modified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX bg_products_brand_idx ON public.bg_products (lower(brand));
CREATE INDEX bg_products_category_idx ON public.bg_products (category, subcategory, subsubcategory);
CREATE INDEX bg_products_gender_idx ON public.bg_products (gender);
CREATE INDEX bg_products_in_stock_idx ON public.bg_products (in_stock) WHERE in_stock = true;

CREATE TABLE public.bg_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_sku text NOT NULL UNIQUE,
  group_sku text NOT NULL REFERENCES public.bg_products(group_sku) ON DELETE CASCADE,
  size text,
  quantity integer NOT NULL DEFAULT 0,
  mpn text,
  weight numeric,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX bg_variants_group_sku_idx ON public.bg_variants (group_sku);

ALTER TABLE public.bg_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bg_variants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "bg_products public read"
  ON public.bg_products FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "bg_variants public read"
  ON public.bg_variants FOR SELECT
  TO anon, authenticated
  USING (true);
