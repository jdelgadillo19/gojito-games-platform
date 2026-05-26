#!/usr/bin/env node
/**
 * Smoke-check that Supabase exposes public.profiles (table exists, REST reachable).
 * Does not prove RLS with a real user JWT — apply profiles.sql and test sign-in in a game.
 *
 * Usage (from gojito-platform):
 *   node scripts/verify-profiles-schema.mjs
 *
 * Reads VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY from .env or .env.local
 */
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function loadEnv() {
  const vars = {};
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
      if (!(m[1] in vars)) vars[m[1]] = v;
    }
  }
  return vars;
}

const env = loadEnv();
const url = (env.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL || "").replace(/\/+$/, "");
const anon = env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || "";

if (!url || !anon) {
  console.error("[verify-profiles] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in gojito-platform/.env");
  process.exit(1);
}

const endpoint = `${url}/rest/v1/profiles?select=id,tier&limit=1`;

let res;
try {
  res = await fetch(endpoint, {
    headers: {
      apikey: anon,
      Authorization: `Bearer ${anon}`,
      Accept: "application/json",
    },
  });
} catch (e) {
  console.error("[verify-profiles] Network error:", e.message);
  process.exit(1);
}

if (res.status === 404 || res.status === 406) {
  const body = await res.text();
  console.error(
    "[verify-profiles] profiles table not found or not exposed. Apply supabase/profiles.sql in the SQL editor.",
  );
  console.error("  HTTP", res.status, body.slice(0, 200));
  process.exit(1);
}

if (!res.ok) {
  const body = await res.text();
  console.warn("[verify-profiles] HTTP", res.status, "-", body.slice(0, 300));
  if (res.status === 401 || res.status === 403) {
    console.log(
      "[verify-profiles] Table likely exists (auth/RLS rejected anon). Sign in via a game to confirm row access.",
    );
    process.exit(0);
  }
  process.exit(1);
}

const rows = await res.json();
console.log("[verify-profiles] OK — public.profiles is reachable via REST.");
console.log("  Sample rows returned:", Array.isArray(rows) ? rows.length : 0);
console.log("  Next: sign in once, set tier = guac for that user id, sign out/in, verify game chrome.");
