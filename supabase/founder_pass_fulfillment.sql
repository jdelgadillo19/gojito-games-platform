-- Gojito Phase 3A — trusted Founder Pass fulfillment / refund primitives
-- Apply AFTER purchases.sql, stripe_webhook_events.sql, and Phase 1 profile
-- entitlement protection (commercial_security_phase1.sql).
-- Safe to re-run (idempotent).
--
-- Future Edge Function: verify Stripe signature, record event id, fulfill or
-- refund, then mark the event processed/failed. Do NOT grant EXECUTE to JWT roles.

begin;

create or replace function public.fulfill_founder_pass(
  p_purchase_id uuid,
  p_stripe_customer_id text default null,
  p_amount_cents integer default null,
  p_currency text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_row public.purchases%rowtype;
  v_grant_source text;
  v_next_grant_source text;
  v_amount integer;
  v_currency text;
begin
  if p_purchase_id is null then
    raise exception 'purchase_id is required' using errcode = '22023';
  end if;

  select * into v_row
  from public.purchases
  where id = p_purchase_id
  for update;

  if not found then
    raise exception 'purchase not found' using errcode = 'P0002';
  end if;

  if v_row.product_key is distinct from 'founder_pass'
     or v_row.provider is distinct from 'stripe' then
    raise exception 'purchase is not a Stripe founder_pass row'
      using errcode = '22023';
  end if;

  if v_row.status = 'refunded' then
    return jsonb_build_object(
      'ok', true,
      'purchase_id', v_row.id,
      'status', v_row.status,
      'already_paid', false,
      'skipped', 'already_refunded'
    );
  end if;

  if v_row.status = 'paid' then
    return jsonb_build_object(
      'ok', true,
      'purchase_id', v_row.id,
      'status', 'paid',
      'already_paid', true,
      'user_id', v_row.user_id
    );
  end if;

  if v_row.status not in ('pending', 'failed', 'canceled') then
    raise exception 'cannot fulfill purchase in status %', v_row.status
      using errcode = 'P0001';
  end if;

  v_amount := coalesce(p_amount_cents, v_row.amount_cents);
  v_currency := nullif(lower(trim(coalesce(p_currency, v_row.currency, ''))), '');
  if v_amount is null or v_amount <= 0 then
    raise exception 'amount_cents is required to mark a purchase paid'
      using errcode = '22023';
  end if;
  if v_currency is null then
    raise exception 'currency is required to mark a purchase paid'
      using errcode = '22023';
  end if;

  update public.purchases
  set
    status = 'paid',
    purchased_at = coalesce(purchased_at, now()),
    amount_cents = v_amount,
    currency = v_currency,
    provider_customer_id = coalesce(p_stripe_customer_id, provider_customer_id),
    updated_at = now()
  where id = v_row.id
  returning * into v_row;

  select grant_source into v_grant_source
  from public.profiles
  where id = v_row.user_id;

  if not found then
    raise exception 'profile not found for purchase user' using errcode = 'P0002';
  end if;

  -- Beef / empty / already-founder → founder_pass.
  -- Temporary demo grants (demo_helper, demo_interest) become founder_pass so a
  -- later demo expiry job cannot downgrade a paid Founder. Permanent independent
  -- grants (manual_admin) are preserved so a later Founder refund cannot revoke them.
  if v_grant_source is null
     or btrim(v_grant_source) = ''
     or v_grant_source in ('founder_pass', 'demo_helper', 'demo_interest') then
    v_next_grant_source := 'founder_pass';
  else
    v_next_grant_source := v_grant_source;
  end if;

  update public.profiles
  set
    tier = 'guac'::public.account_tier,
    grant_source = v_next_grant_source,
    -- Neutralize any demo/timed expiry. Lifetime Founder (and preserved
    -- independent grants after purchase) must not remain revocable by guac_expires_at.
    guac_expires_at = null,
    stripe_customer_id = coalesce(p_stripe_customer_id, stripe_customer_id, v_row.provider_customer_id),
    updated_at = now()
  where id = v_row.user_id;

  return jsonb_build_object(
    'ok', true,
    'purchase_id', v_row.id,
    'status', 'paid',
    'already_paid', false,
    'user_id', v_row.user_id,
    'grant_source', v_next_grant_source
  );
end;
$$;

create or replace function public.refund_founder_pass(p_purchase_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_row public.purchases%rowtype;
  v_grant_source text;
  v_other_paid integer := 0;
  v_revoked boolean := false;
begin
  if p_purchase_id is null then
    raise exception 'purchase_id is required' using errcode = '22023';
  end if;

  select * into v_row
  from public.purchases
  where id = p_purchase_id
  for update;

  if not found then
    raise exception 'purchase not found' using errcode = 'P0002';
  end if;

  if v_row.product_key is distinct from 'founder_pass'
     or v_row.provider is distinct from 'stripe' then
    raise exception 'purchase is not a Stripe founder_pass row'
      using errcode = '22023';
  end if;

  if v_row.status = 'refunded' then
    return jsonb_build_object(
      'ok', true,
      'purchase_id', v_row.id,
      'status', 'refunded',
      'already_refunded', true,
      'revoked', false,
      'user_id', v_row.user_id
    );
  elsif v_row.status = 'paid' then
    update public.purchases
    set
      status = 'refunded',
      refunded_at = coalesce(refunded_at, now()),
      updated_at = now()
    where id = v_row.id
    returning * into v_row;
  else
    raise exception 'cannot refund purchase in status %', v_row.status
      using errcode = 'P0001';
  end if;

  select grant_source into v_grant_source
  from public.profiles
  where id = v_row.user_id;

  select count(*) into v_other_paid
  from public.purchases
  where user_id = v_row.user_id
    and status = 'paid'
    and id is distinct from v_row.id;

  -- Revoke Guac only when this profile's current grant is the Founder Pass
  -- and no other paid purchase remains. Independent grants (manual_admin) are
  -- untouched. Never deletes game_saves.
  if v_grant_source is not distinct from 'founder_pass' and v_other_paid = 0 then
    update public.profiles
    set
      tier = 'beef'::public.account_tier,
      grant_source = null,
      updated_at = now()
    where id = v_row.user_id;
    v_revoked := true;
  end if;

  return jsonb_build_object(
    'ok', true,
    'purchase_id', v_row.id,
    'status', 'refunded',
    'already_refunded', false,
    'revoked', v_revoked,
    'user_id', v_row.user_id
  );
end;
$$;

comment on function public.fulfill_founder_pass(uuid, text, integer, text) is
  'Phase 3A: atomic pending→paid + Guac projection. Converts demo_* grants to founder_pass, clears guac_expires_at, preserves manual_admin. Requires founder_pass/stripe and amount/currency.';
comment on function public.refund_founder_pass(uuid) is
  'Phase 3A: paid→refunded only; refunded is idempotent. Other statuses raise. Revokes Guac only when grant_source=founder_pass and no other paid purchase remains. Does not delete saves.';

revoke all on function public.fulfill_founder_pass(uuid, text, integer, text) from public, anon, authenticated;
revoke all on function public.refund_founder_pass(uuid) from public, anon, authenticated;
grant execute on function public.fulfill_founder_pass(uuid, text, integer, text) to service_role;
grant execute on function public.refund_founder_pass(uuid) to service_role;

commit;
