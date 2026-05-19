
create table if not exists public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  source text,
  user_agent text,
  created_at timestamptz not null default now(),
  unique (email)
);

alter table public.newsletter_subscribers enable row level security;

-- Allow anyone (including unauthenticated visitors) to submit a subscription.
create policy "Anyone can subscribe"
  on public.newsletter_subscribers
  for insert
  to anon, authenticated
  with check (
    email is not null
    and length(email) between 5 and 320
    and email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
  );

-- No public select / update / delete policies — list is private to the owner.

create index if not exists newsletter_subscribers_created_at_idx
  on public.newsletter_subscribers (created_at desc);
