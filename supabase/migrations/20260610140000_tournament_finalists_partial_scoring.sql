-- Finalistas: +2 pts por uno acertado; +5 pts si aciertas los dos (mantener sync con lib/tournament-predictions/scoring.ts)

create or replace function public.tournament_finalist_single_points() returns int
language sql immutable as $$ select 2; $$;

create or replace function public.compute_tournament_finalists_points(
  pred_a text,
  pred_b text,
  official_a text,
  official_b text
) returns int
language sql immutable
as $$
  with officials as (
    select lower(trim(official_a)) as team
    union
    select lower(trim(official_b))
    where official_b is not null
  ),
  predictions as (
    select lower(trim(pred_a)) as team
    where pred_a is not null and trim(pred_a) <> ''
    union
    select lower(trim(pred_b))
    where pred_b is not null and trim(pred_b) <> ''
  ),
  hits as (
    select count(*)::int as n
    from predictions p
    where exists (select 1 from officials o where o.team = p.team)
  )
  select case
    when official_a is null or official_b is null then 0
    when (select n from hits) >= 2 then public.tournament_finalists_points()
    when (select n from hits) = 1 then public.tournament_finalist_single_points()
    else 0
  end;
$$;

grant execute on function public.tournament_finalist_single_points() to authenticated;
