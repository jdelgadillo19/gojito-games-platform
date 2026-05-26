-- Fix: legacy triggers on public.profiles often force tier = 'beef' when guac_active / is_premium
-- are false, so UPDATE ... SET tier = 'guac' RETURNING ... shows beef in the same statement.
--
-- Run once in Supabase SQL editor (project: Gojito Games).
-- Safe to re-run: drops user triggers on profiles, then installs tier-canonical sync.

-- Optional columns (no-op if already present)
alter table public.profiles add column if not exists guac_active boolean not null default false;
alter table public.profiles add column if not exists is_premium boolean not null default false;

-- Remove legacy triggers (names vary by project; drop all non-internal triggers on profiles)
do $$
declare
  r record;
begin
  for r in
    select tgname
    from pg_trigger t
    join pg_class c on t.tgrelid = c.oid
    join pg_namespace n on c.relnamespace = n.oid
    where n.nspname = 'public'
      and c.relname = 'profiles'
      and not t.tgisinternal
  loop
    execute format('drop trigger if exists %I on public.profiles', r.tgname);
  end loop;
end $$;

-- tier is canonical for games; keep guac_active + is_premium aligned for admin / legacy tooling.
-- profiles.tier may be enum account_tier (guac | beef | …) — compare via ::text, assign with ::account_tier.
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

-- Sanity check (replace uuid): should RETURN tier = guac, guac_active true, is_premium true
-- update public.profiles set tier = 'guac' where id = '<uuid>' returning id, tier, guac_active, is_premium;
