The pixel squares pattern that runs behind tournament bands and in the corners of the website's sections. It is the brand's signature texture.

Wrap any container: the pattern is set as a pseudo-element at `z-grid`, behind the content, without intercepting clicks.

The pattern is **decorative**. It sits at about 1.2:1 against its background and never carries information. Do not put text under 18px on it.

Use `over` when the pattern goes over an image or an event poster: it is then toned down to `opacity-grid`.

**Do not use it in the `scene` theme** behind text: the 24px grid creates moiré with the physical grid of LCD panels and DLP chips. When projected, the pattern stays on the edges or behind solid fills.

Pass `as` to change the rendered tag — `section` for a page band, `div` by default.
