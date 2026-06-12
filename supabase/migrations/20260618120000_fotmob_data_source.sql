-- FotMob: alineaciones confirmadas, MVP FIFA (playerOfTheMatch) y mapeo de fixtures WC2026.

insert into public.data_source_registry (code, name, base_url, license) values
  ('fotmob', 'FotMob', 'https://www.fotmob.com', 'Unofficial public API / fair use')
on conflict (code) do nothing;
