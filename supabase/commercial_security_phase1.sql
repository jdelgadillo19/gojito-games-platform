-- Gojito Phase 1 — Commercial Security
-- Apply in the Supabase SQL editor AFTER profiles.sql, profiles_entitlement_sync_fix.sql,
-- profiles_grant_source.sql, and access_requests.sql.
--
-- Goal: a normal authenticated client cannot self-grant paid access.
-- Safe to re-run (idempotent).
--
-- Does NOT change existing guac rows. Trusted writers remain:
--   - Dashboard SQL editor (postgres / supabase_admin)
--   - service_role key (bypasses RLS; allowed by protect triggers)
--   - SECURITY DEFINER functions owned by postgres (e.g. handle_new_user_profile)

-- ---------------------------------------------------------------------------
-- 0. Disable the demo auto-grant path (pending access_request → profiles.guac)
-- ---------------------------------------------------------------------------
drop trigger if exists access_requests_auto_grant_demo on public.access_requests;
drop function if exists public.access_requests_auto_grant_demo();

-- ---------------------------------------------------------------------------
-- 1. Ensure entitlement columns exist (no-op if already present)
-- ---------------------------------------------------------------------------
alter table public.profiles add column if not exists guac_active boolean not null default false;
alter table public.profiles add column if not exists is_premium boolean not null default false;
alter table public.profiles add column if not exists guac_expires_at timestamptz;
alter table public.profiles add column if not exists stripe_customer_id text;
alter table public.profiles add column if not exists stripe_subscription_id text;
alter table public.profiles add column if not exists grant_source text;

-- ---------------------------------------------------------------------------
-- 2. Privileges: authenticated may UPDATE only display_name on profiles.
--    Entitlement / identity / payment columns are not client-updatable.
--    Table-level INSERT/UPDATE include every column, so revoke those first.
-- ---------------------------------------------------------------------------
revoke update on table public.profiles from anon, authenticated, public;
revoke insert on table public.profiles from anon, authenticated, public;
grant select on table public.profiles to authenticated;
grant insert (id, display_name, email, created_at, updated_at)
  on table public.profiles to authenticated;
grant update (display_name) on table public.profiles to authenticated;
grant all on table public.profiles to service_role;
revoke delete, truncate on table public.profiles from anon, authenticated, public;

revoke update on table public.access_requests from anon, authenticated, public;
revoke insert on table public.access_requests from anon, authenticated, public;
grant select on table public.access_requests to authenticated;
grant insert (user_id, email, display_name, source, context_note, updated_at)
  on table public.access_requests to authenticated;
grant all on table public.access_requests to service_role;
revoke delete, truncate on table public.access_requests from anon, authenticated, public;
drop policy if exists "access_requests_update_own" on public.access_requests;
drop policy if exists "access_requests_delete_own" on public.access_requests;
drop policy if exists "profiles_delete_own" on public.profiles;

-- ---------------------------------------------------------------------------
-- 3. RLS — profiles: read own; insert only free defaults; update own row
--    Entitlement columns are additionally blocked by GRANTs + trigger.
-- ---------------------------------------------------------------------------
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles for select
  to authenticated
  using (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
  on public.profiles for insert
  to authenticated
  with check (
    auth.uid() = id
    and lower(trim(tier::text)) = 'beef'
    and guac_active = false
    and is_premium = false
    and guac_expires_at is null
    and stripe_customer_id is null
    and stripe_subscription_id is null
    and grant_source is null
  );

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- ---------------------------------------------------------------------------
-- 4. RLS — access_requests: create/read own; cannot set admin fields
-- ---------------------------------------------------------------------------
drop policy if exists "access_requests_select_own" on public.access_requests;
create policy "access_requests_select_own"
  on public.access_requests for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "access_requests_insert_own" on public.access_requests;
create policy "access_requests_insert_own"
  on public.access_requests for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and status = 'pending'
  );

drop policy if exists "access_requests_update_own" on public.access_requests;
drop policy if exists "access_requests_delete_own" on public.access_requests;

-- No UPDATE or DELETE policy (RLS default deny). Status defaults to pending;
-- authenticated cannot name the status column on INSERT (column grant).

-- ---------------------------------------------------------------------------
-- 5. Triggers — reject entitlement / admin-field writes from JWT clients
--    Fires for authenticated/anon even if column GRANTs are later widened.
--    Name sorts before profiles_sync_entitlement_from_tier so a rejected
--    UPDATE never reaches the sync trigger.
-- ---------------------------------------------------------------------------
create or replace function public.protect_profile_entitlements()
returns trigger
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
begin
  if current_user in ('postgres', 'supabase_admin', 'service_role') then
    return new;
  end if;

  if tg_op = 'INSERT' then
    if lower(trim(new.tier::text)) is distinct from 'beef'
       or new.guac_active is distinct from false
       or new.is_premium is distinct from false
       or new.guac_expires_at is not null
       or new.stripe_customer_id is not null
       or new.stripe_subscription_id is not null
       or new.grant_source is not null then
      raise exception 'Paid-entitlement fields are not client-writable'
        using errcode = '42501';
    end if;
    return new;
  end if;

  if new.tier is distinct from old.tier
     or new.guac_active is distinct from old.guac_active
     or new.is_premium is distinct from old.is_premium
     or new.guac_expires_at is distinct from old.guac_expires_at
     or new.stripe_customer_id is distinct from old.stripe_customer_id
     or new.stripe_subscription_id is distinct from old.stripe_subscription_id
     or new.grant_source is distinct from old.grant_source then
    raise exception 'Paid-entitlement fields are not client-writable'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

drop trigger if exists profiles_protect_entitlement_columns on public.profiles;
create trigger profiles_protect_entitlement_columns
  before insert or update on public.profiles
  for each row
  execute function public.protect_profile_entitlements();

create or replace function public.protect_access_request_admin_fields()
returns trigger
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
begin
  if current_user in ('postgres', 'supabase_admin', 'service_role') then
    return new;
  end if;

  if tg_op = 'INSERT' then
    if new.status is distinct from 'pending' then
      raise exception 'access_requests.status is not client-writable'
        using errcode = '42501';
    end if;
    return new;
  end if;

  if new.status is distinct from old.status
     or new.user_id is distinct from old.user_id then
    raise exception 'access_requests admin fields are not client-writable'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

drop trigger if exists access_requests_protect_admin_fields on public.access_requests;
create trigger access_requests_protect_admin_fields
  before insert or update on public.access_requests
  for each row
  execute function public.protect_access_request_admin_fields();

comment on function public.protect_profile_entitlements() is
  'Phase 1: block client writes to paid-entitlement columns. Allowed writers: current_user in (postgres, supabase_admin, service_role).';

comment on function public.protect_access_request_admin_fields() is
  'Phase 1: clients may INSERT own access_requests only with status=pending. No client UPDATE/DELETE.';

-- Trigger functions are not RPCs; revoke direct EXECUTE from JWT roles.
do $$
begin
  execute 'revoke all on function public.protect_profile_entitlements() from public, anon, authenticated';
  execute 'revoke all on function public.protect_access_request_admin_fields() from public, anon, authenticated';
  begin
    execute 'revoke all on function public.handle_new_user_profile() from public, anon, authenticated';
  exception when undefined_function then null;
  end;
  begin
    execute 'revoke all on function public.profiles_sync_entitlement_from_tier() from public, anon, authenticated';
  exception when undefined_function then null;
  end;
end $$;

-- Manual grant (SQL editor / service_role) still works, e.g.:
--   update public.profiles
--   set tier = 'guac', grant_source = 'manual_admin', updated_at = now()
--   where id = '<uuid>';
