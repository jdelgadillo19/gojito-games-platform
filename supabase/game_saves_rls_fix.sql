-- Run if cloud upserts fail with RLS errors (common with UPSERT + UPDATE policies).
-- Safe to re-run.

drop policy if exists "game_saves_update_own" on public.game_saves;
create policy "game_saves_update_own"
  on public.game_saves for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
