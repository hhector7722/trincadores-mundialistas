-- Fase 1f: acceso cerrado alias + codigo unico

alter table public.profiles
  add column if not exists access_code_rotated_at timestamptz,
  add column if not exists is_active boolean not null default true;

-- Sin auto-registro: el perfil se precarga por bootstrap admin
drop policy if exists profiles_insert on public.profiles;

-- Registro por invitacion desactivado
revoke all on function public.consume_invite_and_join(text) from public;
revoke all on function public.consume_invite_and_join(text) from anon;
revoke all on function public.consume_invite_and_join(text) from authenticated;
