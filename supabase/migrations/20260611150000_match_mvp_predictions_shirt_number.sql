-- Dorsal del jugador MVP elegido (identificación estable en UI)

alter table public.match_mvp_predictions
  add column if not exists shirt_number int;

comment on column public.match_mvp_predictions.shirt_number is
  'Dorsal oficial del jugador al guardar la predicción; usado para restaurar la selección en el campo táctico.';
