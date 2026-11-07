-- G9: when archiving the current event, leftover non-approved scores must not
-- stay pending (approving them later would attach them to the archived event
-- and miss the new board). Reject them in the same transaction with a clear
-- reason; do not move them to the new event.

create or replace function public.archive_current_event(new_event_name text)
returns uuid
language plpgsql
set search_path = ''
as $$
declare
  current_id uuid;
  new_id uuid;
begin
  if not public.is_admin() then
    raise exception 'Only volunteers can archive an event'
      using errcode = '42501';
  end if;

  select id into current_id from public.events where archived_at is null;
  if current_id is null then
    raise exception 'No current event to archive'
      using errcode = 'P0002';
  end if;

  update public.scores
  set
    status = 'rejected',
    rejection_reason = 'Édition archivée',
    reviewed_at = now(),
    reviewed_by = auth.uid()
  where event_id = current_id
    and status is distinct from 'approved';

  update public.events set archived_at = now() where id = current_id;
  insert into public.events (name) values (new_event_name) returning id into new_id;
  return new_id;
end;
$$;

-- Match #70: authenticated volunteers call this RPC; body still enforces is_admin().
revoke all on function public.archive_current_event(text) from public;
grant execute on function public.archive_current_event(text) to authenticated;
