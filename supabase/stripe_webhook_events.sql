-- Gojito Phase 3A — Stripe webhook event-id replay ledger
-- Apply AFTER purchases.sql.
-- Safe to re-run (idempotent).
--
-- Receipt and successful processing are distinct states. Inserting an event
-- row only records that Stripe delivered the event_id; processed_at is set
-- only after trusted fulfillment succeeds.

create table if not exists public.stripe_webhook_events (
  event_id text primary key,
  event_type text not null,
  purchase_id uuid references public.purchases (id) on delete set null,
  status text not null default 'received',
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  created_at timestamptz not null default now(),
  constraint stripe_webhook_events_status_check
    check (status in ('received', 'processed', 'failed'))
);

comment on table public.stripe_webhook_events is
  'Stripe event.id receipt/processing ledger. received ≠ processed. No full event JSON. No browser access.';

-- Upgrade path if an earlier draft created the table without status / received_at.
alter table public.stripe_webhook_events add column if not exists status text;
alter table public.stripe_webhook_events add column if not exists received_at timestamptz;
alter table public.stripe_webhook_events alter column processed_at drop default;
alter table public.stripe_webhook_events alter column processed_at drop not null;

update public.stripe_webhook_events
set
  status = coalesce(nullif(status, ''), case when processed_at is not null then 'processed' else 'received' end),
  received_at = coalesce(received_at, created_at, now())
where status is null or received_at is null;

alter table public.stripe_webhook_events
  alter column status set default 'received';
alter table public.stripe_webhook_events
  alter column status set not null;
alter table public.stripe_webhook_events
  alter column received_at set default now();
alter table public.stripe_webhook_events
  alter column received_at set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'stripe_webhook_events_status_check'
      and conrelid = 'public.stripe_webhook_events'::regclass
  ) then
    alter table public.stripe_webhook_events
      add constraint stripe_webhook_events_status_check
      check (status in ('received', 'processed', 'failed'));
  end if;
end $$;

create index if not exists stripe_webhook_events_purchase_id_idx
  on public.stripe_webhook_events (purchase_id)
  where purchase_id is not null;

create index if not exists stripe_webhook_events_status_idx
  on public.stripe_webhook_events (status);

alter table public.stripe_webhook_events enable row level security;

revoke all on table public.stripe_webhook_events from public, anon, authenticated;
grant all on table public.stripe_webhook_events to service_role;

-- No policies for authenticated/anon → default deny. service_role bypasses RLS.

create or replace function public.protect_stripe_webhook_events_writes()
returns trigger
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
begin
  if current_user in ('postgres', 'supabase_admin', 'service_role') then
    return coalesce(new, old);
  end if;
  raise exception 'stripe_webhook_events rows are not client-writable'
    using errcode = '42501';
end;
$$;

drop trigger if exists stripe_webhook_events_protect_writes on public.stripe_webhook_events;
create trigger stripe_webhook_events_protect_writes
  before insert or update or delete on public.stripe_webhook_events
  for each row
  execute function public.protect_stripe_webhook_events_writes();

revoke all on function public.protect_stripe_webhook_events_writes() from public, anon, authenticated;

-- Trusted helpers: CREATE + REVOKE/GRANT in one transaction so default PUBLIC
-- EXECUTE is never visible to other sessions.
begin;

create or replace function public.record_stripe_webhook_event(
  p_event_id text,
  p_event_type text,
  p_purchase_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_row public.stripe_webhook_events%rowtype;
  v_inserted boolean := false;
begin
  if p_event_id is null or length(trim(p_event_id)) = 0 then
    raise exception 'event_id is required' using errcode = '22023';
  end if;
  if p_event_type is null or length(trim(p_event_type)) = 0 then
    raise exception 'event_type is required' using errcode = '22023';
  end if;

  insert into public.stripe_webhook_events (
    event_id, event_type, purchase_id, status, received_at, processed_at
  )
  values (
    trim(p_event_id), trim(p_event_type), p_purchase_id, 'received', now(), null
  )
  on conflict (event_id) do nothing;

  v_inserted := found;

  select * into v_row
  from public.stripe_webhook_events
  where event_id = trim(p_event_id);

  if p_purchase_id is not null and v_row.purchase_id is null then
    update public.stripe_webhook_events
    set purchase_id = p_purchase_id
    where event_id = v_row.event_id
    returning * into v_row;
  end if;

  return jsonb_build_object(
    'ok', true,
    'event_id', v_row.event_id,
    'status', v_row.status,
    'is_new', v_inserted,
    'already_processed', v_row.status = 'processed',
    'retryable', v_row.status in ('received', 'failed')
  );
end;
$$;

create or replace function public.mark_stripe_webhook_event_processed(
  p_event_id text,
  p_purchase_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_row public.stripe_webhook_events%rowtype;
begin
  if p_event_id is null or length(trim(p_event_id)) = 0 then
    raise exception 'event_id is required' using errcode = '22023';
  end if;

  update public.stripe_webhook_events
  set
    status = 'processed',
    processed_at = coalesce(processed_at, now()),
    purchase_id = coalesce(purchase_id, p_purchase_id)
  where event_id = trim(p_event_id)
  returning * into v_row;

  if not found then
    raise exception 'webhook event not found' using errcode = 'P0002';
  end if;

  return jsonb_build_object(
    'ok', true,
    'event_id', v_row.event_id,
    'status', v_row.status,
    'already_processed', true,
    'retryable', false
  );
end;
$$;

create or replace function public.mark_stripe_webhook_event_failed(p_event_id text)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_row public.stripe_webhook_events%rowtype;
begin
  if p_event_id is null or length(trim(p_event_id)) = 0 then
    raise exception 'event_id is required' using errcode = '22023';
  end if;

  select * into v_row
  from public.stripe_webhook_events
  where event_id = trim(p_event_id)
  for update;

  if not found then
    raise exception 'webhook event not found' using errcode = 'P0002';
  end if;

  if v_row.status = 'processed' then
    return jsonb_build_object(
      'ok', true,
      'event_id', v_row.event_id,
      'status', 'processed',
      'already_processed', true,
      'retryable', false,
      'skipped', 'already_processed'
    );
  end if;

  update public.stripe_webhook_events
  set status = 'failed', processed_at = null
  where event_id = v_row.event_id
  returning * into v_row;

  return jsonb_build_object(
    'ok', true,
    'event_id', v_row.event_id,
    'status', v_row.status,
    'already_processed', false,
    'retryable', true
  );
end;
$$;

comment on function public.record_stripe_webhook_event(text, text, uuid) is
  'Phase 3A: record Stripe event receipt (status=received). retryable=true until successfully processed.';
comment on function public.mark_stripe_webhook_event_processed(text, uuid) is
  'Phase 3A: mark event successfully processed. Subsequent deliveries should no-op.';
comment on function public.mark_stripe_webhook_event_failed(text) is
  'Phase 3A: mark event processing failed so Stripe retries remain retryable. Does not demote processed.';

revoke all on function public.record_stripe_webhook_event(text, text, uuid) from public, anon, authenticated;
revoke all on function public.mark_stripe_webhook_event_processed(text, uuid) from public, anon, authenticated;
revoke all on function public.mark_stripe_webhook_event_failed(text) from public, anon, authenticated;
grant execute on function public.record_stripe_webhook_event(text, text, uuid) to service_role;
grant execute on function public.mark_stripe_webhook_event_processed(text, uuid) to service_role;
grant execute on function public.mark_stripe_webhook_event_failed(text) to service_role;

commit;
