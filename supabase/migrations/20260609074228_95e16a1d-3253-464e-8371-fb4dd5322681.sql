DROP POLICY IF EXISTS "Anyone can record interaction events" ON public.interaction_events;

CREATE POLICY "Anyone can record interaction events"
ON public.interaction_events
FOR INSERT
TO anon, authenticated
WITH CHECK (
  event_type = ANY (ARRAY[
    'impression','hover','click','pdp_view','wishlist','cart',
    'scarcity_view','scarcity_click','scarcity_cart',
    'rail_impression','rail_tap',
    'capsule_view','capsule_open','capsule_add','capsule_remove',
    'capsule_swap','capsule_mismatch','capsule_checkout','capsule_share'
  ])
  AND handle IS NOT NULL
  AND length(handle) BETWEEN 1 AND 255
  AND (vendor IS NULL OR length(vendor) <= 255)
  AND (product_type IS NULL OR length(product_type) <= 255)
  AND (session_id IS NULL OR length(session_id) <= 64)
  AND (page_path IS NULL OR length(page_path) <= 500)
  AND (user_agent IS NULL OR length(user_agent) <= 500)
  AND (
    surface IS NULL
    OR (
      length(surface) BETWEEN 1 AND 64
      AND surface ~ '^(rail|capsule):[a-z0-9-]+$'
    )
  )
  AND (position IS NULL OR (position >= 0 AND position <= 100))
);