-- Elimina participante solskjaer (auth + perfil + membresía en cascada)

delete from auth.users
where id in (
  select id from public.profiles where username = 'solskjaer'
);
