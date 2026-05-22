-- Cakery Bakery stores MULTIPLE saves per account (one row per save id).
-- A UNIQUE (user_id, game_id) constraint blocks the 2nd+ save and surfaces as:
--   23505 duplicate key ... game_saves_user_game_unique
--   HTTP 409 from PostgREST
--
-- Calculator Cove uses ONE settings row per account (id = user_id) — still valid
-- without this constraint.
--
-- Safe to re-run.

alter table public.game_saves
  drop constraint if exists game_saves_user_game_unique;

-- If the constraint was created as a unique index instead:
drop index if exists public.game_saves_user_game_unique;
