-- Demo data for the real Supabase database, shared by preprod and production.
--
-- Not a migration and not run by `supabase db reset`: run it by hand (see
-- README.md in this folder), and remove its rows with demo-clean.sql before
-- the event. Every demo game is visible to players in the form until then.
--
-- How demo rows are marked
--   Every row created here has a fixed id starting with
--     de30de30-de30-0000-
--   (then 0001- for events, 0002- for games, 0003- for scores). Its third
--   group, 0000, is UUID version 0: gen_random_uuid() and the app's
--   randomUuid() only make version 4 ids (third group 4xxx), so no real row
--   can carry this prefix. Station labels (game_event_setups) have no id of
--   their own: the demo ones are those whose game_id is a demo game. Slugs
--   (demo-…) and the photo folder (photos/demo/) only help humans: the
--   cleanup trusts the id prefix and nothing else.
--
-- What it creates (in the spirit of src/lib/data/mock/seed.ts)
--   - 2 archived events: "Novembre 2025" and "Weekend d'avril 2026".
--   - 8 games, slugs demo-…, positions 901 to 908 (after the real games):
--     Tetris (few current scores, a rejected one), Duck Hunt (past records
--     only), Super Mario Bros. (a nameless score), Guitar Hero (dense past top
--     + current scores under it: the 5+5 layout), Pac-Man, Mario Kart (times,
--     lowest wins), Space Invaders (visible, no score) and Street Fighter II
--     (hidden, with a score).
--   - Station labels per event (Duck Hunt: "Salon", then "Tournoi", now
--     "Étage").
--   - 43 scores: approved, anonymous (kept off screen), nameless, 3 pending
--     (one of them a free "Un autre jeu" submission, another a new event
--     record) and 1 rejected. Past ones are in the demo events; the others
--     are in the real current event, dated from now(): yesterday, earlier
--     today and less than an hour ago.
--
-- What it never touches
--   The settings row (screen mode, durations, rows), real games, real scores,
--   and the current event row: it only reads its id. The schema allows a
--   single current event, so the demo scores "of this event" go into the real
--   one, under demo ids. Triggers bump change_signals, so open screens
--   refresh, as with any change made in the admin.
--
-- Running it again creates no duplicate: every insert is an upsert on the
-- fixed id, which puts the demo rows back in their initial state (pending
-- submissions pending again, dates relative to now() refreshed).
--
-- Photos: SQL cannot upload files. A score points to photos/demo/<name>.png
-- only when that file is already in the bucket (demo-photos.ps1 uploads
-- them); otherwise it has no photo and the screen shows its placeholder. Run
-- this script again after uploading the photos to link them.

begin;

-- ---------------------------------------------------------------------------
-- Helpers, in pg_temp: they vanish with the session and change no schema.
-- ---------------------------------------------------------------------------

-- de30de30-de30-0000-<kind>-<n>: kind 1 = event, 2 = game, 3 = score.
create or replace function pg_temp.demo_id(kind integer, n integer)
returns uuid
language sql
immutable
as $$
  select format(
    'de30de30-de30-0000-%s-%s',
    lpad(kind::text, 4, '0'),
    lpad(n::text, 12, '0')
  )::uuid;
$$;

create or replace function pg_temp.demo_event_id(event_key text)
returns uuid
language sql
stable
as $$
  select case event_key
    when 'current' then public.current_event_id()
    when '2025-11' then pg_temp.demo_id(1, 1)
    when '2026-04' then pg_temp.demo_id(1, 2)
  end;
$$;

do $$
begin
  if public.current_event_id() is null then
    raise exception 'There is no current event (events.archived_at is null): nothing was inserted.';
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- Events: two archived editions. The current one is the real event.
-- ---------------------------------------------------------------------------
insert into public.events (id, name, created_at, archived_at)
values
  (pg_temp.demo_id(1, 1), 'Novembre 2025',
    '2025-11-08 09:00+01', '2025-11-09 19:00+01'),
  (pg_temp.demo_id(1, 2), 'Weekend d''avril 2026',
    '2026-04-11 09:00+02', '2026-04-12 20:00+02')
