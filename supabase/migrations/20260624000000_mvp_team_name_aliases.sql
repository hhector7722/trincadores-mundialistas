-- Alias de selecciones al puntuar MVP (FIFA "Bosnia and Herzegovina" vs porra "Bosnia & Herzegovina").

create or replace function public.normalize_mvp_team_token(value text)
returns text
language sql
immutable
as $$
  select trim(
    lower(
      case lower(trim(coalesce(value, '')))
        when 'bosnia and herzegovina' then 'bosnia & herzegovina'
        when 'bosnia-herzegovina' then 'bosnia & herzegovina'
        when 'bosnia herzegovina' then 'bosnia & herzegovina'
        when 'côte d''ivoire' then 'ivory coast'
        when 'cote d''ivoire' then 'ivory coast'
        when 'cabo verde' then 'cape verde'
        when 'korea republic' then 'south korea'
        when 'czechia' then 'czech republic'
        when 'ir iran' then 'iran'
        when 'türkiye' then 'turkey'
        when 'turkey' then 'turkey'
        when 'united states' then 'usa'
        when 'congo dr' then 'dr congo'
        when 'democratic republic of the congo' then 'dr congo'
        else lower(trim(coalesce(value, '')))
      end
    )
  );
$$;

create or replace function public.compute_mvp_points(
  pred_player text,
  pred_team text,
  res_player text,
  res_team text
) returns int
language sql
immutable
as $$
  select case
    when res_player is not null
      and public.normalize_mvp_player_token(pred_player) = public.normalize_mvp_player_token(res_player)
      and public.normalize_mvp_team_token(pred_team) = public.normalize_mvp_team_token(res_team)
    then public.mvp_prediction_points()
    else 0
  end;
$$;
