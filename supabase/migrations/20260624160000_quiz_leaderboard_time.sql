create or replace view public.quiz_leaderboard as
  select
    qa.quiz_id,
    qa.profile_id,
    max(qa.score) as best_score,
    count(*) filter (where qa.status = 'submitted') as attempts,
    min(
      extract(epoch from (qa.submitted_at - qa.started_at)) * 1000
    )::bigint as best_time_ms
  from public.quiz_attempts qa
  join public.quizzes q on q.id = qa.quiz_id
  where qa.status = 'submitted'
    and qa.counts_for_score = true
    and q.kind = 'official'
    and q.scoring_mode = 'competitive'
  group by qa.quiz_id, qa.profile_id;
