-- Gojito Games: account-backed saves (Cakery Bakery + Calculator Cove)
-- Apply in Supabase SQL editor for your project.

create table if not exists public.game_saves (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  game_id text not null,
  save_data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- Non-unique index only. Do NOT add UNIQUE (user_id, game_id): Cakery has many saves
-- per account; a unique constraint causes 23505 / 409 on the second upsert.
create index if not exists idx_game_saves_user_game
  on public.game_saves (user_id, game_id);

alter table public.game_saves enable row level security;

drop policy if exists "game_saves_select_own" on public.game_saves;
create policy "game_saves_select_own"
  on public.game_saves for select
  using (auth.uid() = user_id);

drop policy if exists "game_saves_insert_own" on public.game_saves;
create policy "game_saves_insert_own"
  on public.game_saves for insert
  with check (auth.uid() = user_id);

drop policy if exists "game_saves_update_own" on public.game_saves;
create policy "game_saves_update_own"
  on public.game_saves for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "game_saves_delete_own" on public.game_saves;
create policy "game_saves_delete_own"
  on public.game_saves for delete
  using (auth.uid() = user_id);
