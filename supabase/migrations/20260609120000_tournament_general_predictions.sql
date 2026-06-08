-- Pronósticos generales del Mundial (campeón, finalistas, pichichi, MVP, guante de oro)

create table public.tournament_general_predictions (
  pool_id uuid not null references public.pools (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  champion_team text,
  finalist_team_a text,
  finalist_team_b text,
  top_scorer_player_name text,
  top_scorer_team_name text,
  tournament_mvp_player_name text,
  tournament_mvp_team_name text,
  golden_glove_player_name text,
  golden_glove_team_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (pool_id, profile_id)
);

create index tournament_general_predictions_pool_idx
  on public.tournament_general_predictions (pool_id);

alter table public.tournament_general_predictions enable row level security;

create or replace function public.tournament_general_predictions_edit_allowed(p_pool_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select not exists (
    select 1
    from public.matches m
    join public.matchdays md on md.id = m.matchday_id
    where md.pool_id = p_pool_id
      and now() >= m.kickoff_at
  );
$$;

create policy tournament_general_predictions_select_own
  on public.tournament_general_predictions
  for select to authenticated
  using (profile_id = auth.uid());

create policy tournament_general_predictions_insert
  on public.tournament_general_predictions
  for insert to authenticated
  with check (
    profile_id = auth.uid()
    and public.is_pool_member(pool_id)
    and public.tournament_general_predictions_edit_allowed(pool_id)
  );

create policy tournament_general_predictions_update
  on public.tournament_general_predictions
  for update to authenticated
  using (profile_id = auth.uid())
  with check (
    profile_id = auth.uid()
    and public.tournament_general_predictions_edit_allowed(pool_id)
  );

grant select, insert, update on public.tournament_general_predictions to authenticated;
grant all on public.tournament_general_predictions to service_role;
grant execute on function public.tournament_general_predictions_edit_allowed(uuid) to authenticated;
