-- Pronósticos MVP por partido (independientes del marcador)

create table public.match_mvp_predictions (
  id uuid primary key default gen_random_uuid(),
  pool_id uuid not null references public.pools (id) on delete cascade,
  match_id uuid not null references public.matches (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  player_name text not null,
  team_name text not null,
  points_awarded int,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (pool_id, match_id, profile_id)
);

create index match_mvp_predictions_match_idx on public.match_mvp_predictions (match_id);
create index match_mvp_predictions_pool_profile_idx on public.match_mvp_predictions (pool_id, profile_id);

alter table public.match_results
  add column if not exists mvp_player_name text,
  add column if not exists mvp_team_name text;

alter table public.match_mvp_predictions enable row level security;

create policy match_mvp_predictions_select_own on public.match_mvp_predictions
  for select to authenticated
  using (profile_id = auth.uid());

create policy match_mvp_predictions_select_peers on public.match_mvp_predictions
  for select to authenticated
  using (public.can_view_peer_predictions(pool_id, match_id));

create policy match_mvp_predictions_insert on public.match_mvp_predictions
  for insert to authenticated
  with check (
    profile_id = auth.uid()
    and public.is_pool_member(pool_id)
    and public.prediction_edit_allowed(match_id)
  );

create policy match_mvp_predictions_update on public.match_mvp_predictions
  for update to authenticated
  using (profile_id = auth.uid())
  with check (
    profile_id = auth.uid()
    and public.prediction_edit_allowed(match_id)
  );

create policy match_mvp_predictions_delete on public.match_mvp_predictions
  for delete to authenticated
  using (profile_id = auth.uid() and public.prediction_edit_allowed(match_id));

grant select, insert, update, delete on public.match_mvp_predictions to authenticated;
grant all on public.match_mvp_predictions to service_role;

create or replace function public.compute_mvp_points(
  pred_player text,
  pred_team text,
  res_player text,
  res_team text
) returns int
language sql
immutable
as $$
  select case
    when res_player is not null
      and lower(trim(pred_player)) = lower(trim(res_player))
      and lower(trim(pred_team)) = lower(trim(res_team))
    then 5
    else 0
  end;
$$;

create or replace function public.recalculate_match_mvp_scores(p_match_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  r record;
begin
  select mr.mvp_player_name, mr.mvp_team_name
  into r
  from public.match_results mr
  where mr.match_id = p_match_id;

  if not found or r.mvp_player_name is null then
    update public.match_mvp_predictions
    set points_awarded = null, updated_at = now()
    where match_id = p_match_id;
    return;
  end if;

  update public.match_mvp_predictions m
  set points_awarded = public.compute_mvp_points(
    m.player_name,
    m.team_name,
    r.mvp_player_name,
    coalesce(r.mvp_team_name, m.team_name)
  ),
  updated_at = now()
  where m.match_id = p_match_id;
end;
$$;

create or replace function public.recalculate_match_scores(p_match_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare r record;
begin
  select mr.home_goals, mr.away_goals into r from public.match_results mr where mr.match_id = p_match_id;
  if not found then return; end if;
  update public.predictions p
  set points_awarded = public.compute_match_points(p.home_goals, p.away_goals, r.home_goals, r.away_goals),
      updated_at = now()
  where p.match_id = p_match_id;
  perform public.recalculate_match_mvp_scores(p_match_id);
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
      case when p.points_awarded = 8 then 1 else 0 end as exact_hit,
      case when p.points_awarded = 3 then 1 else 0 end as sign_hit
    from public.predictions p
    join public.matches m on m.id = p.match_id
    where p.pool_id = p_pool_id and p.points_awarded is not null
    union all
    select mvp.pool_id, mvp.profile_id, m.matchday_id, coalesce(mvp.points_awarded, 0) as pts,
      0 as exact_hit,
      case when mvp.points_awarded = 5 then 1 else 0 end as sign_hit
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

grant execute on function public.compute_mvp_points(text, text, text, text) to authenticated;
grant execute on function public.recalculate_match_mvp_scores(uuid) to authenticated;
