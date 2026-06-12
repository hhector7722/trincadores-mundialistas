-- Corrige acumulado por jornada: ordenar por matchdays.sequence, no por matchday_id (UUID).

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
    select pm.pool_id, pm.profile_id, pm.matchday_id, pm.match_points, pm.exact_hits, pm.sign_hits,
      sum(pm.match_points) over (
        partition by pm.pool_id, pm.profile_id
        order by md.sequence asc, md.created_at asc, pm.matchday_id asc
        rows between unbounded preceding and current row
      ) as cumulative_points
    from per_matchday pm
    join public.matchdays md on md.id = pm.matchday_id
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

do $$
declare
  p record;
begin
  for p in select id from public.pools loop
    perform public.rebuild_pool_member_scores(p.id);
  end loop;
end $$;
