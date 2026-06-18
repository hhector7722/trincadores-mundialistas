-- Predicciones IA por partido (acceso exclusivo hector vía RLS + server action)

create table public.prediction_insights (
  match_id uuid primary key references public.matches (id) on delete cascade,
  main_prediction text not null,
  confidence text not null,
  mvp_player_name text not null,
  home_win_prob numeric(5, 2) not null check (home_win_prob >= 0 and home_win_prob <= 100),
  draw_prob numeric(5, 2) not null check (draw_prob >= 0 and draw_prob <= 100),
  away_win_prob numeric(5, 2) not null check (away_win_prob >= 0 and away_win_prob <= 100),
  analysis text not null,
  alternatives jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

create index prediction_insights_updated_at_idx on public.prediction_insights (updated_at desc);

alter table public.prediction_insights enable row level security;

create policy prediction_insights_select_hector on public.prediction_insights
  for select to authenticated
  using (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and lower(p.username) = 'hector'
    )
  );

grant select on public.prediction_insights to authenticated;
grant all on public.prediction_insights to service_role;
