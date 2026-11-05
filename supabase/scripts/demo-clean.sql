-- Removes the demo data of demo-seed.sql, and nothing else.
--
-- Not a migration and not run by `supabase db reset`: run it by hand (see
-- README.md in this folder). Safe to run when there is no demo data: it then
-- deletes nothing.
--
-- How demo rows are recognised
--   By their id only: every demo row has a fixed id starting with
--     de30de30-de30-0000-
--   UUID version 0, which gen_random_uuid() and the app's randomUuid() never
--   make (they only make version 4 ids). Station labels (game_event_setups)
--   have no id of their own: the demo ones are those whose game_id is a demo
--   game. Slugs and names are never used to pick a row.
--
-- What it deletes, in this order
--   1. Scores with a demo id, whatever their event, game or status.
--   2. Station labels of demo games.
--   3. Demo games that no score points to any more (game_id or
--      detected_game_id).
--   4. Archived demo events that no score and no station label points to.
--
-- What it never deletes
--   Rows without the demo id: real games, scores, events and station labels,
--   the current event, the settings. Foreign keys could delete or modify
--   real rows through a demo parent:
--     scores.game_id -> games (on delete cascade)
--     scores.detected_game_id -> games (on delete set null)
--     game_event_setups.game_id -> games (on delete cascade)
--     game_event_setups.event_id -> events (on delete cascade)
--     scores.event_id -> events (on delete restrict)
--   so a demo game or event that a real row still points to (a real score
--   approved on a demo game, for example) is kept, and a kept game is hidden
--   from the screen and the form. The script says so; fix those rows in the
--   admin, then run it again.
--
-- Safety nets, any of which rolls the whole transaction back
--   - A foreign key to games, events or scores that is not in the list above
--     (a later migration): update this script first.
--   - The number of rows without the demo id in scores, games, events and
--     game_event_setups (or of scores with a detected game) changed during
--     the run. The transaction is repeatable read, so these counts only see
--     what this script did.
--
-- Photos: the files in photos/demo/ stay in the bucket (SQL cannot delete
-- Storage files). Nothing points to them any more; remove them with
-- `demo-photos.ps1 -Remove` if you want.
--
-- The summary prints as notices (psql) and as the result table of the last
-- query (SQL Editor of the dashboard).

begin isolation level repeatable read;

drop table if exists pg_temp.demo_clean_summary;
create temp table demo_clean_summary (
  step serial primary key,
  item text not null,
  total bigint not null
);

do $$
declare
  demo constant text := 'de30de30-de30-0000-%';
  unexpected text;
  real_before bigint[];
  real_after bigint[];
  deleted_scores bigint;
  deleted_pending bigint;
  deleted_setups bigint;
  kept_games bigint;
  hidden_games bigint;
  deleted_games bigint;
  kept_events bigint;
  deleted_events bigint;
  line record;
