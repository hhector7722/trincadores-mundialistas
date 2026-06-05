-- Fase 0b.2: cierre RLS pool_members + notifications + default role

-- ---------------------------------------------------------------------------
-- 1. Default explicito en pool_members.role (post-rename enum 0b.1)
-- ---------------------------------------------------------------------------
alter table public.pool_members alter column role drop default;
alter table public.pool_members
  alter column role set default 'player'::public.pool_member_role;

-- ---------------------------------------------------------------------------
-- 2. pool_members_insert: solo admin/owner del pool (sin auto-owner abierto)
-- ---------------------------------------------------------------------------
drop policy if exists pool_members_insert on public.pool_members;

create policy pool_members_insert on public.pool_members
  for insert
  to authenticated
  with check (public.is_pool_admin(pool_id));

-- ---------------------------------------------------------------------------
-- 3. notifications: sin INSERT directo por cliente autenticado
-- ---------------------------------------------------------------------------
drop policy if exists notifications_insert on public.notifications;

revoke insert on public.notifications from authenticated;