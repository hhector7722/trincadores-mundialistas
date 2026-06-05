-- Fase 0b.1: alineacion nucleo
create type public.pool_member_role_new as enum ('owner', 'admin', 'player');
alter table public.pool_members alter column role type public.pool_member_role_new using (case when role::text = 'admin' then 'admin'::public.pool_member_role_new else 'player'::public.pool_member_role_new end);
drop type public.pool_member_role;
alter type public.pool_member_role_new rename to pool_member_role;
insert into public.pool_members (pool_id, user_id, role) select p.id, p.owner_id, 'owner'::public.pool_member_role from public.pools p where not exists (select 1 from public.pool_members pm where pm.pool_id = p.id and pm.user_id = p.owner_id);
update public.pool_members pm set role = 'owner'::public.pool_member_role from public.pools p where p.id = pm.pool_id and pm.user_id = p.owner_id;
alter table public.pools drop column owner_id;
alter table public.pool_members rename column user_id to profile_id;
alter table public.predictions rename column user_id to profile_id;
alter table public.predictions rename column home_score to home_goals;
alter table public.predictions rename column away_score to away_goals;
alter table public.match_results rename column home_score to home_goals;
alter table public.match_results rename column away_score to away_goals;
alter table public.notifications rename column user_id to profile_id;
alter table public.push_subscriptions rename column user_id to profile_id;
alter table public.quiz_attempts rename column user_id to profile_id;
drop index if exists public.idx_pool_members_user;
create index idx_pool_members_profile on public.pool_members (profile_id);
alter table public.pool_member_scores rename column user_id to profile_id;
alter table public.pool_member_scores add column matchday_id uuid references public.matchdays (id) on delete cascade;
update public.pool_member_scores pms set matchday_id = (select md.id from public.matchdays md where md.pool_id = pms.pool_id order by md.sequence asc limit 1);
alter table public.pool_member_scores alter column matchday_id set not null;
alter table public.pool_member_scores rename column total_points to match_points;
alter table public.pool_member_scores add column sign_hits int not null default 0, add column cumulative_points int not null default 0, add column rank int;
alter table public.pool_member_scores drop constraint pool_member_scores_pkey;
alter table public.pool_member_scores add constraint pool_member_scores_pkey primary key (pool_id, profile_id, matchday_id);
alter table public.quiz_attempts add constraint quiz_attempts_quiz_profile_unique unique (quiz_id, profile_id);
create or replace function public.is_pool_member(p_pool_id uuid, p_profile_id uuid default auth.uid())
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.pool_members pm where pm.pool_id = p_pool_id and pm.profile_id = p_profile_id);
$$;

create or replace function public.is_pool_admin(p_pool_id uuid, p_profile_id uuid default auth.uid())
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.pool_members pm where pm.pool_id = p_pool_id and pm.profile_id = p_profile_id and pm.role in ('admin'::public.pool_member_role, 'owner'::public.pool_member_role));
$$;

create or replace function public.is_pool_owner(p_pool_id uuid, p_profile_id uuid default auth.uid())
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.pool_members pm where pm.pool_id = p_pool_id and pm.profile_id = p_profile_id and pm.role = 'owner'::public.pool_member_role);
$$;

create or replace function public.prediction_edit_allowed(p_match_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.matches m where m.id = p_match_id and m.status = 'scheduled' and now() < m.kickoff_at - interval '5 minutes');
$$;

create or replace view public.quiz_leaderboard as
  select qa.quiz_id, qa.profile_id, max(qa.score) as best_score,
         count(*) filter (where qa.status = 'submitted') as attempts
  from public.quiz_attempts qa where qa.status = 'submitted' group by qa.quiz_id, qa.profile_id;

