-- Pending (and any other) score inserts must bump change_signals so the admin
-- queue updates over Realtime without a hard refresh. The public screen still
-- only reads approved rows via public_scores(); a pending bump only triggers a
-- harmless refetch there.

drop trigger if exists scores_signal_insert on public.scores;
drop trigger if exists scores_signal_update on public.scores;
drop trigger if exists scores_signal_delete on public.scores;

create trigger scores_signal_insert
  after insert on public.scores
  for each row
  execute function public.signal_change('scores');

create trigger scores_signal_update
  after update on public.scores
  for each row
  execute function public.signal_change('scores');

create trigger scores_signal_delete
  after delete on public.scores
  for each row
  execute function public.signal_change('scores');
