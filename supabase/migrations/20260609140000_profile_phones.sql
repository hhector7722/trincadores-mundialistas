-- Telefono de participante en profiles + auth.users (login por movil)

alter table public.profiles
  add column if not exists phone text;

comment on column public.profiles.phone is
  'Movil nacional ES (9 digitos, sin prefijo +34). Unico por participante.';

create unique index if not exists profiles_phone_unique
  on public.profiles (phone)
  where phone is not null;

-- Backfill profiles (9 digitos nacionales)
update public.profiles as p
set phone = v.phone
from (
  values
    ('teixeira', '605187355'),
    ('nacho', '639485610'),
    ('damo', '649224147'),
    ('solskjaer', '601353725'),
    ('gabri', '605442296'),
    ('oro', '626155719'),
    ('sanfe', '670658044'),
    ('gonza', '606021566'),
    ('dani', '697989788'),
    ('hector', '647229309')
) as v(username, phone)
where p.username = v.username;

-- Backfill auth.users (E.164 +34)
update auth.users as u
set
  phone = '+34' || p.phone,
  phone_confirmed_at = coalesce(u.phone_confirmed_at, now())
from public.profiles as p
where p.id = u.id
  and p.phone is not null;
