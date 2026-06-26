-- Repriorizar fuentes de resúmenes: FIFA > Replay > Teledeporte > DAZN ES
-- DAZN ES deshabilita la reproducción en sitios web embebidos.

insert into public.data_source_registry (code, name, base_url, license) values
  ('youtube_replay', 'Replay YouTube', 'https://www.youtube.com/@Replay', null)
on conflict (code) do nothing;

alter table public.matches
  drop constraint if exists matches_highlight_source_check;

alter table public.matches
  add constraint matches_highlight_source_check
  check (
    highlight_source is null
    or highlight_source in ('youtube_dazn_es', 'youtube_fifa', 'youtube_replay', 'youtube_rtve_teledeporte')
  );
