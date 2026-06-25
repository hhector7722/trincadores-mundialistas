-- Tipos base
create type public.probability_entity_type as enum ('team', 'player', 'matchup');

-- Capa RAW: Datos en crudo de la API (para auditoría e histórico)
create table public.market_odds_raw (
  id uuid primary key default gen_random_uuid(),
  sport_key text not null,
  market_key text not null,
  selection_name text not null, -- Nombre tal cual viene de la API
  bookmaker_key text not null,
  raw_odds numeric(8, 2) not null,
  api_updated_at timestamptz not null,
  created_at timestamptz not null default now(),
  
  unique (market_key, selection_name)
);

-- Índice optimizado para encontrar la última cuota conocida de una selección
create index market_odds_raw_lookup_idx on public.market_odds_raw (market_key, selection_name, api_updated_at desc);

-- Capa PRESENTACIÓN: Caché calculada exclusiva para opciones votadas
create table public.dynamic_probabilities (
  id uuid primary key default gen_random_uuid(),
  category text not null, -- 'champion', 'final', 'top_scorer', 'mvp', 'golden_glove'
  
  -- Para relacionar directamente con la BD (evitando fallos de nombres en el frontend)
  -- Nota: Al ser pronósticos a nivel de torneo, el ID puede ser del equipo (text) o del jugador (text).
  -- El proyecto trincadores guarda los pronósticos como "text" (ej. "España", "Mbappé") en tournament_general_predictions.
  -- Para evitar romper todo el frontend actual que mapea por nombre, usaremos selection_key (que coincide con lo que el usuario votó).
  selection_key text not null, 
  entity_type public.probability_entity_type not null,
  
  probability numeric(5, 4) not null check (probability >= 0 and probability <= 1),
  confidence_score numeric(5, 2) not null check (confidence_score >= 0 and confidence_score <= 100),
  algorithm_version integer not null default 1,
  
  -- Metadatos de auditoría (opcionales) de dónde salió este dato
  source_raw_odds numeric(8, 2),
  source_bookmaker text,
  source_market text,
  source_api_updated_at timestamptz,
  
  updated_at timestamptz not null default now(),
  
  -- Solo puede haber 1 probabilidad activa por categoría y selección
  unique (category, selection_key)
);

create index dynamic_probabilities_category_idx on public.dynamic_probabilities (category);

-- Seguridad: Solo lectura para la app. La escritura se hace por cron/admin.
alter table public.dynamic_probabilities enable row level security;
create policy dynamic_probabilities_select on public.dynamic_probabilities 
  for select to authenticated using (true);
grant select on public.dynamic_probabilities to authenticated;

alter table public.market_odds_raw enable row level security;
-- No damos acceso público a market_odds_raw, solo Service Role.
