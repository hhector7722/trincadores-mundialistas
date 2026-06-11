-- Recordatorios de pronóstico (marcador / MVP) — deduplicación por usuario y partido

alter table public.notifications
  add column if not exists kind text,
  add column if not exists match_id uuid references public.matches (id) on delete cascade;

create unique index if not exists notifications_kind_match_profile_uidx
  on public.notifications (profile_id, kind, match_id)
  where kind is not null and match_id is not null;

create index if not exists notifications_match_id_idx
  on public.notifications (match_id)
  where match_id is not null;
