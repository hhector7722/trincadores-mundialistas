-- Fix: Argentina vs Suiza (cuartos de final, 12 julio 2026)
-- Resultado 90 min: 1-1, prórroga: Argentina gana 3-1
-- El resultado estaba almacenado como 3-1 (incluyendo goles en prórroga)
-- Debe ser home_goals=1, away_goals=1, advancing_team='home'

do $$
declare
  r record;
begin
  for r in
    select m.id, md.pool_id
    from public.matches m
    join public.matchdays md on md.id = m.matchday_id
    where m.home_team = 'Argentina'
      and m.away_team = 'Switzerland'
      and m.group_code is null
      and m.kickoff_at::date = '2026-07-12'
  loop
    insert into public.match_results (match_id, home_goals, away_goals, advancing_team, recorded_at)
    values (r.id, 1, 1, 'home', now())
    on conflict (match_id) do update set
      home_goals = 1,
      away_goals = 1,
      advancing_team = 'home',
      recorded_at = now();

    update public.matches
    set status = 'finished'
    where id = r.id and status != 'finished';

    perform public.recalculate_match_scores(r.id);
    perform public.rebuild_pool_member_scores(r.pool_id);

    raise notice 'Partido Argentina vs Switzerland (%) actualizado. Pool % recalculado.', r.id, r.pool_id;
  end loop;
end $$;
