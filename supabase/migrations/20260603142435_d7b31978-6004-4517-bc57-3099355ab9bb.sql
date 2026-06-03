-- 1. Declarative public-read policy for the product-images storage bucket.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Public read product-images'
  ) THEN
    CREATE POLICY "Public read product-images"
      ON storage.objects
      FOR SELECT
      USING (bucket_id = 'product-images');
  END IF;
END $$;

-- 2. Defense-in-depth on abandoned_carts: explicitly deny UPDATE/DELETE for
-- anon and authenticated roles. service_role bypasses RLS, so trusted
-- server-side code (supabaseAdmin) still works.
DROP POLICY IF EXISTS "No client updates to abandoned_carts" ON public.abandoned_carts;
CREATE POLICY "No client updates to abandoned_carts"
  ON public.abandoned_carts
  FOR UPDATE
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);

DROP POLICY IF EXISTS "No client deletes from abandoned_carts" ON public.abandoned_carts;
CREATE POLICY "No client deletes from abandoned_carts"
  ON public.abandoned_carts
  FOR DELETE
  TO anon, authenticated
  USING (false);
