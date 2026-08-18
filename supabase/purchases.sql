-- Gojito Phase 3A — durable purchase ledger
-- Apply AFTER commercial_security_phase1.sql.
-- Safe to re-run (idempotent).
--
-- Does NOT apply automatically. Run in the Supabase SQL editor when ready.
-- Product allowlisting (founder_pass, …) belongs in trusted server/config, not a
-- product_key CHECK constraint.

create table if not exists public.purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete restrict,
  product_key text not null,
  provider text not null default 'stripe',
  status text not null,
  -- Nullable until paid: a pending checkout row may be written before Stripe
  -- confirms amount. Fulfillment requires effective amount/currency to mark paid.
  amount_cents integer,
  currency text,
  provider_customer_id text,
  provider_checkout_session_id text,
  provider_payment_intent_id text,
  purchased_at timestamptz,
  refunded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint purchases_status_check
    check (status in ('pending', 'paid', 'refunded', 'failed', 'canceled')),
  constraint purchases_paid_amount_check
    check (
      status <> 'paid'
      or (
        amount_cents is not null
        and amount_cents > 0
        and currency is not null
        and length(btrim(currency)) > 0
      )
    )
);

comment on table public.purchases is
  'Durable commercial ledger. Historical evidence of payment; profiles.tier is the fast entitlement projection.';
comment on column public.purchases.product_key is
  'Internal SKU (e.g. founder_pass). Allowlisting is server-side, not a SQL CHECK.';
comment on column public.purchases.amount_cents is
  'Nullable on pending rows; required (with currency) on the first paid transition.';
comment on column public.purchases.currency is
  'ISO currency code (e.g. eur). Nullable until amount is known; required to mark paid.';
comment on column public.purchases.user_id is
  'Auth user. ON DELETE RESTRICT so account deletion cannot silently erase the ledger.';

-- Replace CASCADE from earlier drafts if the table already existed.
alter table public.purchases drop constraint if exists purchases_user_id_fkey;
alter table public.purchases
  add constraint purchases_user_id_fkey
  foreign key (user_id) references auth.users (id) on delete restrict;

-- Paid-row integrity for an existing draft table (idempotent).
alter table public.purchases drop constraint if exists purchases_paid_amount_check;
alter table public.purchases
  add constraint purchases_paid_amount_check
  check (
    status <> 'paid'
    or (
      amount_cents is not null
      and amount_cents > 0
      and currency is not null
      and length(btrim(currency)) > 0
    )
  );

comment on constraint purchases_paid_amount_check on public.purchases is
  'Paid ledger rows must have a positive amount_cents and a non-empty currency. Amount/currency values are not hard-coded.';

create unique index if not exists purchases_provider_checkout_session_uidx
  on public.purchases (provider, provider_checkout_session_id)
  where provider_checkout_session_id is not null;

create unique index if not exists purchases_provider_payment_intent_uidx
  on public.purchases (provider, provider_payment_intent_id)
  where provider_payment_intent_id is not null;

create index if not exists purchases_user_id_status_idx
  on public.purchases (user_id, status);

alter table public.purchases enable row level security;

revoke all on table public.purchases from public, anon, authenticated;
grant select on table public.purchases to authenticated;
grant all on table public.purchases to service_role;
revoke insert, update, delete, truncate on table public.purchases from anon, authenticated, public;

drop policy if exists "purchases_select_own" on public.purchases;
create policy "purchases_select_own"
  on public.purchases for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "purchases_insert_own" on public.purchases;
drop policy if exists "purchases_update_own" on public.purchases;
drop policy if exists "purchases_delete_own" on public.purchases;

-- Defense in depth: JWT clients cannot write purchases even if a policy is added later.
create or replace function public.protect_purchases_writes()
returns trigger
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
begin
  if current_user in ('postgres', 'supabase_admin', 'service_role') then
    return coalesce(new, old);
  end if;
  raise exception 'purchases rows are not client-writable'
    using errcode = '42501';
end;
$$;

drop trigger if exists purchases_protect_writes on public.purchases;
create trigger purchases_protect_writes
  before insert or update or delete on public.purchases
  for each row
  execute function public.protect_purchases_writes();

comment on function public.protect_purchases_writes() is
  'Phase 3A: block client writes to purchases. Allowed writers: postgres, supabase_admin, service_role.';

revoke all on function public.protect_purchases_writes() from public, anon, authenticated;
