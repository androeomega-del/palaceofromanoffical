-- Create a public-safe view of product_reviews that excludes author_email.
-- The base table currently has no public SELECT policy (only admins can read),
-- but this view exists so that any future public-storefront display of
-- approved reviews can be wired safely without leaking customer emails.
CREATE OR REPLACE VIEW public.product_reviews_public
WITH (security_invoker = on) AS
SELECT
  id,
  product_handle,
  rating,
  title,
  body,
  author_name,
  verified_purchase,
  status,
  approved_at,
  created_at,
  updated_at
FROM public.product_reviews
WHERE status = 'approved';

COMMENT ON VIEW public.product_reviews_public IS
  'Public-safe projection of product_reviews. Excludes author_email and author_email-adjacent PII. Use this view (never the base table) for any anon/storefront read path.';

COMMENT ON COLUMN public.product_reviews.author_email IS
  'PII. Never expose via a public SELECT policy. If you need to surface approved reviews on the storefront, query public.product_reviews_public instead.';