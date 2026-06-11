-- Recordatorio diario del quiz (20:00 Madrid) — deduplicación por usuario y quiz del día

alter table public.notifications
  add column if not exists quiz_id uuid references public.quizzes (id) on delete cascade;

drop index if exists public.notifications_kind_profile_no_match_uidx;

create unique index if not exists notifications_quiz_active_profile_uidx
  on public.notifications (profile_id)
  where kind = 'quiz_competitive_active';

create unique index if not exists notifications_quiz_daily_reminder_uidx
  on public.notifications (profile_id, quiz_id)
  where kind = 'quiz_daily_reminder';

create index if not exists notifications_quiz_id_idx
  on public.notifications (quiz_id)
  where quiz_id is not null;
