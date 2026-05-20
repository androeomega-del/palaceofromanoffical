DROP POLICY IF EXISTS "Anyone can record cart events" ON public.cart_events;

CREATE POLICY "Anyone can record cart events"
ON public.cart_events
FOR INSERT
TO anon, authenticated
WITH CHECK (
  (event_type = ANY (ARRAY['add_to_cart'::text, 'remove_from_cart'::text, 'checkout_started'::text, 'reached_checkout'::text]))
  AND (quantity > 0) AND (quantity <= 100)
  AND ((price_usd IS NULL) OR ((price_usd >= 0::numeric) AND (price_usd <= 1000000::numeric)))
  AND ((product_handle IS NULL) OR (length(product_handle) <= 255))
  AND ((product_title IS NULL) OR (length(product_title) <= 500))
  AND ((variant_id IS NULL) OR (length(variant_id) <= 255))
  AND ((variant_title IS NULL) OR (length(variant_title) <= 255))
  AND ((session_id IS NULL) OR (length(session_id) <= 64))
  AND ((page_path IS NULL) OR (length(page_path) <= 500))
  AND ((user_agent IS NULL) OR (length(user_agent) <= 500))
);