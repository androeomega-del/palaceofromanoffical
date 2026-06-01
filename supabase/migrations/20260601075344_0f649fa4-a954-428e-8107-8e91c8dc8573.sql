-- Add recurrence + due date tracking to daily_tasks
ALTER TABLE public.daily_tasks
  ADD COLUMN IF NOT EXISTS recurrence text NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS recurrence_day integer,
  ADD COLUMN IF NOT EXISTS last_rolled_over_on date;

ALTER TABLE public.daily_tasks
  DROP CONSTRAINT IF EXISTS daily_tasks_recurrence_check;
ALTER TABLE public.daily_tasks
  ADD CONSTRAINT daily_tasks_recurrence_check
  CHECK (recurrence IN ('none','daily','weekly','monthly'));

-- Completion history (one row per completion event, for streaks/analytics)
CREATE TABLE IF NOT EXISTS public.daily_task_completions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES public.daily_tasks(id) ON DELETE CASCADE,
  completed_at timestamptz NOT NULL DEFAULT now(),
  completed_on date NOT NULL DEFAULT (now() AT TIME ZONE 'UTC')::date,
  completed_by uuid
);

CREATE INDEX IF NOT EXISTS idx_dtc_completed_on ON public.daily_task_completions(completed_on);
CREATE INDEX IF NOT EXISTS idx_dtc_task ON public.daily_task_completions(task_id);

GRANT SELECT, INSERT ON public.daily_task_completions TO authenticated;
GRANT ALL ON public.daily_task_completions TO service_role;

ALTER TABLE public.daily_task_completions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view completions" ON public.daily_task_completions
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins insert completions" ON public.daily_task_completions
  FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Update touch trigger to also log completion event
CREATE OR REPLACE FUNCTION public.touch_daily_tasks_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  IF NEW.status = 'done' AND (OLD.status IS DISTINCT FROM 'done') THEN
    NEW.completed_at = COALESCE(NEW.completed_at, now());
    NEW.completed_by = COALESCE(NEW.completed_by, auth.uid());
    INSERT INTO public.daily_task_completions (task_id, completed_at, completed_by)
      VALUES (NEW.id, now(), auth.uid());
  ELSIF NEW.status <> 'done' THEN
    NEW.completed_at = NULL;
    NEW.completed_by = NULL;
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_touch_daily_tasks ON public.daily_tasks;
CREATE TRIGGER trg_touch_daily_tasks
  BEFORE UPDATE ON public.daily_tasks
  FOR EACH ROW EXECUTE FUNCTION public.touch_daily_tasks_updated_at();

-- Rollover function: resets recurring done tasks whose period has elapsed
CREATE OR REPLACE FUNCTION public.rollover_recurring_daily_tasks()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  rolled integer := 0;
  today date := (now() AT TIME ZONE 'UTC')::date;
BEGIN
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN 0;
  END IF;

  -- Daily: roll over if completed before today
  UPDATE public.daily_tasks
    SET status = 'todo',
        last_rolled_over_on = today,
        due_date = today
    WHERE recurrence = 'daily'
      AND status = 'done'
      AND (last_rolled_over_on IS NULL OR last_rolled_over_on < today)
      AND (completed_at IS NULL OR (completed_at AT TIME ZONE 'UTC')::date < today);
  GET DIAGNOSTICS rolled = ROW_COUNT;

  -- Weekly: roll over if completed >= 7 days ago
  UPDATE public.daily_tasks
    SET status = 'todo',
        last_rolled_over_on = today,
        due_date = today + 7
    WHERE recurrence = 'weekly'
      AND status = 'done'
      AND (last_rolled_over_on IS NULL OR last_rolled_over_on <= today - 7)
      AND (completed_at IS NULL OR (completed_at AT TIME ZONE 'UTC')::date <= today - 7);

  -- Monthly: roll over if completed in a prior month
  UPDATE public.daily_tasks
    SET status = 'todo',
        last_rolled_over_on = today,
        due_date = (date_trunc('month', today::timestamp) + interval '1 month')::date
    WHERE recurrence = 'monthly'
      AND status = 'done'
      AND (last_rolled_over_on IS NULL OR date_trunc('month', last_rolled_over_on) < date_trunc('month', today))
      AND (completed_at IS NULL OR date_trunc('month', completed_at AT TIME ZONE 'UTC') < date_trunc('month', today));

  RETURN rolled;
END;
$$;

GRANT EXECUTE ON FUNCTION public.rollover_recurring_daily_tasks() TO authenticated;