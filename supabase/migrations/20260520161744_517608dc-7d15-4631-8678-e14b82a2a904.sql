
create table public.shopify_tag_expirations (
  id uuid primary key default gen_random_uuid(),
  product_id text not null,
  tag text not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index shopify_tag_expirations_expires_at_idx
  on public.shopify_tag_expirations (expires_at);

create unique index shopify_tag_expirations_product_tag_idx
  on public.shopify_tag_expirations (product_id, tag);

alter table public.shopify_tag_expirations enable row level security;

create policy "Admins can read shopify_tag_expirations"
  on public.shopify_tag_expirations
  for select
  to authenticated
  using (has_role(auth.uid(), 'admin'::app_role));
