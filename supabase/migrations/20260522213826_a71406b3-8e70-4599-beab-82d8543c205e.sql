DROP POLICY IF EXISTS "shopify_variant_map public read" ON public.shopify_variant_map;
CREATE POLICY "Admins can read shopify_variant_map"
ON public.shopify_variant_map
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));