on conflict (id) do update set
  name = excluded.name,
  created_at = excluded.created_at,
  archived_at = excluded.archived_at;

-- ---------------------------------------------------------------------------
-- Games
-- ---------------------------------------------------------------------------
create temp table demo_seed_games (
  key text primary key,
  n integer not null unique,
  name text not null,
  short_label text not null,
  console text not null,
  score_type public.score_type not null default 'points',
  score_order public.score_order not null default 'desc',
  score_unit text default 'pts',
  visible boolean not null default true
) on commit drop;

insert into demo_seed_games (key, n, name, short_label, console)
values
  ('tetris', 1, 'Tetris', 'TET', 'Game Boy'),
  ('duck-hunt', 2, 'Duck Hunt', 'DH', 'NES'),
  ('super-mario-bros', 3, 'Super Mario Bros.', 'SMB', 'NES'),
  ('guitar-hero', 4, 'Guitar Hero', 'GH', 'PS2'),
  ('pac-man', 5, 'Pac-Man', 'PAC', 'Arcade'),
  ('space-invaders', 7, 'Space Invaders', 'SI', 'Arcade');

insert into demo_seed_games
  (key, n, name, short_label, console, score_type, score_order, score_unit)
values
  ('mario-kart', 6, 'Mario Kart', 'MK', 'Super NES', 'time', 'asc', null);

insert into demo_seed_games (key, n, name, short_label, console, visible)
values
  ('street-fighter-2', 8, 'Street Fighter II', 'SF2', 'Super NES', false);

do $$
declare
  clash text;
begin
  select string_agg(g.slug, ', ') into clash
  from public.games g
  join demo_seed_games d on g.slug = 'demo-' || d.key
  where g.id <> pg_temp.demo_id(2, d.n);
  if clash is not null then
    raise exception 'These slugs belong to games that are not demo data: %. Nothing was inserted.', clash;
  end if;
end;
$$;

insert into public.games (
  id, slug, name, short_label, console, score_type, score_order, score_unit,
  visible, position, cover_path
)
select
  pg_temp.demo_id(2, n), 'demo-' || key, name, short_label, console,
  score_type, score_order, score_unit, visible, 900 + n, null
from demo_seed_games
on conflict (id) do update set
  slug = excluded.slug,
  name = excluded.name,
  short_label = excluded.short_label,
  console = excluded.console,
  score_type = excluded.score_type,
  score_order = excluded.score_order,
  score_unit = excluded.score_unit,
  visible = excluded.visible,
  position = excluded.position,
  cover_path = excluded.cover_path;

create or replace function pg_temp.demo_game_id(game_key text)
returns uuid
language sql
stable
as $$
  select pg_temp.demo_id(2, d.n) from demo_seed_games d where d.key = game_key;
$$;

-- ---------------------------------------------------------------------------
-- Station labels: Duck Hunt moved between events, its April record keeps
-- "Tournoi".
-- ---------------------------------------------------------------------------
insert into public.game_event_setups (event_id, game_id, station_label)
select pg_temp.demo_event_id(v.event_key), pg_temp.demo_game_id(v.game_key), v.label
from (
  values
    ('2025-11', 'duck-hunt', 'Salon'),
    ('2026-04', 'duck-hunt', 'Tournoi'),
    ('2026-04', 'guitar-hero', 'Scène'),
    ('2026-04', 'tetris', 'Cave'),
    ('current', 'duck-hunt', 'Étage'),
    ('current', 'tetris', 'Borne 3'),
    ('current', 'guitar-hero', 'Scène'),
    ('current', 'super-mario-bros', 'Salon'),
    ('current', 'mario-kart', null),
    ('current', 'pac-man', 'Borne 1'),
    ('current', 'space-invaders', 'Arcade')
) as v (event_key, game_key, label)
on conflict (event_id, game_id) do update set
  station_label = excluded.station_label;

