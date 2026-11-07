-- How long the public "Nouveau record" takeover stays on screen (was 12 s hard-coded).
alter table public.settings
  add column new_record_duration_s integer not null default 12
    check (new_record_duration_s in (8, 12, 20));
