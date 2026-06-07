-- Fase 2b: histórico Fjelstul + integración worldcup2026 + plantillas + quiz facts
-- No modifica tablas operativas OpenFootball ni el import existente.

-- ---------------------------------------------------------------------------
-- Registro de fuentes externas
-- ---------------------------------------------------------------------------

create table public.data_source_registry (
  code text primary key,
  name text not null,
  base_url text,
  license text,
  created_at timestamptz not null default now()
);

insert into public.data_source_registry (code, name, base_url, license) values
  ('openfootball', 'OpenFootball worldcup', 'https://github.com/openfootball/worldcup', null),
  ('fjelstul', 'Fjelstul World Cup Database v1.2.0', 'https://github.com/jfjelstul/worldcup', 'CC-BY-SA 4.0'),
  ('worldcup2026', 'worldcup2026 API', 'https://worldcup26.ir', 'ISC'),
  ('manual', 'Manual / curated', null, null)
on conflict (code) do nothing;

-- ---------------------------------------------------------------------------
-- Histórico: namespace wc_historic_*
-- ---------------------------------------------------------------------------

create table public.wc_historic_tournaments (
  id uuid primary key default gen_random_uuid(),
  external_id text not null unique,
  year int not null,
  name text not null,
  host_country text,
  winner text,
  start_date date,
  end_date date,
  gender text not null default 'men' check (gender in ('men', 'women')),
  created_at timestamptz not null default now()
);

create index wc_historic_tournaments_year_idx on public.wc_historic_tournaments (year);

create table public.wc_historic_teams (
  id uuid primary key default gen_random_uuid(),
  external_id text not null unique,
  name text not null,
  code text,
  confederation text,
  created_at timestamptz not null default now()
);

create index wc_historic_teams_code_idx on public.wc_historic_teams (code);
create index wc_historic_teams_name_idx on public.wc_historic_teams (name);

create table public.wc_historic_stadiums (
  id uuid primary key default gen_random_uuid(),
  external_id text not null unique,
  name text not null,
  city text,
  country text,
  capacity int,
  created_at timestamptz not null default now()
);

create table public.wc_historic_matches (
  id uuid primary key default gen_random_uuid(),
  external_id text not null unique,
  tournament_external_id text not null references public.wc_historic_tournaments (external_id) on delete cascade,
  home_team_external_id text references public.wc_historic_teams (external_id) on delete set null,
  away_team_external_id text references public.wc_historic_teams (external_id) on delete set null,
  stadium_external_id text references public.wc_historic_stadiums (external_id) on delete set null,
  match_date date,
  match_time text,
  stage_name text,
  group_name text,
  home_score int,
  away_score int,
  extra_time boolean not null default false,
  penalty_shootout boolean not null default false,
  created_at timestamptz not null default now()
);

create index wc_historic_matches_tournament_idx on public.wc_historic_matches (tournament_external_id);
create index wc_historic_matches_date_idx on public.wc_historic_matches (match_date);
create index wc_historic_matches_stage_idx on public.wc_historic_matches (stage_name);

create table public.wc_historic_goals (
  id uuid primary key default gen_random_uuid(),
  external_id text not null unique,
  match_external_id text not null references public.wc_historic_matches (external_id) on delete cascade,
  tournament_external_id text not null references public.wc_historic_tournaments (external_id) on delete cascade,
  team_external_id text references public.wc_historic_teams (external_id) on delete set null,
  player_name text not null,
  minute_label text,
  own_goal boolean not null default false,
  penalty boolean not null default false,
  created_at timestamptz not null default now()
);

create index wc_historic_goals_match_idx on public.wc_historic_goals (match_external_id);

create table public.wc_historic_award_winners (
  id uuid primary key default gen_random_uuid(),
  external_key text not null unique,
  tournament_external_id text not null references public.wc_historic_tournaments (external_id) on delete cascade,
  award_name text not null,
  player_name text not null,
  team_name text,
  shared boolean not null default false,
  created_at timestamptz not null default now()
);

create index wc_historic_award_winners_tournament_idx on public.wc_historic_award_winners (tournament_external_id);

create table public.wc_historic_tournament_standings (
  id uuid primary key default gen_random_uuid(),
  external_key text not null unique,
  tournament_external_id text not null references public.wc_historic_tournaments (external_id) on delete cascade,
  team_name text not null,
  position int not null check (position between 1 and 4),
  created_at timestamptz not null default now()
);

create index wc_historic_standings_tournament_idx on public.wc_historic_tournament_standings (tournament_external_id);

-- ---------------------------------------------------------------------------
-- Plantillas / convocados (entidad propia, alimentable por fases)
-- ---------------------------------------------------------------------------

create table public.team_squads (
  id uuid primary key default gen_random_uuid(),
  source_code text not null references public.data_source_registry (code) on delete restrict,
  external_key text not null,
  team_name text not null,
  team_code text,
  year int,
  tournament_external_id text,
  competition_code text,
  label text,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (source_code, external_key)
);

create index team_squads_team_name_idx on public.team_squads (team_name);
create index team_squads_year_idx on public.team_squads (year);
create index team_squads_competition_idx on public.team_squads (competition_code);

create table public.team_squad_players (
  id uuid primary key default gen_random_uuid(),
  squad_id uuid not null references public.team_squads (id) on delete cascade,
  external_player_key text,
  player_name text not null,
  position text,
  shirt_number int,
  club text,
  status text not null default 'called_up',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (squad_id, player_name)
);

