-- Modo Entrenar: preguntas mezcladas del histórico, sin puntuar.

alter table public.quiz_attempts
  add column if not exists drill_question_ids uuid[];

comment on column public.quiz_attempts.drill_question_ids is
  'Preguntas del intento de entrenamiento (mezcla histórica). Null en intentos oficiales.';

create or replace function public.start_quiz_drill_attempt(
  p_quiz_id uuid,
  p_question_ids uuid[] default null
)
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
  v_opens_at timestamptz;
  v_closes_at timestamptz;
  v_question_ids uuid[];
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
    q.max_points,
    q.opens_at,
    q.closes_at
  into v_quiz
  from public.quizzes q
  where q.id = p_quiz_id;

  if not found then
    raise exception 'quiz not found';
  end if;

  v_opens_at := coalesce(
    v_quiz.opens_at,
    case
      when v_quiz.quiz_date is not null then
        (v_quiz.quiz_date::timestamp at time zone 'Europe/Madrid')
      else null
    end
  );

  v_closes_at := coalesce(
    v_quiz.closes_at,
    case
      when v_quiz.quiz_date is not null then
        ((v_quiz.quiz_date::timestamp + interval '23 hours 59 minutes 59 seconds')
          at time zone 'Europe/Madrid')
      else null
    end
  );

  if v_opens_at is not null and now() < v_opens_at then
    raise exception 'quiz not open yet';
  end if;

  if v_closes_at is not null and now() > v_closes_at then
    raise exception 'quiz closed';
  end if;

  v_pool := v_quiz.pool_id;

  if not public.is_pool_member(v_pool, v_profile) then
    raise exception 'not pool member';
  end if;

  if not exists (
    select 1
    from public.quiz_attempts qa
    where qa.quiz_id = p_quiz_id
      and qa.profile_id = v_profile
      and qa.status = 'submitted'
      and coalesce(qa.counts_for_score, true) = true
  ) then
    raise exception 'drill not allowed';
  end if;

  select qa.id, qa.expires_at, qa.drill_question_ids
  into v_existing
  from public.quiz_attempts qa
  where qa.quiz_id = p_quiz_id
    and qa.profile_id = v_profile
    and qa.status = 'in_progress'
    and qa.drill_question_ids is not null
  order by qa.started_at desc
  limit 1;

  if found then
    if v_existing.expires_at >= now() then
      v_attempt := v_existing.id;
      v_expires := v_existing.expires_at;
      v_question_ids := v_existing.drill_question_ids;
      v_resumed := true;
    else
      update public.quiz_attempts
      set status = 'expired'
      where id = v_existing.id;
    end if;
  end if;

  if not v_resumed then
    if p_question_ids is null or coalesce(array_length(p_question_ids, 1), 0) <> 3 then
      raise exception 'drill invalid questions';
    end if;

    v_question_ids := p_question_ids;
    v_expires := now() + interval '30 minutes';

    insert into public.quiz_attempts (
      quiz_id,
      profile_id,
      expires_at,
      counts_for_score,
      drill_question_ids
    )
    values (p_quiz_id, v_profile, v_expires, false, v_question_ids)
    returning id into v_attempt;
  end if;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', qq.id,
        'sort_order', ord.pos,
        'prompt', qq.prompt,
        'options', qq.options,
        'points', qq.points,
        'image_url', qq.image_url,
        'correct_option_id', k.correct_option_id
      )
      order by ord.pos
    ),
    '[]'::jsonb
  )
  into v_questions
  from unnest(v_question_ids) with ordinality as ord(qid, pos)
  join public.quiz_questions_public qq on qq.id = ord.qid
  join public.quiz_question_keys k on k.question_id = qq.id;

  if jsonb_array_length(v_questions) <> 3 then
    raise exception 'drill invalid questions';
  end if;

  return jsonb_build_object(
    'attempt_id', v_attempt,
    'expires_at', v_expires,
    'resumed', v_resumed,
    'drill', true,
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

grant execute on function public.start_quiz_drill_attempt(uuid, uuid[]) to authenticated;
