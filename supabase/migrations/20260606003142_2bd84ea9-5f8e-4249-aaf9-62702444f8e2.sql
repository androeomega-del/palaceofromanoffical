ALTER TABLE public.abandoned_carts
  ADD COLUMN IF NOT EXISTS market_country  text,
  ADD COLUMN IF NOT EXISTS market_language text,
  ADD COLUMN IF NOT EXISTS market_currency text;

ALTER TABLE public.abandoned_carts
  ADD CONSTRAINT abandoned_carts_market_country_len
    CHECK (market_country IS NULL OR length(market_country) BETWEEN 2 AND 4),
  ADD CONSTRAINT abandoned_carts_market_language_len
    CHECK (market_language IS NULL OR length(market_language) BETWEEN 2 AND 8),
  ADD CONSTRAINT abandoned_carts_market_currency_len
    CHECK (market_currency IS NULL OR length(market_currency) BETWEEN 3 AND 4);