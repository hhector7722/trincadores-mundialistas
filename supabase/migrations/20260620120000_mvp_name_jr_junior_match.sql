-- Alias Jr/Junior al puntuar MVP (FIFA "Vinicius Jr" vs porra "Vinicius Junior").

create or replace function public.normalize_mvp_player_token(value text)
returns text
language sql
immutable
as $$
  select trim(
    regexp_replace(
      lower(regexp_replace(trim(coalesce(value, '')), '[^a-zA-Z0-9]+', ' ', 'g')),
      '\m(jr)\M',
      'junior',
      'g'
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
      and lower(trim(pred_team)) = lower(trim(res_team))
    then public.mvp_prediction_points()
    else 0
  end;
$$;
