-- Fuente del resumen enlazado (FIFA oficial > Teledeporte RTVE fallback).

insert into public.data_source_registry (code, name, base_url, license) values
  ('youtube_rtve_teledeporte', 'Teledeporte RTVE YouTube', 'https://www.youtube.com/@TeledeporteRTVE', null)
on conflict (code) do nothing;

alter table public.matches
  add column if not exists highlight_source text;

alter table public.matches
  drop constraint if exists matches_highlight_source_check;

alter table public.matches
  add constraint matches_highlight_source_check
  check (
    highlight_source is null
    or highlight_source in ('youtube_fifa', 'youtube_rtve_teledeporte')
  );

update public.matches
set highlight_source = 'youtube_fifa'
where highlight_youtube_id is not null
  and highlight_source is null;
