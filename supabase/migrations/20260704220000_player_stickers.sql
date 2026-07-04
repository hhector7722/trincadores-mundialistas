-- migration for player stickers

alter table public.team_squad_players
  add column if not exists sticker_url text,
  add column if not exists sticker_hash text;

-- Create storage bucket if it doesn't exist
insert into storage.buckets (id, name, public)
values ('stickers', 'stickers', true)
on conflict (id) do update set public = true;

-- Ensure RLS on objects
alter table storage.objects enable row level security;

-- Public read access for stickers
create policy "Public Access"
  on storage.objects for select
  using ( bucket_id = 'stickers' );

-- Service role can upload/update (the API uses service role key)
create policy "Service Role Upload"
  on storage.objects for insert
  with check ( bucket_id = 'stickers' );

create policy "Service Role Update"
  on storage.objects for update
  using ( bucket_id = 'stickers' );
