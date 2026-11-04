The states of a tournament: `soon` (À venir), `live` (En cours), `done` (Terminé) — plus `bye` (Qualifié d'office), for a player exempt from a round in a table.

The component provides the French label by default. Do not replace it with an abbreviation: **color never carries the information alone**, the word carries it, and the colored dot reinforces it.

The three colors are taken as is from the Tournaments app and are identical in the three themes: the pill stays light to stand out on the purple, including when projected.

Place the badge to the right of the tournament title, never as the color of the title itself.

`bye` is on the blue axis, not in the green. The Tournaments app currently renders « Qualifié d'office » in green, the same register as « En cours »: two different meanings carried by a single color, which nothing tells apart at first glance. Blue separates them, including for red-green color blindness.

Do not repurpose these states for other statuses. A new business state needs a new set of `state-*` tokens, not the reuse of « En cours ».

## Free label

Without `state`, the component becomes a generic label: the text comes from `children`, the tint from `tone`, and the dot disappears — a colored dot makes sense to signal a state that changes, not to name a console.

Five checked tints: `brand` (the brand pink), `gold` (the winner's metal), `neutral` (gray, the default), `info` (blue) and `outline`, which only has a rule and fits when several labels follow each other and none should dominate. Each pair stays above 4.5:1 in the three themes.

That is enough to label a game, a console, a machine, an edition — anything that classifies without being a state.

For a color outside this list, pass `color` and `textColor` together. **Contrast then becomes your responsibility**: the system cannot guarantee it on a value it does not know. Aim for 4.5:1 between the two, and remember the label will sit on a dark background as well as on a white card depending on the theme.

Do not make a fifth tournament state with a free label. A new business state needs its own `state-*` tokens and its entry in `BADGE_LABEL`, so the label and the dot follow everywhere.
