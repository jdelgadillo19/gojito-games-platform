#!/usr/bin/env node
/**
 * Phase 3A purchase-ledger regression.
 *
 * Always runs a static SQL-file check (no database).
 *
 * Optional live checks (after applying the Phase 3A SQL in the editor):
 *   GOJITO_TEST_ACCESS_TOKEN='eyJ...' npm run test:phase3a-ledger
 *   SUPABASE_SERVICE_ROLE_KEY=... (required for trusted G–L and seeding)
 *
 * GOJITO_TEST_ACCESS_TOKEN is process-env only — not read from .env files.
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sqlDir = path.join(root, "supabase");

function fail(message) {
  console.error("[phase3a-ledger] FAIL:", message);
  process.exit(1);
}

function pass(message) {
  console.log("[phase3a-ledger] PASS:", message);
}

function loadSql(name) {
  const p = path.join(sqlDir, name);
  if (!existsSync(p)) fail(`Missing ${name}`);
  return readFileSync(p, "utf8");
}

function mustInclude(sql, needle, label) {
  if (!sql.includes(needle)) fail(`${label}: expected ${JSON.stringify(needle)}`);
}

function mustNotInclude(sql, needle, label) {
  if (sql.includes(needle)) fail(`${label}: must not contain ${JSON.stringify(needle)}`);
}

function loadEnv() {
  const vars = { ...process.env };
  for (const name of [".env.local", ".env"]) {
    const p = path.join(root, name);
    if (!existsSync(p)) continue;
    for (const line of readFileSync(p, "utf8").split("\n")) {
      const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
      if (!m) continue;
      let v = m[2].trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
        v = v.slice(1, -1);
      }
      if (!(m[1] in vars) || vars[m[1]] === "") vars[m[1]] = v;
    }
  }
  return vars;
}

const purchasesSql = loadSql("purchases.sql");
const eventsSql = loadSql("stripe_webhook_events.sql");
const fulfillSql = loadSql("founder_pass_fulfillment.sql");

mustInclude(purchasesSql, "create table if not exists public.purchases", "purchases table");
mustInclude(purchasesSql, "constraint purchases_status_check", "status check");
mustInclude(purchasesSql, "constraint purchases_paid_amount_check", "paid amount/currency check");
mustInclude(purchasesSql, "drop constraint if exists purchases_paid_amount_check", "paid check is idempotent for draft tables");
mustInclude(purchasesSql, "on delete restrict", "restrictive user FK");
mustInclude(purchasesSql, "purchases_provider_checkout_session_uidx", "checkout session unique");
mustInclude(purchasesSql, "purchases_provider_payment_intent_uidx", "payment intent unique");
mustInclude(purchasesSql, 'grant select on table public.purchases to authenticated', "own-row select grant");
mustInclude(purchasesSql, "revoke insert, update, delete, truncate on table public.purchases", "no client writes");
mustInclude(purchasesSql, "protect_purchases_writes", "write-protect trigger");
mustNotInclude(purchasesSql, "on delete cascade", "must not cascade-delete purchases");
mustNotInclude(purchasesSql, "product_key in ('founder_pass')", "no product_key CHECK allowlist");

mustInclude(eventsSql, "create table if not exists public.stripe_webhook_events", "webhook events table");
mustInclude(eventsSql, "event_id text primary key", "event_id PK");
mustInclude(eventsSql, "received", "received status");
mustInclude(eventsSql, "processed", "processed status");
mustInclude(eventsSql, "failed", "failed status");
mustInclude(eventsSql, "retryable", "retryable flag");
mustInclude(eventsSql, "mark_stripe_webhook_event_processed", "mark processed");
mustInclude(eventsSql, "mark_stripe_webhook_event_failed", "mark failed");
mustInclude(eventsSql, "revoke all on table public.stripe_webhook_events from public, anon, authenticated", "no browser access");
mustInclude(eventsSql, "begin;", "definer functions in a transaction");
mustInclude(eventsSql, "revoke all on function public.record_stripe_webhook_event", "record helper locked");

mustInclude(fulfillSql, "create or replace function public.fulfill_founder_pass", "fulfill primitive");
mustInclude(fulfillSql, "create or replace function public.refund_founder_pass", "refund primitive");
mustInclude(fulfillSql, "begin;", "fulfillment functions in a transaction");
mustInclude(fulfillSql, "purchase is not a Stripe founder_pass row", "product/provider guard");
mustInclude(fulfillSql, "amount_cents is required to mark a purchase paid", "paid amount guard");
mustInclude(fulfillSql, "currency is required to mark a purchase paid", "paid currency guard");
mustInclude(fulfillSql, "v_next_grant_source := v_grant_source", "preserve independent grant_source");
mustInclude(fulfillSql, "demo_helper", "temporary demo_helper converts on fulfill");
mustInclude(fulfillSql, "demo_interest", "temporary demo_interest converts on fulfill");
mustInclude(fulfillSql, "guac_expires_at = null", "fulfillment clears expiry");
mustInclude(fulfillSql, "grant_source is not distinct from 'founder_pass'", "refund only founder_pass");
mustInclude(fulfillSql, "cannot refund purchase in status", "refund rejects non-paid statuses");
mustInclude(fulfillSql, "already_refunded", "refund replay is idempotent");
mustInclude(fulfillSql, "revoke all on function public.fulfill_founder_pass", "fulfill EXECUTE locked");
mustInclude(fulfillSql, "revoke all on function public.refund_founder_pass", "refund EXECUTE locked");
mustInclude(fulfillSql, "security definer", "SECURITY DEFINER");
mustInclude(fulfillSql, "set search_path = public, pg_temp", "safe search_path");
mustNotInclude(fulfillSql, "delete from public.game_saves", "must never delete saves");
mustNotInclude(purchasesSql, "1200", "paid check must not hard-code €12");
mustNotInclude(fulfillSql, "1200", "fulfillment must not hard-code €12");

pass("static SQL foundation (event states, grant preservation, locks, restrict FK)");

const env = loadEnv();
const url = (env.SUPABASE_URL || env.VITE_SUPABASE_URL || "").replace(/\/+$/, "");
const anon = env.SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY || "";
const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY || env.VITE_SUPABASE_SERVICE_ROLE_KEY || "";
const accessToken = (process.env.GOJITO_TEST_ACCESS_TOKEN || "").trim();

if (!accessToken) {
  console.log(
    "[phase3a-ledger] SKIP live checks: set GOJITO_TEST_ACCESS_TOKEN after applying the Phase 3A SQL.",
  );
  process.exit(0);
}

if (!url || !anon) {
  fail("Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY for live checks");
}

const authOptions = {
  persistSession: false,
  autoRefreshToken: false,
  detectSessionInUrl: false,
};

const supabase = createClient(url, anon, {
  auth: authOptions,
  global: { headers: { Authorization: `Bearer ${accessToken}` } },
});

const { data: userData, error: userError } = await supabase.auth.getUser(accessToken);
if (userError || !userData?.user?.id) {
  fail(`Access token is invalid or expired (${userError?.message || "no user"})`);
}
const userId = userData.user.id;
console.log("[phase3a-ledger] Authenticated as", userData.user.email || "(no email)", userId);

function rejected(error, data) {
  return Boolean(error) || data == null;
}

function rpcDenied(result) {
  return Boolean(result.error) || result.data?.ok !== true;
}

const insertAttempt = await supabase
  .from("purchases")
  .insert({
    user_id: userId,
    product_key: "founder_pass",
    provider: "stripe",
    status: "paid",
    amount_cents: 1200,
    currency: "eur",
  })
  .select("id, status")
  .maybeSingle();
if (!rejected(insertAttempt.error, insertAttempt.data) && insertAttempt.data?.status === "paid") {
  fail("authenticated INSERT of a paid purchase succeeded");
}
pass(`authenticated cannot INSERT a purchase (${insertAttempt.error?.message || "no row"})`);

if (!serviceRoleKey) {
  console.log("[phase3a-ledger] SKIP remaining live checks: set SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(0);
}

const admin = createClient(url, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const { data: profileBefore, error: profileReadError } = await admin
  .from("profiles")
  .select("id, tier, grant_source, stripe_customer_id, guac_active, guac_expires_at")
  .eq("id", userId)
  .maybeSingle();
if (profileReadError || !profileBefore) {
  fail(`Could not read profile for restore: ${profileReadError?.message || "no row"}`);
}

const stamp = Date.now();
const eventReceived = `evt_test_phase3a_${stamp}_received`;
const eventFailed = `evt_test_phase3a_${stamp}_failed`;
const eventProcessed = `evt_test_phase3a_${stamp}_processed`;
const eventIds = [eventReceived, eventFailed, eventProcessed];
const createdIds = [];

async function insertPurchase(extra) {
  const { data, error } = await admin
    .from("purchases")
    .insert({
      user_id: userId,
      product_key: "founder_pass",
      provider: "stripe",
      status: "pending",
      ...extra,
    })
    .select("id, status, user_id")
    .maybeSingle();
  if (error || !data?.id) fail(`trusted insert failed: ${error?.message || "no row"}`);
  createdIds.push(data.id);
  return data;
}

async function readProfile() {
  const { data } = await admin
    .from("profiles")
    .select("tier, grant_source, guac_active, stripe_customer_id, guac_expires_at")
    .eq("id", userId)
    .maybeSingle();
  return data;
}

async function setBeef() {
  await admin
    .from("profiles")
    .update({
      tier: "beef",
      grant_source: null,
      stripe_customer_id: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);
}

async function cleanup() {
  if (eventIds.length) {
    await admin.from("stripe_webhook_events").delete().in("event_id", eventIds);
  }
  if (createdIds.length) {
    await admin.from("stripe_webhook_events").delete().in("purchase_id", createdIds);
    await admin.from("purchases").delete().in("id", createdIds);
  }
  await admin
    .from("profiles")
    .update({
      tier: profileBefore.tier,
      grant_source: profileBefore.grant_source,
      stripe_customer_id: profileBefore.stripe_customer_id,
      guac_expires_at: profileBefore.guac_expires_at,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);
}

try {
  const seeded = await insertPurchase({
    provider_checkout_session_id: `cs_test_phase3a_${stamp}_a`,
    provider_payment_intent_id: `pi_test_phase3a_${stamp}_a`,
  });
  pass("trusted/admin can create a purchase");

  const { data: ownRow, error: ownReadError } = await supabase
    .from("purchases")
    .select("id, status, user_id, product_key")
    .eq("id", seeded.id)
    .maybeSingle();
  if (ownReadError || !ownRow || ownRow.user_id !== userId) {
    fail(`could not SELECT own purchase: ${ownReadError?.message || JSON.stringify(ownRow)}`);
  }
  pass("authenticated can SELECT own purchase row");

  const paidPatch = await supabase
    .from("purchases")
    .update({ status: "paid" })
    .eq("id", seeded.id)
    .select("id, status")
    .maybeSingle();
  const { data: afterPaidPatch } = await supabase
    .from("purchases")
    .select("status")
    .eq("id", seeded.id)
    .maybeSingle();
  if (afterPaidPatch?.status === "paid") fail("authenticated marked a purchase paid");
  pass(`authenticated cannot mark a purchase paid (${paidPatch.error?.message || "unchanged"})`);

  const idPatch = await supabase
    .from("purchases")
    .update({
      provider_checkout_session_id: "cs_hacked",
      provider_payment_intent_id: "pi_hacked",
      provider_customer_id: "cus_hacked",
    })
    .eq("id", seeded.id)
    .select("id")
    .maybeSingle();
  const { data: afterIdPatch } = await admin
    .from("purchases")
    .select("provider_checkout_session_id, provider_payment_intent_id")
    .eq("id", seeded.id)
    .maybeSingle();
  if (afterIdPatch?.provider_checkout_session_id === "cs_hacked") {
    fail("authenticated modified Stripe provider identifiers");
  }
  pass(`authenticated cannot modify Stripe provider identifiers (${idPatch.error?.message || "unchanged"})`);

  const eventInsert = await supabase.from("stripe_webhook_events").insert({
    event_id: eventReceived,
    event_type: "checkout.session.completed",
    purchase_id: seeded.id,
  });
  const { data: eventRow } = await admin
    .from("stripe_webhook_events")
    .select("event_id")
    .eq("event_id", eventReceived)
    .maybeSingle();
  if (eventRow) fail("authenticated inserted a webhook event row");
  pass(`authenticated cannot insert webhook event rows (${eventInsert.error?.message || "no row"})`);

  const clientCalls = [
    await supabase.rpc("fulfill_founder_pass", { p_purchase_id: seeded.id }),
    await supabase.rpc("refund_founder_pass", { p_purchase_id: seeded.id }),
    await supabase.rpc("record_stripe_webhook_event", {
      p_event_id: eventReceived,
      p_event_type: "checkout.session.completed",
      p_purchase_id: seeded.id,
    }),
    await supabase.rpc("mark_stripe_webhook_event_processed", { p_event_id: eventReceived }),
    await supabase.rpc("mark_stripe_webhook_event_failed", { p_event_id: eventReceived }),
  ];
  if (clientCalls.some((r) => !rpcDenied(r))) {
    fail("authenticated invoked a trusted commercial function");
  }
  pass("authenticated cannot execute fulfillment or webhook event functions");

  const { data: rec1, error: rec1Error } = await admin.rpc("record_stripe_webhook_event", {
    p_event_id: eventReceived,
    p_event_type: "checkout.session.completed",
    p_purchase_id: seeded.id,
  });
  if (rec1Error || rec1?.status !== "received" || rec1?.retryable !== true || rec1?.is_new !== true) {
    fail(`received insert unexpected: ${rec1Error?.message || JSON.stringify(rec1)}`);
  }
  const { data: rec1b, error: rec1bError } = await admin.rpc("record_stripe_webhook_event", {
    p_event_id: eventReceived,
    p_event_type: "checkout.session.completed",
    p_purchase_id: seeded.id,
  });
  if (rec1bError || rec1b?.retryable !== true || rec1b?.already_processed === true || rec1b?.is_new !== false) {
    fail(`received retry should remain retryable: ${rec1bError?.message || JSON.stringify(rec1b)}`);
  }
  pass("event received but not processed can be retried");

  const { data: recFail, error: recFailError } = await admin.rpc("record_stripe_webhook_event", {
    p_event_id: eventFailed,
    p_event_type: "checkout.session.completed",
    p_purchase_id: seeded.id,
  });
  if (recFailError || !recFail?.ok) fail(`failed-path record: ${recFailError?.message || JSON.stringify(recFail)}`);
  const { data: markedFail, error: markFailError } = await admin.rpc("mark_stripe_webhook_event_failed", {
    p_event_id: eventFailed,
  });
  if (markFailError || markedFail?.status !== "failed" || markedFail?.retryable !== true) {
    fail(`mark failed: ${markFailError?.message || JSON.stringify(markedFail)}`);
  }
  const { data: recFail2, error: recFail2Error } = await admin.rpc("record_stripe_webhook_event", {
    p_event_id: eventFailed,
    p_event_type: "checkout.session.completed",
  });
  if (recFail2Error || recFail2?.retryable !== true || recFail2?.status !== "failed") {
    fail(`failed event should be retryable: ${recFail2Error?.message || JSON.stringify(recFail2)}`);
  }
  pass("failed processing can be retried");

  const { data: recProc, error: recProcError } = await admin.rpc("record_stripe_webhook_event", {
    p_event_id: eventProcessed,
    p_event_type: "checkout.session.completed",
    p_purchase_id: seeded.id,
  });
  if (recProcError || !recProc?.ok) fail(`processed-path record: ${recProcError?.message}`);
  const { data: markedProc, error: markProcError } = await admin.rpc(
    "mark_stripe_webhook_event_processed",
    { p_event_id: eventProcessed, p_purchase_id: seeded.id },
  );
  if (markProcError || markedProc?.status !== "processed" || markedProc?.retryable !== false) {
    fail(`mark processed: ${markProcError?.message || JSON.stringify(markedProc)}`);
  }
  const { data: recProc2, error: recProc2Error } = await admin.rpc("record_stripe_webhook_event", {
    p_event_id: eventProcessed,
    p_event_type: "checkout.session.completed",
  });
  if (
    recProc2Error ||
    recProc2?.already_processed !== true ||
    recProc2?.retryable !== false ||
    recProc2?.status !== "processed"
  ) {
    fail(`processed event should be deduped: ${recProc2Error?.message || JSON.stringify(recProc2)}`);
  }
  pass("processed event is safely deduped");

  await setBeef();
  const wrongProduct = await insertPurchase({
    product_key: "not_founder_pass",
    provider_checkout_session_id: `cs_test_phase3a_${stamp}_wrong_product`,
    amount_cents: 1200,
    currency: "eur",
  });
  const { data: wrongProductResult, error: wrongProductError } = await admin.rpc("fulfill_founder_pass", {
    p_purchase_id: wrongProduct.id,
    p_amount_cents: 1200,
    p_currency: "eur",
  });
  const profileAfterWrongProduct = await readProfile();
  const { data: wrongProductRow } = await admin.from("purchases").select("status").eq("id", wrongProduct.id).maybeSingle();
  if (!wrongProductError && wrongProductResult?.ok) fail("wrong product_key was fulfilled");
  if (String(profileAfterWrongProduct?.tier).toLowerCase() === "guac") {
    fail("wrong product_key modified profiles");
  }
  if (wrongProductRow?.status === "paid") fail("wrong product_key marked paid");
  pass("wrong product_key cannot be fulfilled");

  const wrongProvider = await insertPurchase({
    provider: "paypal",
    provider_checkout_session_id: `cs_test_phase3a_${stamp}_wrong_provider`,
    amount_cents: 1200,
    currency: "eur",
  });
  const { data: wrongProviderResult, error: wrongProviderError } = await admin.rpc("fulfill_founder_pass", {
    p_purchase_id: wrongProvider.id,
    p_amount_cents: 1200,
    p_currency: "eur",
  });
  const profileAfterWrongProvider = await readProfile();
  if (!wrongProviderError && wrongProviderResult?.ok) fail("wrong provider was fulfilled");
  if (String(profileAfterWrongProvider?.tier).toLowerCase() === "guac") {
    fail("wrong provider modified profiles");
  }
  pass("wrong provider cannot be fulfilled");

  const { data: noAmountResult, error: noAmountError } = await admin.rpc("fulfill_founder_pass", {
    p_purchase_id: seeded.id,
  });
  const profileAfterNoAmount = await readProfile();
  const { data: seededAfterNoAmount } = await admin
    .from("purchases")
    .select("status")
    .eq("id", seeded.id)
    .maybeSingle();
  if (!noAmountError && noAmountResult?.ok) fail("paid transition succeeded without amount/currency");
  if (seededAfterNoAmount?.status === "paid") fail("pending row marked paid without amount");
  if (String(profileAfterNoAmount?.tier).toLowerCase() === "guac") {
    fail("missing amount/currency modified profiles");
  }
  pass("first paid transition requires amount/currency");

  const invalidPaidAttempts = [
    { status: "paid", amount_cents: null, currency: "eur" },
    { status: "paid", amount_cents: 0, currency: "eur" },
    { status: "paid", amount_cents: 1200, currency: null },
    { status: "paid", amount_cents: 1200, currency: "   " },
  ];
  for (const extra of invalidPaidAttempts) {
    const { data: badPaid, error: badPaidError } = await admin.from("purchases").insert({
      user_id: userId,
      product_key: "founder_pass",
      provider: "stripe",
      provider_checkout_session_id: `cs_test_phase3a_${stamp}_bad_paid_${extra.amount_cents}_${extra.currency ?? "null"}`,
      ...extra,
    }).select("id").maybeSingle();
    if (badPaid?.id) {
      createdIds.push(badPaid.id);
      fail(`invalid paid row was accepted: ${JSON.stringify(extra)}`);
    }
    if (!badPaidError) fail(`invalid paid insert returned no error: ${JSON.stringify(extra)}`);
  }
  pass("database rejects invalid paid ledger rows");

  async function expectRefundRejected(purchaseId, expectedStatus) {
    const before = await readProfile();
    const { data, error } = await admin.rpc("refund_founder_pass", { p_purchase_id: purchaseId });
    const { data: row } = await admin.from("purchases").select("status").eq("id", purchaseId).maybeSingle();
    const after = await readProfile();
    if (!error && data?.ok) fail(`${expectedStatus} purchase was refunded`);
    if (row?.status !== expectedStatus) {
      fail(`${expectedStatus} refund mutated status to ${row?.status}`);
    }
    if (
      after?.tier !== before?.tier ||
      after?.grant_source !== before?.grant_source ||
      after?.guac_expires_at !== before?.guac_expires_at
    ) {
      fail(`${expectedStatus} refund mutated profile`);
    }
  }

  await expectRefundRejected(seeded.id, "pending");
  pass("pending cannot refund");

  const failedPurchase = await insertPurchase({
    status: "failed",
    provider_checkout_session_id: `cs_test_phase3a_${stamp}_failed_refund`,
    amount_cents: 1200,
    currency: "eur",
  });
  await expectRefundRejected(failedPurchase.id, "failed");
  pass("failed cannot refund");

  const canceledPurchase = await insertPurchase({
    status: "canceled",
    provider_checkout_session_id: `cs_test_phase3a_${stamp}_canceled_refund`,
    amount_cents: 1200,
    currency: "eur",
  });
  await expectRefundRejected(canceledPurchase.id, "canceled");
  pass("canceled cannot refund");

  const { data: granted, error: fulfillError } = await admin.rpc("fulfill_founder_pass", {
    p_purchase_id: seeded.id,
    p_stripe_customer_id: "cus_test_phase3a",
    p_amount_cents: 1200,
    p_currency: "eur",
  });
  if (fulfillError || !granted?.ok) {
    fail(`trusted fulfill failed: ${fulfillError?.message || JSON.stringify(granted)}`);
  }
  const afterGrant = await readProfile();
  if (String(afterGrant?.tier).toLowerCase() !== "guac" || afterGrant?.grant_source !== "founder_pass") {
    fail(`expected Guac/founder_pass, got ${JSON.stringify(afterGrant)}`);
  }
  pass("normal Founder purchase grants Guac");

  const { data: replay, error: replayError } = await admin.rpc("fulfill_founder_pass", {
    p_purchase_id: seeded.id,
    p_stripe_customer_id: "cus_test_phase3a",
  });
  if (replayError || !replay?.ok || replay.already_paid !== true) {
    fail(`replay was not idempotent: ${replayError?.message || JSON.stringify(replay)}`);
  }
  pass("replay remains idempotent");

  const { data: refunded, error: refundError } = await admin.rpc("refund_founder_pass", {
    p_purchase_id: seeded.id,
  });
  if (refundError || !refunded?.ok || refunded.status !== "refunded" || refunded.revoked !== true) {
    fail(`Founder refund failed: ${refundError?.message || JSON.stringify(refunded)}`);
  }
  const afterFounderRefund = await readProfile();
  if (String(afterFounderRefund?.tier).toLowerCase() !== "beef") {
    fail(`Founder-only refund should return Beef, got ${JSON.stringify(afterFounderRefund)}`);
  }
  pass("normal Founder refund returns a Founder-only user to Beef");

  const { data: refundReplay, error: refundReplayError } = await admin.rpc("refund_founder_pass", {
    p_purchase_id: seeded.id,
  });
  if (
    refundReplayError ||
    !refundReplay?.ok ||
    refundReplay.already_refunded !== true ||
    refundReplay.revoked !== false
  ) {
    fail(`refund replay was not idempotent: ${refundReplayError?.message || JSON.stringify(refundReplay)}`);
  }
  const afterRefundReplay = await readProfile();
  if (String(afterRefundReplay?.tier).toLowerCase() !== "beef") {
    fail(`refund replay mutated profile: ${JSON.stringify(afterRefundReplay)}`);
  }
  pass("refund replay remains idempotent");

  await admin
    .from("profiles")
    .update({
      tier: "guac",
      grant_source: "demo_helper",
      guac_expires_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);
  const demoPurchase = await insertPurchase({
    provider_checkout_session_id: `cs_test_phase3a_${stamp}_demo_helper`,
    provider_payment_intent_id: `pi_test_phase3a_${stamp}_demo_helper`,
  });
  const { data: demoFulfill, error: demoFulfillError } = await admin.rpc("fulfill_founder_pass", {
    p_purchase_id: demoPurchase.id,
    p_amount_cents: 1200,
    p_currency: "eur",
  });
  if (demoFulfillError || !demoFulfill?.ok) {
    fail(`demo_helper fulfill failed: ${demoFulfillError?.message || JSON.stringify(demoFulfill)}`);
  }
  const afterDemoFulfill = await readProfile();
  if (
    String(afterDemoFulfill?.tier).toLowerCase() !== "guac" ||
    afterDemoFulfill?.grant_source !== "founder_pass" ||
    afterDemoFulfill?.guac_expires_at != null
  ) {
    fail(`demo_helper was not converted to durable Founder: ${JSON.stringify(afterDemoFulfill)}`);
  }
  const expiredAt = new Date(Date.now() - 60 * 1000).toISOString();
  const { data: expiryHits, error: expiryError } = await admin
    .from("profiles")
    .update({
      tier: "beef",
      grant_source: null,
      guac_expires_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId)
    .eq("grant_source", "demo_helper")
    .lt("guac_expires_at", expiredAt)
    .select("id");
  if (expiryError) fail(`demo expiry simulation failed: ${expiryError.message}`);
  if (expiryHits && expiryHits.length > 0) {
    fail("old demo expiry job matched a paid Founder profile");
  }
  const afterDemoExpiry = await readProfile();
  if (
    String(afterDemoExpiry?.tier).toLowerCase() !== "guac" ||
    afterDemoExpiry?.grant_source !== "founder_pass"
  ) {
    fail(`old demo expiry downgraded paid Founder: ${JSON.stringify(afterDemoExpiry)}`);
  }
  pass("temporary demo Guac → Founder fulfillment is durable against demo expiry");

  const { data: demoRefund, error: demoRefundError } = await admin.rpc("refund_founder_pass", {
    p_purchase_id: demoPurchase.id,
  });
  if (demoRefundError || !demoRefund?.ok) {
    fail(`demo Founder refund failed: ${demoRefundError?.message || JSON.stringify(demoRefund)}`);
  }

  await admin
    .from("profiles")
    .update({
      tier: "guac",
      grant_source: "manual_admin",
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);
  const manualPurchase = await insertPurchase({
    provider_checkout_session_id: `cs_test_phase3a_${stamp}_manual`,
    provider_payment_intent_id: `pi_test_phase3a_${stamp}_manual`,
  });
  const { data: manualFulfill, error: manualFulfillError } = await admin.rpc("fulfill_founder_pass", {
    p_purchase_id: manualPurchase.id,
    p_amount_cents: 1200,
    p_currency: "eur",
  });
  if (manualFulfillError || !manualFulfill?.ok) {
    fail(`manual_admin fulfill failed: ${manualFulfillError?.message || JSON.stringify(manualFulfill)}`);
  }
  const afterManualFulfill = await readProfile();
  if (
    String(afterManualFulfill?.tier).toLowerCase() !== "guac" ||
    afterManualFulfill?.grant_source !== "manual_admin"
  ) {
    fail(`fulfill overwrote manual_admin: ${JSON.stringify(afterManualFulfill)}`);
  }
  const { data: manualRefund, error: manualRefundError } = await admin.rpc("refund_founder_pass", {
    p_purchase_id: manualPurchase.id,
  });
  if (manualRefundError || !manualRefund?.ok) {
    fail(`manual_admin refund failed: ${manualRefundError?.message || JSON.stringify(manualRefund)}`);
  }
  const afterManualRefund = await readProfile();
  if (
    String(afterManualRefund?.tier).toLowerCase() !== "guac" ||
    afterManualRefund?.grant_source !== "manual_admin"
  ) {
    fail(`refund revoked manual_admin: ${JSON.stringify(afterManualRefund)}`);
  }
  if (manualRefund.revoked === true) fail("refund reported revoked=true for manual_admin profile");
  pass("manual_admin → Founder purchase → refund preserves manual_admin Guac");
} catch (e) {
  await cleanup();
  fail(e instanceof Error ? e.message : String(e));
}

await cleanup();
console.log("[phase3a-ledger] Live checks passed. Test purchases removed; profile restored.");
process.exit(0);
