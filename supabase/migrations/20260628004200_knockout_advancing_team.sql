-- Añadir columna advancing_team a predictions
alter table public.predictions 
add column advancing_team text check (advancing_team in ('home', 'away'));

-- Actualizar la función de cálculo de puntos para tener en cuenta si es fase eliminatoria
create or replace function public.compute_match_points_v3(
  pred_home int,
  pred_away int,
  pred_adv text,
  res_home int,
  res_away int,
  res_pen_home int,
  res_pen_away int,
  is_knockout boolean
) returns int
language plpgsql
immutable
as $$
declare
  actual_adv text;
  predicted_adv text;
  exact_score boolean;
  correct_adv boolean;
begin
  if not is_knockout then
    -- Fase de grupos (Reglas clásicas v2: 5 por exacto, 2 por signo)
    if pred_home = res_home and pred_away = res_away then return 5; end if;
    if sign(pred_home - pred_away) = sign(res_home - res_away) then return 2; end if;
    return 0;
  end if;

  -- Eliminatorias (Nuevas reglas)
  exact_score := (pred_home = res_home and pred_away = res_away);
  
  -- Determinar el equipo real que avanza
  if res_home > res_away then 
    actual_adv := 'home';
  elsif res_home < res_away then 
    actual_adv := 'away';
  elsif coalesce(res_pen_home, 0) > coalesce(res_pen_away, 0) then 
    actual_adv := 'home';
  else 
    actual_adv := 'away'; 
  end if;

  -- Determinar el equipo predicho que avanza
  if pred_home > pred_away then 
    predicted_adv := 'home';
  elsif pred_home < pred_away then 
    predicted_adv := 'away';
  else 
    predicted_adv := pred_adv; 
  end if;

  correct_adv := (predicted_adv is not null and predicted_adv = actual_adv);

  -- 1. Pleno total (marcador exacto + clasificado) = 5
  if exact_score and correct_adv then return 5; end if;
  -- 2. Marcador exacto sin acertar clasificado = 3
  if exact_score and not correct_adv then return 3; end if;
  -- 3. Clasificado correcto sin acertar marcador = 2
  if correct_adv then return 2; end if;
  
  -- 4. Todo mal = 0
  return 0;
end;
$$;

-- Sobrescribir la función que recalcula los puntos de un partido
create or replace function public.recalculate_match_scores(p_match_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare 
  r record;
begin
  select mr.home_goals, mr.away_goals, mr.penalty_home, mr.penalty_away, (m.group_code is null) as is_knockout
  into r 
  from public.match_results mr 
  join public.matches m on m.id = mr.match_id
  where mr.match_id = p_match_id;
  
  if not found then return; end if;

  update public.predictions p
  set points_awarded = public.compute_match_points_v3(
        p.home_goals, p.away_goals, p.advancing_team,
        r.home_goals, r.away_goals, r.penalty_home, r.penalty_away,
        r.is_knockout
      ),
      updated_at = now()
  where p.match_id = p_match_id;

  perform public.recalculate_match_mvp_scores(p_match_id);
end;
$$;

-- Dar permisos
grant execute on function public.compute_match_points_v3(int, int, text, int, int, int, int, boolean) to authenticated;