begin
  -- Every foreign key to the tables this script deletes from.
  select string_agg(ref, ', ' order by ref) into unexpected
  from (
    select format('%s.%s.%s -> %s', ns.nspname, cl.relname, a.attname, fcl.relname) as ref
    from pg_catalog.pg_constraint c
    join pg_catalog.pg_class cl on cl.oid = c.conrelid
    join pg_catalog.pg_namespace ns on ns.oid = cl.relnamespace
    join pg_catalog.pg_class fcl on fcl.oid = c.confrelid
    join pg_catalog.pg_attribute a
      on a.attrelid = c.conrelid and a.attnum = any (c.conkey)
    where c.contype = 'f'
      and c.confrelid in (
        'public.games'::regclass,
        'public.events'::regclass,
        'public.scores'::regclass
      )
  ) as refs
  where ref not in (
    'public.scores.game_id -> games',
    'public.scores.detected_game_id -> games',
    'public.scores.event_id -> events',
    'public.game_event_setups.game_id -> games',
    'public.game_event_setups.event_id -> events'
  );
  if unexpected is not null then
    raise exception 'Unknown foreign keys: %. Update demo-clean.sql before running it: nothing was deleted.', unexpected;
  end if;

  real_before := array[
    (select count(*) from public.scores where id::text not like demo),
    (select count(*) from public.scores
      where id::text not like demo and detected_game_id is not null),
    (select count(*) from public.games where id::text not like demo),
    (select count(*) from public.events where id::text not like demo),
    (select count(*) from public.game_event_setups where game_id::text not like demo)
  ];

  -- 1. Demo scores.
  with deleted as (
    delete from public.scores where id::text like demo returning status
  )
  select count(*), count(*) filter (where status = 'pending')
  into deleted_scores, deleted_pending
  from deleted;

  -- 2. Station labels of demo games.
  with deleted as (
    delete from public.game_event_setups where game_id::text like demo returning 1
  )
  select count(*) into deleted_setups from deleted;

  -- 3. Demo games: those a real score still points to are kept, and hidden.
  select count(*) into kept_games
  from public.games g
  where g.id::text like demo
    and exists (
      select 1 from public.scores s
      where s.game_id = g.id or s.detected_game_id = g.id
    );

  with hidden as (
    update public.games g set visible = false
    where g.id::text like demo
      and g.visible
      and exists (
        select 1 from public.scores s
        where s.game_id = g.id or s.detected_game_id = g.id
      )
    returning 1
  )
  select count(*) into hidden_games from hidden;

  with deleted as (
    delete from public.games g
    where g.id::text like demo
      and not exists (
        select 1 from public.scores s
        where s.game_id = g.id or s.detected_game_id = g.id
      )
      and not exists (
        select 1 from public.game_event_setups ges where ges.game_id = g.id
      )
    returning 1
  )
  select count(*) into deleted_games from deleted;

  -- 4. Archived demo events that nothing points to any more.
  select count(*) into kept_events
  from public.events e
  where e.id::text like demo
    and (
      e.archived_at is null
      or exists (select 1 from public.scores s where s.event_id = e.id)
      or exists (select 1 from public.game_event_setups ges where ges.event_id = e.id)
    );

  with deleted as (
    delete from public.events e
    where e.id::text like demo
      and e.archived_at is not null
      and not exists (select 1 from public.scores s where s.event_id = e.id)
      and not exists (
        select 1 from public.game_event_setups ges where ges.event_id = e.id
      )
    returning 1
  )
  select count(*) into deleted_events from deleted;

  real_after := array[
    (select count(*) from public.scores where id::text not like demo),
    (select count(*) from public.scores
      where id::text not like demo and detected_game_id is not null),
    (select count(*) from public.games where id::text not like demo),
    (select count(*) from public.events where id::text not like demo),
    (select count(*) from public.game_event_setups where game_id::text not like demo)
  ];
  if real_after is distinct from real_before then
    raise exception 'Rows without the demo id changed (before %, after %): nothing was deleted.',
      real_before, real_after;
  end if;

  insert into demo_clean_summary (item, total)
  values
    ('scores deleted', deleted_scores),
    ('  of which pending submissions', deleted_pending),
    ('station labels deleted', deleted_setups),
    ('games deleted', deleted_games),
    ('archived events deleted', deleted_events),
    ('demo games kept: real scores point to them', kept_games),
    ('  of which hidden now', hidden_games),
    ('demo events kept: real rows point to them', kept_events),
    ('real scores (untouched)', real_after[1]),
    ('real games (untouched)', real_after[3]),
    ('real events (untouched)', real_after[4]);

  for line in select item, total from demo_clean_summary order by step loop
    raise notice '%: %', line.item, line.total;
  end loop;

  if deleted_scores + deleted_setups + deleted_games + deleted_events = 0
    and kept_games + kept_events = 0 then
    raise notice 'No demo data found: nothing to do.';
  end if;
  if kept_games + kept_events > 0 then
    raise warning 'Some demo rows were kept because real rows point to them. Run demo-status.sql to list them, fix them in the admin, then run this script again.';
  end if;
end;
$$;

commit;

select item, total from demo_clean_summary order by step;
