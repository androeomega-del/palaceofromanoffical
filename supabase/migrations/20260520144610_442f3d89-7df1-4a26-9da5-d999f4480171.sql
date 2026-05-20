UPDATE public.bg_products p
SET total_stock = sub.qty, in_stock = sub.qty > 0
FROM (SELECT group_sku, COALESCE(SUM(quantity),0)::int AS qty FROM public.bg_variants GROUP BY group_sku) sub
WHERE p.group_sku = sub.group_sku
  AND p.total_stock <> sub.qty;