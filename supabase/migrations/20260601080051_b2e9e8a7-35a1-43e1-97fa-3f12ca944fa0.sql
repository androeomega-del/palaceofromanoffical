ALTER TABLE public.daily_tasks
  ADD COLUMN IF NOT EXISTS reminder_sent_for date;