-- Persistir bonus quiz durante el torneo (no solo al finalizar)
-- El ranking base usa pronósticos; el bonus se actualiza al cerrar cada quiz diario.

create or replace function public.recalculate_quiz_final_ranking_scores(p_pool_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.quiz_final_ranking_scores
  where pool_id = p_pool_id;

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
      and q.kind = 'official'
      and q.scoring_mode = 'competitive'
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
  where r.final_position <= 4;
end;
$$;
