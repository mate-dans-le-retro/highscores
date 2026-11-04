The system's button, in five variants that each answer a precise intent.

`primary` carries a screen's main action — only one per screen. `secondary` carries second-rank actions. `ghost` carries the discreet actions of a toolbar. `danger` is reserved for destructive actions, and nothing else: in MDLR, a red button deletes. `pixel` belongs to the arcade register and is only used on a screen the public watches, never in a management interface.

Write labels as an infinitive or action verb, in sentence case: « Démarrer le tournoi », « Ajouter », « Enregistrer », « Vider ». Do not use block capitals outside the `pixel` variant.

Pass `icon` for an icon before the label, `iconEnd` for an icon after. The gap is `space-2` in both cases. The product provides the glyph — the system ships no icon library, it expects 2px-stroke Lucide.

`icon` carries the meaning of the action: a play arrow on « Démarrer », a plus on « Ajouter ». `iconEnd` carries a direction or a continuation: a menu chevron, a next-step arrow, an outgoing link. Do not put one on both sides.

**Without a label, the button becomes square and only shows its icon.** It keeps all the chrome of its variant — a `danger` stays red, a `pixel` keeps its frame. In that case `aria-label` is **mandatory**: it is the button's only accessible name, and without it a screen reader announces "button" and nothing else.

Do not confuse it with `IconButton`. The icon-only button is for when the action needs a button's chrome: a toolbar, a modal header, an isolated action that must be seen. `IconButton` has no background, is smaller, made for repeated actions at the end of a list row, where chrome on every row would saturate the screen.

A disabled button takes `disabled`, which sets `aria-disabled` rather than the native attribute: the button stays reachable by keyboard, so it can be announced — a natively disabled button leaves the tab order and becomes invisible to keyboard users. In return the browser no longer blocks the click: the component neutralizes it, and a disabled link loses its `href`. The cursor switches to `not-allowed` on hover, which requires keeping pointer events — hence no `pointer-events: none`.

Two pressed states, not to be confused. **Pushing down** is automatic and lasts as long as the click: the button moves down one pixel, and in the pixel register it slides `space-1` diagonally while losing its drop shadow — the gesture of pressing an arcade button.

The **active state** is persistent and declared with `pressed`, for a toggle: fullscreen, pause, a filter left on. `aria-pressed` carries the state, and the style follows that attribute rather than a class: appearance and semantics cannot diverge, and a screen reader announces "pressed" as the eye sees it.

The active button **keeps its variant's color**. Repainting it pink would make a pressed secondary toggle look like a primary button at rest, and the state would become unreadable in a toolbar where both sit side by side. Instead, three cues add up, which only say "pressed": the button moves down one pixel, gets an inner shadow and a pink outline inside its edge. The `pixel` variant keeps its own vocabulary — it slides over its drop shadow, which already says it all.

Only set `pressed` on a real toggle. A regular action button — « Enregistrer », « Ajouter » — leaves it out: `aria-pressed="false"` on a button that does not toggle announces a state that does not exist.

Set `href` to render a link that looks like a button — useful for the website's calls to action.
