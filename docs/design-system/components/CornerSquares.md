The three `space-4` squares set at each top corner of a section band, in `brand-pink` and `brand-purple`.

It is as much a signature of the website as the purple / pink alternation: some squares have a negative offset and overlap the previous band, which visually stitches the sections together instead of stacking them.

The offsets are taken from the website's template, in `space-1` units. Two clusters are provided, `variant="a"` and `variant="b"`: alternate them from one band to the next so the pattern does not repeat identically down the page.

`SectionBand` sets them by default — you rarely need this component directly. Turn them off on the first band of a page, which has nothing above it to overlap.

The component is purely decorative: it is marked `aria-hidden` and does not intercept clicks. Do not attach anything informative to it.

Do not add more, do not put any at the bottom of a band, do not enlarge them. Three per corner, two corners, 16px: that dosage is what makes them noticeable without becoming a pattern.
