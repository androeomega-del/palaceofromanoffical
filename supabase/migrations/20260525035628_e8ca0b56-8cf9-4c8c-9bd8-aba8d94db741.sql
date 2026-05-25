-- Lookbook images (one row per editorial photo in an Edition)
CREATE TABLE public.lookbook_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  edition_handle TEXT NOT NULL,
  image_url TEXT NOT NULL,
  blur_data_url TEXT,
  width INTEGER,
  height INTEGER,
  alt_text TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_lookbook_images_edition ON public.lookbook_images (edition_handle, sort_order);

ALTER TABLE public.lookbook_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lookbook_images public read"
ON public.lookbook_images FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Admins manage lookbook_images"
ON public.lookbook_images FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER touch_lookbook_images_updated_at
BEFORE UPDATE ON public.lookbook_images
FOR EACH ROW EXECUTE FUNCTION public.touch_collection_images_updated_at();

-- Lookbook hotspots (shoppable dots placed on a lookbook image)
CREATE TABLE public.lookbook_hotspots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lookbook_image_id UUID NOT NULL REFERENCES public.lookbook_images(id) ON DELETE CASCADE,
  x NUMERIC NOT NULL CHECK (x >= 0 AND x <= 1),
  y NUMERIC NOT NULL CHECK (y >= 0 AND y <= 1),
  product_handle TEXT NOT NULL,
  variant_gid TEXT,
  label TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_lookbook_hotspots_image ON public.lookbook_hotspots (lookbook_image_id, sort_order);

ALTER TABLE public.lookbook_hotspots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lookbook_hotspots public read"
ON public.lookbook_hotspots FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Admins manage lookbook_hotspots"
ON public.lookbook_hotspots FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));