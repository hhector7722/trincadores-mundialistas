-- Trincadores Mundialistas — esquema inicial (Fase 0b)
create extension if not exists "pgcrypto";

-- Enums
create type public.pool_member_role as enum ('member', 'admin');
create type public.match_status as enum ('scheduled', 'live', 'finished', 'postponed', 'cancelled');
create type public.quiz_attempt_status as enum ('in_progress', 'submitted', 'expired');

-- Profiles (1:1 auth.users)
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null,
  display_name text,
  recovery_email text,
  avatar_url text,
  created_at timestamptz not null default now(),
  constraint profiles_username_unique unique (username)
);

create table public.pools (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  owner_id uuid not null references public.profiles (id),
  settings_json jsonb not null default '{"prediction_visibility":"kickoff"}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.pool_members (
  pool_id uuid not null references public.pools (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role public.pool_member_role not null default 'member',
  joined_at timestamptz not null default now(),
  primary key (pool_id, user_id)
);

create table public.invite_codes (
  id uuid primary key default gen_random_uuid(),
  pool_id uuid not null references public.pools (id) on delete cascade,
  code text not null,
  created_by uuid references public.profiles (id),
  expires_at timestamptz,
  max_uses int,
  uses_count int not null default 0,
  created_at timestamptz not null default now(),
  unique (pool_id, code)
);

create table public.matchdays (
  id uuid primary key default gen_random_uuid(),
  pool_id uuid not null references public.pools (id) on delete cascade,
  name text not null,
  sequence int not null default 0,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.matches (
  id uuid primary key default gen_random_uuid(),
  matchday_id uuid not null references public.matchdays (id) on delete cascade,
  home_team text not null,
  away_team text not null,
  kickoff_at timestamptz not null,
  status public.match_status not null default 'scheduled',
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table public.match_results (
  match_id uuid primary key references public.matches (id) on delete cascade,
  home_score int not null,
  away_score int not null,
  recorded_at timestamptz not null default now(),
  recorded_by uuid references public.profiles (id)
);

create table public.predictions (
  id uuid primary key default gen_random_uuid(),
  pool_id uuid not null references public.pools (id) on delete cascade,
  match_id uuid not null references public.matches (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  home_score int not null,
  away_score int not null,
  points_awarded int,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (pool_id, match_id, user_id)
);

create table public.pool_member_scores (
  pool_id uuid not null references public.pools (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  total_points int not null default 0,
  exact_hits int not null default 0,
  updated_at timestamptz not null default now(),
  primary key (pool_id, user_id)
);

create table public.activity_events (
  id uuid primary key default gen_random_uuid(),
  pool_id uuid not null references public.pools (id) on delete cascade,
  actor_id uuid references public.profiles (id),
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.news_items (
  id uuid primary key default gen_random_uuid(),
  pool_id uuid not null references public.pools (id) on delete cascade,
  title text not null,
  body text not null,
  published_at timestamptz not null default now(),
  created_by uuid references public.profiles (id)
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  pool_id uuid references public.pools (id) on delete cascade,
  title text not null,
  body text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.achievements (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  description text
);

create table public.profile_achievements (
  profile_id uuid not null references public.profiles (id) on delete cascade,
  achievement_id uuid not null references public.achievements (id) on delete cascade,
  earned_at timestamptz not null default now(),
  primary key (profile_id, achievement_id)
);

create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  endpoint text not null,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);

create table public.admin_audit_log (
  id uuid primary key default gen_random_uuid(),
  pool_id uuid references public.pools (id) on delete set null,
  actor_id uuid references public.profiles (id),
  action text not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- Quiz
create table public.quizzes (
  id uuid primary key default gen_random_uuid(),
  pool_id uuid not null references public.pools (id) on delete cascade,
  title text not null,
  opens_at timestamptz,
  closes_at timestamptz,
  max_points int not null default 3,
  created_at timestamptz not null default now()
);

create table public.quiz_questions (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references public.quizzes (id) on delete cascade,
  sort_order int not null default 0,
  prompt text not null,
  options jsonb not null default '[]'::jsonb,
  points int not null default 1,
  created_at timestamptz not null default now()
);

create table public.quiz_question_keys (
  question_id uuid primary key references public.quiz_questions (id) on delete cascade,
  correct_option_id text not null
);

create table public.quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references public.quizzes (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  status public.quiz_attempt_status not null default 'in_progress',
  score int,
  started_at timestamptz not null default now(),
  submitted_at timestamptz,
  expires_at timestamptz
);

create table public.quiz_responses (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references public.quiz_attempts (id) on delete cascade,
  question_id uuid not null references public.quiz_questions (id) on delete cascade,
  selected_option_id text not null,
  is_correct boolean,
  points_awarded int not null default 0,
  unique (attempt_id, question_id)
);

create index idx_pool_members_user on public.pool_members (user_id);
create index idx_predictions_match on public.predictions (match_id);
create index idx_matches_matchday on public.matches (matchday_id);

-- Scoring (exclusivo 3/5/8) — fuente de verdad en SQL
create or replace function public.compute_match_points(
  pred_home int,
  pred_away int,
  res_home int,
  res_away int
) returns int
language sql
immutable
as $$
  select case
    when pred_home = res_home and pred_away = res_away then 8
    when (pred_home - pred_away) = (res_home - res_away) then 5
    when sign(pred_home - pred_away) = sign(res_home - res_away) then 3
    else 0
  end;
$$;

-- Helpers membresía / visibilidad
create or replace function public.is_pool_member(p_pool_id uuid, p_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.pool_members pm
    where pm.pool_id = p_pool_id and pm.user_id = p_user_id
  );
$$;

create or replace function public.is_pool_admin(p_pool_id uuid, p_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.pool_members pm
    where pm.pool_id = p_pool_id and pm.user_id = p_user_id and pm.role = 'admin'
  )
  or exists (
    select 1 from public.pools p where p.id = p_pool_id and p.owner_id = p_user_id
  );
$$;

create or replace function public.is_pool_owner(p_pool_id uuid, p_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.pools p where p.id = p_pool_id and p.owner_id = p_user_id
  );
$$;

create or replace function public.can_view_peer_predictions(p_pool_id uuid, p_match_id uuid, p_viewer uuid default auth.uid())
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  vis text;
  m_status public.match_status;
  m_kickoff timestamptz;
begin
  if not public.is_pool_member(p_pool_id, p_viewer) then
    return false;
  end if;
  select coalesce(p.settings_json->>'prediction_visibility', 'kickoff')
    into vis
  from public.pools p where p.id = p_pool_id;
  if vis = 'always' then
    return true;
  elsif vis = 'never' then
    return p_viewer is not null; -- solo propias vía políticas separadas
  end if;
  -- kickoff (default)
  select m.status, m.kickoff_at into m_status, m_kickoff
  from public.matches m where m.id = p_match_id;
  if m_status in ('live', 'finished') then
    return true;
  end if;
  if now() >= m_kickoff then
    return true;
  end if;
  return false;
end;
$$;

create or replace view public.quiz_questions_public as
  select q.id, q.quiz_id, q.sort_order, q.prompt, q.options, q.points
  from public.quiz_questions q;

create or replace view public.quiz_leaderboard as
  select qa.quiz_id,
         qa.user_id,
         max(qa.score) as best_score,
         count(*) filter (where qa.status = 'submitted') as attempts
  from public.quiz_attempts qa
  where qa.status = 'submitted'
  group by qa.quiz_id, qa.user_id;

revoke all on public.quiz_questions from authenticated, anon;
grant select on public.quiz_questions_public to authenticated, anon;
grant select on public.quiz_leaderboard to authenticated, anon;

-- RPC scoring
create or replace function public.recalculate_match_scores(p_match_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  r record;
begin
  select mr.home_score, mr.away_score into r
  from public.match_results mr where mr.match_id = p_match_id;
  if not found then
    return;
  end if;
  update public.predictions p
  set points_awarded = public.compute_match_points(p.home_score, p.away_score, r.home_score, r.away_score),
      updated_at = now()
  where p.match_id = p_match_id;
end;
$$;

create or replace function public.rebuild_pool_member_scores(p_pool_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.pool_member_scores (pool_id, user_id, total_points, exact_hits, updated_at)
  select p.pool_id,
         p.user_id,
         coalesce(sum(p.points_awarded), 0),
         count(*) filter (where p.points_awarded = 8),
         now()
  from public.predictions p
  where p.pool_id = p_pool_id
  group by p.pool_id, p.user_id
  on conflict (pool_id, user_id) do update
  set total_points = excluded.total_points,
      exact_hits = excluded.exact_hits,
      updated_at = now();
end;
$$;

create or replace function public.expire_stale_quiz_attempts()
returns int
language plpgsql
security definer
set search_path = public
as $$
declare n int;
begin
  update public.quiz_attempts
  set status = 'expired'
  where status = 'in_progress' and expires_at is not null and expires_at < now();
  get diagnostics n = row_count;
  return n;
end;
$$;

create or replace function public.start_quiz_attempt(p_quiz_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_pool uuid;
  v_attempt uuid;
begin
  if v_user is null then
    raise exception 'not authenticated';
  end if;
  select q.pool_id into v_pool from public.quizzes q where q.id = p_quiz_id;
  if not public.is_pool_member(v_pool, v_user) then
    raise exception 'not pool member';
  end if;
  insert into public.quiz_attempts (quiz_id, user_id, expires_at)
  values (p_quiz_id, v_user, now() + interval '30 minutes')
  returning id into v_attempt;
  return v_attempt;
end;
$$;

create or replace function public.submit_quiz_attempt(p_attempt_id uuid, p_answers jsonb)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_quiz uuid;
  v_score int := 0;
  ans record;
  v_correct text;
  v_pts int;
begin
  if v_user is null then
    raise exception 'not authenticated';
  end if;
  select qa.quiz_id into v_quiz
  from public.quiz_attempts qa
  where qa.id = p_attempt_id and qa.user_id = v_user and qa.status = 'in_progress';
  if not found then
    raise exception 'invalid attempt';
  end if;
  for ans in
    select key as question_id, value::text as option_id
    from jsonb_each_text(p_answers)
  loop
    select k.correct_option_id, q.points into v_correct, v_pts
    from public.quiz_question_keys k
    join public.quiz_questions q on q.id = k.question_id
    where k.question_id = ans.question_id::uuid;
    insert into public.quiz_responses (attempt_id, question_id, selected_option_id, is_correct, points_awarded)
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
  set status = 'submitted', score = v_score, submitted_at = now()
  where id = p_attempt_id;
  return v_score;
end;
$$;

create or replace function public.generate_news_batch(p_pool_id uuid default null)
returns int
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Stub Fase 0b
  return 0;
end;
$$;

grant execute on function public.recalculate_match_scores(uuid) to authenticated;
grant execute on function public.rebuild_pool_member_scores(uuid) to authenticated;
grant execute on function public.start_quiz_attempt(uuid) to authenticated;
grant execute on function public.submit_quiz_attempt(uuid, jsonb) to authenticated;
grant execute on function public.expire_stale_quiz_attempts() to authenticated;
grant execute on function public.generate_news_batch(uuid) to authenticated;

-- RLS
alter table public.profiles enable row level security;
alter table public.pools enable row level security;
alter table public.pool_members enable row level security;
alter table public.invite_codes enable row level security;
alter table public.matchdays enable row level security;
alter table public.matches enable row level security;
alter table public.match_results enable row level security;
alter table public.predictions enable row level security;
alter table public.pool_member_scores enable row level security;
alter table public.activity_events enable row level security;
alter table public.news_items enable row level security;
alter table public.notifications enable row level security;
alter table public.achievements enable row level security;
alter table public.profile_achievements enable row level security;
alter table public.push_subscriptions enable row level security;
alter table public.admin_audit_log enable row level security;
alter table public.quizzes enable row level security;
alter table public.quiz_questions enable row level security;
alter table public.quiz_question_keys enable row level security;
alter table public.quiz_attempts enable row level security;
alter table public.quiz_responses enable row level security;

-- profiles
create policy profiles_select on public.profiles for select to authenticated
  using (
    id = auth.uid()
    or exists (
      select 1 from public.pool_members pm1
      join public.pool_members pm2 on pm1.pool_id = pm2.pool_id
      where pm1.user_id = auth.uid() and pm2.user_id = profiles.id
    )
  );
create policy profiles_update on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());
create policy profiles_insert on public.profiles for insert to authenticated
  with check (id = auth.uid());

-- pools
create policy pools_select on public.pools for select to authenticated
  using (public.is_pool_member(id));
create policy pools_insert on public.pools for insert to authenticated
  with check (owner_id = auth.uid());
create policy pools_update on public.pools for update to authenticated
  using (public.is_pool_admin(id)) with check (public.is_pool_admin(id));

-- pool_members
create policy pool_members_select on public.pool_members for select to authenticated
  using (public.is_pool_member(pool_id));
create policy pool_members_insert on public.pool_members for insert to authenticated
  with check (public.is_pool_admin(pool_id) or user_id = auth.uid());
create policy pool_members_delete on public.pool_members for delete to authenticated
  using (public.is_pool_admin(pool_id));

-- invite_codes: sin políticas para authenticated (denegado)

-- matchdays / matches
create policy matchdays_select on public.matchdays for select to authenticated
  using (public.is_pool_member(pool_id));
create policy matchdays_write on public.matchdays for all to authenticated
  using (public.is_pool_admin(pool_id)) with check (public.is_pool_admin(pool_id));

create policy matches_select on public.matches for select to authenticated
  using (
    public.is_pool_member(
      (select md.pool_id from public.matchdays md where md.id = matchday_id)
    )
  );
create policy matches_write on public.matches for all to authenticated
  using (
    public.is_pool_admin((select md.pool_id from public.matchdays md where md.id = matchday_id))
  ) with check (
    public.is_pool_admin((select md.pool_id from public.matchdays md where md.id = matchday_id))
  );

-- match_results
create policy match_results_select on public.match_results for select to authenticated
  using (
    public.is_pool_member(
      (select md.pool_id from public.matches m join public.matchdays md on md.id = m.matchday_id where m.id = match_id)
    )
  );
create policy match_results_insert on public.match_results for insert to authenticated
  with check (
    public.is_pool_admin(
      (select md.pool_id from public.matches m join public.matchdays md on md.id = m.matchday_id where m.id = match_id)
    )
  );
create policy match_results_update on public.match_results for update to authenticated
  using (
    public.is_pool_admin(
      (select md.pool_id from public.matches m join public.matchdays md on md.id = m.matchday_id where m.id = match_id)
    )
  );

-- predictions
create policy predictions_select_own on public.predictions for select to authenticated
  using (user_id = auth.uid());
create policy predictions_select_peers on public.predictions for select to authenticated
  using (public.can_view_peer_predictions(pool_id, match_id));
create policy predictions_insert on public.predictions for insert to authenticated
  with check (
    user_id = auth.uid() and public.is_pool_member(pool_id)
    and exists (
      select 1 from public.matches m
      where m.id = match_id and m.status = 'scheduled' and now() < m.kickoff_at
    )
  );
create policy predictions_update on public.predictions for update to authenticated
  using (user_id = auth.uid())
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.matches m
      where m.id = match_id and m.status = 'scheduled' and now() < m.kickoff_at
    )
  );

-- pool_member_scores
create policy pool_member_scores_select on public.pool_member_scores for select to authenticated
  using (public.is_pool_member(pool_id));

-- activity_events / news
create policy activity_events_select on public.activity_events for select to authenticated
  using (public.is_pool_member(pool_id));
create policy news_items_select on public.news_items for select to authenticated
  using (public.is_pool_member(pool_id));

-- notifications
create policy notifications_select on public.notifications for select to authenticated
  using (user_id = auth.uid());
create policy notifications_update on public.notifications for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- achievements
create policy achievements_select on public.achievements for select to authenticated using (true);
create policy profile_achievements_select on public.profile_achievements for select to authenticated
  using (profile_id = auth.uid() or exists (
    select 1 from public.pool_members pm1 join public.pool_members pm2 on pm1.pool_id = pm2.pool_id
    where pm1.user_id = auth.uid() and pm2.user_id = profile_achievements.profile_id
  ));

-- push_subscriptions
create policy push_subscriptions_select on public.push_subscriptions for select to authenticated using (user_id = auth.uid());
create policy push_subscriptions_insert on public.push_subscriptions for insert to authenticated with check (user_id = auth.uid());
create policy push_subscriptions_delete on public.push_subscriptions for delete to authenticated using (user_id = auth.uid());

-- admin_audit_log
create policy admin_audit_select on public.admin_audit_log for select to authenticated
  using (pool_id is null or public.is_pool_admin(pool_id));

-- quizzes
create policy quizzes_select on public.quizzes for select to authenticated
  using (public.is_pool_member(pool_id));

-- quiz_questions / keys: sin acceso directo authenticated (tabla questions revocada; keys sin políticas)

-- quiz_attempts: solo lectura propia; escritura vía RPC (sin políticas insert/update)
create policy quiz_attempts_select on public.quiz_attempts for select to authenticated
  using (user_id = auth.uid());

create policy quiz_responses_select on public.quiz_responses for select to authenticated
  using (
    exists (
      select 1 from public.quiz_attempts qa
      where qa.id = attempt_id and qa.user_id = auth.uid()
    )
  );
revoke all on public.quiz_question_keys from authenticated, anon;
revoke insert, update, delete on public.quiz_attempts from authenticated;
revoke insert, update, delete on public.quiz_responses from authenticated;
grant select on public.quiz_attempts to authenticated;
grant select on public.quiz_responses to authenticated;

grant execute on function public.is_pool_member(uuid, uuid) to authenticated;
grant execute on function public.is_pool_admin(uuid, uuid) to authenticated;
grant execute on function public.is_pool_owner(uuid, uuid) to authenticated;
grant execute on function public.can_view_peer_predictions(uuid, uuid, uuid) to authenticated;
grant execute on function public.compute_match_points(int, int, int, int) to authenticated;