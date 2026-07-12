-- Propagar ganadores de cuartos a semifinales (Jul 2026)

update public.matches
set home_team = 'France', away_team = 'Spain', status = 'scheduled'
where match_number = 101;

update public.matches
set home_team = 'England', away_team = 'Argentina', status = 'scheduled'
where match_number = 102;
