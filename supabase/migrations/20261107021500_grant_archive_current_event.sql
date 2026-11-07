-- F5: archive_current_event revoked execute from public/anon without granting
-- authenticated. Admins call it via PostgREST as the authenticated role; the
-- function body already enforces public.is_admin().

revoke all on function public.archive_current_event(text) from public;
grant execute on function public.archive_current_event(text) to authenticated;
