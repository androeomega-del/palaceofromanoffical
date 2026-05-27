-- Allow anonymous visitors to subscribe to stock alerts (with validation)
CREATE POLICY "Anyone can subscribe to stock alerts"
ON public.stock_alert_subscriptions
FOR INSERT
TO anon, authenticated
WITH CHECK (
  email IS NOT NULL
  AND length(email) >= 5 AND length(email) <= 320
  AND email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
  AND product_handle IS NOT NULL
  AND length(product_handle) >= 1 AND length(product_handle) <= 255
  AND length(product_title) >= 1 AND length(product_title) <= 500
  AND length(variant_gid) >= 1 AND length(variant_gid) <= 255
  AND (variant_title IS NULL OR length(variant_title) <= 255)
  AND (price_usd IS NULL OR length(price_usd) <= 32)
  AND (image_url IS NULL OR length(image_url) <= 2048)
  AND notified_at IS NULL
);

GRANT INSERT ON public.stock_alert_subscriptions TO anon, authenticated;

-- Allow anonymous visitors to capture their abandoned cart with email
CREATE POLICY "Anyone can record abandoned carts"
ON public.abandoned_carts
FOR INSERT
TO anon, authenticated
WITH CHECK (
  email IS NOT NULL
  AND length(email) >= 5 AND length(email) <= 320
  AND email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
  AND session_id IS NOT NULL
  AND length(session_id) >= 1 AND length(session_id) <= 128
  AND item_count >= 0 AND item_count <= 100
  AND total_usd >= 0 AND total_usd <= 1000000
  AND (customer_name IS NULL OR length(customer_name) <= 200)
  AND (checkout_url IS NULL OR length(checkout_url) <= 2048)
  AND (page_path IS NULL OR length(page_path) <= 500)
  AND (user_agent IS NULL OR length(user_agent) <= 500)
  AND recovery_email_sent_at IS NULL
  AND recovery_email_count = 0
  AND recovered_at IS NULL
);

GRANT INSERT ON public.abandoned_carts TO anon, authenticated;