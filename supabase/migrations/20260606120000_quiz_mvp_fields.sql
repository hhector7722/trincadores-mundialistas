-- Fase 1 quiz MVP: quiz_date, kind, scoring_mode, image_url, intentos (Opción A)

-- ---------------------------------------------------------------------------
-- Tipos
-- ---------------------------------------------------------------------------

create type public.quiz_kind as enum ('official', 'bonus');

create type public.quiz_scoring_mode as enum ('training', 'competitive');

-- ---------------------------------------------------------------------------
-- Columnas nuevas
-- ---------------------------------------------------------------------------

alter table public.quizzes
  add column quiz_date date,
  add column kind public.quiz_kind not null default 'official',
  add column scoring_mode public.quiz_scoring_mode not null default 'training',
  add column settings_json jsonb not null default '{}'::jsonb;

alter table public.quiz_questions
  add column image_url text;

comment on column public.quizzes.quiz_date is
  'Día civil del quiz (Europe/Madrid), asignado al publicar.';

comment on column public.quizzes.kind is
  'official = 3 preguntas puntuables; bonus = 1 pregunta sin puntos.';

comment on column public.quizzes.scoring_mode is
  'training = no puntúa; competitive = puntúa según questions.points.';

comment on column public.quiz_questions.image_url is
  'Ruta pública de imagen, ej. /quiz/2026-06-15-q1.jpg';

-- ---------------------------------------------------------------------------
-- Índices quizzes
-- ---------------------------------------------------------------------------

create unique index quizzes_pool_date_kind_uq
  on public.quizzes (pool_id, quiz_date, kind)
  where quiz_date is not null;

create index quizzes_pool_date_idx
  on public.quizzes (pool_id, quiz_date desc);

-- ---------------------------------------------------------------------------
-- Intentos: partial unique (Opción A)
-- submitted     → bloquea nuevo intento
-- in_progress   → reanudar o expirar
-- expired       → historial; permite nuevo intento
-- ---------------------------------------------------------------------------

alter table public.quiz_attempts
  drop constraint if exists quiz_attempts_quiz_profile_unique;

create unique index quiz_attempts_active_uq
  on public.quiz_attempts (quiz_id, profile_id)
  where status in ('in_progress', 'submitted');

create index quiz_attempts_lookup_idx
  on public.quiz_attempts (quiz_id, profile_id, status);

-- ---------------------------------------------------------------------------
-- Vista pública de preguntas (sin respuestas correctas)
-- ---------------------------------------------------------------------------

drop view if exists public.quiz_questions_public;

create view public.quiz_questions_public as
  select
    q.id,
    q.quiz_id,
    q.sort_order,
    q.prompt,
    q.options,
    q.points,
    q.image_url
  from public.quiz_questions q;

grant select on public.quiz_questions_public to authenticated, anon;

-- ---------------------------------------------------------------------------
-- Leaderboard quiz: solo official + competitive
-- ---------------------------------------------------------------------------

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
    and q.kind = 'official'
    and q.scoring_mode = 'competitive'
  group by qa.quiz_id, qa.profile_id;

grant select on public.quiz_leaderboard to authenticated, anon;

-- ---------------------------------------------------------------------------
-- RPC: start_quiz_attempt
-- Resume in_progress vigente; expira obsoleto; permite nuevo tras expired
-- ---------------------------------------------------------------------------

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

  if exists (
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

-- ---------------------------------------------------------------------------
-- RPC: submit_quiz_attempt
-- training y bonus nunca otorgan puntos (defensa en profundidad)
-- ---------------------------------------------------------------------------

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
begin
  if v_profile is null then
    raise exception 'not authenticated';
  end if;

  select qa.expires_at, q.kind, q.scoring_mode
  into v_expires, v_kind, v_scoring_mode
  from public.quiz_attempts qa
  join public.quizzes q on q.id = qa.quiz_id
  where qa.id = p_attempt_id
    and qa.profile_id = v_profile
    and qa.status = 'in_progress';

  if not found then
    raise exception 'invalid attempt';
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

    if v_scoring_mode = 'training' or v_kind = 'bonus' then
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

  update public.quiz_attempts
  set status = 'submitted',
      score = v_score,
      submitted_at = now()
  where id = p_attempt_id;

  return v_score;
end;
$$;

grant execute on function public.start_quiz_attempt(uuid) to authenticated;
grant execute on function public.submit_quiz_attempt(uuid, jsonb) to authenticated;
