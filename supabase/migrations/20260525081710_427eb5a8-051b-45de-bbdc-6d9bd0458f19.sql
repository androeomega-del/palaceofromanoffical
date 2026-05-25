UPDATE public.homepage_daily_layout
SET layout_json = jsonb_set(
  layout_json,
  '{blocks}',
  (
    SELECT jsonb_agg(
      CASE WHEN b->>'id' = 'hero'
        THEN b
          || jsonb_build_object(
            'image', 'https://dofmsxihjlohiouvxjsy.supabase.co/storage/v1/object/public/collection-images/homepage%2Fmens-swim-hero.jpg',
            'poster', 'https://dofmsxihjlohiouvxjsy.supabase.co/storage/v1/object/public/collection-images/homepage%2Fmens-swim-hero.jpg',
            'video', '/__l5e/assets-v1/f550bcf6-2234-4c14-b36b-72785c5e42da/mens-swim-campaign.mp4',
            'alt', 'Men''s Swim — Resort 2026 campaign film.',
            'heading', 'Men''s Swim, In Motion',
            'subheading', 'A Resort 2026 edit — tailored swim shorts, linen cabana shirts and the Mediterranean essentials in between.'
          )
        ELSE b END
    )
    FROM jsonb_array_elements(layout_json->'blocks') b
  )
)
WHERE is_active = true;