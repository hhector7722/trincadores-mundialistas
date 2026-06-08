-- Escala definitiva v2: partidos 5/2 + MVP 1 (sin diferencia de goles; exacto excluye signo)

create or replace function public.match_exact_points() returns int
language sql immutable as $$ select 5; $$;

create or replace function public.match_sign_points() returns int
language sql immutable as $$ select 2; $$;

create or replace function public.mvp_prediction_points() returns int
language sql immutable as $$ select 1; $$;

create or replace function public.compute_match_points(
  pred_home int,
  pred_away int,
  res_home int,
  res_away int
) returns int
language sql
immutable
as $$
  select case
    when pred_home = res_home and pred_away = res_away then public.match_exact_points()
    when sign(pred_home - pred_away) = sign(res_home - res_away) then public.match_sign_points()
    else 0
  end;
$$;

create or replace function public.rebuild_pool_member_scores(p_pool_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.pool_member_scores where pool_id = p_pool_id;
  insert into public.pool_member_scores (pool_id, profile_id, matchday_id, match_points, exact_hits, sign_hits, cumulative_points, rank, updated_at)
  with score_rows as (
    select p.pool_id, p.profile_id, m.matchday_id, coalesce(p.points_awarded, 0) as pts,
      case when p.points_awarded = public.match_exact_points() then 1 else 0 end as exact_hit,
      case when p.points_awarded = public.match_sign_points() then 1 else 0 end as sign_hit
    from public.predictions p
    join public.matches m on m.id = p.match_id
    where p.pool_id = p_pool_id and p.points_awarded is not null
    union all
    select mvp.pool_id, mvp.profile_id, m.matchday_id, coalesce(mvp.points_awarded, 0) as pts,
      0 as exact_hit,
      0 as sign_hit
    from public.match_mvp_predictions mvp
    join public.matches m on m.id = mvp.match_id
    where mvp.pool_id = p_pool_id and mvp.points_awarded is not null
  ),
  per_matchday as (
    select pool_id, profile_id, matchday_id,
      sum(pts) as match_points,
      sum(exact_hit) as exact_hits,
      sum(sign_hit) as sign_hits
    from score_rows
    group by pool_id, profile_id, matchday_id
  ),
  with_cumulative as (
    select pm.*,
      sum(pm.match_points) over (
        partition by pm.pool_id, pm.profile_id
        order by pm.matchday_id rows between unbounded preceding and current row
      ) as cumulative_points
    from per_matchday pm
  ),
  ranked as (
    select wc.*,
      rank() over (partition by wc.pool_id, wc.matchday_id order by wc.match_points desc, wc.profile_id)::int as rank
    from with_cumulative wc
  )
  select pool_id, profile_id, matchday_id, match_points, exact_hits, sign_hits, cumulative_points, rank, now()
  from ranked;
end;
$$;

-- Recalcular partidos ya resueltos y rankings existentes
do $$
declare
  r record;
begin
  for r in
    select distinct m.id as match_id
    from public.matches m
    join public.match_results mr on mr.match_id = m.id
  loop
    perform public.recalculate_match_scores(r.match_id);
  end loop;
end $$;

do $$
declare
  p record;
begin
  for p in select id from public.pools loop
    perform public.rebuild_pool_member_scores(p.id);
  end loop;
end $$;

grant execute on function public.match_exact_points() to authenticated;
grant execute on function public.match_sign_points() to authenticated;
