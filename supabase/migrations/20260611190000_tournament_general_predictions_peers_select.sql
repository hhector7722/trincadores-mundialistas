-- Tras el inicio del Mundial: los miembros del pool pueden ver los pronósticos globales de sus rivales.

create policy tournament_general_predictions_select_peers
  on public.tournament_general_predictions
  for select to authenticated
  using (public.is_pool_member(pool_id));
