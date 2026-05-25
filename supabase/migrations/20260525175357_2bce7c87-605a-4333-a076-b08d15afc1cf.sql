DELETE FROM public.cart_events WHERE session_id IN ('diag-final','diag-post-fix','diagnostic-probe-2026-05-25','diag-probe','diag4','admin-probe') OR product_handle IN ('diag-final','diag-post-fix','diag3','diag4','admin-probe','diagnostic-test','diag2') OR event_type IS NULL;
DELETE FROM public.interaction_events WHERE handle = 'diag';
DELETE FROM public.search_queries WHERE query = 'diag';
DELETE FROM public.newsletter_subscribers WHERE email = 'probe-anon@example.com';