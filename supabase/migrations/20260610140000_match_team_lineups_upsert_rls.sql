-- Permitir que usuarios autenticados persistan caché de alineaciones (datos públicos de lectura).

create policy match_team_lineups_insert on public.match_team_lineups
  for insert to authenticated
  with check (true);

create policy match_team_lineups_update on public.match_team_lineups
  for update to authenticated
  using (true)
  with check (true);
