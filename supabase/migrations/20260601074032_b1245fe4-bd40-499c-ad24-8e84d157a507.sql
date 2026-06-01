CREATE TABLE public.daily_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'general',
  priority TEXT NOT NULL DEFAULT 'medium',
  sort_order INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'todo',
  notes TEXT,
  due_date DATE,
  completed_at TIMESTAMPTZ,
  completed_by UUID,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT daily_tasks_status_chk CHECK (status IN ('todo','in_progress','done')),
  CONSTRAINT daily_tasks_priority_chk CHECK (priority IN ('low','medium','high','critical'))
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.daily_tasks TO authenticated;
GRANT ALL ON public.daily_tasks TO service_role;

ALTER TABLE public.daily_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view daily tasks" ON public.daily_tasks
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins insert daily tasks" ON public.daily_tasks
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins update daily tasks" ON public.daily_tasks
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins delete daily tasks" ON public.daily_tasks
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.touch_daily_tasks_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.updated_at = now();
  IF NEW.status = 'done' AND (OLD.status IS DISTINCT FROM 'done') THEN
    NEW.completed_at = COALESCE(NEW.completed_at, now());
    NEW.completed_by = COALESCE(NEW.completed_by, auth.uid());
  ELSIF NEW.status <> 'done' THEN
    NEW.completed_at = NULL;
    NEW.completed_by = NULL;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER daily_tasks_touch
BEFORE UPDATE ON public.daily_tasks
FOR EACH ROW EXECUTE FUNCTION public.touch_daily_tasks_updated_at();

CREATE INDEX idx_daily_tasks_status ON public.daily_tasks(status);
CREATE INDEX idx_daily_tasks_sort ON public.daily_tasks(sort_order);

INSERT INTO public.daily_tasks (title, description, category, priority, sort_order) VALUES
  ('Verify A/B meta output', 'Confirm meta-ab.ts serves both variants and meta-ab-track.functions.ts logs assignments.', 'seo', 'critical', 10),
  ('Validate structured data', 'Run Google Rich Results test on /, PDP, collection, and editorial routes.', 'seo', 'critical', 20),
  ('Generate + publish sitemap', 'Ensure sitemap-xml.ts regenerates on publish and pings Google/Bing.', 'seo', 'critical', 30),
  ('SEO regression check', 'Add a test that fails the build if a route loses title, meta description, canonical, or H1.', 'seo', 'critical', 40),
  ('Mega menu completeness', 'Audit every top-level category for missing subcategory links.', 'ux', 'high', 50),
  ('Abandoned cart email cadence', 'Confirm dispatch cron is firing in the 1h–24h window. Check email_dispatch_log for last 7d.', 'email', 'high', 60),
  ('Out-of-stock drift', 'Unpublish or hide products whose inventory hit 0 without modifying fulfillment locations.', 'catalog', 'high', 70),
  ('PDP trust signals', 'Verify shipping ETA, return policy, and authorised boutique network framing on every PDP.', 'ux', 'high', 80),
  ('Decide autopilot cadence + scope', 'Pick cadence (4h/12h/nightly), auto-execute scope, and notification channel.', 'growth', 'medium', 90),
  ('Homepage Edit tile audit', 'Every tile must link to its own themed page with tagged catalog products.', 'ux', 'medium', 100),
  ('Shopify catalog sync', 'Verify new arrivals are tagged and visible in /new-arrivals.', 'catalog', 'low', 110),
  ('Broken-link sweep', 'Catch dead handles from unpublished products.', 'maintenance', 'low', 120),
  ('Daily analytics glance', 'Sessions, AOV, cart abandonment %, top exit pages.', 'analytics', 'low', 130);
