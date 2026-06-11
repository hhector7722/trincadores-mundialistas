-- Resúmenes FIFA (YouTube @fifa) enlazados a partidos operativos.

insert into public.data_source_registry (code, name, base_url, license) values
  ('youtube_fifa', 'FIFA YouTube', 'https://www.youtube.com/@fifa', null)
on conflict (code) do nothing;

alter table public.matches
  add column if not exists highlight_youtube_id text,
  add column if not exists highlight_published_at timestamptz;

create index if not exists matches_highlight_published_idx
  on public.matches (highlight_published_at desc nulls last)
  where highlight_youtube_id is not null;
