-- Training: permitir rejugada (varios submitted); competitive mantiene bloqueo.
-- Índice único solo para in_progress (evita dos sesiones activas).

drop index if exists public.quiz_attempts_active_uq;

create unique index quiz_attempts_in_progress_uq
  on public.quiz_attempts (quiz_id, profile_id)
  where status = 'in_progress';

drop function if exists public.start_quiz_attempt(uuid);

create or replace function public.start_quiz_attempt(p_quiz_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile uuid := auth.uid();
  v_pool uuid;
  v_attempt uuid;
  v_expires timestamptz;
  v_questions jsonb;
  v_quiz record;
  v_existing record;
  v_resumed boolean := false;
begin
  if v_profile is null then
    raise exception 'not authenticated';
  end if;

  select
    q.pool_id,
    q.title,
    q.quiz_date,
    q.kind,
    q.scoring_mode,
    q.max_points
  into v_quiz
  from public.quizzes q
  where q.id = p_quiz_id;

  if not found then
    raise exception 'quiz not found';
  end if;

  v_pool := v_quiz.pool_id;

  if not public.is_pool_member(v_pool, v_profile) then
    raise exception 'not pool member';
  end if;

  -- Competitive: un submitted bloquea nuevo intento. Training: permite rejugada.
  if v_quiz.scoring_mode = 'competitive' and exists (
    select 1
    from public.quiz_attempts qa
    where qa.quiz_id = p_quiz_id
      and qa.profile_id = v_profile
      and qa.status = 'submitted'
  ) then
    raise exception 'quiz already completed';
  end if;

  select qa.id, qa.expires_at
  into v_existing
  from public.quiz_attempts qa
  where qa.quiz_id = p_quiz_id
    and qa.profile_id = v_profile
    and qa.status = 'in_progress'
  order by qa.started_at desc
  limit 1;

  if found then
    if v_existing.expires_at >= now() then
      v_attempt := v_existing.id;
      v_expires := v_existing.expires_at;
      v_resumed := true;
    else
      update public.quiz_attempts
      set status = 'expired'
      where id = v_existing.id;
    end if;
  end if;

  if not v_resumed then
    v_expires := now() + interval '30 minutes';
    insert into public.quiz_attempts (quiz_id, profile_id, expires_at)
    values (p_quiz_id, v_profile, v_expires)
    returning id into v_attempt;
  end if;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', qq.id,
        'sort_order', qq.sort_order,
        'prompt', qq.prompt,
        'options', qq.options,
        'points', qq.points,
        'image_url', qq.image_url
      )
      order by qq.sort_order
    ),
    '[]'::jsonb
  )
  into v_questions
  from public.quiz_questions_public qq
  where qq.quiz_id = p_quiz_id;

  return jsonb_build_object(
    'attempt_id', v_attempt,
    'expires_at', v_expires,
    'resumed', v_resumed,
    'quiz', jsonb_build_object(
      'id', p_quiz_id,
      'title', v_quiz.title,
      'quiz_date', v_quiz.quiz_date,
      'kind', v_quiz.kind,
      'scoring_mode', v_quiz.scoring_mode,
      'max_points', v_quiz.max_points
    ),
    'questions', v_questions
  );
end;
$$;

grant execute on function public.start_quiz_attempt(uuid) to authenticated;