-- ---------------------------------------------------------------------------
-- Photos already uploaded to photos/demo/ (see demo-photos.ps1).
-- ---------------------------------------------------------------------------
create temp table demo_seed_photos (name text primary key) on commit drop;

do $$
begin
  insert into demo_seed_photos (name)
  select o.name from storage.objects o
  where o.bucket_id = 'photos' and o.name like 'demo/%';
exception when insufficient_privilege or undefined_table then
  raise notice 'Cannot read storage.objects: the demo scores get no photo.';
end;
$$;

-- ---------------------------------------------------------------------------
-- Scores
-- ---------------------------------------------------------------------------
-- Current event: minutes_ago, relative to now(). Past events: dated.
create or replace function pg_temp.demo_score(
  n integer,
  event_key text,
  game_key text,
  player_name text,
  score bigint,
  minutes_ago integer default null,
  dated timestamptz default null,
  photo text default 'novembre',
  display_on_screen boolean default true,
  status public.score_status default 'approved',
  source public.score_source default 'player',
  instagram_consent boolean default false,
  instagram_handle text default null,
  custom_game_name text default null,
  rejection_reason text default null
)
returns void
language sql
as $$
  insert into public.scores (
    id, event_id, game_id, custom_game_name, player_name, score,
    photo_path, thumb_path, display_on_screen, instagram_consent,
    instagram_handle, detected_game_id, detected_score, status, source,
    rejection_reason, instagram_post_id, created_at, reviewed_at, reviewed_by
  )
  select
    pg_temp.demo_id(3, n),
    pg_temp.demo_event_id(event_key),
    pg_temp.demo_game_id(game_key),
    custom_game_name,
    player_name,
    score,
    (select p.name from demo_seed_photos p where p.name = 'demo/' || photo || '.png'),
    null,
    display_on_screen,
    instagram_consent,
    instagram_handle,
    null,
    null,
    status,
    source,
    rejection_reason,
    null,
    t.created_at,
    case status
      when 'approved' then t.created_at
      when 'rejected' then t.created_at + interval '5 minutes'
    end,
    null
  from (
    select coalesce(dated, now() - make_interval(mins => minutes_ago)) as created_at
  ) as t
  on conflict (id) do update set
    event_id = excluded.event_id,
    game_id = excluded.game_id,
    custom_game_name = excluded.custom_game_name,
    player_name = excluded.player_name,
    score = excluded.score,
    photo_path = excluded.photo_path,
    thumb_path = excluded.thumb_path,
    display_on_screen = excluded.display_on_screen,
    instagram_consent = excluded.instagram_consent,
    instagram_handle = excluded.instagram_handle,
    detected_game_id = excluded.detected_game_id,
    detected_score = excluded.detected_score,
    status = excluded.status,
    source = excluded.source,
    rejection_reason = excluded.rejection_reason,
    instagram_post_id = excluded.instagram_post_id,
    created_at = excluded.created_at,
    reviewed_at = excluded.reviewed_at,
    reviewed_by = excluded.reviewed_by;
$$;

