-- Telefono de Aitor (nuevo participante)

update public.profiles as p
set phone = '690885999'
where p.username = 'aitor';

update auth.users as u
set
  phone = '+34690885999',
  phone_confirmed_at = coalesce(u.phone_confirmed_at, now())
from public.profiles as p
where p.id = u.id
  and p.username = 'aitor'
  and p.phone is not null;
