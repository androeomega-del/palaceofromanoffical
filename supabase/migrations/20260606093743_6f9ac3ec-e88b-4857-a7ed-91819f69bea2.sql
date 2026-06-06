
-- 1. Grant read on the safe review view (excludes author_email) to public roles
GRANT SELECT ON public.public_approved_reviews TO anon, authenticated;

-- 2. Allow anon/authenticated to insert quiz funnel events with field-length validation
CREATE POLICY "Anyone can record quiz funnel events"
  ON public.quiz_funnel_events
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    length(event_type) <= 64
    AND (email IS NULL OR (length(email) <= 320 AND email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'))
    AND (step IS NULL OR (step >= 0 AND step <= 100))
    AND (session_id IS NULL OR length(session_id) <= 128)
    AND (page_path IS NULL OR length(page_path) <= 2048)
    AND (user_agent IS NULL OR length(user_agent) <= 1024)
  );
GRANT INSERT ON public.quiz_funnel_events TO anon, authenticated;

-- 3. Allow anon/authenticated to insert quiz unlock records with validation
CREATE POLICY "Anyone can record a quiz unlock"
  ON public.quiz_unlocks
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    length(email) >= 5
    AND length(email) <= 320
    AND email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
    AND (source IS NULL OR length(source) <= 64)
    AND (user_agent IS NULL OR length(user_agent) <= 1024)
  );
GRANT INSERT ON public.quiz_unlocks TO anon, authenticated;
