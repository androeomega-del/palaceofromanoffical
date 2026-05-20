
CREATE TABLE public.inventory_sync_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  status text NOT NULL DEFAULT 'running' CHECK (status IN ('running','success','error')),
  dry_run boolean NOT NULL DEFAULT false,
  total int NOT NULL DEFAULT 0,
  processed int NOT NULL DEFAULT 0,
  updated int NOT NULL DEFAULT 0,
  activated int NOT NULL DEFAULT 0,
  failed int NOT NULL DEFAULT 0,
  flipped int NOT NULL DEFAULT 0,
  error_message text,
  notes text
);

CREATE INDEX inventory_sync_runs_started_at_idx
  ON public.inventory_sync_runs (started_at DESC);

ALTER TABLE public.inventory_sync_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view inventory sync runs"
ON public.inventory_sync_runs
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role));
