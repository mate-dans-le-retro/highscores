-- Events, station labels, free game names, anonymous scores, score types and
-- settings, as decided by the reference mockups (docs/screens.md) and the
-- frontend data model (src/lib/data/types.ts).
--
-- Privacy: a player can stay ranked without showing their name and photo
-- (display_on_screen = false). The real name stays in the database, but the
-- public no longer reads the scores table: it calls public_scores(), which
-- hides the name and the photo of those rows and returns a keyed hash instead,
-- from which the browser builds a stable retro nickname. Realtime goes through
-- change_signals, so that no score row ever travels to the public.

-- ---------------------------------------------------------------------------
-- Private schema: never exposed by the API.
-- ---------------------------------------------------------------------------
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table private.secrets (
  name text primary key,
  value text not null
);

revoke all on private.secrets from public, anon, authenticated;

-- Key of the anonymous seeds. Without it, a seed cannot be traced back to a
-- name by hashing a list of first names.
insert into private.secrets (name, value)
values ('anonymous_seed_key', encode(extensions.gen_random_bytes(32), 'hex'));

-- ---------------------------------------------------------------------------
-- Events: each edition has its own leaderboard. Archiving an event starts a
-- new one; archived scores still count for the all-time records.
-- ---------------------------------------------------------------------------
create table public.events (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 80),
  created_at timestamptz not null default now(),
  archived_at timestamptz
);

-- Exactly one current (not archived) event at a time.
create unique index events_single_current_idx
  on public.events ((true))
  where archived_at is null;

alter table public.events enable row level security;

create policy "anyone can read events"
  on public.events for select
  to anon, authenticated
  using (true);

create policy "admins manage events"
  on public.events for all
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

insert into public.events (name) values ('Novembre 2026');

create or replace function public.current_event_id()
returns uuid
language sql
stable
set search_path = ''
as $$
  select id from public.events where archived_at is null;
$$;

-- Archives the current event and opens a new one, in one transaction.
create or replace function public.archive_current_event(new_event_name text)
returns uuid
language plpgsql
set search_path = ''
as $$
declare
  new_id uuid;
begin
  if not public.is_admin() then
    raise exception 'Only volunteers can archive an event'
      using errcode = '42501';
  end if;

  update public.events set archived_at = now() where archived_at is null;
  insert into public.events (name) values (new_event_name) returning id into new_id;
  return new_id;
end;
$$;

revoke execute on function public.archive_current_event(text) from public, anon;

-- ---------------------------------------------------------------------------
-- Games: console, score type, short label and station label per event.
-- ---------------------------------------------------------------------------
-- "Super NES", stable across events. The eyebrow adds the station label.
alter table public.games rename column machine to console;

