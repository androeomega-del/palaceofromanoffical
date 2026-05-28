CREATE OR REPLACE FUNCTION public.validate_lookbook_hotspots()
RETURNS TABLE (
  hotspot_id uuid,
  product_handle text,
  label text,
  surface_kind text,
  surface_slug text,
  lookbook_image_id uuid,
  image_url text,
  alt_text text,
  reason text,
  total_hotspots bigint,
  unique_handles bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH stats AS (
    SELECT
      count(*)::bigint AS total_hotspots,
      count(DISTINCT product_handle)::bigint AS unique_handles
    FROM public.lookbook_hotspots
  )
  SELECT
    h.id AS hotspot_id,
    h.product_handle,
    h.label,
    h.surface_kind,
    h.surface_slug,
    h.lookbook_image_id,
    i.image_url,
    i.alt_text,
    CASE
      WHEN p.handle IS NULL THEN 'missing'
      WHEN p.in_stock = false THEN 'out_of_stock'
    END AS reason,
    s.total_hotspots,
    s.unique_handles
  FROM public.lookbook_hotspots h
  LEFT JOIN public.lookbook_images i ON i.id = h.lookbook_image_id
  LEFT JOIN public.bg_products p ON p.handle = h.product_handle
  CROSS JOIN stats s
  WHERE p.handle IS NULL OR p.in_stock = false;
$$;

REVOKE ALL ON FUNCTION public.validate_lookbook_hotspots() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.validate_lookbook_hotspots() TO service_role;