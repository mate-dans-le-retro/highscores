-- Read-only: counts the demo rows of demo-seed.sql and lists the real rows
-- that would stop demo-clean.sql from deleting a demo game or event. A single
-- select: it changes nothing. Demo rows are those whose id starts with
-- de30de30-de30-0000- (see demo-seed.sql).

with
demo_events as (
  select id, name from public.events
  where id::text like 'de30de30-de30-0000-%'
),
demo_games as (
  select id, slug, visible from public.games
  where id::text like 'de30de30-de30-0000-%'
),
demo_scores as (
  select id, status, photo_path from public.scores
  where id::text like 'de30de30-de30-0000-%'
),
real_scores_on_demo_games as (
  select s.id, s.status, g.slug
  from public.scores s
  join demo_games g on g.id = s.game_id or g.id = s.detected_game_id
  where s.id::text not like 'de30de30-de30-0000-%'
),
real_rows_in_demo_events as (
  select 'score ' || s.id::text as ref, e.name
  from public.scores s
  join demo_events e on e.id = s.event_id
  where s.id::text not like 'de30de30-de30-0000-%'
  union all
  select 'station label of game ' || ges.game_id::text, e.name
  from public.game_event_setups ges
  join demo_events e on e.id = ges.event_id
  where ges.game_id::text not like 'de30de30-de30-0000-%'
)
select 'demo events' as item, count(*)::text as detail from demo_events
union all
select 'demo games', count(*)::text from demo_games
union all
select 'demo games visible', count(*)::text from demo_games where visible
union all
select 'demo station labels', count(*)::text
from public.game_event_setups
where game_id::text like 'de30de30-de30-0000-%'
union all
select 'demo scores ' || status, count(*)::text from demo_scores group by status
union all
select 'demo scores with a photo', count(*)::text
from demo_scores where photo_path is not null
union all
select 'real score on a demo game: keeps that game',
  format('%s (%s, %s)', id, slug, status)
from real_scores_on_demo_games
union all
select 'real row in a demo event: keeps that event', format('%s (%s)', ref, name)
from real_rows_in_demo_events
union all
select 'real scores (never touched)', count(*)::text
from public.scores where id::text not like 'de30de30-de30-0000-%'
union all
select 'real games (never touched)', count(*)::text
from public.games where id::text not like 'de30de30-de30-0000-%';
