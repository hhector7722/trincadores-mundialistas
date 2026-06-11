-- Payload JSON para stats, sustituciones y metadatos BSD en partidos en vivo.

alter table public.match_live_state
  add column if not exists live_payload jsonb not null default '{}'::jsonb;

create index if not exists match_live_state_synced_idx
  on public.match_live_state (synced_at desc);
