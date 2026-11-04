The system serves three surfaces: the event website `matedansleretro.fr`, the app that manages and displays tournaments, and the highscores display. It comes in three themes — `arcade` (dark, default), `console` (light, for dense management screens) and `scene` (projection and big screens) — and two visual registers that live side by side without mixing: the **pixel register**, inherited from the logo's RÉTRO block, for everything the public looks at; the **application register**, rounded and plain, for what volunteers work with.

## Editorial foundations

The interface is written in French, with the formal **"vous"**, in the first person plural: « on vous attend les 7 et 8 novembre », « on prépare les tournois de Volume III ». The "on" is the association's voice, not an institutional "nous".

The tone is that of a group of enthusiasts welcoming people at home: direct, warm, a little teasing, never salesy. Write « Toujours l'ambiance comme à la maison, avec encore un peu plus de machines et de folie ! » rather than « une expérience immersive inédite ». Own the enthusiasm with one exclamation mark per idea, not three.

Name the association **Mate dans le Rétro… Gaming** in full at the first mention in a document, then **MDLR** in internal interfaces and product names. The ellipsis in the full name is part of the brand: keep it.

Write the website's section titles in **uppercase** (`AU PROGRAMME`, `LES TOURNOIS`, `LES INFOS IMPORTANTES À CONNAITRE`), with accents on capitals. In apps, write titles in sentence case (`Gestion du tournoi`, `Configuration du tournoi`): these are tools, not posters.