do $$
begin
  -- Tetris: a few current scores, one from yesterday, one anonymous, one
  -- entered by a volunteer (no photo), a rejected submission, an April record.
  perform pg_temp.demo_score(1, 'current', 'tetris', 'Julie', 128400,
    minutes_ago => 95, photo => 'julie', instagram_consent => true);
  perform pg_temp.demo_score(2, 'current', 'tetris', 'Marc', 98200,
    minutes_ago => 180, photo => 'marc');
  perform pg_temp.demo_score(3, 'current', 'tetris', 'Sam', 87650,
    minutes_ago => 240, photo => null, source => 'admin');
  perform pg_temp.demo_score(4, 'current', 'tetris', 'Inès', 64300,
    minutes_ago => 12, photo => 'ines');
  perform pg_temp.demo_score(5, 'current', 'tetris', 'Thomas', 52100,
    minutes_ago => 26 * 60, photo => 'thomas');
  perform pg_temp.demo_score(6, 'current', 'tetris', 'Zoé', 41000,
    minutes_ago => 45, photo => 'zoe', display_on_screen => false);
  perform pg_temp.demo_score(7, '2026-04', 'tetris', 'Karim', 55000,
    dated => '2026-04-11 18:20+02', photo => 'avril');
  perform pg_temp.demo_score(42, 'current', 'tetris', 'Bastien', 999999,
    minutes_ago => 60, status => 'rejected',
    rejection_reason => 'Score illisible sur la photo');

  -- Duck Hunt: records of past events only.
  perform pg_temp.demo_score(8, '2025-11', 'duck-hunt', 'Nina', 28400,
    dated => '2025-11-08 15:00+01', photo => '2025');
  perform pg_temp.demo_score(9, '2026-04', 'duck-hunt', 'Marc', 31200,
    dated => '2026-04-11 17:00+02', photo => 'marc');
  perform pg_temp.demo_score(10, '2026-04', 'duck-hunt', 'Léa', 24500,
    dated => '2026-04-12 13:30+02', photo => 'lea');
  perform pg_temp.demo_score(11, '2026-04', 'duck-hunt', 'Omar', 19800,
    dated => '2026-04-11 19:45+02', photo => 'avril');

  -- Super Mario Bros.: a couple of current scores, one sent without a name.
  perform pg_temp.demo_score(12, 'current', 'super-mario-bros', 'Paul', 412300,
    minutes_ago => 300, photo => 'paul');
  perform pg_temp.demo_score(13, 'current', 'super-mario-bros', 'Camille', 298100,
    minutes_ago => 3);
  perform pg_temp.demo_score(14, 'current', 'super-mario-bros', null, 187500,
    minutes_ago => 7);

  -- Guitar Hero: dense past top, current scores in the middle of it and under
  -- it (5+5 with the default 10 rows and 5 all-time rows at least).
  perform pg_temp.demo_score(15, '2025-11', 'guitar-hero', 'Alex', 520000,
    dated => '2025-11-08 13:00+01', photo => '2025');
  perform pg_temp.demo_score(16, '2025-11', 'guitar-hero', 'Béa', 505000,
    dated => '2025-11-08 14:00+01', photo => '2025');
  perform pg_temp.demo_score(17, '2026-04', 'guitar-hero', 'Chris', 490000,
    dated => '2026-04-11 14:00+02', photo => 'avril');
  perform pg_temp.demo_score(18, 'current', 'guitar-hero', 'Hugo', 480000,
    minutes_ago => 360, photo => 'hugo');
  perform pg_temp.demo_score(19, 'current', 'guitar-hero', 'Iris', 470000,
    minutes_ago => 330);
  perform pg_temp.demo_score(20, '2026-04', 'guitar-hero', 'Dana', 460000,
    dated => '2026-04-11 15:00+02', photo => 'avril');
  perform pg_temp.demo_score(21, '2026-04', 'guitar-hero', 'Eli', 450000,
    dated => '2026-04-11 16:00+02', photo => 'avril');
  perform pg_temp.demo_score(22, '2026-04', 'guitar-hero', 'Fran', 440000,
    dated => '2026-04-11 17:00+02', photo => 'avril');
  perform pg_temp.demo_score(23, '2026-04', 'guitar-hero', 'Gus', 430000,
    dated => '2026-04-11 18:00+02', photo => 'avril');
  perform pg_temp.demo_score(24, '2026-04', 'guitar-hero', 'Hana', 420000,
    dated => '2026-04-11 19:00+02', photo => 'avril');
  perform pg_temp.demo_score(25, '2026-04', 'guitar-hero', 'Jo', 410000,
    dated => '2026-04-12 12:00+02', photo => 'avril');
  perform pg_temp.demo_score(26, '2026-04', 'guitar-hero', 'Kim', 400000,
    dated => '2026-04-12 13:00+02', photo => 'avril');
  perform pg_temp.demo_score(27, 'current', 'guitar-hero', 'Lou', 210000,
    minutes_ago => 120);
  perform pg_temp.demo_score(28, 'current', 'guitar-hero', 'Max', 195000,
    minutes_ago => 50);
  perform pg_temp.demo_score(29, 'current', 'guitar-hero', 'Noé', 180000,
    minutes_ago => 35);
  perform pg_temp.demo_score(30, 'current', 'guitar-hero', 'Ophélie', 165000,
    minutes_ago => 20, photo => 'anonyme', display_on_screen => false);
  perform pg_temp.demo_score(31, 'current', 'guitar-hero', 'Pia', 150000,
    minutes_ago => 8);
  -- Pending: approving it makes a new event record ("Nouveau record").
  perform pg_temp.demo_score(32, 'current', 'guitar-hero', 'Antoine', 485000,
    minutes_ago => 5, photo => 'antoine', status => 'pending',
    instagram_consent => true, instagram_handle => 'demo.antoine.mdlr');

  -- Pac-Man: no cover (trigramme), current and past scores, one anonymous.
  perform pg_temp.demo_score(33, 'current', 'pac-man', 'Nora', 96720,
    minutes_ago => 210, photo => 'nora');
  perform pg_temp.demo_score(34, '2026-04', 'pac-man', 'Rémi', 88100,
    dated => '2026-04-11 20:00+02', photo => 'avril');
  perform pg_temp.demo_score(35, 'current', 'pac-man', 'Sacha', 72400,
    minutes_ago => 15, photo => 'anonyme', display_on_screen => false);

  -- Mario Kart: times in milliseconds, lowest wins (92480 = 1'32"48).
  perform pg_temp.demo_score(36, 'current', 'mario-kart', 'Yanis', 92480,
    minutes_ago => 150, photo => 'yanis');
  perform pg_temp.demo_score(37, 'current', 'mario-kart', 'Lina', 95100,
    minutes_ago => 25 * 60, photo => 'lina');
  perform pg_temp.demo_score(38, '2026-04', 'mario-kart', 'Tom', 98200,
    dated => '2026-04-12 14:00+02', photo => 'avril');
  perform pg_temp.demo_score(39, 'current', 'mario-kart', 'Éva', 101500,
    minutes_ago => 30);
  -- Pending, sent without a name: a new best time.
  perform pg_temp.demo_score(43, 'current', 'mario-kart', null, 90120,
    minutes_ago => 4, status => 'pending');

  -- Space Invaders: visible, no score at all.

  -- Street Fighter II: hidden game, its score only shows in the admin.
  perform pg_temp.demo_score(40, 'current', 'street-fighter-2', 'Ryu', 120000,
    minutes_ago => 240);

  -- "Un autre jeu": free game name, pending, no game yet.
  perform pg_temp.demo_score(41, 'current', null, 'Chloé', 15000,
    minutes_ago => 10, photo => 'chloe', status => 'pending',
    custom_game_name => 'Bomberman');
end;
$$;

drop function pg_temp.demo_score;
drop function pg_temp.demo_game_id;
drop function pg_temp.demo_event_id;
drop function pg_temp.demo_id;

commit;

-- What the database now holds, demo rows only.
select 'events' as demo_rows, count(*) as total
from public.events where id::text like 'de30de30-de30-0000-%'
union all
select 'games', count(*)
from public.games where id::text like 'de30de30-de30-0000-%'
union all
select 'station labels', count(*)
from public.game_event_setups where game_id::text like 'de30de30-de30-0000-%'
union all
select 'scores', count(*)
from public.scores where id::text like 'de30de30-de30-0000-%'
union all
select 'scores pending', count(*)
from public.scores
where id::text like 'de30de30-de30-0000-%' and status = 'pending'
union all
select 'scores with a photo', count(*)
from public.scores
where id::text like 'de30de30-de30-0000-%' and photo_path is not null;
