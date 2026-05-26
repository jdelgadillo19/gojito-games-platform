-- Gojito Games: account profiles (tier drives free vs full game access in clients)
-- Apply in Supabase SQL editor after auth is enabled.
-- Run before granting Guac manually: users need a row (created on first sign-in via games).

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  email text,
  tier text not null default 'beef',
  guac_active boolean not null default false,
  guac_expires_at timestamptz,
  stripe_customer_id text,
  stripe_subscription_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_tier_check check (tier in ('beef', 'guac', 'mvp', 'free', 'gold', 'paid'))
);

comment on table public.profiles is 'Per-user metadata; games read tier (beef|guac) after login.';
comment on column public.profiles.tier is 'Canonical: beef (free account) or guac (full access). Legacy values normalized in clients.';

create index if not exists idx_profiles_tier on public.profiles (tier);

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Optional: auto-create profile on signup (games also call ensureUserProfile on login)
create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, email, tier)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', 'Player'),
    new.email,
    'beef'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_profile on auth.users;
create trigger on_auth_user_created_profile
  after insert on auth.users
  for each row execute function public.handle_new_user_profile();

-- Keep tier / guac_active / is_premium aligned (tier is canonical for games).
-- See profiles_entitlement_sync_fix.sql to replace legacy triggers on existing projects.
alter table public.profiles add column if not exists is_premium boolean not null default false;

create or replace function public.profiles_sync_entitlement_from_tier()
returns trigger
language plpgsql
as $$
declare
  tier_text text;
begin
  tier_text := lower(trim(new.tier::text));

  if tier_text in ('guac', 'gold', 'paid') then
    new.tier := 'guac'::public.account_tier;
    new.guac_active := true;
    new.is_premium := true;
  else
    new.tier := 'beef'::public.account_tier;
    new.guac_active := false;
    new.is_premium := false;
  end if;

  new.updated_at := coalesce(new.updated_at, now());
  return new;
end;
$$;

drop trigger if exists profiles_sync_entitlement_from_tier on public.profiles;
create trigger profiles_sync_entitlement_from_tier
  before insert or update of tier, guac_active, is_premium
  on public.profiles
  for each row
  execute function public.profiles_sync_entitlement_from_tier();
