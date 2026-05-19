ALTER TABLE public.collection_images
  ADD COLUMN IF NOT EXISTS focal_x numeric,
  ADD COLUMN IF NOT EXISTS focal_y numeric;

ALTER TABLE public.collection_images
  ADD CONSTRAINT collection_images_focal_x_range
    CHECK (focal_x IS NULL OR (focal_x >= 0 AND focal_x <= 100)) NOT VALID,
  ADD CONSTRAINT collection_images_focal_y_range
    CHECK (focal_y IS NULL OR (focal_y >= 0 AND focal_y <= 100)) NOT VALID;