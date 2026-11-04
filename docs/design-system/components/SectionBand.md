The website's full-width band, to alternate between `tone="base"` (purple) and `tone="accent"` (pink) from one section to the next. It is the structure of `matedansleretro.fr`.

The paddings are the website's: `space-12` at the top, `space-16` on the sides, `space-24` at the bottom. The content fits in `layout-lg` (1024px).

The title is `h2`, uppercase, centered. It takes `ink-accent` on a purple band and `ink-on-accent` on a pink band — the component handles it, do not force it.

Pass `columns` for the three-column grid (« Au programme », « Les infos importantes à connaitre »): each column fits in `layout-column` (296px) and can carry an illustration at most 147px high. Never exceed three columns.

**Plain columns or card columns.** By default (`columnStyle="plain"`), columns have no background or shadow: it is the website's design, and it works because each column carries an illustration there. The illustration gives the column its presence, not a surface. A column without an illustration, however, floats in the band and looks unfinished.

So: an illustration for each column, and stay `plain`. No illustration — prices, a venue, opening times — and switch to `columnStyle="card"`, which sets a surface, a `radius-xl` and a `shadow-card`. Do not mix both on the same page: it is one or the other depending on whether there are images.

**Corner squares** are on by default. They are the three `space-4` squares per top corner that overlap the previous band: they stitch the bands together, and they are as much a signature of the website as the color alternation. Alternate `cornerVariant` between `"a"` and `"b"` from one band to the next to avoid repetition, and pass `corners={false}` on the first band of a page, which has nothing above it.

Two bands of the same tint never follow each other: the alternation gives the page its rhythm.
