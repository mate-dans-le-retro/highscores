The end-of-tournament screen: three `radius-none` blocks in `rank-gold`, `rank-silver`, `rank-bronze`, the first one higher and wider, ordered 2 – 1 – 3.

The rank is written out under the color: « 1re place », « 2e place », « 3e place ». **Replace the medal emoji** of the current screen — they do not render the same from one device to another, and are not usefully announced by a screen reader.

The three colors are taken exactly from the existing podium screen in the arcade and scene themes, and darkened in the console theme to stay readable on a light background.

The next finalists are listed under the podium, in `body-sm` on `surface-raised`, not on a fourth colored block.

A podium is a whole screen: place it on `surface-base`, centered, with `space-24` of margin in the `scene` theme.

`second` and `third` are optional — a tournament with two finalists renders two blocks.
