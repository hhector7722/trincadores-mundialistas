create table quiz_jersey_pick_bank (
  id uuid primary key default gen_random_uuid(),
  target_date date not null unique,
  status text not null default 'pending' check (status in ('pending','ready','used','failed')),
  prompt text,
  match_reference jsonb,
  correct_option jsonb,
  distractor_options jsonb,
  source_notes text,
  generated_at timestamptz,
  created_at timestamptz not null default now()
);

alter table quiz_jersey_pick_bank enable row level security;
