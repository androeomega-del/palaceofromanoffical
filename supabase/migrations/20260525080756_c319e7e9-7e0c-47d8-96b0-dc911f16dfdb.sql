UPDATE public.homepage_daily_layout
SET layout_json = jsonb_set(
  layout_json,
  '{blocks}',
  (
    SELECT jsonb_agg(
      CASE
        WHEN block->>'id' = 'hero' AND block->'cta'->>'href' = '/campaign/dolce-gabbana-swim'
          THEN jsonb_set(block, '{cta,href}', '"/campaign/mens-swim"')
        ELSE block
      END
    )
    FROM jsonb_array_elements(layout_json->'blocks') AS block
  )
)
WHERE is_active = true
  AND layout_json::text LIKE '%/campaign/dolce-gabbana-swim%';