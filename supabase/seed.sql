-- Jeux de départ pour le développement local (supabase db reset).
insert into public.games (slug, name, machine, score_order, score_unit, position)
values
  ('tetris', 'Tetris', 'Game Boy', 'desc', 'pts', 1),
  ('duck-hunt', 'Duck Hunt', 'NES', 'desc', 'pts', 2),
  ('super-mario-bros', 'Super Mario Bros.', 'NES', 'desc', 'pts', 3),
  ('guitar-hero', 'Guitar Hero', 'PS2', 'desc', 'pts', 4)
on conflict (slug) do nothing;
