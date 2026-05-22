CREATE TABLE public.interaction_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  handle text NOT NULL,
  event_type text NOT NULL,
  vendor text,
  product_type text,
  session_id text,
  page_path text,
  user_agent text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.interaction_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read interaction events"
ON public.interaction_events
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can record interaction events"
ON public.interaction_events
FOR INSERT
TO anon, authenticated
WITH CHECK (
  event_type = ANY (ARRAY['impression'::text, 'hover'::text, 'click'::text, 'pdp_view'::text, 'wishlist'::text, 'cart'::text])
  AND handle IS NOT NULL
  AND length(handle) BETWEEN 1 AND 255
  AND (vendor IS NULL OR length(vendor) <= 255)
  AND (product_type IS NULL OR length(product_type) <= 255)
  AND (session_id IS NULL OR length(session_id) <= 64)
  AND (page_path IS NULL OR length(page_path) <= 500)
  AND (user_agent IS NULL OR length(user_agent) <= 500)
);

CREATE INDEX idx_interaction_events_handle_created_at
  ON public.interaction_events (handle, created_at DESC);

CREATE INDEX idx_interaction_events_event_created_at
  ON public.interaction_events (event_type, created_at DESC);