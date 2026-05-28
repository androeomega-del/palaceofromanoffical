
-- Add surface-tracking columns to lookbook_images so we can group images by where they appear
ALTER TABLE public.lookbook_images
  ADD COLUMN IF NOT EXISTS surface_kind text,
  ADD COLUMN IF NOT EXISTS surface_slug text,
  ADD COLUMN IF NOT EXISTS chapter_key text,
  ADD COLUMN IF NOT EXISTS external_id text;

-- Denormalised surface columns on hotspots for fast admin filtering
ALTER TABLE public.lookbook_hotspots
  ADD COLUMN IF NOT EXISTS surface_kind text,
  ADD COLUMN IF NOT EXISTS surface_slug text;

CREATE INDEX IF NOT EXISTS lookbook_images_surface_idx
  ON public.lookbook_images (surface_kind, surface_slug);

CREATE INDEX IF NOT EXISTS lookbook_hotspots_surface_idx
  ON public.lookbook_hotspots (surface_kind, surface_slug);

CREATE INDEX IF NOT EXISTS lookbook_hotspots_image_idx
  ON public.lookbook_hotspots (lookbook_image_id);

-- Trigger to keep lookbook_images.updated_at fresh on edits
DROP TRIGGER IF EXISTS lookbook_images_touch_updated_at ON public.lookbook_images;
CREATE TRIGGER lookbook_images_touch_updated_at
  BEFORE UPDATE ON public.lookbook_images
  FOR EACH ROW
  EXECUTE FUNCTION public.touch_collection_images_updated_at();
