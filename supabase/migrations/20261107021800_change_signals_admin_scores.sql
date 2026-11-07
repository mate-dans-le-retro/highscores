-- F12: pending score writes must not bump the public `scores` topic.
-- Admins listen to `admin_scores` (RLS: is_admin only). The public still
-- hears approved score changes on `scores` only, so pending activity timing
-- no longer leaks through Realtime to anon.

alter table public.change_signals
  drop constraint if exists change_signals_topic_check;

alter table public.change_signals
  add constraint change_signals_topic_check
  check (topic in ('games', 'scores', 'settings', 'admin_scores'));

insert into public.change_signals (topic)
values ('admin_scores')
on conflict (topic) do nothing;

drop policy if exists "anyone can read change signals" on public.change_signals;

create policy "anyone can read public change signals"
  on public.change_signals for select
  to anon, authenticated
  using (topic in ('games', 'scores', 'settings'));

create policy "admins can read admin change signals"
  on public.change_signals for select
  to authenticated
  using (topic = 'admin_scores' and (select public.is_admin()));

drop trigger if exists scores_signal_insert on public.scores;
drop trigger if exists scores_signal_update on public.scores;
drop trigger if exists scores_signal_delete on public.scores;

-- Public screen: approved rows only (same as before 20261106220000).
create trigger scores_signal_insert_public
  after insert on public.scores
  for each row when (new.status = 'approved')
  execute function public.signal_change('scores');

create trigger scores_signal_update_public
  after update on public.scores
  for each row when (old.status = 'approved' or new.status = 'approved')
  execute function public.signal_change('scores');

create trigger scores_signal_delete_public
  after delete on public.scores
  for each row when (old.status = 'approved')
  execute function public.signal_change('scores');

-- Admin queue: every score write.
create trigger scores_signal_insert_admin
  after insert on public.scores
  for each row
  execute function public.signal_change('admin_scores');

create trigger scores_signal_update_admin
  after update on public.scores
  for each row
  execute function public.signal_change('admin_scores');

create trigger scores_signal_delete_admin
  after delete on public.scores
  for each row
  execute function public.signal_change('admin_scores');
