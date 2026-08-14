-- Example: grant full game access for one signed-in user (run in Supabase SQL editor).
-- This trusted postgres path still works after commercial_security_phase1.sql.
-- Replace the UUID with auth.users.id for the account (Dashboard → Authentication → Users).

-- Requires profiles_entitlement_sync_fix.sql if tier-only updates return beef in RETURNING.
-- update public.profiles
-- set tier = 'guac', updated_at = now()
-- where id = '7565871b-7313-4197-b855-bc345f91c629'
-- returning id, tier, guac_active, is_premium;