create index team_squad_players_squad_idx on public.team_squad_players (squad_id);

-- ---------------------------------------------------------------------------
-- Integración 2026: mapeo + live state
-- ---------------------------------------------------------------------------

create table public.external_id_map (
  id uuid primary key default gen_random_uuid(),
  source_code text not null references public.data_source_registry (code) on delete restrict,
  external_key text not null,
  entity_type text not null check (entity_type in ('match', 'team', 'stadium', 'group')),
  internal_table text not null,
  internal_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  match_status text not null default 'mapped' check (match_status in ('mapped', 'pending', 'rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (source_code, external_key)
);

create unique index external_id_map_mapped_entity_uq
  on public.external_id_map (source_code, entity_type, internal_id)
  where internal_id is not null and match_status = 'mapped';

create index external_id_map_internal_idx on public.external_id_map (internal_table, internal_id);
create index external_id_map_pending_idx on public.external_id_map (match_status) where match_status = 'pending';

create table public.match_live_state (
  match_id uuid primary key references public.matches (id) on delete cascade,
  source_code text not null references public.data_source_registry (code) on delete restrict,
  source_external_key text not null,
  home_score int not null default 0,
  away_score int not null default 0,
  time_elapsed text not null default 'notstarted',
  finished boolean not null default false,
  synced_at timestamptz not null default now()
);

create index match_live_state_source_idx on public.match_live_state (source_code, source_external_key);

-- ---------------------------------------------------------------------------
-- Quiz: hechos persistidos
-- ---------------------------------------------------------------------------

create table public.quiz_facts_worldcup (
  id text primary key,
  category text not null,
  fact_type text not null,
  subject text not null,
  value text not null,
  year int,
  difficulty text not null default 'easy' check (difficulty in ('easy', 'medium', 'hard')),
  option_semantic_type text not null,
  distractor_pool jsonb not null default '[]'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  source_url text not null,
  source_label text not null,
  enabled boolean not null default true,
  created_at timestamptz not null default now()
);

create index quiz_facts_worldcup_category_idx on public.quiz_facts_worldcup (category);
create index quiz_facts_worldcup_enabled_idx on public.quiz_facts_worldcup (enabled) where enabled = true;

-- ---------------------------------------------------------------------------
-- RLS + grants
-- ---------------------------------------------------------------------------

alter table public.data_source_registry enable row level security;
alter table public.wc_historic_tournaments enable row level security;
alter table public.wc_historic_teams enable row level security;
alter table public.wc_historic_stadiums enable row level security;
alter table public.wc_historic_matches enable row level security;
alter table public.wc_historic_goals enable row level security;
alter table public.wc_historic_award_winners enable row level security;
alter table public.wc_historic_tournament_standings enable row level security;
alter table public.team_squads enable row level security;
alter table public.team_squad_players enable row level security;
alter table public.external_id_map enable row level security;
alter table public.match_live_state enable row level security;
alter table public.quiz_facts_worldcup enable row level security;

create policy data_source_registry_select on public.data_source_registry for select to authenticated using (true);
create policy wc_historic_tournaments_select on public.wc_historic_tournaments for select to authenticated using (true);
create policy wc_historic_teams_select on public.wc_historic_teams for select to authenticated using (true);
create policy wc_historic_stadiums_select on public.wc_historic_stadiums for select to authenticated using (true);
create policy wc_historic_matches_select on public.wc_historic_matches for select to authenticated using (true);
create policy wc_historic_goals_select on public.wc_historic_goals for select to authenticated using (true);
create policy wc_historic_award_winners_select on public.wc_historic_award_winners for select to authenticated using (true);
create policy wc_historic_tournament_standings_select on public.wc_historic_tournament_standings for select to authenticated using (true);
create policy team_squads_select on public.team_squads for select to authenticated using (true);
create policy team_squad_players_select on public.team_squad_players for select to authenticated using (true);
create policy external_id_map_select on public.external_id_map for select to authenticated using (true);
create policy match_live_state_select on public.match_live_state for select to authenticated using (true);
create policy quiz_facts_worldcup_select on public.quiz_facts_worldcup for select to authenticated using (true);

grant all on public.data_source_registry to service_role;
grant all on public.wc_historic_tournaments to service_role;
grant all on public.wc_historic_teams to service_role;
grant all on public.wc_historic_stadiums to service_role;
grant all on public.wc_historic_matches to service_role;
grant all on public.wc_historic_goals to service_role;
grant all on public.wc_historic_award_winners to service_role;
grant all on public.wc_historic_tournament_standings to service_role;
grant all on public.team_squads to service_role;
grant all on public.team_squad_players to service_role;
grant all on public.external_id_map to service_role;
grant all on public.match_live_state to service_role;
grant all on public.quiz_facts_worldcup to service_role;

grant select on public.data_source_registry to authenticated;
grant select on public.wc_historic_tournaments to authenticated;
grant select on public.wc_historic_teams to authenticated;
grant select on public.wc_historic_stadiums to authenticated;
grant select on public.wc_historic_matches to authenticated;
grant select on public.wc_historic_goals to authenticated;
grant select on public.wc_historic_award_winners to authenticated;
grant select on public.wc_historic_tournament_standings to authenticated;
grant select on public.team_squads to authenticated;
grant select on public.team_squad_players to authenticated;
grant select on public.external_id_map to authenticated;
grant select on public.match_live_state to authenticated;
grant select on public.quiz_facts_worldcup to authenticated;
