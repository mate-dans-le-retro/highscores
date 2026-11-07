-- F8: demote must lock admin rows so two concurrent demotes cannot both
-- pass the "last admin" check and wipe every volunteer.

create or replace function public.set_user_admin(
  target_user_id uuid,
  make_admin boolean
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller uuid := (select auth.uid());
  admin_count integer;
begin
  if caller is null or not public.is_admin() then
    raise exception 'not authorized' using errcode = '42501';
  end if;

  if not exists (select 1 from auth.users u where u.id = target_user_id) then
    raise exception 'user not found' using errcode = 'P0002';
  end if;

  if make_admin then
    insert into public.admins (user_id)
    values (target_user_id)
    on conflict (user_id) do nothing;
    return;
  end if;

  if target_user_id = caller then
    raise exception 'cannot demote yourself' using errcode = 'P0001';
  end if;

  -- Serialize demotes: lock every admin row before counting and deleting.
  perform 1 from public.admins for update;

  select count(*)::integer into admin_count from public.admins;
  if admin_count <= 1 then
    raise exception 'cannot demote the last admin' using errcode = 'P0001';
  end if;

  delete from public.admins where user_id = target_user_id;
end;
$$;

revoke all on function public.set_user_admin(uuid, boolean) from public;
grant execute on function public.set_user_admin(uuid, boolean) to authenticated;

comment on function public.set_user_admin(uuid, boolean) is
  'Promote or demote a volunteer; only callable by public.is_admin(). Demote locks admins for update.';
