UPDATE public.homepage_daily_layout
SET layout_json = jsonb_set(
  layout_json,
  '{blocks,0}',
  jsonb_build_object(
    'id', 'hero',
    'type', 'hero',
    'image', 'library:18',
    'poster', 'library:18',
    'video', '/__l5e/assets-v1/8e6f04dd-13ec-4fbd-81d8-9d61184485ab/swim-campaign.mp4',
    'alt', 'Palace of Roman campaign film — the season in motion.',
    'heading', 'The Season, In Motion',
    'subheading', 'A campaign film of summer''s most considered pieces — swim, eveningwear, and the quiet ceremony in between.',
    'cta', jsonb_build_object('label', 'Shop The Campaign', 'href', '/campaign/dolce-gabbana-swim')
  ),
  false
)
WHERE is_active = true
  AND layout_json->'blocks'->0->>'type' = 'hero';