-- Tabla para configuración manual de probabilidades de jugadores estrella
create table public.star_player_config (
  id uuid primary key default gen_random_uuid(),
  player_name text not null,
  team_name text,
  top_scorer_prob numeric(5,4),
  mvp_prob numeric(5,4),
  golden_glove_prob numeric(5,4),
  updated_at timestamptz default now(),
  constraint star_player_config_player_name_unique unique (player_name)
);

-- Solo Hector (admin) podrá escribir desde el servidor usando service_role
alter table public.star_player_config enable row level security;

-- Lectura pública (el sync script la lee con service_role, pero también puede ser anon)
create policy "star_player_config_read"
  on public.star_player_config
  for select
  using (true);
