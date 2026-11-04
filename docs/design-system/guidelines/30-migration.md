# Migrating the Tournaments app

The app runs on Next 16, React 19, Tailwind 4.2 and shadcn/ui in the *new-york* style, with lucide-react, next-intl and Supabase. The system is designed to sit on top of it without breaking anything: shadcn already sets its colors as CSS variables, and it is enough to rewire those variables to the tokens.

## The colors have drifted

`src/app/global.css` defines its colors in `oklch` and explicitly names them "Mate dans le Rétro branding". Once converted, they are not the brand's:

| role | app today | brand | gap |
| --- | --- | --- | --- |
| purple | `oklch(0.25 0.115 295)` = `#280c51` | `#331655` | 15 in RGB distance |
| pink | `oklch(0.65 0.22 340)` = `#e048b8` | `#ea4592` | **39 in RGB distance** |

The purple almost passes; the pink does not. The app's leans toward a purplish magenta, the brand's toward raspberry. Side by side — a website tab and an app tab — the difference shows.

The fix is short: replace the `:root` values with `var(--brand-purple)` and `var(--brand-pink)`, or directly import the system's `tokens.css` and `tailwind.css` and point the shadcn aliases at them (`--primary: var(--surface-accent)`, `--background: var(--surface-base)`, `--card: var(--surface-raised)`, `--destructive: var(--state-danger)`).

## Four things to fix along the way

`a { color: var(--color-brand-secondary) }`: `brand-secondary` is exactly the background color. **Links are invisible**, at 1:1 contrast. Switch them to `ink-accent`.

The `.dark` block copies `:root` value for value. So there is no light theme: the selector exists and does nothing. Either wire it to the system's `console` theme, or delete it. (The website's `favicon.svg` has exactly the same flaw, with two identical light and dark variants — worth checking where the habit comes from.)

In `@theme inline`, five entries reference themselves: `--color-brand-primary: var(--color-brand-primary)`. It only works because the `:root` block comes later in the file and wins in the cascade. The other entries follow the right pattern, with two distinct names (`--color-card: var(--card)`). Align them before someone reorders the file.

`components.json` declares `"css": "src/app/globals.css"`, but the file is named `global.css`, without the "s". The shadcn CLI would write to the wrong place on the next component generation. It also declares `tailwind.config.ts`, which does not exist — normal in v4, but it may as well be emptied.

## Radii

The app starts from `--radius: 0.625rem` (10px) and derives 6, 8, 10 and 14px from it. The system offers 0, 4, 8, 12, 16 — a scale on the 4px grid, with `radius-none` for the pixel register. Switch all at once rather than component by component: it is the kind of 2px gap that only shows when both coexist.

## Contrast

White on the primary pink gives 3.42:1, under the 4.5 threshold. It is the same question as on the website, and the system solves it with `ink-on-accent` (deep purple on pink, 4.53:1). Primary buttons and the app bar are affected.

## What the code teaches the system

The tournament table knows a state the screenshots did not show: **"Qualifié d'office"**, for a player exempt from a round (a bye). The app renders it in green — the same register as "En cours", so two different meanings share one color. The system adds `state-bye-surface` and `state-bye-ink`, on the blue axis, distinguishable from the green including with red-green color blindness.

`PoolBracket.tsx` is 22,000 characters long and carries the table, the podium and the end screen on its own. It is the right place to start: `PixelPanel`, `BracketMatch`, `Podium` and `ScoreTable` cover most of what it draws by hand.

The podium builds medals with emoji (`medals[index] || '🏆'`) and `bg-linear-to-br` gradients. `Podium` replaces them with `rank-*` fills and the written rank.

The `public/images/background.svg` background is in the system, `Motifs` group. Its fill, `#38195C`, is exactly `surface-raised` in the arcade theme — that is where the value comes from.

Finally, the sprite of Mario in a kart in the middle of the table is a Nintendo copyrighted character inside a product, not in event communication. It is the only one in the whole system, and the easiest to replace.
