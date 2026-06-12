-- Resúmenes DAZN ES (@DAZNES): prioridad máxima sobre FIFA y Teledeporte.

insert into public.data_source_registry (code, name, base_url, license) values
  ('youtube_dazn_es', 'DAZN ES YouTube', 'https://www.youtube.com/@DAZNES', null)
on conflict (code) do nothing;

alter table public.matches
  drop constraint if exists matches_highlight_source_check;

alter table public.matches
  add constraint matches_highlight_source_check
  check (
    highlight_source is null
    or highlight_source in ('youtube_dazn_es', 'youtube_fifa', 'youtube_rtve_teledeporte')
  );
