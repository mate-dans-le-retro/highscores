The association's full lockup, used as is from the `Logos` asset group.

The product provides the asset URL in `src`: the system never redraws the brand and does not embed the file in the bundle.

Place the logo on `surface-base`, `surface-raised` or a white fill. It keeps `space-6` of margin around it, applied by the component.

Pass `tilted` for the 3° tilt of the website header — it is a brand gesture, for the header placement and not for an app bar. Do not go below 160px wide: below that, the pixel letters of the RÉTRO block blur. For an app bar, use `AppBar` with `logoSrc`, which handles the reduced height.

Do not recompose the lockup, do not separate the word "mate" from the block, do not apply a filter or a tint. There is no vector or monochrome version in the sources: for large-format printing, ask for the original file.

Set `alt` only if the logo is not already accompanied by the association's name in text; otherwise pass `alt=""`.
