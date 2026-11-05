-- The public screen header (title and logo) takes a lot of room: hidden by default.
alter table public.settings
  add column show_header boolean not null default false;
