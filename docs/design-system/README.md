# MDLR design system in this repository

The reference is the MDLR "Design System" artifact: https://claude.ai/artifact/Pja2gYg1rDtHBykCDhhrTX. This folder keeps an English copy that any agent can read, and explains how it is wired into the app.

## What is in this folder

| File                                                     | Content                                                                                                  |
| -------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| [foundations.md](foundations.md)                         | Editorial tone, colors, type, spacing, registers, icons, logo. **Read first.**                           |
| [guidelines/10-screens.md](guidelines/10-screens.md)     | Projection rules (`scene` theme): minimum sizes, density, no looping animation. Essential for `/screen`. |
| [guidelines/20-products.md](guidelines/20-products.md)   | The three MDLR products, including the **Highscores** section.                                           |
| [guidelines/30-migration.md](guidelines/30-migration.md) | Wiring shadcn to the tokens (written for the Tournaments app, same principle here).                      |
| [components/](components/)                               | One page per reference component (ScoreTable, RankBadge, Podium, PixelPanel, Button…).                   |
| [assets/](assets/)                                       | Logos and patterns: versions and usage rules.                                                            |
| [tokens.json](tokens.json)                               | The raw tokens of the three themes.                                                                      |

The component pages describe the components of the reference bundle (`variant`, `fresh`, `onSelectRow` props…). In this repository, we **reimplement** them in React + Tailwind + shadcn following the described behavior; their props are a good starting point for the API.

The interface text quoted in these pages (« À venir », « Démarrer le tournoi »…) stays in French: it is what the players and volunteers read.

## How it is wired into the code

`src/styles.css` loads, in order:

1. `tailwindcss` and `tw-animate-css` (shadcn animations);
2. `src/styles/mdlr/tokens.css`: the variables of the three themes, copied from the design system's `mdlr.css`;
3. `src/styles/mdlr/tailwind.css`: the design system's Tailwind v4 preset (`@theme inline`), which creates the `bg-surface-*`, `text-ink-*`, `text-h1…h6`, `text-scene-*`, `text-arcade-*`, `font-display`, `shadow-pixel`, `rounded-md/lg/xl` utilities and sets `--spacing: 4px`;
4. `src/styles/mdlr/shadcn.css`: the shadcn variables wired to the tokens, and the `dark:` variant tied to the dark themes.

`tokens.css` and `tailwind.css` are **copies**: do not edit their values by hand, copy them again from the artifact if the design system changes.

### shadcn → MDLR mapping

| shadcn                           | MDLR                                         | Note                                      |
| -------------------------------- | -------------------------------------------- | ----------------------------------------- |
| `background` / `foreground`      | `surface-base` / `ink-primary`               |                                           |
| `card`                           | `surface-raised`                             |                                           |
| `popover`                        | `surface-overlay`                            |                                           |
| `primary` / `primary-foreground` | `surface-accent` / `ink-on-accent`           | pink, deep purple text (4.5:1 contrast)   |
| `secondary`, `muted`             | `surface-sunken`                             |                                           |
| `muted-foreground`               | `ink-secondary`                              | not `ink-muted`, invisible when projected |
| `accent`                         | `surface-overlay`                            | hover lightens by one step                |
| `destructive`                    | `state-danger`                               | only for deleting                         |
| `border` / `input` / `ring`      | `line-subtle` / `line-strong` / `focus-ring` |                                           |

### Themes

Each route declares its theme: `createFileRoute('/screen')({ staticData: { theme: 'scene' } })`. Values: `scene` (projected screen), `arcade` (phone, default), `console` (admin, light).

## Rules to remember

- No hard-coded hex, radius or size: go through the utilities.
- **Pixel** register for the public (square corners, `border-4`, `shadow-pixel`, `font-display`); **application** register for the admin (`rounded-*`, `shadow-card`). Do not mix them on the same component.
- `font-display`: three words max.
- Projection: `text-scene-row` (40px) minimum, ten rows max, rotation every 15 s, no looping animation, no pixel pattern under text.
- A state color is always paired with a word.
- Icons: Lucide only, 2px stroke, 20px in the admin, 24px in public, never in the pixel register.
- No emoji in the interface, no copyrighted characters as icons.
- Tone: this app says "tu" everywhere, unlike the "vous" of [foundations.md](foundations.md) (see [docs/decisions.md](../decisions.md)).
