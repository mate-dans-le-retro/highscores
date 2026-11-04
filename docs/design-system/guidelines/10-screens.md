# Screens and projection

The association displays on three very different kinds of surfaces: projectors on a screen, a 70-inch plasma and LCD flat screens from 30 to 50 inches. The same bracket screen has to work on all three. That is what the `scene` theme is for — enlarging the `arcade` theme is not enough.

## Choosing the theme

Set `data-theme="scene"` on any display meant to be watched from afar, whatever the panel. Set `data-theme="arcade"` on what a player looks at from less than a meter away (phone, sign-up kiosk). Set `data-theme="console"` on the management screens volunteers work with.

Do not switch a projected screen to `console` "to see better": a 3 m² light fill from a projector dazzles a dark room and washes out the machines around it.

## What `scene` changes

The background drops to `#2a1148` instead of the brand purple. A projector lifts blacks: an already light background rises to a purplish gray and crushes all useful contrast. The deeper background compensates, and text automatically gains separation (16.5:1 for `ink-primary`, versus 15.1:1 in `arcade`).

The pink fill gets lighter (`surface-accent` at `#f457a0`): DLP and LCD projectors desaturate magentas, and the brand pink turns brown on a screen.

Pixel shadows go to 6px and the focus ring to 4px: below 4px, a line disappears when scaled up on a 3 m screen.

Edge paddings go to `space-24`. Every panel crops its edges — a screen is rarely stretched straight, a plasma sometimes applies a 3% overscan. Nothing informative may live within 96px of the edge.

## Text sizes when projected

Use the **Scene** style group and nothing else. `scene-hero` for the screen title, `scene-row` for each leaderboard or match row, `scene-meta` for time and place, `scene-pixel` for a pixel title.

Mind the width of the pixel font when sizing. Press Start 2P advances one em per glyph: at the same size, it takes almost twice the space of a sans-serif, and a seven-character number at 28px is already almost 200px wide. This is why the projected score table sets its scores at 28px and not 40: they weigh as much visually, and leave room for the player name. Size a column counting 1 em per character, not 0.6 as for Montserrat.

`scene-row` at 40px is the **absolute minimum**: it is what stays readable from the back of a room on a 30-inch LCD, the smallest and most demanding screen of the lot. Never show tournament information below it.

Do not use `ink-muted` when projected. It passes the threshold on a panel, but a projector's contrast loss in daylight makes it disappear. In `scene`, secondary text is in `ink-secondary`.

## Density

Count at most **ten rows** of `scene-row` per projected screen, and eight on a 30-inch panel. Beyond that, paginate: a leaderboard of twenty players becomes two screens alternating every fifteen seconds, not a list of twenty shrunken rows.

A projected bracket never shows more than two rounds at a time. On the current screenshots, the semi-finals and the final fit in the same frame as the quarter-finals: when projected, nothing is readable anymore.

## Rendering constraints

Do not put text on the `mdlr-pixelgrid` pattern when projected: the 24px grid creates moiré with the physical grid of LCD panels and DLP chips. The pattern stays on the edges or behind solid fills.

Avoid pure white in very large fills on a projector. A white pixel bracket panel is fine at the size of a match card; a full-screen white background is not.

Do not loop animations. A 120 ms screen change transition is enough; any permanent movement becomes tiresome after a few minutes in a room.

## Check before the event

Show the real screen on every panel of the lot, from the farthest point where a visitor will stand, with the planned lighting. Read a player name and a score out loud from that point: if either takes effort, go up a full step, not half.
