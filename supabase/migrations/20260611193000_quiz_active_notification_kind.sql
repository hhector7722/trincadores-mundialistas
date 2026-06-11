-- Anuncio único de quiz competitivo activo (sin partido asociado)

create unique index if not exists notifications_kind_profile_no_match_uidx
  on public.notifications (profile_id, kind)
  where kind is not null and match_id is null;
