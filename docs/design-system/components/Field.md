The input field and dropdown of configuration forms.

The label is **always visible** and tied to the control: never replace it with placeholder text in the field, which disappears at the first keystroke.

Pass `hint` for the input hint — « Nombre de manches par match ». It is linked to the control through `aria-describedby`.

Pass `invalid` for the error: the border switches to a `border-thick` `state-danger` and the hint becomes the error message in bold. Write what the user must do (« Indiquez un nombre entre 2 et 64 »), not what is wrong.

Use `as="select"` with `options` for a dropdown; the chevron is provided, do not add another one.

Lay forms out on two columns at most, with a `space-5` gutter, grouping fields that read together — « Joueurs par match » and « Qualifiés par match » side by side.

## Disabled and read-only

The two do not say the same thing, and the choice affects what the form sends.

`disabled` takes the field out of the form: the value is not submitted, the control fades and refuses the pointer. It is for a setting that does not make sense yet — « Format des phases finales » until the pools are finished. Say why in `hint`, otherwise the greyed-out field is a riddle.

`readonly` locks input but keeps the value: it stays readable at full contrast, and it is submitted with the form. It is for data that matters but that the user does not set — a tournament code generated at creation. The field gets the sunken background and a dotted border, the same vocabulary as a match's pending slot.

`readonly` does not exist on a `select` in HTML. So the component locks the list and carries the value in a hidden field with the same `name`: the form keeps sending it, which is exactly what sets read-only apart from disabled. The chevron disappears, since there is nothing left to open.

Focus is the system's: solid `shadow-focus`, 2px offset. Do not replace it with a pink ring, which fails on `surface-raised`.
