#!/usr/bin/env node
/**
 * Phase 1 commercial security — self-upgrade regression.
 *
 * Uses a normal authenticated client (anon/publishable key + user JWT), never
 * service_role except the optional trusted-grant roundtrip.
 *
 * Preferred (OAuth / Google accounts — no password):
 *   GOJITO_TEST_ACCESS_TOKEN='eyJ...' npm run test:phase1-security
 *
 * Optional email/password accounts:
 *   GOJITO_TEST_EMAIL=you@example.com GOJITO_TEST_PASSWORD='***' npm run test:phase1-security
 *
 * Optional trusted-path check (restores Beef afterwards):
 *   SUPABASE_SERVICE_ROLE_KEY=... (same command)
 *
 * Reads VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY from .env / .env.local
 * unless SUPABASE_URL / SUPABASE_ANON_KEY are already set.
 * GOJITO_TEST_ACCESS_TOKEN is read from the process environment only (not .env files).
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

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

function fail(message) {
  console.error("[phase1-security] FAIL:", message);
  process.exit(1);
}

function pass(message) {
  console.log("[phase1-security] PASS:", message);
}

function isDuplicate(error) {
  if (!error) return false;
  return (
    error.code === "23505" ||
    error.code === "409" ||
    /duplicate|unique/i.test(error.message || "")
  );
}

function profileEscalated(row) {
  if (!row) return false;
  return (
    String(row.tier).toLowerCase() === "guac" ||
    row.guac_active === true ||
    row.is_premium === true ||
    row.grant_source != null ||
    row.stripe_customer_id != null ||
    row.stripe_subscription_id != null
  );
}

const env = loadEnv();
const url = (env.SUPABASE_URL || env.VITE_SUPABASE_URL || "").replace(/\/+$/, "");
const anon = env.SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY || "";
const emailArg = env.GOJITO_TEST_EMAIL || "";
const password = env.GOJITO_TEST_PASSWORD || "";
const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY || env.VITE_SUPABASE_SERVICE_ROLE_KEY || "";
// Command-line / process env only — do not read a persisted token from .env files.
const accessToken = (process.env.GOJITO_TEST_ACCESS_TOKEN || "").trim();

if (!url || !anon) {
  fail("Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY");
}

const authOptions = {
  persistSession: false,
  autoRefreshToken: false,
  detectSessionInUrl: false,
};

let supabase;
let userId;
let email;
let usedOAuthToken = false;

if (accessToken) {
  if (accessToken.split(".").length !== 3) {
    fail("GOJITO_TEST_ACCESS_TOKEN is not a JWT");
  }
  usedOAuthToken = true;
  supabase = createClient(url, anon, {
    auth: authOptions,
    global: {
      headers: { Authorization: `Bearer ${accessToken}` },
    },
  });
  const { data: userData, error: userError } = await supabase.auth.getUser(accessToken);
  if (userError || !userData?.user?.id) {
    fail(`Access token is invalid or expired (${userError?.message || "no user"})`);
  }
  userId = userData.user.id;
  email = userData.user.email || null;
  console.log("[phase1-security] Authenticated via OAuth access token as", email || "(no email)", userId);
} else if (emailArg && password) {
  supabase = createClient(url, anon, { auth: authOptions });
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: emailArg,
    password,
  });
  if (authError || !authData.user) {
    fail(`Sign-in failed: ${authError?.message || "no user"}`);
  }
  userId = authData.user.id;
  email = authData.user.email || emailArg;
  console.log("[phase1-security] Signed in with password as", email, userId);
} else {
  console.error(
    "[phase1-security] Set GOJITO_TEST_ACCESS_TOKEN (OAuth session JWT) or GOJITO_TEST_EMAIL and GOJITO_TEST_PASSWORD.",
  );
  process.exit(2);
}

const profileSelect =
  "id, tier, guac_active, is_premium, guac_expires_at, stripe_customer_id, stripe_subscription_id, grant_source, display_name, email";

const { data: before, error: readError } = await supabase
  .from("profiles")
  .select(profileSelect)
  .eq("id", userId)
  .maybeSingle();

if (readError || !before) {
  fail(`Could not read own profile: ${readError?.message || "no row"}`);
}
pass("ordinary profile read succeeds");

if (profileEscalated(before)) {
  fail("Test account is already escalated — use a Beef account so a successful write would be visible");
}
pass("existing profile is Beef with empty payment metadata (defaults / omitted insert path)");

await assertRejected("INSERT access_requests status=granted", () =>
  supabase
    .from("access_requests")
    .insert({
      user_id: userId,
      email,
      source: "phase1_security_test",
      status: "granted",
    })
    .select("id, status")
    .maybeSingle(),
);

async function rereadProfile() {
  const { data } = await supabase.from("profiles").select(profileSelect).eq("id", userId).maybeSingle();
  return data;
}

async function assertRejected(label, run) {
  const { data, error } = await run();
  const after = await rereadProfile();
  if (profileEscalated(after)) {
    fail(`${label}: profile escalated — ${JSON.stringify(after)}`);
  }
  if (!error && data && profileEscalated(data)) {
    fail(`${label}: API returned escalated row ${JSON.stringify(data)}`);
  }
  pass(`${label} rejected (${error?.message || "no row changed"})`);
}

await assertRejected("PATCH Beef → Guac (tier)", () =>
  supabase.from("profiles").update({ tier: "guac" }).eq("id", userId).select("id, tier").maybeSingle(),
);

await assertRejected("PATCH guac_active=true", () =>
  supabase.from("profiles").update({ guac_active: true }).eq("id", userId).select("id, guac_active").maybeSingle(),
);

await assertRejected("PATCH is_premium=true", () =>
  supabase.from("profiles").update({ is_premium: true }).eq("id", userId).select("id, is_premium").maybeSingle(),
);

await assertRejected("PATCH stripe / grant metadata", () =>
  supabase
    .from("profiles")
    .update({
      stripe_customer_id: "cus_fake",
      stripe_subscription_id: "sub_fake",
      grant_source: "founder_pass",
      guac_expires_at: new Date().toISOString(),
    })
    .eq("id", userId)
    .select("id")
    .maybeSingle(),
);

await assertRejected("PATCH profiles.email", () =>
  supabase
    .from("profiles")
    .update({ email: "attacker@example.com" })
    .eq("id", userId)
    .select("id, email")
    .maybeSingle(),
);

await assertRejected("INSERT new Guac profile (same id + tier=guac)", () =>
  supabase
    .from("profiles")
    .insert({
      id: userId,
      display_name: "Attacker",
      email,
      tier: "guac",
      guac_active: true,
      is_premium: true,
      grant_source: "founder_pass",
    })
    .select("id, tier")
    .maybeSingle(),
);

const { data: nameUpdate, error: nameError } = await supabase
  .from("profiles")
  .update({ display_name: before.display_name || "Player" })
  .eq("id", userId)
  .select("id, display_name")
  .maybeSingle();

if (nameError || !nameUpdate) {
  fail(`Allowed display_name update should succeed: ${nameError?.message || "no row"}`);
}
pass("allowed display_name change succeeds");

const { error: pendingInsertError } = await supabase.from("access_requests").insert({
  user_id: userId,
  email,
  source: "phase1_security_test",
  context_note: "phase1 regression",
});
if (pendingInsertError && !isDuplicate(pendingInsertError)) {
  fail(`Creating own pending access request should succeed: ${pendingInsertError.message}`);
}
pass("create pending access request succeeds");

const { data: ownRequest, error: ownReadError } = await supabase
  .from("access_requests")
  .select("id, status, user_id")
  .eq("user_id", userId)
  .maybeSingle();

if (ownReadError || !ownRequest) {
  fail(`Could not read own access request: ${ownReadError?.message || "no row"}`);
}
if (ownRequest.status !== "pending") {
  fail(`Own access request status is ${ownRequest.status} — expected pending (auto-grant may still be installed)`);
}
pass("user can SELECT own access request (status=pending)");

await assertRejected("PATCH access_requests pending → granted", async () => {
  const result = await supabase
    .from("access_requests")
    .update({ status: "granted" })
    .eq("user_id", userId)
    .select("id, status")
    .maybeSingle();
  const { data: afterReq } = await supabase
    .from("access_requests")
    .select("status")
    .eq("user_id", userId)
    .maybeSingle();
  if (afterReq?.status === "granted") {
    fail("access_requests.status became granted");
  }
  return result;
});

const { error: deleteError } = await supabase.from("access_requests").delete().eq("user_id", userId);
const { data: stillThere } = await supabase
  .from("access_requests")
  .select("id")
  .eq("user_id", userId)
  .maybeSingle();
if (!deleteError && !stillThere) {
  fail("DELETE access_requests succeeded");
}
if (!stillThere) {
  fail("access request disappeared after DELETE attempt");
}
pass(`DELETE access_requests rejected (${deleteError?.message || "row unchanged"})`);

const finalProfile = await rereadProfile();
if (!finalProfile || profileEscalated(finalProfile)) {
  fail(`Profile escalated by the end of the client tests: ${JSON.stringify(finalProfile)}`);
}

if (serviceRoleKey) {
  const admin = createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: granted, error: grantError } = await admin
    .from("profiles")
    .update({ tier: "guac", grant_source: "manual_admin", updated_at: new Date().toISOString() })
    .eq("id", userId)
    .select("id, tier, guac_active, is_premium, grant_source")
    .maybeSingle();
  if (grantError || !granted || String(granted.tier).toLowerCase() !== "guac") {
    fail(`Trusted service_role Guac grant failed: ${grantError?.message || JSON.stringify(granted)}`);
  }
  const seen = await rereadProfile();
  if (!seen || String(seen.tier).toLowerCase() !== "guac") {
    fail("User JWT could not read Guac after trusted grant");
  }
  pass("trusted/manual Guac grant via service_role succeeds");

  const { error: restoreError } = await admin
    .from("profiles")
    .update({
      tier: "beef",
      grant_source: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);
  if (restoreError) {
    fail(`Failed to restore Beef after trusted-grant check: ${restoreError.message}`);
  }
  pass("trusted grant restored to Beef");
} else {
  console.log(
    "[phase1-security] SKIP trusted/manual Guac grant: set SUPABASE_SERVICE_ROLE_KEY, or run grant_guac_example.sql in the SQL editor as postgres.",
  );
}

if (!usedOAuthToken) {
  await supabase.auth.signOut();
}
console.log("[phase1-security] All authenticated-client checks passed. Profile remains", finalProfile.tier);
process.exit(0);
