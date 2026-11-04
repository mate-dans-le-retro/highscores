# Decisions

Log of structural choices. Add a dated entry when a new one is made; do not rewrite old ones, mark them "superseded by".

## 2026-11-04: TanStack Start + Supabase, on Vercel

Three days before the event. TanStack Start gives us React with server functions to keep secrets on the server (score detection from a photo, Instagram) without running separate Edge Functions. Supabase covers the database, realtime for the public screen, photo storage and volunteer auth in one go. MDLR already has GitHub, Supabase and Vercel accounts.

## 2026-11-04: shadcn/ui themed by the MDLR design system

Components come from shadcn (new-york, Radix). Their variables (`--primary`, `--background`…) are wired to the MDLR tokens in `src/styles/mdlr/shadcn.css`, so they follow the three themes without recompiling. The design system's React bundle (React 18, `MDLR` global) is not used. MDLR-specific components will be written here, then extracted later into a shared library.

## 2026-11-04: a single `scores` table for submissions and admin entries

A player submission and a score entered by a volunteer are the same object at different stages (`status`, `source`). A single table keeps the leaderboard, realtime and admin simple.

## 2026-11-04: sign-ups closed, volunteers in `public.admins`

No public sign-up. An Auth account alone grants nothing: it has to be in `public.admins`. This way, sign-ups opened by mistake would not give access to the admin.

## 2026-11-04: public repository

Nothing sensitive in the code; the publishable key is public by design and RLS protects the data. The repository is also a showcase for the association. Consequence: never any real player data in seeds, tests or screenshots.

## 2026-11-04: photos in a public bucket

The public screen and the admin show photos without signing URLs. File names are UUIDs and the bucket cannot be listed by the public. To revisit if we want to hide photos of rejected submissions (private bucket + signed URLs from the admin).

## 2026-11-04: everything in English except the interface

Code, identifiers, routes, comments, docs, commit messages and pull requests are in English. The interface stays in French, for the players and volunteers.

## 2026-11-04: "tu" everywhere in the interface

The interface speaks to players and volunteers with the informal "tu", on the public screen, the player form and the admin alike. The tone of voice is simple, fun and retro, like a bunch of friends in their forties playing on the console. It fits the event and the mockups. This departs from the design system, which uses "vous" for the association's website.

## 2026-11-05: a mock data source behind `VITE_DATA_SOURCE=mock`

The screens are built while the schema for events, masking and settings is still being written, and Docker is not available on every machine. Pages only import `src/lib/highscores.ts`, which reads from a `HighscoresSource`: the Supabase one by default, or a mock one that keeps fake data in `localStorage` when `VITE_DATA_SOURCE=mock`. The mock follows the target model (`src/lib/data/types.ts`); the Supabase source maps the current schema with defaults until the migration lands. Without the flag, nothing changes on preprod and production.

The URL can also switch it: `?mock=1` turns the mock on and `?mock=0` turns it off, for the rest of the tab's session (sessionStorage), whatever the variable says. The variable is meant for local work only; on a Vercel preview, the mock is turned on from the URL. Anyone can do the same on production, but it only shows fake data in their own browser.

## 2026-11-05: product rules for submissions and records

- The photo is mandatory: it is the proof, the player and the score must both be on it.
- "Un autre jeu": a player can submit a score for a game that is not in the list, with a free game name and no `game_id`. A volunteer then creates the game from it or links it to an existing one.
- The record wall and the "NOUVEAU RECORD !" screen are needed for the first event: the model serves the all-time record and detects a new first place.
- The eyebrow above a game name is the console (stable, on the game) plus an optional station label set per game and per event ("Super NES · Étage"). Each score keeps its event, so an old record shows with the label of its own event.
- A player who does not want to be on screen stays ranked, under a retro nickname ("Un Mario anonyme"), stable for a given score. The real name is kept in the database; what changes is what leaves the backend: a source never returns the name or the photo of an anonymous score, and the real backend must guarantee it on the server side (view or server function), not only in the browser.
- The "TOUS LES TEMPS" badge only shows when the new record beats the best existing score of every event.
- Score types are a closed list that is easy to extend: `points` and `time` (stored in milliseconds, shown as 1'32"48) today, plus `other`. A new type needs a name in `ScoreType` and a formatter in `src/lib/format.ts`.
- A photo is never refused: when the browser cannot shrink it (HEIC outside Safari), the original file is kept.

## 2026-11-05: screen rotation and rows are settings the URL can override

Rotation (15 s by default) and the number of rows (5 by default) are settings, to be changed from the admin. The public screen accepts `?rotation=<seconds>` (5 to 300) and `?rows=<count>` (1 to 10, the design system's maximum) to override them on the fly, for example on a second screen. Values are validated and clamped with zod in the route's search params; invalid ones are ignored.

## 2026-11-05: Vitest for the data layer

`pnpm test` runs Vitest on plain TypeScript modules (ranking, score formatting, new record detection, anonymization, mock switch, screen options). It has its own `vitest.config.ts`, without the TanStack Start plugins.
