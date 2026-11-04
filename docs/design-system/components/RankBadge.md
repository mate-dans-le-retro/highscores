A player's rank mark: a pixel art cup carrying the place number, in `rank-gold`, `rank-silver` or `rank-bronze`.

The cup is an original drawing of the system, drawn on a 16-unit grid like the rest of the pixel register. It is neither an emoji nor an icon font glyph: it is tinted by `currentColor`, so it follows the theme, and stays sharp at any size.

**The number is real text**, not a shape. It carries the information; the cup is decorative. The component exposes a full accessible name — « 1re place », « 2e place » — and hides the rest from screen readers.

By default, the cup is drawn in dark ink on a **plate** of the rank's color. On a podium, the step already carries that color: pass `bare`, otherwise the plate would disappear on its own background. `Podium` already does it.

The three metals are set as a **two-tone gradient** — a light highlight at the top left, the full tint at the bottom right. It is the system's only gradient: flat gold has no shine, and two stops are enough to make it glow without leaving the pixel register. The dark ink holds from 5.35:1 to 11.32:1 depending on the metal and the spot in the gradient.

The three metals are identical in the three themes. They are not re-tinted by theme: gold stays gold, and since they always serve as a fill under dark ink, their readability does not depend on the page background. That is what avoids the dull golds and muddy bronzes of a light theme.

Only the top three get a cup. Beyond that, `RankBadge` renders a simple numbered square on `surface-overlay`: a cup for seventeenth place means nothing, and the number in the cup stays a single digit, so always readable.

The cup is drawn with two units of margin at the top and bottom of its grid, and the number sits down in the bowl rather than against the rim. Do not reduce these margins: stuck to the edge of its plate, the cup looks like it is falling.

Four sizes: `xs` (28px), `sm` (40px) for a dense table row, the default size (48px) for a leaderboard, `lg` (80px) for the winner's step on a podium.

`sm` is the minimum for reading: below it, the digit goes under 12px and the pixel font starts to close up. `xs` takes the digit down to 10px and only exists for one precise case, the mark of a `BracketMatch` row: there, the place is also carried by the plate's color, it never exceeds one digit, and the row's accessible name states it in full. Do not use it elsewhere — a full leaderboard in `xs` would be unreadable.

`Podium` and `ScoreTable` already use it. You rarely need it directly — the typical case is a "best score of the weekend" insert outside a table.

Pass `label` to replace the accessible name when the context calls for it, for example « vainqueur du tournoi Mario Kart » rather than « 1re place ».

Do not replace the cup with a 🏆 emoji: rendering changes from one device to another, the color cannot be controlled, and screen readers announce it poorly. That is precisely what this component replaces in the current podium screen.
