The highscores table, foundation of the upcoming display product. Pixel register, `scene` theme by default: it lives on a screen, not on a desk.

Three fixed columns: rank, player, score. The rank is a square block colored `rank-*` for the top three, `surface-overlay` beyond. The score is monospaced, right-aligned, in tabular figures — this is what lets you compare two numbers at a glance and keeps the column from shaking on update.

Set `game` and `machine`: a leaderboard without the game name means nothing when twenty machines are running in the room.

Pass numbers as `score` — they are formatted the French way, with spaces between thousands. A string is rendered as is, for scores with a special format (time, combo).

**Ten rows at most** per screen, eight on a 30-inch panel. For a longer leaderboard, alternate pages every fifteen seconds; never reduce the text size to fit more people.

Use `fresh` on the row of a score that just came in: it switches to `surface-accent` for a few seconds then fades back. It is the only movement allowed on a highscores screen.

`fresh` is a **passing state, not a selection**: the product sets it when the score arrives and removes it afterwards. Do not use it to mark a row permanently — a pink row that no longer moves loses its power to catch the eye, which is exactly what it is for.

## Hover and click

By default, **no row reacts to hover**. The table lives on a projector or a panel in the room, where there is no pointer; and on a management screen, a hover that leads nowhere promises an action that does not exist.

Pass `onSelectRow(index, row)` when rows do something — fix a score, invalidate a game, open a player's page. They then become real buttons, with the same vocabulary as `BracketMatch` rows: accent outline on hover, one-pixel push on press, visible keyboard focus. The accessible name repeats the player, their score and their place — « Alice — 128 400 points, 1re place ».
