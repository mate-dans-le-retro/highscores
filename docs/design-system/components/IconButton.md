The button without a visible label, for repeated actions at the end of a row: edit a player, delete them, pause a tournament.

`label` is **mandatory**: it is the button's accessible name, read by screen readers. Write the full action (« Supprimer le joueur »), not the icon's name.

Use `tone="danger"` for deletion: the icon turns `state-danger` on hover, never at rest — a list row must not look permanently red.

The target is 36 × 36 px. Do not shrink it: it is already the comfortable minimum for a mouse, and the association's management screens are sometimes used with a trackpad in the dark.

Group at most three icon buttons per row. Beyond that, switch to a menu.

Pass `pressed` for a toggle — a toolbar tool left on. The button sinks and gets a pink outline, like the filled button, and `aria-pressed` carries the state. Do not use it on a regular action: announcing a toggle state on a button that has none is worse than announcing nothing.

`disabled` sets `aria-disabled`, neutralizes the click and switches the cursor to `not-allowed`, without removing the button from the tab order. On a list row, prefer hiding an action that makes no sense rather than lining up greyed-out icons.
