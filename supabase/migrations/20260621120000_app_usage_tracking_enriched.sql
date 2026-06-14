-- Enriquecer seguimiento de uso: etiquetas, query, referrer, duracion y acciones

alter type public.app_usage_event_type add value if not exists 'action';

alter table public.app_usage_events
  add column if not exists label text,
  add column if not exists search text,
  add column if not exists referrer_path text,
  add column if not exists duration_ms integer,
  add column if not exists metadata jsonb not null default '{}'::jsonb;

comment on column public.app_usage_events.label is 'Etiqueta legible (ej. España vs Brasil)';
comment on column public.app_usage_events.search is 'Query string (?dia=...) sin pathname';
comment on column public.app_usage_events.referrer_path is 'Ruta anterior en la navegacion';
comment on column public.app_usage_events.duration_ms is 'Tiempo en pantalla anterior (ms)';
comment on column public.app_usage_events.metadata is 'Contexto: matchId, profileId, action, score, etc.';

create index if not exists idx_app_usage_events_type_created
  on public.app_usage_events (event_type, created_at desc);
