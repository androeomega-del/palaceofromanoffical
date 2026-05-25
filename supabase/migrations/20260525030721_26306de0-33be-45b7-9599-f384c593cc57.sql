-- Restrict Realtime channel subscriptions: enable RLS on realtime.messages
-- and allow only the public homepage layout topic (anon + authenticated).
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public homepage layout topic readable" ON realtime.messages;
CREATE POLICY "Public homepage layout topic readable"
ON realtime.messages
FOR SELECT
TO anon, authenticated
USING (realtime.topic() = 'homepage-daily-layout-live');