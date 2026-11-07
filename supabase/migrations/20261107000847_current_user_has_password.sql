-- Whether the signed-in Auth user already has a password.
--
-- updateUser({ password }) on a Google-only account sets auth.users.encrypted_password
-- but does not add an email identity. Client-side checks on identities therefore stay
-- false after a successful set, so the form keeps offering "set password" and a second
-- submit with the same value fails with same_password.

create or replace function public.current_user_has_password()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (
      select nullif(u.encrypted_password, '') is not null
      from auth.users u
      where u.id = (select auth.uid())
    ),
    false
  );
$$;

revoke all on function public.current_user_has_password() from public;
grant execute on function public.current_user_has_password() to authenticated;

comment on function public.current_user_has_password() is
  'True when auth.users.encrypted_password is set for auth.uid(); usable by any signed-in user for their own account.';
