-- Intento extra de práctica para hector el 2026-06-17: no puntúa ni afecta al ranking.

alter table public.quiz_attempts
  add column if not exists counts_for_score boolean not null default true;

drop view if exists public.quiz_leaderboard;

create view public.quiz_leaderboard as
  select
    qa.quiz_id,
    qa.profile_id,
    max(qa.score) as best_score,
    count(*) filter (where qa.status = 'submitted') as attempts
  from public.quiz_attempts qa
  join public.quizzes q on q.id = qa.quiz_id
  where qa.status = 'submitted'
    and qa.counts_for_score = true
    and q.kind = 'official'
    and q.scoring_mode = 'competitive'
  group by qa.quiz_id, qa.profile_id;

grant select on public.quiz_leaderboard to authenticated, anon;

drop function if exists public.start_quiz_practice_attempt(uuid);

create or replace function public.start_quiz_practice_attempt(p_quiz_id uuid)
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
  v_practice_date date := '2026-06-17';
begin
  if v_profile is null then
    raise exception 'not authenticated';
  end if;

  if not exists (
    select 1
    from public.profiles p
    where p.id = v_profile
      and lower(p.username) = 'hector'
  ) then
    raise exception 'practice replay not allowed';
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

  if v_quiz.quiz_date is distinct from v_practice_date then
    raise exception 'practice replay not allowed';
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
      and qa.counts_for_score = true
  ) then
    raise exception 'practice replay not allowed';
  end if;

  if exists (
    select 1
    from public.quiz_attempts qa
    where qa.quiz_id = p_quiz_id
      and qa.profile_id = v_profile
      and qa.counts_for_score = false
  ) then
    raise exception 'practice replay already used';
  end if;

  select qa.id, qa.expires_at
  into v_existing
  from public.quiz_attempts qa
  where qa.quiz_id = p_quiz_id
    and qa.profile_id = v_profile
    and qa.status = 'in_progress'
    and qa.counts_for_score = false
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
    insert into public.quiz_attempts (quiz_id, profile_id, expires_at, counts_for_score)
    values (p_quiz_id, v_profile, v_expires, false)
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
        'image_url', qq.image_url,
        'correct_option_id', k.correct_option_id
      )
      order by qq.sort_order
    ),
    '[]'::jsonb
  )
  into v_questions
  from public.quiz_questions_public qq
  join public.quiz_question_keys k on k.question_id = qq.id
  where qq.quiz_id = p_quiz_id;

  return jsonb_build_object(
    'attempt_id', v_attempt,
    'expires_at', v_expires,
    'resumed', v_resumed,
    'practice', true,
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

grant execute on function public.start_quiz_practice_attempt(uuid) to authenticated;

drop function if exists public.submit_quiz_attempt(uuid, jsonb);

create or replace function public.submit_quiz_attempt(p_attempt_id uuid, p_answers jsonb)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile uuid := auth.uid();
  v_expires timestamptz;
  v_score int := 0;
  ans record;
  v_correct text;
  v_pts int;
  v_kind public.quiz_kind;
  v_scoring_mode public.quiz_scoring_mode;
  v_closes_at timestamptz;
  v_quiz_date date;
  v_counts_for_score boolean := true;
begin
  if v_profile is null then
    raise exception 'not authenticated';
  end if;

  select
    qa.expires_at,
    q.kind,
    q.scoring_mode,
    q.closes_at,
    q.quiz_date,
    qa.counts_for_score
  into v_expires, v_kind, v_scoring_mode, v_closes_at, v_quiz_date, v_counts_for_score
  from public.quiz_attempts qa
  join public.quizzes q on q.id = qa.quiz_id
  where qa.id = p_attempt_id
    and qa.profile_id = v_profile
    and qa.status = 'in_progress';

  if not found then
    raise exception 'invalid attempt';
  end if;

  v_closes_at := coalesce(
    v_closes_at,
    case
      when v_quiz_date is not null then
        ((v_quiz_date::timestamp + interval '23 hours 59 minutes 59 seconds')
          at time zone 'Europe/Madrid')
      else null
    end
  );

  if v_closes_at is not null and now() > v_closes_at then
    update public.quiz_attempts
    set status = 'expired'
    where id = p_attempt_id;
    raise exception 'quiz closed';
  end if;

  if v_expires < now() then
    update public.quiz_attempts
    set status = 'expired'
    where id = p_attempt_id;
    raise exception 'quiz attempt expired';
  end if;

  for ans in
    select key as question_id, value::text as option_id
    from jsonb_each_text(p_answers)
  loop
    select k.correct_option_id, q.points
    into v_correct, v_pts
    from public.quiz_question_keys k
    join public.quiz_questions q on q.id = k.question_id
    where k.question_id = ans.question_id::uuid;

    if not v_counts_for_score or v_scoring_mode = 'training' or v_kind = 'bonus' then
      v_pts := 0;
    end if;

    insert into public.quiz_responses (
      attempt_id,
      question_id,
      selected_option_id,
      is_correct,
      points_awarded
    )
    values (
      p_attempt_id,
      ans.question_id::uuid,
      trim(both '"' from ans.option_id),
      trim(both '"' from ans.option_id) = v_correct,
      case when trim(both '"' from ans.option_id) = v_correct then v_pts else 0 end
    )
    on conflict (attempt_id, question_id) do update
    set selected_option_id = excluded.selected_option_id,
        is_correct = excluded.is_correct,
        points_awarded = excluded.points_awarded;

    if trim(both '"' from ans.option_id) = v_correct then
      v_score := v_score + v_pts;
    end if;
  end loop;

  if not v_counts_for_score then
    v_score := 0;
  end if;

  update public.quiz_attempts
  set status = 'submitted',
      score = v_score,
      submitted_at = now()
  where id = p_attempt_id;

  return v_score;
end;
$$;

grant execute on function public.submit_quiz_attempt(uuid, jsonb) to authenticated;
