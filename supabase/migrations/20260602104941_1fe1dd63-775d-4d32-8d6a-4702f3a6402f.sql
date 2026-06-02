
ALTER TABLE public.newsletter_subscribers
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS confirmation_token text,
  ADD COLUMN IF NOT EXISTS confirmation_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS confirmed_at timestamptz;

-- Backfill: anyone already in the list pre-double-opt-in is treated as confirmed.
UPDATE public.newsletter_subscribers
   SET status = 'confirmed', confirmed_at = COALESCE(confirmed_at, created_at)
 WHERE status = 'pending' AND confirmation_token IS NULL;

ALTER TABLE public.newsletter_subscribers
  ADD CONSTRAINT newsletter_subscribers_status_check
  CHECK (status IN ('pending','confirmed'));

CREATE UNIQUE INDEX IF NOT EXISTS newsletter_subscribers_token_idx
  ON public.newsletter_subscribers (confirmation_token)
  WHERE confirmation_token IS NOT NULL;
