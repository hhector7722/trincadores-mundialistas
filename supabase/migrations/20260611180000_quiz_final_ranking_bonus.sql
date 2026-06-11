-- Bonus de clasificación final del quiz → porra principal (top 5 al terminar el torneo)

create or replace function public.quiz_final_ranking_bonus_for_position(p_position int)
returns int
language sql
immutable
as $$
  select case p_position
    when 1 then 5
    when 2 then 4
    when 3 then 3
    when 4 then 2
    when 5 then 1
    else 0
  end;
$$;

create or replace function public.is_pool_tournament_finished(p_pool_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.matchdays md
    join public.matches m on m.matchday_id = md.id
    where md.pool_id = p_pool_id
  )
  and not exists (
    select 1
    from public.matchdays md
    join public.matches m on m.matchday_id = md.id
    where md.pool_id = p_pool_id
      and m.status <> 'finished'::public.match_status
  );
$$;

create table public.quiz_final_ranking_scores (
  pool_id uuid not null references public.pools (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  quiz_total_score int not null default 0,
  final_position int,
  bonus_points int not null default 0,
  calculated_at timestamptz not null default now(),
  primary key (pool_id, profile_id),
  constraint quiz_final_ranking_bonus_nonneg check (bonus_points >= 0)
);

create index quiz_final_ranking_scores_pool_idx
  on public.quiz_final_ranking_scores (pool_id);

alter table public.quiz_final_ranking_scores enable row level security;

create policy quiz_final_ranking_scores_select
  on public.quiz_final_ranking_scores
  for select
  to authenticated
  using (public.is_pool_member(pool_id));

create or replace function public.recalculate_quiz_final_ranking_scores(p_pool_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.quiz_final_ranking_scores
  where pool_id = p_pool_id;

  if not public.is_pool_tournament_finished(p_pool_id) then
    return;
  end if;

  insert into public.quiz_final_ranking_scores (
    pool_id,
    profile_id,
    quiz_total_score,
    final_position,
    bonus_points,
    calculated_at
  )
  with quiz_totals as (
    select
      q.pool_id,
      lb.profile_id,
      sum(lb.best_score)::int as quiz_total_score
    from public.quiz_leaderboard lb
    join public.quizzes q on q.id = lb.quiz_id
    where q.pool_id = p_pool_id
    group by q.pool_id, lb.profile_id
  ),
  ranked as (
    select
      qt.pool_id,
      qt.profile_id,
      qt.quiz_total_score,
      rank() over (
        order by qt.quiz_total_score desc, qt.profile_id
      )::int as final_position
    from quiz_totals qt
  )
  select
    r.pool_id,
    r.profile_id,
    r.quiz_total_score,
    r.final_position,
    public.quiz_final_ranking_bonus_for_position(r.final_position),
    now()
  from ranked r
  where r.final_position <= 5;
end;
$$;

grant select on public.quiz_final_ranking_scores to authenticated;
grant all on public.quiz_final_ranking_scores to service_role;

grant execute on function public.quiz_final_ranking_bonus_for_position(int) to authenticated;
grant execute on function public.is_pool_tournament_finished(uuid) to authenticated;
grant execute on function public.recalculate_quiz_final_ranking_scores(uuid) to authenticated;
