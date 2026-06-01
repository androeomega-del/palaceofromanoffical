ALTER FUNCTION public.rollover_recurring_daily_tasks() SECURITY INVOKER;
REVOKE EXECUTE ON FUNCTION public.rollover_recurring_daily_tasks() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rollover_recurring_daily_tasks() TO authenticated;