create or replace function public.recalculate_match_scores(p_match_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare r record;
begin
  select mr.home_goals, mr.away_goals into r from public.match_results mr where mr.match_id = p_match_id;
  if not found then return; end if;
  update public.predictions p set points_awarded = public.compute_match_points(p.home_goals, p.away_goals, r.home_goals, r.away_goals), updated_at = now() where p.match_id = p_match_id;
end; $$;

create or replace function public.rebuild_pool_member_scores(p_pool_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  delete from public.pool_member_scores where pool_id = p_pool_id;
  insert into public.pool_member_scores (pool_id, profile_id, matchday_id, match_points, exact_hits, sign_hits, cumulative_points, rank, updated_at)
  with per_matchday as (
    select p.pool_id, p.profile_id, m.matchday_id,
      coalesce(sum(p.points_awarded), 0) as match_points,
      count(*) filter (where p.points_awarded = 8) as exact_hits,
      count(*) filter (where p.points_awarded = 3) as sign_hits
    from public.predictions p join public.matches m on m.id = p.match_id
    where p.pool_id = p_pool_id and p.points_awarded is not null
    group by p.pool_id, p.profile_id, m.matchday_id
  ), with_cumulative as (
    select pm.*, sum(pm.match_points) over (partition by pm.pool_id, pm.profile_id order by pm.matchday_id rows between unbounded preceding and current row) as cumulative_points
    from per_matchday pm
  ), ranked as (
    select wc.*, rank() over (partition by wc.pool_id, wc.matchday_id order by wc.match_points desc, wc.profile_id)::int as rank from with_cumulative wc
  )
  select pool_id, profile_id, matchday_id, match_points, exact_hits, sign_hits, cumulative_points, rank, now() from ranked;
end; $$;

drop function if exists public.start_quiz_attempt(uuid);

create or replace function public.start_quiz_attempt(p_quiz_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_profile uuid := auth.uid(); v_pool uuid; v_attempt uuid; v_expires timestamptz; v_questions jsonb;
begin
  if v_profile is null then raise exception 'not authenticated'; end if;
  select q.pool_id into v_pool from public.quizzes q where q.id = p_quiz_id;
  if not public.is_pool_member(v_pool, v_profile) then raise exception 'not pool member'; end if;
  if exists (select 1 from public.quiz_attempts qa where qa.quiz_id = p_quiz_id and qa.profile_id = v_profile) then
    raise exception 'quiz attempt already exists for this user';
  end if;
  v_expires := now() + interval '30 minutes';
  insert into public.quiz_attempts (quiz_id, profile_id, expires_at) values (p_quiz_id, v_profile, v_expires) returning id into v_attempt;
  select coalesce(jsonb_agg(jsonb_build_object('id', qq.id, 'sort_order', qq.sort_order, 'prompt', qq.prompt, 'options', qq.options, 'points', qq.points) order by qq.sort_order), '[]'::jsonb)
  into v_questions from public.quiz_questions_public qq where qq.quiz_id = p_quiz_id;
  return jsonb_build_object('attempt_id', v_attempt, 'expires_at', v_expires, 'questions', v_questions);
end; $$;

create or replace function public.submit_quiz_attempt(p_attempt_id uuid, p_answers jsonb)
returns int language plpgsql security definer set search_path = public as $$
declare v_profile uuid := auth.uid(); v_expires timestamptz; v_score int := 0; ans record; v_correct text; v_pts int;
begin
  if v_profile is null then raise exception 'not authenticated'; end if;
  select qa.expires_at into v_expires from public.quiz_attempts qa
  where qa.id = p_attempt_id and qa.profile_id = v_profile and qa.status = 'in_progress';
  if not found then raise exception 'invalid attempt'; end if;
  if v_expires < now() then
    update public.quiz_attempts set status = 'expired' where id = p_attempt_id;
    raise exception 'quiz attempt expired';
  end if;
  for ans in select key as question_id, value::text as option_id from jsonb_each_text(p_answers) loop
    select k.correct_option_id, q.points into v_correct, v_pts from public.quiz_question_keys k join public.quiz_questions q on q.id = k.question_id where k.question_id = ans.question_id::uuid;
    insert into public.quiz_responses (attempt_id, question_id, selected_option_id, is_correct, points_awarded)
    values (p_attempt_id, ans.question_id::uuid, trim(both '"' from ans.option_id), trim(both '"' from ans.option_id) = v_correct, case when trim(both '"' from ans.option_id) = v_correct then v_pts else 0 end)
    on conflict (attempt_id, question_id) do update set selected_option_id = excluded.selected_option_id, is_correct = excluded.is_correct, points_awarded = excluded.points_awarded;
    if trim(both '"' from ans.option_id) = v_correct then v_score := v_score + v_pts; end if;
  end loop;
  update public.quiz_attempts set status = 'submitted', score = v_score, submitted_at = now() where id = p_attempt_id;
  return v_score;
end; $$;

grant execute on function public.prediction_edit_allowed(uuid) to authenticated;
grant execute on function public.start_quiz_attempt(uuid) to authenticated;

drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles for select to authenticated using (id = auth.uid() or exists (select 1 from public.pool_members pm1 join public.pool_members pm2 on pm1.pool_id = pm2.pool_id where pm1.profile_id = auth.uid() and pm2.profile_id = profiles.id));

drop policy if exists pools_insert on public.pools;
drop policy if exists pools_update on public.pools;
create policy pools_insert on public.pools for insert to authenticated with check (auth.uid() is not null);
create policy pools_update on public.pools for update to authenticated using (public.is_pool_admin(id)) with check (public.is_pool_admin(id));

drop policy if exists pool_members_select on public.pool_members;
drop policy if exists pool_members_insert on public.pool_members;
drop policy if exists pool_members_delete on public.pool_members;
create policy pool_members_select on public.pool_members for select to authenticated using (public.is_pool_member(pool_id));
create policy pool_members_insert on public.pool_members for insert to authenticated with check ((profile_id = auth.uid() and role = 'owner'::public.pool_member_role and not exists (select 1 from public.pool_members pm where pm.pool_id = pool_members.pool_id)) or public.is_pool_admin(pool_id));
create policy pool_members_update on public.pool_members for update to authenticated using (public.is_pool_admin(pool_id)) with check (public.is_pool_admin(pool_id));
create policy pool_members_delete on public.pool_members for delete to authenticated using (public.is_pool_admin(pool_id));

drop policy if exists predictions_select_own on public.predictions;
drop policy if exists predictions_select_peers on public.predictions;
drop policy if exists predictions_insert on public.predictions;
drop policy if exists predictions_update on public.predictions;
create policy predictions_select_own on public.predictions for select to authenticated using (profile_id = auth.uid());
create policy predictions_select_peers on public.predictions for select to authenticated using (public.can_view_peer_predictions(pool_id, match_id));
create policy predictions_insert on public.predictions for insert to authenticated with check (profile_id = auth.uid() and public.is_pool_member(pool_id) and public.prediction_edit_allowed(match_id));
create policy predictions_update on public.predictions for update to authenticated using (profile_id = auth.uid()) with check (profile_id = auth.uid() and public.prediction_edit_allowed(match_id));
create policy predictions_delete on public.predictions for delete to authenticated using (profile_id = auth.uid() and public.prediction_edit_allowed(match_id));

drop policy if exists notifications_select on public.notifications;
drop policy if exists notifications_update on public.notifications;
create policy notifications_select on public.notifications for select to authenticated using (profile_id = auth.uid());
create policy notifications_insert on public.notifications for insert to authenticated with check (profile_id = auth.uid() or public.is_pool_admin(pool_id));
create policy notifications_update on public.notifications for update to authenticated using (profile_id = auth.uid()) with check (profile_id = auth.uid());
create policy notifications_delete on public.notifications for delete to authenticated using (profile_id = auth.uid());

drop policy if exists quiz_attempts_select on public.quiz_attempts;
create policy quiz_attempts_select on public.quiz_attempts for select to authenticated using (profile_id = auth.uid());

drop policy if exists quiz_responses_select on public.quiz_responses;
create policy quiz_responses_select on public.quiz_responses for select to authenticated using (exists (select 1 from public.quiz_attempts qa where qa.id = attempt_id and qa.profile_id = auth.uid()));

drop policy if exists profile_achievements_select on public.profile_achievements;
create policy profile_achievements_select on public.profile_achievements for select to authenticated using (profile_id = auth.uid() or exists (select 1 from public.pool_members pm1 join public.pool_members pm2 on pm1.pool_id = pm2.pool_id where pm1.profile_id = auth.uid() and pm2.profile_id = profile_achievements.profile_id));

drop policy if exists push_subscriptions_select on public.push_subscriptions;
drop policy if exists push_subscriptions_insert on public.push_subscriptions;
drop policy if exists push_subscriptions_delete on public.push_subscriptions;
create policy push_subscriptions_select on public.push_subscriptions for select to authenticated using (profile_id = auth.uid());
create policy push_subscriptions_insert on public.push_subscriptions for insert to authenticated with check (profile_id = auth.uid());
create policy push_subscriptions_update on public.push_subscriptions for update to authenticated using (profile_id = auth.uid()) with check (profile_id = auth.uid());
create policy push_subscriptions_delete on public.push_subscriptions for delete to authenticated using (profile_id = auth.uid());
