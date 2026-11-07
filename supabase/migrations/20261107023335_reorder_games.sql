-- G19: reorder games in one statement so a mid-list failure cannot leave
-- duplicate or half-applied positions (Promise.all of per-row updates).

create or replace function public.reorder_games(ordered_ids uuid[])
returns void
language plpgsql
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Only volunteers can reorder games'
      using errcode = '42501';
  end if;

  update public.games as g
  set position = u.ord::integer
  from unnest(ordered_ids) with ordinality as u(id, ord)
  where g.id = u.id;
end;
$$;

comment on function public.reorder_games(uuid[]) is
  'Set games.position from the given id order (1-based); only callable by public.is_admin().';

revoke all on function public.reorder_games(uuid[]) from public;
grant execute on function public.reorder_games(uuid[]) to authenticated;
