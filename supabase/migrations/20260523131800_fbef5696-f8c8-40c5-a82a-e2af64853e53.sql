-- Restrict public access to product_reviews so author_email isn't exposed.
-- Create a column-safe view that omits author_email and any internal fields.
CREATE OR REPLACE VIEW public.public_approved_reviews
WITH (security_invoker = true) AS
SELECT id, product_handle, rating, title, body, author_name,
       verified_purchase, created_at
FROM public.product_reviews
WHERE status = 'approved';

GRANT SELECT ON public.public_approved_reviews TO anon, authenticated;

-- Remove the permissive public SELECT policy on the base table.
DROP POLICY IF EXISTS "Public can read approved reviews" ON public.product_reviews;