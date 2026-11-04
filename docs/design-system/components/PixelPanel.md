The arcade register's frame: `radius-none`, `border-pixel` border in `line-accent`, hard `shadow-pixel` shadow without blur.

It is the container of everything the public watches on a game screen: match blocks, leaderboard inserts, information panels of a bracket.

Pass `label` for the display-font label above the content — « QUARTS DE FINALE », « FINALE ». Three words at most: beyond that, the pixel font stops being readable.

Use `tone="plain"` to border in `line-strong` rather than pink, when several neighboring panels compete for attention.

Never round the corners or add a blurred shadow: a rounded bracket panel loses all identity. For a management container, use `Card`.

The inner surface is `surface-inverse`: white in the arcade and scene themes, purple in console. The text inside is `ink-inverse`.
