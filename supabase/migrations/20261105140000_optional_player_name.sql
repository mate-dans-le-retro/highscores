-- The player name becomes optional. A player who leaves it empty shows on the
-- screen under a nickname built by the browser from the score id (see
-- displayedPlayerName() in src/lib/data/anonymize.ts).
--
-- public_scores() needs no change: for a nameless score it returns
-- player_name = null when displayed, and anonymous_seed = null when kept off
-- screen (the hmac of a null name is null), and the client falls back to the
-- score id in both cases.
--
-- The phone now chooses the score id itself (a v4 UUID), so that the form can
-- preview the nickname and a retried send stores the score only once. The
-- insert policy does not constrain the id: nothing to change there either.

alter table public.scores
  alter column player_name drop not null;

comment on column public.scores.player_name is
  'Name typed by the player, 1 to 40 characters, or null when left empty.';