-- 'points' and 'other' are integers; 'time' is stored in milliseconds
-- (1'32"48 = 92480) and usually goes with score_order = 'asc'.
-- To add a type: alter type public.score_type add value '...'.
create type public.score_type as enum ('points', 'time', 'other');

alter table public.games
  add column score_type public.score_type not null default 'points',
  -- Shown in the game tile when there is no cover ("TET", "DH").
  add column short_label text;

update public.games
set short_label = coalesce(
  case slug
    when 'tetris' then 'TET'
    when 'duck-hunt' then 'DH'
    when 'super-mario-bros' then 'SMB'
    when 'guitar-hero' then 'GH'
  end,
  nullif(upper(left(regexp_replace(name, '[^A-Za-z0-9]', '', 'g'), 3)), ''),
  '???'
);

alter table public.games
  alter column short_label set not null,
  add constraint games_short_label_length
    check (char_length(short_label) between 1 and 4);

-- How a game is set up for one event: its nickname or location there
-- ("Étage", "Tournoi"). Editing it never touches past scores.
create table public.game_event_setups (
  event_id uuid not null references public.events (id) on delete cascade,
  game_id uuid not null references public.games (id) on delete cascade,
  station_label text check (char_length(station_label) between 1 and 40),
  primary key (event_id, game_id)
);

alter table public.game_event_setups enable row level security;

create policy "anyone can read game event setups"
  on public.game_event_setups for select
  to anon, authenticated
  using (true);

create policy "admins manage game event setups"
  on public.game_event_setups for all
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- Visible games, with their station label for the current event. Runs with
-- the caller's rights: the policies of games still apply.
create view public.displayed_games
with (security_invoker = true)
as
select g.*, ges.station_label
from public.games g
left join public.game_event_setups ges
  on ges.game_id = g.id
  and ges.event_id = public.current_event_id()
where g.visible;

grant select on public.displayed_games to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Scores: event, free game name, display consent, thumbnail, Instagram
-- handle and what the photo reading detected.
-- ---------------------------------------------------------------------------
alter table public.scores
  add column event_id uuid references public.events (id) on delete restrict,
  -- Free game name typed by the player ("Un autre jeu"), until a volunteer
  -- creates the game or links the score to an existing one.
  add column custom_game_name text
    check (char_length(custom_game_name) between 1 and 60),
  -- Player consent to show their name and photo on the screen. When false,
  -- the score stays ranked, under a nickname and without photo.
  add column display_on_screen boolean not null default true,
  -- ~800 px version of the photo, for the screen. photo_path is the proof.
  add column thumb_path text,
  add column instagram_handle text
    check (instagram_handle ~ '^[A-Za-z0-9._]{1,30}$'),
  add column detected_game_id uuid references public.games (id) on delete set null,
  add column detected_score bigint check (detected_score >= 0);

update public.scores set event_id = public.current_event_id() where event_id is null;

alter table public.scores
  alter column event_id set default public.current_event_id(),
  alter column event_id set not null,
  alter column game_id drop not null,
  add constraint scores_game_or_custom_name
    check ((game_id is null) <> (custom_game_name is null)),
  add constraint scores_approved_have_a_game
    check (status <> 'approved' or game_id is not null);

drop index public.scores_game_status_idx;
create index scores_event_game_status_idx on public.scores (event_id, game_id, status);
create index scores_game_status_idx on public.scores (game_id, status);
create index scores_status_created_at_idx on public.scores (status, created_at);

-- ---------------------------------------------------------------------------
-- Settings: a single row, edited from the admin.
-- ---------------------------------------------------------------------------
create type public.screen_mode as enum ('game', 'wall', 'both');
create type public.instagram_mode as enum ('on_approval', 'ask', 'off');

create table public.settings (
  id boolean primary key default true check (id),
  submissions_open boolean not null default true,
  screen_mode public.screen_mode not null default 'game',
  game_duration_s integer not null default 15
    check (game_duration_s in (15, 30, 60)),
  wall_duration_s integer not null default 20
    check (wall_duration_s in (10, 20, 30)),
  -- Total rows on the public screen.
  rows_shown integer not null default 10 check (rows_shown in (3, 5, 10)),
  -- The all-time block never shrinks below this many rows.
  min_all_time_rows integer not null default 5
    check (min_all_time_rows in (3, 5, 10)),
  instagram_enabled boolean not null default false,
  instagram_mode public.instagram_mode not null default 'ask',
  -- [jeu], [joueur] and [score] are replaced when posting.
  instagram_caption text not null default
    'Nouveau record sur [jeu] : [joueur] a mis [score] ! Viens le battre à Mate dans le Rétro… Gaming.',
  updated_at timestamptz not null default now()
);

insert into public.settings default values;

alter table public.settings enable row level security;

create policy "anyone can read settings"
  on public.settings for select
  to anon, authenticated
  using (true);

create policy "admins update settings"
  on public.settings for update
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create trigger settings_touch_updated_at
  before update on public.settings
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Scores access: the public only inserts; reading goes through public_scores().
-- ---------------------------------------------------------------------------
drop view public.leaderboard;
drop policy "anyone can read approved scores" on public.scores;
drop policy "players submit pending scores" on public.scores;

-- A player can only send a pending submission with its photo, in the current
-- event, while submissions are open, on a visible game or a free game name.
create policy "players submit pending scores"
  on public.scores for insert
  to anon, authenticated
  with check (
    status = 'pending'
    and source = 'player'
    and reviewed_at is null
    and reviewed_by is null
    and rejection_reason is null
    and instagram_post_id is null
    and event_id = (select public.current_event_id())
    and (select submissions_open from public.settings)
    and photo_path like 'submissions/%'
    and (thumb_path is null or thumb_path like 'submissions/%')
    and (
      game_id is null
      or exists (select 1 from public.games g where g.id = game_id and g.visible)
    )
  );

-- Flood guard. Not per device or IP: the whole venue shares one wifi.
create or replace function public.limit_player_submissions()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (
    select count(*) from public.scores
    where source = 'player' and created_at > now() - interval '1 minute'
  ) >= 30 then
    raise exception 'Too many submissions, try again in a minute'
      using errcode = 'P0001', hint = 'rate_limited';
  end if;
  return new;
end;
$$;

revoke execute on function public.limit_player_submissions() from public, anon, authenticated;

create trigger scores_limit_player_submissions
  before insert on public.scores
  for each row
  when (new.source = 'player')
  execute function public.limit_player_submissions();

-- Lowercase, no accents, single spaces: the same player typed twice gets the
-- same seed.
create or replace function private.normalize_player_name(name text)
returns text
language sql
immutable
set search_path = ''
as $$
  select regexp_replace(
    lower(trim(translate(
      name,
      'ÀÂÄÁÃÅàâäáãåÇçÉÈÊËéèêëÍÌÎÏíìîïÑñÓÒÔÖÕóòôöõÚÙÛÜúùûüÝŸýÿ',
      'AAAAAAaaaaaaCcEEEEeeeeIIIIiiiiNnOOOOOoooooUUUUuuuuYYyy'
    ))),
    '\s+', ' ', 'g'
  );
$$;

-- Approved scores of visible games, every event included, for the public.
-- Runs with the owner's rights, so the public never reads scores directly:
-- an anonymous row comes without name and photo, with anonymous_seed instead
-- (keyed hash of the normalized name and the game: one nickname per player
-- per game, which cannot be traced back to the name).
create or replace function public.public_scores()
returns table (
  id uuid,
  game_id uuid,
  event_id uuid,
  event_name text,
  is_current_event boolean,
  station_label text,
  player_name text,
  photo_path text,
  anonymous boolean,
  anonymous_seed text,
  score bigint,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    s.id,
    s.game_id,
    s.event_id,
    e.name,
    e.archived_at is null,
    ges.station_label,
    case when s.display_on_screen then s.player_name end,
    case when s.display_on_screen then coalesce(s.thumb_path, s.photo_path) end,
    not s.display_on_screen,
    case when not s.display_on_screen then encode(
      extensions.hmac(
        private.normalize_player_name(s.player_name) || ':' || s.game_id::text,
        (select value from private.secrets where name = 'anonymous_seed_key'),
        'sha256'
      ),
      'hex'
    ) end,
    s.score,
    s.created_at
  from public.scores s
  join public.games g on g.id = s.game_id
  join public.events e on e.id = s.event_id
  left join public.game_event_setups ges
    on ges.event_id = s.event_id and ges.game_id = s.game_id
  where s.status = 'approved'
    and g.visible;
$$;

revoke execute on function public.public_scores() from public;
grant execute on function public.public_scores() to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Realtime: the screen listens to change_signals, never to scores, so that
-- hidden names and pending submissions never travel to the public. A row per
-- topic, bumped when something the public screen shows changes.
-- ---------------------------------------------------------------------------
create table public.change_signals (
  topic text primary key check (topic in ('games', 'scores', 'settings')),
  changed_at timestamptz not null default now()
);

insert into public.change_signals (topic) values ('games'), ('scores'), ('settings');

alter table public.change_signals enable row level security;

create policy "anyone can read change signals"
  on public.change_signals for select
  to anon, authenticated
  using (true);

create or replace function public.signal_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  signal_topic text;
begin
  foreach signal_topic in array tg_argv loop
    update public.change_signals set changed_at = now()
    where topic = signal_topic;
  end loop;
  return null;
end;
$$;

revoke execute on function public.signal_change() from public, anon, authenticated;

create trigger games_signal_change
  after insert or update or delete on public.games
  for each statement execute function public.signal_change('games', 'scores');

create trigger game_event_setups_signal_change
  after insert or update or delete on public.game_event_setups
  for each statement execute function public.signal_change('games', 'scores');

create trigger events_signal_change
  after insert or update or delete on public.events
  for each statement execute function public.signal_change('games', 'scores');

create trigger settings_signal_change
  after insert or update or delete on public.settings
  for each statement execute function public.signal_change('settings');

-- Only approved scores show on the screen: pending submissions stay silent.
create trigger scores_signal_insert
  after insert on public.scores
  for each row when (new.status = 'approved')
  execute function public.signal_change('scores');

create trigger scores_signal_update
  after update on public.scores
  for each row when (old.status = 'approved' or new.status = 'approved')
  execute function public.signal_change('scores');

create trigger scores_signal_delete
  after delete on public.scores
  for each row when (old.status = 'approved')
  execute function public.signal_change('scores');

alter publication supabase_realtime drop table public.scores, public.games;
alter publication supabase_realtime add table public.change_signals;

-- ---------------------------------------------------------------------------
-- Storage: a photo is never refused (HEIF, odd types from some phones), and
-- players only upload while submissions are open.
-- ---------------------------------------------------------------------------
update storage.buckets
set allowed_mime_types = array['image/*']
where id = 'photos';

drop policy "players upload submission photos" on storage.objects;

create policy "players upload submission photos"
  on storage.objects for insert
  to anon, authenticated
  with check (
    bucket_id = 'photos'
    and (storage.foldername(name))[1] = 'submissions'
    and (select submissions_open from public.settings)
  );
