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

Rotation (15 s by default) and the number of rows (10 by default) are settings, to be changed from the admin. The public screen accepts `?rotation=<seconds>` (5 to 300), `?rows=<count>` (1 to 10, the design system's maximum) and `?minAllTime=<count>` (floor for the all-time block, 5 by default) to override them on the fly, for example on a second screen. Values are validated and clamped with zod in the route's search params; invalid ones are ignored.

Supersedes the earlier "5 rows by default" wording from the same day: Clément set the default to 10, with `min_all_time_rows` (default 5) so the all-time block can shrink for current-event extras but never below that floor.

## 2026-11-05: Vitest for the data layer

`pnpm test` runs Vitest on plain TypeScript modules (ranking, score formatting, new record detection, anonymization, mock switch, screen options). It has its own `vitest.config.ts`, without the TanStack Start plugins.

## 2026-11-05: anonymous nicknames, dual photos, screen leaderboard shape

- Anonymous nicknames are generated (character + qualifier + optional flourish, French agreement), seeded by the normalized player name and the game id, so one nickname per player per game. Per-game character lists with a long pop-culture fallback live in `src/lib/data/anonymous-name.ts` for Claude to reuse on the server.
- Each submission keeps a proof photo (~2000 px JPEG ~0.85) and a thumbnail (~800 px). The mock stores both in IndexedDB; HEIC that the browser cannot decode is kept as the original, never rejected.
- The public leaderboard is a `ScreenLeaderboard`: all-time top N (past events dimmed with event name), current-event scores outside that top under a separator without duplicates, empty state flag. No `current_event_rows` / `?eventRows=`.
- Mock mode shows a "Données de démo" watermark.
- Game tiles use `cover_path` when set; otherwise the UI falls back to `short_label` (trigramme placeholder).

## 2026-11-05: the public reads scores through `public_scores()` only

The public has no read access to `scores` any more. It calls `public_scores()` (security definer), which returns the approved scores of visible games, every event included, and never the name or the photo of a score kept off screen. Those rows come with `anonymous_seed`, an HMAC-SHA256 of the normalized name and the game id, keyed by a secret stored in the unexposed `private` schema: one stable nickname per player per game, which cannot be traced back to a first name by hashing a list. The browser turns the seed into the nickname with `anonymousName()`, so the nickname lists stay in one place. Ranking and the screen layout stay in the browser too (`rankScores`, `buildScreenLeaderboard`), shared with the mock: a weekend is a few hundred scores.

A function rather than a view with the owner's rights: same filtering through PostgREST, without the "security definer view" lint.

## 2026-11-05: realtime through `change_signals`

Realtime respects RLS, and the public cannot read `scores` any more. Triggers bump one row per topic (`games`, `scores`, `settings`) in `change_signals`, the only table in the publication; the screen refetches on each signal. Pending submissions send no signal, so the public cannot even tell that someone submitted.

## 2026-11-05: the public screen reconnects, then reloads

A projected tab never gets a focus event, so TanStack Query never refetches on its own: if realtime drops, the screen freezes without telling anyone. The screen detects the drop from the channel status and the browser's network events, resubscribes with a backoff, and refetches everything once it is back. After 60 seconds without a connection, it reloads the page, as long as the site answers. We chose detection over a blind reload every few rotations because Supabase reports every way a channel can fail (error, timeout, close) and its heartbeat catches a socket that dies silently.

## 2026-11-05: a global flood guard, not a per-device limit

Everyone at the venue shares one wifi, so a limit per IP would block the room. A trigger refuses player submissions beyond 30 per minute in total, and volunteers can close submissions from the settings (which also blocks photo uploads). To revisit if someone actually abuses it.

## 2026-11-05: the photos bucket accepts any image type

A photo is never refused: some phones send `image/heif` or no type at all. The bucket accepts `image/*` (still no HTML or scripts). The browser uploads a ~2000 px proof (`photo_path`, for the admin) and a ~800 px thumbnail (`thumb_path`, for the screen) when it can resize; `public_scores()` returns the thumbnail when there is one.

## 2026-11-05: an admin for the weekend, simple first

- Volunteers sign in with an email and a password, created by hand in Supabase: no email links to configure before Saturday. Superseded by "Google sign-in for volunteers, sign-ups still closed" below, with email and password kept as a fallback.
- The submissions queue refreshes every 10 seconds instead of listening to realtime: the public must not receive score rows, and a short delay is fine for a volunteer.
- Games are reordered with up and down arrows, not by dragging rows as in the mockup: it works the same on a phone.
- A free game name ("Un autre jeu") is either created as a new game from the submission, or linked to an existing game by picking it in the list.
- Instagram: the admin shows the player's consent and handle, but does not publish yet.

## 2026-11-05: Google sign-in for volunteers, sign-ups still closed

Volunteers sign in with Google, so they have no password to remember. Sign-ups stay closed: we create each volunteer's user first, and their Google identity links to it through the email. With sign-ups open, any Google account could create a user. That user would have no rights, but we would have to check every policy against a signed-in stranger. Rights still come only from `public.admins`. Email and password stay as a fallback, in case Google fails on the venue network during the event.

## 2026-11-05: public screen after the visual review

Clément's calls on the review of the public screens, and how we applied them.

- **Leaderboard composition.** The all-time block and the rows under the separator are settled together: the block shrinks for the current-event scores that fall out of it, which can push more of them out, until it is stable (never below `min_all_time_rows`). No current-event score is left out while a lower one is shown; when there are too many, the lowest ones go. Every row keeps its all-time rank, so ranks only go down the screen ("5" then "6", "14"…), never two "4". Cups are for the podium at the top; rows under the separator have a plain numbered square, and the separator carries the event name, in pixel type, to read from afar. We kept the all-time rank rather than the event rank under the separator: the two blocks are one ranking cut in two, and a "3" under a "5" is what looked wrong.
- **Pink and white.** A row that just came in is pink for 30 seconds of screen time (the clock waits while a "Nouveau record" covers the table), then fades back. The first place is white, faded like the other past-event rows when it comes from an older event. Pink stays rare, as the design system asks, and the record still stands out.
- **Record panel.** Titled "Record de l'évènement", with the photo, the name, the score and the time. When nobody has scored yet this event, it shows the all-time record as "Record de tous les temps", with its date and event. A game with no score at all drops both side panels and puts a large QR code in the table.
- **Labels.** Panel titles sit above the frame, as on the mockup, in 28px pixel type (the design system's projected minimum) on a solid chip (not on the pixel pattern); a label too long for its column wraps on two balanced lines. The game eyebrow ("GAME BOY · BORNE 3") stays at 22px, under the 28px game name. Capitals in the pixel font drop their accents (`pixelCaps()`), since Press Start 2P draws É and À as lowercase letters.
- **No photo.** An anonymous record shows a masked pixel bust and "INCOGNITO !"; a record without a photo shows the bust and "SANS PHOTO". Never "Photo de Un …". Record photos are contained, not cropped, on a dark surface: a phone photo held upright keeps the player and the score.
- **Rotation.** After a "Nouveau record", the screen shows that game from the start of its time, with the new row in pink. A click on a pill shows that slide from the start. Pills are 96px clear of the bottom edge.
- **Wall.** Games are shared evenly between pages (7 → 4 + 3) and each row of cards is centred. The photo takes two fifths of a card at most, so names and scores fit without the header. Without the header, the wall still has its "LES RECORDS" title. A card says when its record is also the all-time one (`wallCardView()`): the gold "TOUS LES TEMPS" badge of the "Nouveau record" screen, in 28px pixel type, when the event record is the best ever; no badge but the "★ Alex · 520 000" line when the all-time record is another score; the badge plus the event and date of origin when nobody has scored this event yet.
- **"NOUVEAU RECORD !"** is in `brand-pink`, as on the mockup (the design system allows it from 24px).
- **Demo data.** The current event of the mock is dated from now (minutes, hours and a day ago), and the demo rotation alternates the wall and the games.
