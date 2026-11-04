# The three products

## Event website

The website is a series of **full-width bands** alternating `surface-base` and `surface-accent`, each with `space-16` vertical padding. Use `SectionBand`: it sets the background, the pixel pattern in the corners and the title.

Band titles are `h2`, uppercase. On a purple band, they are `ink-accent` (the website's current treatment); on a pink band, `ink-on-accent`.

A band's content is centered, 720px max width for running text, and splits into three columns at most. Program cards (« … de consoles ! », « … de bornes d'arcade ! ») are `Card`s without background, image on top, `h4` in `ink-on-accent`, text in `body-sm`.

Practical information — prices, venue, payment — is the only information the public really comes for: keep it above the footer, in three columns of `eyebrow` + `body-strong`.

## Tournaments app

Two modes, two themes. Admin screens (player list, configuration, management) are in `console`: white cards on a light background, rounded register, deliberate density. Display screens (table, podium) are in `arcade`, or in `scene` as soon as they are projected.

The app bar (`AppBar`) is in `surface-accent` with the logo on the left and the user's identity on the right. It is the only pink area of the management screens: it ties the tool to the brand without pink everywhere.

The four statistic cards at the top of a tournament (registered players, format, venue, start) are `StatCard`s: icon in a pill, `eyebrow` for the label, `numeric` for a counter, `h4` for a text value.

The tournament state is a `Badge` placed to the right of the title, never a title color. The three states are `soon` (À venir), `live` (En cours), `done` (Terminé).

The tournament table is pixel register throughout: `PixelPanel` for the frame, `BracketMatch` for a match block, `radius-none`, `border-pixel`, `shadow-pixel`, `display` font. A match winner is marked by a `surface-accent` fill **and** a filled gamepad icon — not by color alone.

Unplayed slots are in `state-pending-surface`, with three dots, never empty: an empty frame reads as a bug.

Long player names are truncated with an ellipsis at the end of the line, but the full name stays available in `title`. Today truncation is abrupt: a player with a long name cannot be identified anywhere in the table.

The podium uses `Podium`: three `radius-none` blocks in `rank-gold`, `rank-silver`, `rank-bronze`, the first one higher and wider, the next finalists listed below. Each step carries a `RankBadge` — a pixel art cup with the place number — which replaces the medal emoji.

## Highscores

The highscores display product does not exist yet; `ScoreTable` is the component to build it on.

A highscores table is pixel register, in the `scene` theme by default: it lives on a screen, not on a desk.

Structure each row in three fixed columns: rank, player, score. The rank is a 48px `RankBadge`: a cup colored `rank-gold`, `rank-silver` or `rank-bronze` for the top three, a simple numbered square beyond. The player is in `arcade-name`, the score in `numeric`, right-aligned.

Right-align the scores and set them in `mono`: this is what lets you compare two numbers at a glance and keeps the column from shaking when a score updates.

Show the game and the machine at the top of the table, in `eyebrow` + `arcade-title`. A leaderboard without the game name means nothing when twenty machines are running in the room.

Ten rows per screen at most. For a longer leaderboard, alternate pages every fifteen seconds with a 120 ms transition, without reducing the text size.

Mark a score that just came in with a `surface-accent` fill on the row for a few seconds, then let it fade back: it is the only movement allowed on a highscores screen.

## Deliberate additions

`ScoreTable`, `Field`, `Modal` and `SectionBand` are not extracted from an existing source. `ScoreTable` is required by the upcoming highscores product; `Field` and `Modal` rebuild the "Configuration du tournoi" modal of the current app, which does not expose its styles; `SectionBand` formalizes the website's alternating bands, which today only exist in its template.
