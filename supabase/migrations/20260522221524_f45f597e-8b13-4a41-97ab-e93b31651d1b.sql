CREATE TABLE public.search_queries (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  query text NOT NULL,
  result_count integer NOT NULL DEFAULT 0,
  session_id text,
  page_path text,
  user_agent text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.search_queries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can record search queries"
ON public.search_queries
FOR INSERT
TO anon, authenticated
WITH CHECK (
  query IS NOT NULL
  AND length(query) >= 1
  AND length(query) <= 200
  AND result_count >= 0
  AND result_count <= 100000
  AND (session_id IS NULL OR length(session_id) <= 64)
  AND (page_path IS NULL OR length(page_path) <= 500)
  AND (user_agent IS NULL OR length(user_agent) <= 500)
);

CREATE POLICY "Admins can read search queries"
ON public.search_queries
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_search_queries_created_at ON public.search_queries (created_at DESC);
CREATE INDEX idx_search_queries_zero_results ON public.search_queries (query) WHERE result_count = 0;