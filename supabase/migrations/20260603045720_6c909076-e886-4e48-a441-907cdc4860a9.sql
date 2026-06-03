
CREATE TABLE IF NOT EXISTS public.backfill_status (
  id text PRIMARY KEY,
  cursor text,
  total_products integer NOT NULL DEFAULT 0,
  total_seen integer NOT NULL DEFAULT 0,
  products_type_updated integer NOT NULL DEFAULT 0,
  variants_barcoded integer NOT NULL DEFAULT 0,
  errors integer NOT NULL DEFAULT 0,
  last_error text,
  status text NOT NULL DEFAULT 'idle',
  started_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz
);

GRANT SELECT ON public.backfill_status TO authenticated;
GRANT ALL ON public.backfill_status TO service_role;

ALTER TABLE public.backfill_status ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins read backfill_status"
ON public.backfill_status
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
