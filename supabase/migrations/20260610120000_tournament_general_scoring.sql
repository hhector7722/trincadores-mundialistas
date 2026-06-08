-- Scoring de pronósticos generales del Mundial (separado de partidos y quiz)

-- Resultados oficiales del torneo por porra (admin)
create table public.tournament_official_awards (
  pool_id uuid primary key references public.pools (id) on delete cascade,
  champion_team text,
  finalist_team_a text,
  finalist_team_b text,
  top_scorer_player_name text,
  top_scorer_team_name text,
  tournament_mvp_player_name text,
  tournament_mvp_team_name text,
  golden_glove_player_name text,
  golden_glove_team_name text,
  recorded_by uuid references public.profiles (id) on delete set null,
  recorded_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Puntos calculados por usuario (desglose + total)
create table public.tournament_general_prediction_scores (
  pool_id uuid not null references public.pools (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  champion_points int not null default 0,
  finalists_points int not null default 0,
  top_scorer_points int not null default 0,
  tournament_mvp_points int not null default 0,
  golden_glove_points int not null default 0,
  total_points int not null default 0,
  calculated_at timestamptz not null default now(),
  primary key (pool_id, profile_id),
  constraint tournament_general_prediction_scores_total_nonneg check (total_points >= 0)
);

create index tournament_general_prediction_scores_pool_idx
  on public.tournament_general_prediction_scores (pool_id);

alter table public.tournament_official_awards enable row level security;
alter table public.tournament_general_prediction_scores enable row level security;

-- Constantes (mantener en sync con lib/tournament-predictions/scoring.ts)
create or replace function public.tournament_champion_points() returns int
language sql immutable as $$ select 10; $$;

create or replace function public.tournament_finalists_points() returns int
language sql immutable as $$ select 5; $$;

create or replace function public.tournament_top_scorer_points() returns int
language sql immutable as $$ select 7; $$;

create or replace function public.tournament_mvp_award_points() returns int
language sql immutable as $$ select 10; $$;

create or replace function public.tournament_golden_glove_points() returns int
language sql immutable as $$ select 7; $$;

create or replace function public.tournament_player_prediction_match(
  pred_player text,
  pred_team text,
  res_player text,
  res_team text
) returns boolean
language sql immutable
as $$
  select res_player is not null
    and lower(trim(pred_player)) = lower(trim(res_player))
    and lower(trim(pred_team)) = lower(trim(res_team));
$$;

create or replace function public.compute_tournament_champion_points(
  pred_team text,
  official_team text
) returns int
language sql immutable
as $$
  select case
    when official_team is null or pred_team is null then 0
    when lower(trim(pred_team)) = lower(trim(official_team))
    then public.tournament_champion_points()
    else 0
  end;
$$;

-- 5 pts si aciertas los dos finalistas (orden indiferente)
create or replace function public.compute_tournament_finalists_points(
  pred_a text,
  pred_b text,
  official_a text,
  official_b text
) returns int
language sql immutable
as $$
  select case
    when official_a is null or official_b is null then 0
    when pred_a is null or pred_b is null then 0
    when (
      (
        lower(trim(pred_a)) = lower(trim(official_a))
        and lower(trim(pred_b)) = lower(trim(official_b))
      )
      or (
        lower(trim(pred_a)) = lower(trim(official_b))
        and lower(trim(pred_b)) = lower(trim(official_a))
      )
    ) then public.tournament_finalists_points()
    else 0
  end;
$$;

create or replace function public.compute_tournament_player_award_points(
  pred_player text,
  pred_team text,
  res_player text,
  res_team text,
  p_points int
) returns int
language sql immutable
as $$
  select case
    when public.tournament_player_prediction_match(pred_player, pred_team, res_player, res_team)
    then p_points
    else 0
  end;
$$;

create or replace function public.recalculate_tournament_general_scores(p_pool_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  awards public.tournament_official_awards%rowtype;
begin
  select * into awards
  from public.tournament_official_awards
  where pool_id = p_pool_id;

  delete from public.tournament_general_prediction_scores
  where pool_id = p_pool_id;

  if not found then
    return;
  end if;

  insert into public.tournament_general_prediction_scores (
    pool_id,
    profile_id,
    champion_points,
    finalists_points,
    top_scorer_points,
    tournament_mvp_points,
    golden_glove_points,
    total_points,
    calculated_at
  )
  select
    p.pool_id,
    p.profile_id,
    public.compute_tournament_champion_points(p.champion_team, awards.champion_team),
    public.compute_tournament_finalists_points(
      p.finalist_team_a,
      p.finalist_team_b,
      awards.finalist_team_a,
      awards.finalist_team_b
    ),
    public.compute_tournament_player_award_points(
      p.top_scorer_player_name,
      p.top_scorer_team_name,
      awards.top_scorer_player_name,
      awards.top_scorer_team_name,
      public.tournament_top_scorer_points()
    ),
    public.compute_tournament_player_award_points(
      p.tournament_mvp_player_name,
      p.tournament_mvp_team_name,
      awards.tournament_mvp_player_name,
      awards.tournament_mvp_team_name,
      public.tournament_mvp_award_points()
    ),
    public.compute_tournament_player_award_points(
      p.golden_glove_player_name,
      p.golden_glove_team_name,
      awards.golden_glove_player_name,
      awards.golden_glove_team_name,
      public.tournament_golden_glove_points()
    ),
    0,
    now()
  from public.tournament_general_predictions p
  where p.pool_id = p_pool_id;

  update public.tournament_general_prediction_scores s
  set total_points =
    s.champion_points
    + s.finalists_points
    + s.top_scorer_points
    + s.tournament_mvp_points
    + s.golden_glove_points,
    calculated_at = now()
  where s.pool_id = p_pool_id;
end;
$$;

create or replace function public.upsert_tournament_official_awards(
  p_pool_id uuid,
  p_champion_team text default null,
  p_finalist_team_a text default null,
  p_finalist_team_b text default null,
  p_top_scorer_player_name text default null,
  p_top_scorer_team_name text default null,
  p_tournament_mvp_player_name text default null,
  p_tournament_mvp_team_name text default null,
  p_golden_glove_player_name text default null,
  p_golden_glove_team_name text default null
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_pool_admin(p_pool_id) then
    raise exception 'not authorized';
  end if;

  insert into public.tournament_official_awards (
    pool_id,
    champion_team,
    finalist_team_a,
    finalist_team_b,
    top_scorer_player_name,
    top_scorer_team_name,
    tournament_mvp_player_name,
    tournament_mvp_team_name,
    golden_glove_player_name,
    golden_glove_team_name,
    recorded_by,
    recorded_at,
    updated_at
  )
  values (
    p_pool_id,
    nullif(trim(p_champion_team), ''),
    nullif(trim(p_finalist_team_a), ''),
    nullif(trim(p_finalist_team_b), ''),
    nullif(trim(p_top_scorer_player_name), ''),
    nullif(trim(p_top_scorer_team_name), ''),
    nullif(trim(p_tournament_mvp_player_name), ''),
    nullif(trim(p_tournament_mvp_team_name), ''),
    nullif(trim(p_golden_glove_player_name), ''),
    nullif(trim(p_golden_glove_team_name), ''),
    auth.uid(),
    now(),
    now()
  )
  on conflict (pool_id) do update set
    champion_team = excluded.champion_team,
    finalist_team_a = excluded.finalist_team_a,
    finalist_team_b = excluded.finalist_team_b,
    top_scorer_player_name = excluded.top_scorer_player_name,
    top_scorer_team_name = excluded.top_scorer_team_name,
    tournament_mvp_player_name = excluded.tournament_mvp_player_name,
    tournament_mvp_team_name = excluded.tournament_mvp_team_name,
    golden_glove_player_name = excluded.golden_glove_player_name,
    golden_glove_team_name = excluded.golden_glove_team_name,
    recorded_by = auth.uid(),
    updated_at = now();

  perform public.recalculate_tournament_general_scores(p_pool_id);
end;
$$;

create policy tournament_official_awards_select
  on public.tournament_official_awards
  for select to authenticated
  using (public.is_pool_member(pool_id));

create policy tournament_general_prediction_scores_select
  on public.tournament_general_prediction_scores
  for select to authenticated
  using (public.is_pool_member(pool_id));

grant select on public.tournament_official_awards to authenticated;
grant select on public.tournament_general_prediction_scores to authenticated;
grant all on public.tournament_official_awards to service_role;
grant all on public.tournament_general_prediction_scores to service_role;

grant execute on function public.tournament_champion_points() to authenticated;
grant execute on function public.tournament_finalists_points() to authenticated;
grant execute on function public.tournament_top_scorer_points() to authenticated;
grant execute on function public.tournament_mvp_award_points() to authenticated;
grant execute on function public.tournament_golden_glove_points() to authenticated;
grant execute on function public.recalculate_tournament_general_scores(uuid) to authenticated;
grant execute on function public.upsert_tournament_official_awards(
  uuid, text, text, text, text, text, text, text, text, text
) to authenticated;
