The content container of management screens: `surface-raised`, `radius-xl`, `space-6` padding, `shadow-card`.

Pass `title` for the header and `actions` for the buttons. Same mechanism as `Modal`: you pass the buttons themselves, the card places them. The product keeps control of the variant, size and icon.

By default the actions go in the header, to the right of the title — it is the pattern of the app's « Joueurs » and « Gestion du tournoi » panels, and the right place for actions on the content listed below: add, clear, filter.

`actionsIn="footer"` puts them under the content, right-aligned and separated by a rule. Use it when the action concludes what was just read rather than acting on a list — « Démarrer le tournoi » after a summary. A card never has actions in both places.

The website's program columns (« … de consoles ! ») are **not** cards: they are text columns centered in a band, without background or shadow. They are set with the `columns` prop of `SectionBand`, not here.

A card holds a single subject. Two subjects need two cards, not a separator.

Do not nest a card in a card: switch to a list bordered with `line-subtle`.

Do not use `Card` in the pixel register — a bracket uses `PixelPanel`, which has square corners and a hard shadow.
