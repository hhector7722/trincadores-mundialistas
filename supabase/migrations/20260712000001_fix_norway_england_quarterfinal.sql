-- Fix: Noruega vs Inglaterra (cuartos de final, 11 julio 2026)
-- Resultado 90 min: 1-1, prórroga: Inglaterra gana 2-1
-- El resultado estaba almacenado como 1-2 (incluyendo gol en prórroga)
-- Debe ser home_goals=1, away_goals=1, advancing_team='away'

do $$
declare
  r record;
  v_pool_id uuid;
begin
  -- Buscar el partido Norway vs England en cuartos de final (sin group_code) del 11 julio
  for r in
    select m.id, m.home_team, m.away_team, m.kickoff_at, m.matchday_id, md.pool_id
    from public.matches m
    join public.matchdays md on md.id = m.matchday_id
    where m.home_team = 'Norway'
      and m.away_team = 'England'
      and m.group_code is null
      and m.kickoff_at::date = '2026-07-11'
  loop
    -- Actualizar el resultado oficial: 1-1 en 90 min, advancing Inglaterra
    insert into public.match_results (match_id, home_goals, away_goals, advancing_team, recorded_at)
    values (r.id, 1, 1, 'away', now())
    on conflict (match_id) do update set
      home_goals = 1,
      away_goals = 1,
      advancing_team = 'away',
      recorded_at = now();
    
    -- Marcar partido como finalizado si no lo está
    update public.matches
    set status = 'finished'
    where id = r.id and status != 'finished';

    -- Recalcular puntos de todos los pronósticos de este partido
    perform public.recalculate_match_scores(r.id);

    -- Reconstruir puntuaciones del pool
    perform public.rebuild_pool_member_scores(r.pool_id);

    raise notice 'Partido Norway vs England (%) actualizado. Pool % recalculado.', r.id, r.pool_id;
  end loop;

  if not found then
    raise notice 'No se encontró el partido Norway vs England del 11 julio 2026.';
  end if;
end $$;
