
-- 1) First-party pageview tracking
CREATE TABLE public.pageviews (
  id BIGSERIAL PRIMARY KEY,
  session_id TEXT NOT NULL,
  path TEXT NOT NULL,
  referrer TEXT,
  user_agent TEXT,
  country TEXT,
  is_bot BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT INSERT ON public.pageviews TO anon, authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.pageviews_id_seq TO anon, authenticated;
GRANT ALL ON public.pageviews TO service_role;

ALTER TABLE public.pageviews ENABLE ROW LEVEL SECURITY;

-- Anyone can log a pageview (write-only, like cart_events)
CREATE POLICY "Anyone can insert pageviews"
  ON public.pageviews FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Only admins can read
CREATE POLICY "Admins can read pageviews"
  ON public.pageviews FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_pageviews_created_at ON public.pageviews (created_at DESC);
CREATE INDEX idx_pageviews_path ON public.pageviews (path);
CREATE INDEX idx_pageviews_session ON public.pageviews (session_id);

-- 2) Email open / click tracking columns
ALTER TABLE public.email_dispatch_log
  ADD COLUMN IF NOT EXISTS opened_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS opened_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS clicked_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS clicked_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_click_url TEXT;

-- 3) Realtime for live dashboard streams
ALTER PUBLICATION supabase_realtime ADD TABLE public.pageviews;
ALTER PUBLICATION supabase_realtime ADD TABLE public.cart_events;
ALTER PUBLICATION supabase_realtime ADD TABLE public.interaction_events;
