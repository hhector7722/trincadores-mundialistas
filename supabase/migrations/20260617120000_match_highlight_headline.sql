-- Titulares cortos de partido (BSD social / incidentes) para hero highlights.

alter table public.matches
  add column if not exists highlight_headline text,
  add column if not exists highlight_headline_source text;

comment on column public.matches.highlight_headline is
  'Titular corto del partido para UI de highlights (BSD social o incidentes).';

comment on column public.matches.highlight_headline_source is
  'Fuente del titular: bsd_social | bsd_incidents.';
