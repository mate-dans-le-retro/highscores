-- F10: cap scores at 10^15 - 1 (same ceiling as admin parseScore digits).
-- Stops an anon client from inserting an absurd pending score past the form.

alter table public.scores
  drop constraint if exists scores_score_check;

alter table public.scores
  add constraint scores_score_check
  check (score >= 0 and score < 1000000000000000);

alter table public.scores
  drop constraint if exists scores_detected_score_check;

alter table public.scores
  add constraint scores_detected_score_check
  check (
    detected_score is null
    or (detected_score >= 0 and detected_score < 1000000000000000)
  );
