-- Seed datos (requiere perfiles/auth creados por seed-auth.ts)
insert into public.profiles (id, username, display_name) values
  ('b0000000-0000-4000-8000-000000000001', 'owner', 'Owner Seed'),
  ('b0000000-0000-4000-8000-000000000002', 'admin', 'Admin Seed'),
  ('b0000000-0000-4000-8000-000000000003', 'maria', 'Maria'),
  ('b0000000-0000-4000-8000-000000000004', 'pedro', 'Pedro'),
  ('b0000000-0000-4000-8000-000000000005', 'lucia', 'Lucia'),
  ('b0000000-0000-4000-8000-000000000006', 'diego', 'Diego'),
  ('b0000000-0000-4000-8000-000000000007', 'ana', 'Ana')
on conflict (id) do update set username = excluded.username, display_name = excluded.display_name;
insert into public.pools (id, slug, name, settings_json) values (
  'a0000000-0000-4000-8000-000000000001', 'mundial-seed', 'Porra Seed', '{"prediction_visibility":"kickoff"}'::jsonb
) on conflict (id) do nothing;
insert into public.pool_members (pool_id, profile_id, role) values
  ('a0000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000001', 'owner'),
  ('a0000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000002', 'admin'),
  ('a0000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000003', 'player'),
  ('a0000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000004', 'player'),
  ('a0000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000005', 'player'),
  ('a0000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000006', 'player'),
  ('a0000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000007', 'player')
on conflict do nothing;
insert into public.invite_codes (id, pool_id, code, created_by, max_uses) values (
  'f0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', 'SEED2026',
  'b0000000-0000-4000-8000-000000000001', 99
) on conflict (id) do nothing;
insert into public.matchdays (id, pool_id, name, sequence) values (
  'c0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', 'Jornada 1', 1
) on conflict (id) do nothing;
insert into public.matches (id, matchday_id, home_team, away_team, kickoff_at, status, sort_order) values
  ('d0000000-0000-4000-8000-000000000001','c0000000-0000-4000-8000-000000000001','Espana','Francia',now()-interval '3 days','finished',1),
  ('d0000000-0000-4000-8000-000000000002','c0000000-0000-4000-8000-000000000001','Brasil','Argentina',now()-interval '1 hour','live',2),
  ('d0000000-0000-4000-8000-000000000003','c0000000-0000-4000-8000-000000000001','Alemania','Italia',now()+interval '2 days','scheduled',3),
  ('d0000000-0000-4000-8000-000000000004','c0000000-0000-4000-8000-000000000001','Espana','Belgica','2026-07-10 21:00:00Z'::timestamptz,'scheduled',4)
on conflict (id) do nothing;
insert into public.match_results (match_id, home_goals, away_goals, recorded_by) values (
  'd0000000-0000-4000-8000-000000000001', 2, 1, 'b0000000-0000-4000-8000-000000000001'
) on conflict (match_id) do update set home_goals = 2, away_goals = 1;
insert into public.predictions (pool_id, match_id, profile_id, home_goals, away_goals) values
  ('a0000000-0000-4000-8000-000000000001','d0000000-0000-4000-8000-000000000001','b0000000-0000-4000-8000-000000000001',2,1),
  ('a0000000-0000-4000-8000-000000000001','d0000000-0000-4000-8000-000000000001','b0000000-0000-4000-8000-000000000003',1,1),
  ('a0000000-0000-4000-8000-000000000001','d0000000-0000-4000-8000-000000000002','b0000000-0000-4000-8000-000000000004',0,0),
  ('a0000000-0000-4000-8000-000000000001','d0000000-0000-4000-8000-000000000003','b0000000-0000-4000-8000-000000000005',1,0)
on conflict (pool_id, match_id, profile_id) do update set home_goals = excluded.home_goals, away_goals = excluded.away_goals, updated_at = now();
select public.recalculate_match_scores('d0000000-0000-4000-8000-000000000001');
select public.rebuild_pool_member_scores('a0000000-0000-4000-8000-000000000001');
insert into public.quizzes (id, pool_id, title, max_points) values (
  'e0000000-0000-4000-8000-000000000001','a0000000-0000-4000-8000-000000000001','Quiz Seed',3
) on conflict (id) do nothing;
