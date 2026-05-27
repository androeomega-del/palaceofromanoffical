
CREATE TABLE public.quiz_unlocks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  answers JSONB NOT NULL DEFAULT '{}'::jsonb,
  source TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT ALL ON public.quiz_unlocks TO service_role;

ALTER TABLE public.quiz_unlocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read quiz_unlocks"
ON public.quiz_unlocks
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER touch_quiz_unlocks_updated_at
BEFORE UPDATE ON public.quiz_unlocks
FOR EACH ROW EXECUTE FUNCTION public.touch_abandoned_carts_updated_at();

CREATE INDEX idx_quiz_unlocks_email ON public.quiz_unlocks (lower(email));

CREATE TABLE public.quiz_funnel_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL,
  email TEXT,
  step INTEGER,
  answers_snapshot JSONB,
  session_id TEXT,
  page_path TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT quiz_funnel_events_event_type_chk
    CHECK (event_type IN ('quiz_started','quiz_step','quiz_gate_viewed','quiz_gate_submitted','quiz_lookbook_viewed','quiz_shop_clicked','quiz_unlock_resumed'))
);

GRANT ALL ON public.quiz_funnel_events TO service_role;

ALTER TABLE public.quiz_funnel_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read quiz_funnel_events"
ON public.quiz_funnel_events
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_quiz_funnel_events_created_at ON public.quiz_funnel_events (created_at DESC);
CREATE INDEX idx_quiz_funnel_events_type ON public.quiz_funnel_events (event_type);
