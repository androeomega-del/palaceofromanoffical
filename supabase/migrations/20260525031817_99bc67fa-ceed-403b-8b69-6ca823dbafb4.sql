-- Archive any stragglers (defensive — only the Claude row should be active)
UPDATE public.homepage_daily_layout
SET is_active = false, status = 'archived'
WHERE is_active = true
  AND id <> '590b1a64-617f-4999-a341-1c4f2005785c';

-- Re-stamp the Claude-composed edition so realtime fires and the
-- public read picks up a fresh generated_at.
UPDATE public.homepage_daily_layout
SET is_active = true,
    status = 'active',
    generated_at = now()
WHERE id = '590b1a64-617f-4999-a341-1c4f2005785c';

-- Audit
INSERT INTO public.homepage_layout_audit (action, edition_id, actor, details)
VALUES (
  'force_publish',
  '590b1a64-617f-4999-a341-1c4f2005785c',
  'manual-sql',
  jsonb_build_object('reason', 'operator requested manual republish of active layout')
);
