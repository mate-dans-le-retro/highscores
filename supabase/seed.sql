-- Starter games for local development (supabase db reset). The migrations
-- already created the current event and the settings row.
insert into public.games (slug, name, short_label, console, score_type, score_order, score_unit, position)
values
  ('tetris', 'Tetris', 'TET', 'Game Boy', 'points', 'desc', 'pts', 1),
  ('duck-hunt', 'Duck Hunt', 'DH', 'NES', 'points', 'desc', 'pts', 2),
  ('super-mario-bros', 'Super Mario Bros.', 'SMB', 'NES', 'points', 'desc', 'pts', 3),
  ('guitar-hero', 'Guitar Hero', 'GH', 'PS2', 'points', 'desc', 'pts', 4),
  ('mario-kart', 'Super Mario Kart', 'SMK', 'Super NES', 'time', 'asc', null, 5)
on conflict (slug) do nothing;

insert into public.game_event_setups (event_id, game_id, station_label)
select public.current_event_id(), id, 'Étage'
from public.games
where slug = 'duck-hunt'
on conflict do nothing;
