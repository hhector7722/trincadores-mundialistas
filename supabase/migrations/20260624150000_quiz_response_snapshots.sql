-- Snapshot de pregunta y respuestas en texto para análisis post-torneo (premio "fallos claros").

alter table public.quiz_responses
  add column if not exists question_prompt text,
  add column if not exists selected_option_label text,
  add column if not exists correct_option_label text,
  add column if not exists quiz_date date,
  add column if not exists pool_id uuid references public.pools (id) on delete set null;

comment on column public.quiz_responses.question_prompt is
  'Texto de la pregunta en el momento del intento (snapshot).';
comment on column public.quiz_responses.selected_option_label is
  'Etiqueta legible de la opción elegida por el usuario.';
comment on column public.quiz_responses.correct_option_label is
  'Etiqueta legible de la respuesta correcta en el momento del intento.';
comment on column public.quiz_responses.quiz_date is
  'Día civil del quiz (denormalizado para informes).';
comment on column public.quiz_responses.pool_id is
  'Porra del quiz (denormalizado para informes de admin).';

create index if not exists quiz_responses_wrong_answers_idx
  on public.quiz_responses (pool_id, quiz_date)
  where is_correct = false;

create or replace function public.quiz_option_label(p_options jsonb, p_option_id text)
returns text
language sql
immutable
as $$
  select coalesce(
    (
      select opt->>'label'
      from jsonb_array_elements(coalesce(p_options, '[]'::jsonb)) as opt
      where opt->>'id' = p_option_id
      limit 1
    ),
    p_option_id
  );
$$;

-- Rellena snapshots en respuestas históricas cuando aún existen las preguntas.
update public.quiz_responses qr
set
  question_prompt = q.prompt,
  selected_option_label = public.quiz_option_label(q.options, qr.selected_option_id),
  correct_option_label = public.quiz_option_label(q.options, k.correct_option_id),
  quiz_date = qu.quiz_date,
  pool_id = qu.pool_id
from public.quiz_attempts qa,
     public.quizzes qu,
     public.quiz_questions q,
     public.quiz_question_keys k
where qr.attempt_id = qa.id
  and qa.quiz_id = qu.id
  and qr.question_id = q.id
  and k.question_id = q.id
  and qr.question_prompt is null;

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
  v_pool_id uuid;
  v_counts_for_score boolean := true;
  v_prompt text;
  v_options jsonb;
  v_selected text;
  v_selected_label text;
  v_correct_label text;
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
    q.pool_id,
    qa.counts_for_score
  into
    v_expires,
    v_kind,
    v_scoring_mode,
    v_closes_at,
    v_quiz_date,
    v_pool_id,
    v_counts_for_score
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
    select k.correct_option_id, q.points, q.prompt, q.options
    into v_correct, v_pts, v_prompt, v_options
    from public.quiz_question_keys k
    join public.quiz_questions q on q.id = k.question_id
    where k.question_id = ans.question_id::uuid;

    if not v_counts_for_score or v_scoring_mode = 'training' or v_kind = 'bonus' then
      v_pts := 0;
    end if;

    v_selected := trim(both '"' from ans.option_id);
    v_selected_label := public.quiz_option_label(v_options, v_selected);
    v_correct_label := public.quiz_option_label(v_options, v_correct);

    insert into public.quiz_responses (
      attempt_id,
      question_id,
      selected_option_id,
      is_correct,
      points_awarded,
      question_prompt,
      selected_option_label,
      correct_option_label,
      quiz_date,
      pool_id
    )
    values (
      p_attempt_id,
      ans.question_id::uuid,
      v_selected,
      v_selected = v_correct,
      case when v_selected = v_correct then v_pts else 0 end,
      v_prompt,
      v_selected_label,
      v_correct_label,
      v_quiz_date,
      v_pool_id
    )
    on conflict (attempt_id, question_id) do update
    set selected_option_id = excluded.selected_option_id,
        is_correct = excluded.is_correct,
        points_awarded = excluded.points_awarded,
        question_prompt = excluded.question_prompt,
        selected_option_label = excluded.selected_option_label,
        correct_option_label = excluded.correct_option_label,
        quiz_date = excluded.quiz_date,
        pool_id = excluded.pool_id;

    if v_selected = v_correct then
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

-- Informe para admins: todas las respuestas incorrectas del quiz oficial competitivo.
create or replace function public.get_pool_quiz_wrong_answers(p_pool_id uuid)
returns table (
  profile_id uuid,
  username text,
  display_name text,
  quiz_date date,
  question_prompt text,
  selected_option_label text,
  correct_option_label text,
  submitted_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is not null and not public.is_pool_admin(p_pool_id) then
    raise exception 'not pool admin';
  end if;

  return query
  select
    p.id,
    p.username,
    p.display_name,
    qr.quiz_date,
    qr.question_prompt,
    qr.selected_option_label,
    qr.correct_option_label,
    qa.submitted_at
  from public.quiz_responses qr
  join public.quiz_attempts qa on qa.id = qr.attempt_id
  join public.quizzes q on q.id = qa.quiz_id
  join public.profiles p on p.id = qa.profile_id
  where q.pool_id = p_pool_id
    and qr.is_correct = false
    and coalesce(qa.counts_for_score, true) = true
    and q.kind = 'official'
    and q.scoring_mode = 'competitive'
    and qr.question_prompt is not null
    and qr.selected_option_label is not null
  order by qa.submitted_at desc, p.username asc;
end;
$$;

grant execute on function public.get_pool_quiz_wrong_answers(uuid) to authenticated;
