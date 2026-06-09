-- Alineaciones por partido/equipo con trazabilidad de fuente (confirmed > predicted > fallback).

insert into public.data_source_registry (code, name, base_url, license) values
  ('api_football', 'API-Football (API-SPORTS)', 'https://www.api-football.com', 'Free tier / commercial')
on conflict (code) do nothing;

create table public.match_team_lineups (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches (id) on delete cascade,
  team_name text not null,
  source_kind text not null check (source_kind in ('confirmed', 'predicted', 'fallback')),
  data_source_code text references public.data_source_registry (code) on delete set null,
  formation text not null,
  slots jsonb not null default '[]'::jsonb,
  bench jsonb not null default '[]'::jsonb,
  fetched_at timestamptz,
  updated_at timestamptz not null default now(),
  unique (match_id, team_name)
);

create index match_team_lineups_match_idx on public.match_team_lineups (match_id);
create index match_team_lineups_source_idx on public.match_team_lineups (source_kind, updated_at desc);

alter table public.match_team_lineups enable row level security;

create policy match_team_lineups_select on public.match_team_lineups
  for select to authenticated using (true);

grant all on public.match_team_lineups to service_role;
grant select on public.match_team_lineups to authenticated;
