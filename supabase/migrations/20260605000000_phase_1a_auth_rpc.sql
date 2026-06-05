-- Fase 1a: registro por codigo de invitacion (SECURITY DEFINER)

create or replace function public.consume_invite_and_join(p_code text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile uuid := auth.uid();
  v_invite public.invite_codes%rowtype;
begin
  if v_profile is null then
    raise exception 'not_authenticated';
  end if;

  if p_code is null or length(trim(p_code)) = 0 then
    raise exception 'invalid_invite_code';
  end if;

  select *
  into v_invite
  from public.invite_codes ic
  where upper(trim(ic.code)) = upper(trim(p_code))
  for update;

  if not found then
    raise exception 'invalid_invite_code';
  end if;

  if v_invite.expires_at is not null and v_invite.expires_at < now() then
    raise exception 'invite_expired';
  end if;

  if v_invite.max_uses is not null and v_invite.uses_count >= v_invite.max_uses then
    raise exception 'invite_exhausted';
  end if;

  if exists (
    select 1
    from public.pool_members pm
    where pm.pool_id = v_invite.pool_id
      and pm.profile_id = v_profile
  ) then
    raise exception 'already_member';
  end if;

  insert into public.pool_members (pool_id, profile_id, role)
  values (v_invite.pool_id, v_profile, 'player'::public.pool_member_role);

  update public.invite_codes
  set uses_count = uses_count + 1
  where id = v_invite.id;

  return v_invite.pool_id;
end;
$$;

revoke all on function public.consume_invite_and_join(text) from public;
grant execute on function public.consume_invite_and_join(text) to authenticated;