Write dates in full and in lowercase (« samedi 7 novembre de 10h à minuit »), times as `20h00`, prices with a non-breaking space before the euro sign (« Pass week'end : 8 € »). Game names keep their official spelling: *Super Bomberman 2*, *Mario Kart*, *Just Dance*, *Super Smash Bros*.

Emoji belong to communication, not to products. The brand uses them in its metadata and posts — « Association de quarantenaires geeks nostalgiques 🎮 📺 » is the website's description — and that is fine. In an interface, however, they render differently from one device to another and are poorly announced by screen readers: podium medals are colored blocks in `rank-gold`, `rank-silver`, `rank-bronze` with the rank written, not emoji characters — the current podium screen uses them and should be fixed.

Use the association's words for business objects: a **tournoi** is made of **poules** then **phases finales**, each **match** opposes **joueurs**, a tournament is **à venir**, **en cours** or **terminé**. Do not bring "bracket", "seed" or "round" into the French interface; these terms stay in the code.

## Visual foundations

### Color

Two colors make the brand and never change: `brand-purple` (#331655) and `brand-pink` (#ea4592). They are identical in the three themes. Every MDLR interface alternates these two fills, punctuated with white.

Set backgrounds with `surface-base`, `surface-sunken`, `surface-raised` and `surface-overlay`, never with a hard-coded `brand-purple`: this is what lets the same component switch to the light theme and the projection theme.

Alternate the large page bands between `surface-base` and `surface-accent`, as the website does. A pink band never carries two levels of gray: on `surface-accent`, use `ink-on-accent` for all text, and `ink-on-accent-large` only for headings of 24px and more.

Use `ink-accent` for pink text, not `brand-pink`: `brand-pink` on `surface-base` reaches 4.16:1, which reserves it for headings of 24px and more, or bold from 19px. `ink-accent` passes at any size.

Reserve `state-danger` for destructive actions, and `state-live-*`, `state-soon-*`, `state-done-*` for the three tournament states. These four colors serve no other purpose: a red button in MDLR deletes something.

Always pair a state color with a word. Pills carry the label (« À venir », « En cours », « Terminé ») and the bracket table marks the winner with a `surface-accent` fill **and** an icon, never with color alone.

### Typography

**Montserrat** is the brand font, variable from 100 to 900, italics included, loaded from Google Fonts. It is the website's exact value, with its full fallback stack in `type.families.sans`. It carries everything: headings and running text.

Only three weights, the website's: **400** for running text, **600** for medium emphasis and links, **800** for headings and strong passages. Do not introduce 500 or 700 — the brand's bold is an 800, heavier than most systems' default bold.

All of the website's headings are **uppercase**. This is a template rule, not a token property: add `text-transform: uppercase` or the `uppercase` class. In apps, headings stay in sentence case — they are tools.

Running text has a tight line height (18px on 24px, i.e. 1.33). This is deliberate and it is the brand's rhythm: do not loosen it to "add air".

`display` (Press Start 2P) is the pixel font, reserved for moments when the public watches a game screen: bracket titles, player names, podium, highscores table. `mono` carries numeric values that refresh (`numeric`), so the digits do not jump.

Never set a paragraph in `display`. Beyond three words, the pixel font stops being readable: switch to a short `arcade-label`, or to `eyebrow`. Do not take `arcade-name` below 16px nor `scene-pixel` below 28px — below that, the counters close up, even more on a projector.

**Press Start 2P** is the confirmed pixel font: the Tournaments app loads it through `next/font/google` and uses it for the tournament table, the podium screen and the winner's rank number. So it is no longer a substitute. Neither of the system's two fonts needs to be self-hosted: Montserrat and Press Start 2P both come from Google Fonts.

### Spacing and grid

Everything is a multiple of `space-1` (4px). This grid is not an arbitrary convention: it is the grid of the brand's pixel art, and it is also Tailwind's grid once the preset is in place — `p-6` equals `space-6`.

The website's values: a section band has `space-12` padding at the top, `space-16` on the sides and `space-24` at the bottom, its blocks are `space-10` apart, and its content fits in `layout-lg` (1024px), in columns of `layout-column` (296px) at most.

Elsewhere: `space-6` inside a card, `space-4` horizontally inside a button or a field, `space-8` inside a modal, `space-24` around the edge of any projected screen.

### Corners and depth

Pick the register before the radius. Pixel register: `radius-none`, `border-pixel` border in `line-accent` or `line-strong`, depth through `shadow-pixel` (hard offset, no blur). Application register: `radius-md` for fields, `radius-lg` for buttons, `radius-xl` for cards, `radius-pill` for pills, depth through `shadow-card`.

Do not mix both on the same component: a bracket panel with rounded corners and a blurred shadow loses all identity.

### Background pattern

The pixel squares pattern is the brand's signature texture — it runs behind tournament bands and in the corners of the website's sections. Set it with the `mdlr-pixelgrid` class or the `PixelGrid` component, in `grid-dot` and `grid-dot-bright`, on a `space-6` grid.

This pattern is decorative: it sits at about 1.2:1 against its background and must never carry information or go under text smaller than 18px. On a photo or a poster, tone it down to `opacity-grid`.

The website uses a second, sparser form: three isolated `space-4` squares per top corner of a band, in `brand-pink` and `brand-purple`, some overlapping the band above. They are what stitch the sections together. Set them with `CornerSquares`, or `SectionBand`, which sets them by default.

### States and focus

Give every interactive element a visible focus: `shadow-focus`, solid, with a 2px offset. The ring is chosen to hold 3:1 on every surface of the theme, pink band included — do not replace it with a pink ring, which fails on `surface-raised`.

A disabled state combines `opacity-disabled` and `aria-disabled`: opacity alone is not enough to meet the contrast threshold.

On hover, lighten the surface by one step (`surface-raised` → `surface-overlay`) rather than changing the hue.

### Motion

Motion is short and crisp, never smooth: 120 ms transitions in `steps(3)` or `linear` to stay in the 8-bit spirit, no elastic easing. Projected screens carry no looping animation: permanent movement on a projector tires a room within minutes.

## Iconography

The system keeps **a single icon set: Lucide.** The Tournaments app already uses it through `lucide-react`, and it is a geometric 2px stroke that matches the brand's drawing.

2px stroke, 20px in management interfaces, 24px on public screens, in `ink-secondary` at rest and `ink-accent` when active.

Do not add a second library. Font Awesome, Material Symbols or Phosphor would bring a second vocabulary and above all a second style — Font Awesome is mostly filled, Lucide is outlined — and two icon styles in the same product show immediately. That is exactly the drift this system exists to fix. A third-party icon font also brings its own license and attribution terms, to check before any use.

If the ergonomics of an icon font are wanted — writing `<i class="icon-trophy"></i>` rather than importing a component — **Lucide provides one**, without changing vocabulary: import `lucide-static/font/lucide.css` and use the `icon-<name>` classes. Same drawing, same license, same names as the React components.

Beware though: Lucide's documentation notes that this font embeds **all** the icons and noticeably slows down loading. On a screen projected in a village hall, over its wifi, that costs. Keep the font for static pages and use `lucide-react` in the app, which only loads the icons actually used.

In the pixel register, do not use Lucide at all: brackets use a gamepad drawn in pixels, and the `RankBadge` cup is an original drawing on a 16 grid. A 2px outline icon next to a pixel drawing clashes. For a new pixel element, draw on the 4px grid with `radius-none`.

Never carry information with an emoji. Rendering changes from one system to another, the color cannot be controlled, and screen readers announce them poorly or not at all — the current podium screen uses 🥇🥈🥉, which `RankBadge` replaces.

Game visuals (Mario, Kirby, Bomberman, Chun-Li…) are copyrighted characters, used in event communication. They are not part of the system and never serve as interface icons. The tournament table currently shows a sprite of Mario in a kart in its center: it is the only place where a copyrighted character slipped into a product, and the easiest one to replace with an MDLR figure.

## Brand and logo

The logo is the full lockup — "mate" in pink script, the "DANS LE / RÉTRO" block in white pixel letters on purple, the "GAMING" pill. It is provided in the `Logos` asset group and is used as is: do not redraw it, do not recompose it, do not separate the word "mate" from the block.

Place the logo on `surface-base`, `surface-raised` or white. Keep a margin of at least `space-6` around it. Minimum width 160px, maximum `layout-logo` (240px): below 160px, the pixel letters of the RÉTRO block blur.

In the website header, the logo is **tilted 3° to the left** and overlaps the bottom of the banner. This is a deliberate brand gesture, not a template accident: reproduce it with `tilted`. In an app bar or a footer, set it straight.

The logo exists in **four vector versions**, all in the `Logos` asset group: a color version outlined with a white rule that works on every background, the same without the rule for light backgrounds and pink, and two monochrome versions. The master is an Illustrator file in four-color CMYK with all text outlined.

Files are named after the background they go on. By default, use `mdlr-logo-couleur-fond-sombre.svg`, which has a white rule and works everywhere. The `fond-clair` version never goes on `brand-purple`: the RÉTRO block is that very purple and disappears. The details of each version are in the group's README.

The system's files were re-tinted to the website's colors: the Illustrator export outputs colors converted from CMYK, which desaturates the pinks by about forty units. The `.ai` master still carries the converted values and remains to be fixed.

Do not confuse them with the `favicon.svg` of the website's repository: that one is not vector at all, it is an SVG wrapper around two base64 PNGs.

## How to consume this system

Each product loads `tokens.css` then `components/bundle.css`, and sets `data-theme` on `<html>`: `arcade` by default, `console` on management screens, `scene` on any projected or big-screen display.

Three ways to consume the system, depending on the product.

**Static website, without a build tool.** Link `mdlr.css` and nothing else. This file contains the variables of the three themes, one class per type style and all the component classes. Set `data-theme` on `<html>` and the `mdlr-root` class on `<body>`, add the Google Fonts link for Montserrat and Press Start 2P, and that's it. This is the path for `matedansleretro.fr`, which has no build chain.

**Tailwind v4 app.** Load `tailwind.css`, the `@theme` preset, which turns the tokens into native utilities: `bg-surface-raised`, `text-ink-accent`, `text-h2`, `font-display`, `rounded-xl`, `max-w-column`. It also sets `--spacing: 4px`, which aligns Tailwind's whole numeric scale on the brand's grid, and provides `bg-purple`, `bg-pink`, `text-purple`, `text-pink` — the classes the website currently writes by hand. Do not load `mdlr.css` as well: the two would overlap.

**React components.** `components/bundle.js` exposes the `MDLR` global and renders exactly the classes of `bundle.css`, so a product can migrate component by component without a visual break.

Because the Tailwind preset is declared with `@theme inline`, the utilities point to the system's variables: `bg-surface-base` follows `data-theme` without recompiling. The system's state colors replace the Tailwind palettes used today in the Tournaments app — write `bg-state-danger` rather than `bg-red-600`.

`mdlr.css` is a file **generated** from `tokens.json` and `bundle.css`. Do not edit it by hand: fix the source and regenerate, otherwise the next generation overwrites the change.

Never copy a hex value, a radius or a size into a product's code. Every value goes through a `--token-name` CSS variable or the matching Tailwind utility.
