-- Grants Data API para tablas catálogo OpenFootball

grant all on public.competitions to service_role;
grant all on public.tournament_stages to service_role;
grant all on public.host_cities to service_role;
grant all on public.teams to service_role;

grant select on public.competitions to authenticated;
grant select on public.tournament_stages to authenticated;
grant select on public.host_cities to authenticated;
grant select on public.teams to authenticated;
