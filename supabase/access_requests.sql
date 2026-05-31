-- Gojito Games: manual full-access requests (beta — no Stripe checkout yet)
-- Apply in Supabase SQL editor. Review pending rows in Table Editor or:
--   select * from public.access_requests where status = 'pending' order by created_at desc;

create table if not exists public.access_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  email text,
  display_name text,
  source text not null default 'hub_nav',
  context_note text,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint access_requests_status_check check (status in ('pending', 'granted', 'dismissed')),
  constraint access_requests_user_id_key unique (user_id)
);

comment on table public.access_requests is 'Beta: users request manual Guac/full access when checkout is unavailable.';
comment on column public.access_requests.source is 'Where the request originated, e.g. hub_nav, cakery_bakery, calculator_cove.';

create index if not exists idx_access_requests_status_created
  on public.access_requests (status, created_at desc);

alter table public.access_requests enable row level security;

drop policy if exists "access_requests_select_own" on public.access_requests;
create policy "access_requests_select_own"
  on public.access_requests for select
  using (auth.uid() = user_id);

drop policy if exists "access_requests_insert_own" on public.access_requests;
create policy "access_requests_insert_own"
  on public.access_requests for insert
  with check (auth.uid() = user_id);

drop policy if exists "access_requests_update_own" on public.access_requests;
create policy "access_requests_update_own"
  on public.access_requests for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
