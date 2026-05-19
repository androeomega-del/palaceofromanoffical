
CREATE TABLE public.collection_images (
  handle text PRIMARY KEY,
  title text,
  image_url text NOT NULL,
  source text NOT NULL CHECK (source IN ('shopify','ai','manual')),
  prompt text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.collection_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "collection_images public read"
  ON public.collection_images FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE OR REPLACE FUNCTION public.touch_collection_images_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER trg_collection_images_updated_at
  BEFORE UPDATE ON public.collection_images
  FOR EACH ROW EXECUTE FUNCTION public.touch_collection_images_updated_at();

INSERT INTO storage.buckets (id, name, public)
VALUES ('collection-images', 'collection-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "collection-images public read"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'collection-images');
