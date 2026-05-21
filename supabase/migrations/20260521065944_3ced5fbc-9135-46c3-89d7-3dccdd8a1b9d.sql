DROP POLICY IF EXISTS "Anyone can upsert their own abandoned cart" ON public.abandoned_carts;
DROP POLICY IF EXISTS "Anyone can update their own abandoned cart by session" ON public.abandoned_carts;