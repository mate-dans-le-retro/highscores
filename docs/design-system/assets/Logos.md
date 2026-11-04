The association's full lockup: "mate" in pink script, the "DANS LE / RÉTRO" block in pixel letters on purple, the "GAMING" pill.

Four versions, all with the same drawing, each in SVG and PNG. The SVGs have a 450.57 × 247.84 `viewBox`; the PNGs are 2362px wide, on a transparent background, and are generated from the fixed SVGs — same colors, same names. Prefer SVG wherever it is accepted.

`mdlr-logo.png` is the website's old file, kept for reference. It matches `mdlr-logo-couleur-fond-sombre`: use that one from now on.

## Which one to use

The name says the background the version goes on ("fond sombre" = dark background, "fond clair" = light background). Each one was checked rendered on white, on `brand-purple` and on black.

`mdlr-logo-couleur-fond-sombre.svg` — **the default version.** A white rule sets it apart from any background, so it works on purple as well as on white or pink. When in doubt, use this one.

`mdlr-logo-couleur-fond-clair.svg` — the same without the rule, for a more integrated look on a light background. It contains **no light pixel**: on `brand-purple`, the RÉTRO block — which is exactly that purple — disappears entirely. Reserved for white, light backgrounds and the brand pink.

`mdlr-logo-mono-fond-sombre.svg` — one-tone version, black outlines and white inside. It is the sturdiest monochrome: it works on white, on purple and on black. For screen printing, marking and any medium without four-color printing.

`mdlr-logo-mono-fond-clair.svg` — version in outlines and light grays, for light backgrounds only. On purple it turns dull, and on black the "mate" script disappears: it is drawn there as a dark outline.

Mind the name of the latter in the original file, "Monochrome white": it is not a single-ink white fill, it mixes black, mid gray, light gray and white. **A real one-ink white version is still missing** — that is what embroidery, vinyl cutting or hot stamping on a dark medium would need.

## Mapping to the original files

The export names were inverted relative to their use. The table below makes the link once and for all:

| original file | name in the system | goes on |
| --- | --- | --- |
| `Color light.svg` | `mdlr-logo-couleur-fond-sombre.svg` | any background |
| `Color dark.svg` | `mdlr-logo-couleur-fond-clair.svg` | light backgrounds and pink |
| `Monochrome black.svg` | `mdlr-logo-mono-fond-sombre.svg` | any background |
| `Monochrome white.svg` | `mdlr-logo-mono-fond-clair.svg` | light backgrounds |

## Placement rules

Place the logo on `surface-base`, `surface-raised` or white, with at least `space-6` of margin around it. Minimum width 160px, maximum `layout-logo` (240px): below 160px the pixel letters of the RÉTRO block blur.

In the website header, the logo is tilted 3° to the left and overlaps the bottom of the banner. It is a brand gesture, to reproduce with the `tilted` prop of the `Logo` component. Elsewhere, set it straight.

Do not recompose the lockup, do not separate "mate" from the block, do not redraw the letters, do not apply a filter, a drop shadow or an extra outline.

## Colors: these files were fixed

The SVG export from the Illustrator master outputs colors converted from CMYK, and that conversion desaturates the pinks. The original export values were `#d12a7c` for the main pink and `#d65490` for the light pink — 43 and 30 units of RGB distance from the brand pink. Next to the website, these logos looked dusty.

The files in this group are therefore **re-tinted to the website's values, which are authoritative**:

| Illustrator export | fixed to | occurrences |
| --- | --- | --- |
| `#d12a7c` | `#ea4592` (`brand-pink`) | 27 |
| `#d65490` | `#f14794` (logo light pink) | 16 |
| `#321356`, `#331456` | `#331655` (`brand-purple`) | 19 |

The file's `#4fa9d0` is kept as is: it is not a brand color but a 20% opacity veil that draws the diagonal band of the RÉTRO block. Rendered on the purple, it gives `#39336e` — 2.4 units from the `brand-slate` token, which confirms that value along the way.

The Illustrator master was not modified: it still carries the converted values. **To do on the next pass on the `.ai` file**: apply the same mapping, so later exports no longer need fixing. Until then, do not re-export over these files without reapplying the fix.

## Still to provide

The website repository's `favicon.svg` is still not vector: it is an SVG wrapper around two base64 PNGs, and its light and dark variants are two identical images. It should be regenerated from `mdlr-logo-couleur.svg`, which really is vector.
