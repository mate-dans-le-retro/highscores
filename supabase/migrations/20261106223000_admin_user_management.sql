-- Admin user management: list Auth users and promote / demote volunteers.
--
-- Sign-ups create an Auth user only. Rights still come only from public.admins
-- (fail-closed). These RPCs are security definer and refuse anyone who is not
-- already an admin; demotion cannot remove the caller's own admin row or the
-- last remaining admin.

create or replace function public.list_registered_users()
returns table (
  id uuid,
  email text,
  created_at timestamptz,
  is_admin boolean,
  has_password boolean,
  providers text[]
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'not authorized' using errcode = '42501';
  end if;

  return query
  select
    u.id,
    u.email::text,
    u.created_at,
    exists (
      select 1 from public.admins a where a.user_id = u.id
    ) as is_admin,
    coalesce(nullif(u.encrypted_password, '') is not null, false) as has_password,
    coalesce(
      (
        select array_agg(distinct i.provider order by i.provider)
        from auth.identities i
        where i.user_id = u.id
      ),
      '{}'::text[]
    ) as providers
  from auth.users u
  order by u.created_at desc;
end;
$$;

revoke all on function public.list_registered_users() from public;
grant execute on function public.list_registered_users() to authenticated;

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

  select count(*)::integer into admin_count from public.admins;
  if admin_count <= 1 then
    raise exception 'cannot demote the last admin' using errcode = 'P0001';
  end if;

  delete from public.admins where user_id = target_user_id;
end;
$$;

revoke all on function public.set_user_admin(uuid, boolean) from public;
grant execute on function public.set_user_admin(uuid, boolean) to authenticated;

comment on function public.list_registered_users() is
  'Auth users with admin flag; only callable by public.is_admin().';

comment on function public.set_user_admin(uuid, boolean) is
  'Promote or demote a volunteer; only callable by public.is_admin().';
