-- DEPRECATED — do not apply.
-- Phase 1 commercial security drops this trigger. Applying this file re-enables
-- client self-upgrade: inserting a pending access_request grants profiles.tier = guac.
-- See commercial_security_phase1.sql.
--
-- Historical: pre-founder demo loop — pending access_requests auto-grant guac.
-- Requires: access_requests.sql, profiles.sql, profiles_grant_source.sql
--
-- Flow: user taps fake-door / "Request full access" → row in access_requests (pending)
--       → this trigger sets profiles.tier = guac, grant_source = demo_interest, status = granted.
--
-- Does NOT overwrite founder_pass accounts.

create or replace function public.access_requests_auto_grant_demo()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status is distinct from 'pending' then
    return new;
  end if;

  insert into public.profiles (id, email, display_name, tier, grant_source, guac_expires_at, updated_at)
  values (
    new.user_id,
    new.email,
    new.display_name,
    'guac',
    'demo_interest',
    null,
    now()
  )
  on conflict (id) do update
  set
    tier = case
      when public.profiles.grant_source = 'founder_pass' then public.profiles.tier
      else 'guac'::public.account_tier
    end,
    grant_source = case
      when public.profiles.grant_source = 'founder_pass' then public.profiles.grant_source
      else coalesce(public.profiles.grant_source, 'demo_interest')
    end,
    guac_expires_at = case
      when public.profiles.grant_source = 'founder_pass' then public.profiles.guac_expires_at
      else null
    end,
    email = coalesce(excluded.email, public.profiles.email),
    display_name = coalesce(excluded.display_name, public.profiles.display_name),
    updated_at = now();

  new.status := 'granted';
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists access_requests_auto_grant_demo on public.access_requests;
create trigger access_requests_auto_grant_demo
  before insert or update of status, context_note, source
  on public.access_requests
  for each row
  when (new.status = 'pending')
  execute function public.access_requests_auto_grant_demo();

comment on function public.access_requests_auto_grant_demo() is
  'Beta wind-test: fake-door clicks grant guac immediately (grant_source demo_interest).';

-- Cohort queries at founder-pass launch:
--   select * from public.access_requests order by created_at desc;
--   select id, email, grant_source, guac_expires_at from public.profiles where grant_source = 'demo_interest';

-- Grant demo_helper (declined founder, timed thank-you):
--   update public.profiles
--   set tier = 'guac', grant_source = 'demo_helper', guac_expires_at = now() + interval '6 months', updated_at = now()
--   where id = '<uuid>' and grant_source is distinct from 'founder_pass';

-- Grant founder_pass (lifetime):
--   update public.profiles
--   set tier = 'guac', grant_source = 'founder_pass', guac_expires_at = null, updated_at = now()
--   where id = '<uuid>';
