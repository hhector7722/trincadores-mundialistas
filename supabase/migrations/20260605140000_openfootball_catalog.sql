-- Fase 2a: catálogo OpenFootball WC2026 + puente matchdays/matches
-- No modifica auth, profiles, pool_members, predictions ni policies existentes.

create table public.competitions (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  year int not null,
  source_path text,
  created_at timestamptz not null default now()
);

create table public.tournament_stages (
  id uuid primary key default gen_random_uuid(),
  competition_id uuid not null references public.competitions (id) on delete cascade,
  external_key text not null unique,
  stage_type text not null,
  name text not null,
  sequence int not null default 0,
  group_code text,
  created_at timestamptz not null default now()
);

create table public.host_cities (
  id uuid primary key default gen_random_uuid(),
  external_key text not null unique,
  city text not null,
  country_code text,
  stadium_name text not null,
  timezone_offset text,
  capacity int,
  latitude numeric,
  longitude numeric,
  created_at timestamptz not null default now()
);

create table public.teams (
  id uuid primary key default gen_random_uuid(),
  external_key text not null unique,
  name text not null,
  fifa_name text,
  created_at timestamptz not null default now()
);

alter table public.matchdays
  add column competition_id uuid references public.competitions (id) on delete set null,
  add column tournament_stage_id uuid references public.tournament_stages (id) on delete set null,
  add column external_key text;

create unique index matchdays_pool_external_key_uq
  on public.matchdays (pool_id, external_key)
  where external_key is not null;

alter table public.matches
  add column external_match_id text,
  add column competition_id uuid references public.competitions (id) on delete set null,
  add column tournament_stage_id uuid references public.tournament_stages (id) on delete set null,
  add column host_city_id uuid references public.host_cities (id) on delete set null,
  add column home_team_id uuid references public.teams (id) on delete set null,
  add column away_team_id uuid references public.teams (id) on delete set null,
  add column stadium_name text,
  add column group_code text,
  add column match_number int;

create unique index matches_external_match_id_uq
  on public.matches (external_match_id)
  where external_match_id is not null;

alter table public.competitions enable row level security;
alter table public.tournament_stages enable row level security;
alter table public.host_cities enable row level security;
alter table public.teams enable row level security;

create policy competitions_select on public.competitions
  for select to authenticated using (true);

create policy tournament_stages_select on public.tournament_stages
  for select to authenticated using (true);

create policy host_cities_select on public.host_cities
  for select to authenticated using (true);

create policy teams_select on public.teams
  for select to authenticated using (true);
