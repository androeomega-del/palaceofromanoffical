
-- 1) Hide wholesale_price from public via column-level revoke.
-- The RLS policy is permissive (USING true) but column-level GRANTs gate access.
REVOKE SELECT (wholesale_price) ON public.bg_products FROM anon, authenticated;

-- 2) Storage: admin-only write policies for collection-images bucket.
CREATE POLICY "Admins can upload collection-images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'collection-images'
  AND public.has_role(auth.uid(), 'admin'::public.app_role)
);

CREATE POLICY "Admins can update collection-images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'collection-images'
  AND public.has_role(auth.uid(), 'admin'::public.app_role)
)
WITH CHECK (
  bucket_id = 'collection-images'
  AND public.has_role(auth.uid(), 'admin'::public.app_role)
);

CREATE POLICY "Admins can delete collection-images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'collection-images'
  AND public.has_role(auth.uid(), 'admin'::public.app_role)
);
