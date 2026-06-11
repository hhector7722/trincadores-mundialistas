-- Tablero de pronósticos de un partido para todos los trincadores del pool (tras kickoff / en juego).

create or replace function public.get_match_predictions_board(
  p_pool_id uuid,
  p_match_id uuid
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_viewer uuid := auth.uid();
  v_result jsonb;
begin
  if v_viewer is null then
    return null;
  end if;

  if not public.is_pool_member(p_pool_id, v_viewer) then
    return null;
  end if;

  if not public.can_view_peer_predictions(p_pool_id, p_match_id, v_viewer) then
    return null;
  end if;

  select jsonb_build_object(
    'home_team', m.home_team,
    'away_team', m.away_team,
    'rows', coalesce(
      (
        select jsonb_agg(row_data order by sort_label)
        from (
          select
            jsonb_build_object(
              'profile_id', p.id,
              'label', coalesce(p.display_name, p.username),
              'avatar_url', p.avatar_url,
              'home_goals', pred.home_goals,
              'away_goals', pred.away_goals,
              'mvp_player_name', mvp.player_name
            ) as row_data,
            coalesce(p.display_name, p.username) as sort_label
          from public.pool_members pm
          join public.profiles p on p.id = pm.profile_id
          left join public.predictions pred
            on pred.pool_id = p_pool_id
            and pred.match_id = p_match_id
            and pred.profile_id = p.id
          left join public.match_mvp_predictions mvp
            on mvp.pool_id = p_pool_id
            and mvp.match_id = p_match_id
            and mvp.profile_id = p.id
          where pm.pool_id = p_pool_id
            and (
              nullif(trim(coalesce(p.onboarding_completed_at::text, '')), '') is not null
              or nullif(trim(coalesce(p.avatar_url, '')), '') is not null
            )
        ) board_rows
      ),
      '[]'::jsonb
    )
  )
  into v_result
  from public.matches m
  where m.id = p_match_id;

  return v_result;
end;
$$;

revoke all on function public.get_match_predictions_board(uuid, uuid) from public;
grant execute on function public.get_match_predictions_board(uuid, uuid) to authenticated;
