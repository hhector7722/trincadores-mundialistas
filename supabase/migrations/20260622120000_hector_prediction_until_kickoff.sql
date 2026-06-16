-- Hector puede editar pronósticos (y MVP) hasta el pitido; resto mantiene T-5 min.

create or replace function public.prediction_edit_allowed(p_match_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.matches m
    where m.id = p_match_id
      and m.status = 'scheduled'
      and now() < (
        m.kickoff_at - case
          when exists (
            select 1
            from public.profiles p
            where p.id = auth.uid()
              and lower(p.username) = 'hector'
          )
          then interval '0 minutes'
          else interval '5 minutes'
        end
      )
  );
$$;
