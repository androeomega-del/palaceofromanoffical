CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Drop existing schedule if re-running
DO $$
DECLARE jid bigint;
BEGIN
  SELECT jobid INTO jid FROM cron.job WHERE jobname = 'dispatch-cart-recovery';
  IF jid IS NOT NULL THEN PERFORM cron.unschedule(jid); END IF;
END $$;

SELECT cron.schedule(
  'dispatch-cart-recovery',
  '*/15 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://project--a70dea94-4a98-4b06-9d12-c49a8efe251f.lovable.app/api/public/hooks/dispatch-cart-recovery',
    headers := '{"Content-Type": "application/json", "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRvZm1zeGloamxvaGlvdXZ4anN5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkxNjA0MjMsImV4cCI6MjA5NDczNjQyM30.szW2LSreyqCf6p-EdoFkr04nIAJfoV86Kv8tUIg4YlQ"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);