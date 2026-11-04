The background pixel pattern, as a file (the `Motifs` asset group in the design system).

`pixel-background.svg` — 1920 × 1080, the exact background of the Tournaments app: a `#38195C` fill (the value of `surface-raised` in the arcade theme) covered with 1351 gray squares of varying sizes, at 40% opacity and in `overlay` blend mode.

The squares range from `#808080` to `#E6E6E6`: they are grays, not purples. The `overlay` blend is what tints them with the background, which means the pattern adapts by itself if the fill behind it changes.

Two ways to use the pattern, not to be confused. This file, for a large surface where the irregular density of the squares shows — a bracket background, a projection screen. The `mdlr-pixelgrid` class or the `PixelGrid` component, for a regular grid generated in CSS, lighter and following the theme: prefer it in an interface.

The file is an SVG of about 100 KB. Do not put it behind text smaller than 18px, and do not use it in the `scene` theme behind content: its grid creates moiré with the physical grid of the panels.

The website's squares are yet another thing: three isolated squares per band corner, set by `CornerSquares`.
