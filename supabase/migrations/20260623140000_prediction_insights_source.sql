-- Fuente del insight: bsd | gemini | hybrid

alter table public.prediction_insights
  add column if not exists source_code text not null default 'bsd';

alter table public.prediction_insights
  add constraint prediction_insights_source_code_check
  check (source_code in ('bsd', 'gemini', 'hybrid'));

create index if not exists prediction_insights_source_code_idx
  on public.prediction_insights (source_code);
