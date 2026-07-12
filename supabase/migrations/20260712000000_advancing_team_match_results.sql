-- Añadir columna advancing_team a match_results para partidos de eliminatorias
-- que se deciden en prórroga (sin penaltis)
alter table public.match_results
  add column advancing_team text check (advancing_team in ('home', 'away'));

-- Actualizar función de puntos v3 para usar advancing_team de match_results
create or replace function public.compute_match_points_v3(
  pred_home int,
  pred_away int,
  pred_adv text,
  res_home int,
  res_away int,
  res_pen_home int,
  res_pen_away int,
  res_adv text,
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
    if pred_home = res_home and pred_away = res_away then return 5; end if;
    if sign(pred_home - pred_away) = sign(res_home - res_away) then return 2; end if;
    return 0;
  end if;

  exact_score := (pred_home = res_home and pred_away = res_away);
  
  if res_adv is not null then
    actual_adv := res_adv;
  elsif res_home > res_away then 
    actual_adv := 'home';
  elsif res_home < res_away then 
    actual_adv := 'away';
  elsif coalesce(res_pen_home, 0) > coalesce(res_pen_away, 0) then 
    actual_adv := 'home';
  elsif coalesce(res_pen_home, 0) < coalesce(res_pen_away, 0) then 
    actual_adv := 'away';
  else
    actual_adv := null;
  end if;

  if pred_home > pred_away then 
    predicted_adv := 'home';
  elsif pred_home < pred_away then 
    predicted_adv := 'away';
  else 
    predicted_adv := pred_adv; 
  end if;

  correct_adv := (predicted_adv is not null and actual_adv is not null and predicted_adv = actual_adv);

  if exact_score and correct_adv then return 5; end if;
  if exact_score and not correct_adv then return 3; end if;
  if correct_adv then return 2; end if;
  
  return 0;
end;
$$;

-- Actualizar recalculate_match_scores para pasar advancing_team
create or replace function public.recalculate_match_scores(p_match_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare 
  r record;
begin
  select mr.home_goals, mr.away_goals, mr.penalty_home, mr.penalty_away, mr.advancing_team, (m.group_code is null) as is_knockout
  into r 
  from public.match_results mr 
  join public.matches m on m.id = mr.match_id
  where mr.match_id = p_match_id;
  
  if not found then return; end if;

  update public.predictions p
  set points_awarded = public.compute_match_points_v3(
        p.home_goals, p.away_goals, p.advancing_team,
        r.home_goals, r.away_goals, r.penalty_home, r.penalty_away,
        r.advancing_team,
        r.is_knockout
      ),
      updated_at = now()
  where p.match_id = p_match_id;

  perform public.recalculate_match_mvp_scores(p_match_id);
end;
$$;

grant execute on function public.compute_match_points_v3(int, int, text, int, int, int, int, text, boolean) to authenticated;
