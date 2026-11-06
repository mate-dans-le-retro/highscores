# Decisions

Log of structural choices. Add a dated entry when a new one is made; do not rewrite old ones, mark them "superseded by".

## 2026-11-04: TanStack Start + Supabase, on Vercel

Three days before the event. TanStack Start gives us React with server functions to keep secrets on the server (score detection from a photo, Instagram) without running separate Edge Functions. Supabase covers the database, realtime for the public screen, photo storage and volunteer auth in one go. MDLR already has GitHub, Supabase and Vercel accounts.

## 2026-11-04: shadcn/ui themed by the MDLR design system

Components come from shadcn (new-york, Radix). Their variables (`--primary`, `--background`…) are wired to the MDLR tokens in `src/styles/mdlr/shadcn.css`, so they follow the three themes without recompiling. The design system's React bundle (React 18, `MDLR` global) is not used. MDLR-specific components will be written here, then extracted later into a shared library.

## 2026-11-04: a single `scores` table for submissions and admin entries

A player submission and a score entered by a volunteer are the same object at different stages (`status`, `source`). A single table keeps the leaderboard, realtime and admin simple.

## 2026-11-04: sign-ups closed, volunteers in `public.admins`

No public sign-up. An Auth account alone grants nothing: it has to be in `public.admins`. This way, sign-ups opened by mistake would not give access to the admin. Superseded for the sign-up policy by "Open sign-ups, promote from the admin" (2026-11-06); the fail-closed rule (rights only from `public.admins`) stays.

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
- The "RECORD ABSOLU" badge (first called "TOUS LES TEMPS") only shows when the new record beats the best existing score of every event.
- Score types are a closed list that is easy to extend: `points` and `time` (stored in milliseconds, shown as 1'32"48) today, plus `other`. A new type needs a name in `ScoreType` and a formatter in `src/lib/format.ts`.
- A photo is never refused: when the browser cannot shrink it (HEIC outside Safari), the original file is kept. Since then, HEIC is converted in the browser first (see "HEIC photos are converted in the browser, on demand").

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

Realtime respects RLS, and the public cannot read `scores` any more. Triggers bump one row per topic (`games`, `scores`, `settings`) in `change_signals`, the only table in the publication; the screen refetches on each signal. Superseded for pending scores by "Realtime fallback aligned with Tournaments" below: every score write now bumps `scores` so the admin queue updates live; the public still only sees approved rows via `public_scores()`.

## 2026-11-05: the public screen reconnects, then reloads

A projected tab never gets a focus event, so TanStack Query never refetches on its own: if realtime drops, the screen freezes without telling anyone. The screen detects the drop from the channel status and the browser's network events, resubscribes with a backoff, and refetches everything once it is back. After 60 seconds without a connection, it reloads the page, as long as the site answers. We chose detection over a blind reload every few rotations because Supabase reports every way a channel can fail (error, timeout, close) and its heartbeat catches a socket that dies silently. Superseded by "Realtime fallback aligned with Tournaments" below (polling while reconnecting; admin warns instead of reloading).

## 2026-11-05: a global flood guard, not a per-device limit

Everyone at the venue shares one wifi, so a limit per IP would block the room. A trigger refuses player submissions beyond 30 per minute in total, and volunteers can close submissions from the settings (which also blocks photo uploads). To revisit if someone actually abuses it.

## 2026-11-05: the photos bucket accepts any image type

A photo is never refused: some phones send `image/heif` or no type at all. The bucket accepts `image/*` (still no HTML or scripts). The browser uploads a ~2000 px proof (`photo_path`, for the admin) and a ~800 px thumbnail (`thumb_path`, for the screen) when it can resize; `public_scores()` returns the thumbnail when there is one.

## 2026-11-05: an admin for the weekend, simple first

- Volunteers sign in with an email and a password, created by hand in Supabase: no email links to configure before Saturday. Superseded by "Google sign-in for volunteers, sign-ups still closed" below, with email and password kept as a fallback.
- The submissions queue used to refresh every 10 seconds instead of listening to realtime. Superseded by "Realtime fallback aligned with Tournaments" below: the admin listens to `change_signals` and only polls while reconnecting.
- Games are reordered with up and down arrows, not by dragging rows as in the mockup: it works the same on a phone.
- A free game name ("Un autre jeu") is either created as a new game from the submission, or linked to an existing game by picking it in the list.
- Instagram: the admin shows the player's consent and handle, but does not publish yet. Superseded by "Instagram posts are made by hand, from the admin" below.

## 2026-11-05: Google sign-in for volunteers, sign-ups still closed

Volunteers sign in with Google, so they have no password to remember. Sign-ups stay closed: we create each volunteer's user first, and their Google identity links to it through the email. With sign-ups open, any Google account could create a user. That user would have no rights, but we would have to check every policy against a signed-in stranger. Rights still come only from `public.admins`. Email and password stay as a fallback, in case Google fails on the venue network during the event. Superseded by "Open sign-ups, promote from the admin" below.

## 2026-11-06: Open sign-ups, promote from the admin

Sign-ups are open so colleagues can create an Auth account themselves (Google or email/password). Fail-closed stays: Auth alone grants nothing; `/admin` only opens for rows in `public.admins`. Clément (or any admin) promotes from `/admin/users` (`list_registered_users` / `set_user_admin`), without SQL. Demotion is supported, except for yourself and the last admin. After a Google sign-up, the signed-in user can set a password for the venue wifi. Linking Google onto a password-only account is deferred.

## 2026-11-05: public screen after the visual review

Clément's calls on the review of the public screens, and how we applied them.

- **Leaderboard composition.** The all-time block and the rows under the separator are settled together: the block shrinks for the current-event scores that fall out of it, which can push more of them out, until it is stable (never below `min_all_time_rows`). No current-event score is left out while a lower one is shown; when there are too many, the lowest ones go. Every row keeps its all-time rank, so ranks only go down the screen ("5" then "6", "14"…), never two "4". Cups are for the podium at the top; rows under the separator have a plain numbered square, and the separator carries the event name, in pixel type, to read from afar. We kept the all-time rank rather than the event rank under the separator: the two blocks are one ranking cut in two, and a "3" under a "5" is what looked wrong.
- **Pink and white.** A row that just came in is pink for 30 seconds of screen time (the clock waits while a "Nouveau record" covers the table), then fades back. The first place is white, faded like the other past-event rows when it comes from an older event. Pink stays rare, as the design system asks, and the record still stands out.
- **Record panel.** Titled "Record évènement", with the photo, the name, the score and the time. When nobody has scored yet this event, it shows the all-time record as "Record absolu", with its date and event. Both titles fit on one line. On screen, "absolu" replaces "de tous les temps" everywhere. A game with no score at all drops both side panels and puts a large QR code in the table.
- **Labels.** Panel titles sit inside the white frame, in 28px pixel type (the design system's projected minimum) and in `brand-pink`, which the design system allows on white from 24px; a label too long for its column wraps on two balanced lines. Titles above the frame, on a dark chip, were tried and dropped. The game eyebrow ("GAME BOY · BORNE 3") stays at 22px, under the 28px game name. Capitals in the pixel font drop their accents (`pixelCaps()`), since Press Start 2P draws É and À as lowercase letters.
- **No photo.** An anonymous record shows a masked pixel bust and "INCOGNITO !"; a record without a photo shows the bust and "SANS PHOTO". Never "Photo de Un …". Record photos are contained, not cropped, on a dark surface: a phone photo held upright keeps the player and the score. The same rule applies to every row of the `ScoreTable`: a 48px square next to the cup, real thumbnail when the player is on screen, Incognito bust when anonymous, plain bust when there is no photo (caption omitted in the tight cell; `aria-label` carries it).
- **Rotation.** After a "Nouveau record", the screen shows that game from the start of its time, with the new row in pink. A click on a pill shows that slide from the start. A double click holds it: the progress bar goes away and a still "PAUSE" button sits beside the pills (no blinking, since the projected screen has no looping animation). A click changes slide at once, but the bar only starts over once the 400 ms double-click window is over, so it never shows at zero before a pause hides it. While held, a click on any pill, the current one included, resumes from the start of that slide; a click on "PAUSE" resumes the slide on screen from zero (`src/lib/rotation-control.ts`). Realtime keeps running: a "Nouveau record" still takes over, then the screen goes back to the held slide, still held. Pills are 96px clear of the bottom edge.
- **Wall.** Games are shared evenly between pages (7 → 4 + 3) and each row of cards is centred. The photo takes two fifths of a card at most, so names and scores fit without the header. Without the header, the wall still has its "LES RECORDS" title. A card says when its record is also the all-time one (`wallCardView()`): a large gold pixel star left of the player's name, where the mockup has the cup, drawn on the pixel font's own grid and centred on its letters, when the event record is the best ever; no star but the "★ Alex · 520 000" line under the score, with a small star, when the all-time record is another score; the star plus the event and date of origin when nobody has scored this event yet. Wall cards have no cup: the star always means "the all-time record". The wall pills use the same pixel star, centred with the page number.
- **"NOUVEAU RECORD !"** is in `brand-pink`, as on the mockup (the design system allows it from 24px).
- **Demo data.** The current event of the mock is dated from now (minutes, hours and a day ago), and the demo rotation alternates the wall and the games.

## 2026-11-05: HEIC photos are converted in the browser, on demand

A photo is never refused, and volunteers read the proof in Chrome, which cannot show HEIC. iOS mostly hands the page a JPEG already: the camera always does, and the photo library does by default (WebKit asks the picker for its "compatible" format). A HEIC still arrives when an iPhone user sets the picker's format to "Current" or picks a file from the Files app, from an Android phone that shoots HEIF, or from a laptop (AirDrop). So `preparePhoto()` tries the browser's own decoder first (Safari 17+ reads HEIC), and only when it fails on a file detected as HEIF (type, extension or `ftyp` brand) it loads `heic-to` (libheif in WebAssembly, ~3 MB, ~0.8 MB gzipped, in its own chunk) and converts it to the same JPEG proof and thumbnail. If that fails too, the original file is kept and the admin converts it on display. The draft keeps the photo in memory and IndexedDB, never in sessionStorage. Server-side conversion was ruled out: sharp's prebuilt binaries have no HEVC decoder, Supabase image transformations cannot output from HEIC, and uploading full-size originals would weigh on the venue's wifi.

`heic-to` and libheif are LGPL-3.0: we use the unmodified npm package, loaded as a separate file, so it stays replaceable.

## 2026-11-05: player flow rework, optional name, times typed like a stopwatch

- **Optional name.** The name moves to the consent step, under "Affichage sur l'écran" (ticked by default), and is optional. `scores.player_name` becomes nullable. A score without a name shows under a generated nickname seeded by its id, with its photo when displayed. An anonymous score that has a name keeps the normalized name as the seed (in Supabase, through `anonymous_seed`), so a player keeps one nickname per game. `displayedPlayerName()` holds the rule for both sources and for the form's preview.
- **What you see is what is sent.** When "Affichage sur l'écran" is unticked, the name field is hidden and no name is sent; when "Instagram" is unticked, the handle field is hidden and no handle is sent. So the preview of an anonymous score is exact: its nickname comes from the score id, and a player who stays off screen does not keep it from one score to the next. Clément validated both choices.
- **The phone chooses the score id.** The draft holds a v4 UUID from the start: the preview knows the nickname a nameless score will get, and a retried send stores the score once (the mock ignores a known id, Supabase treats a duplicate key on insert as already sent). Photo file names stay random per try, so a retry never collides with a photo already uploaded.
- **No `crypto.randomUUID()` in the browser.** It only exists over HTTPS or on localhost: a phone on the dev server over the LAN could not store its photo nor send its score. `randomUuid()` falls back on `crypto.getRandomValues()`.
- **Times.** The field shows a numeric keyboard. Digits alone read like a stopwatch, from the right (13248 = 1'32"48); separators are accepted too, typographic quotes of phone keyboards included (1’32”48, 1:32.48, 1:32:48, 1.32.48, 1:32, 32"48, 1h02'03"45). Seconds stop at 59 when minutes are shown. The form reads the value back ("On lit 1'32"48.") and explains a refused time. The admin keeps its own, more permissive parser for now.

## 2026-11-05: Instagram posts are made by hand, from the admin

No Meta API before the event: a volunteer posts by hand, and the admin gives them everything for it.

- **Where.** A fourth filter "À publier" in Submissions lists the approved player scores whose player said yes to Instagram and that are not posted yet, oldest first. Its detail only holds the post. The detail of an approved submission (filter "Validées") shows the same post under the review form, and its card says "Publié sur Instagram" once done. The mockups put the caption in the submission detail (p.16): this keeps it there, and adds a queue so nothing is forgotten.
- **Visual.** Mockup p.15 drawn on a canvas at 1080 × 1350 (Instagram's 4:5 portrait), colors read from the `arcade` tokens. The photo frame is taller than on the mockup, where it is a placeholder bar: the photo is the point of the post. The photo is contained, not cropped (it is the proof), over a blurred copy of itself. The headline follows the rank in the score's event: "NOUVEAU RECORD !" (1st), "SUR LE PODIUM !" (2nd, 3rd), "BEAU SCORE !"; the cup or numbered square is the screen's `RankBadge`; "RECORD ABSOLU" when the score beats every score of the other events, like the screen's badge. Names that do not fit wrap on two lines. The bottom panel stacks the event, the date and time the score was sent (`created_at`, always in Paris time: "7 nov. 2026 à 14h32", the admin's date style with the year) and the account.
- **Anonymous.** A score kept off screen keeps the screen's masked bust and its nickname (the same as the screen when `public_scores()` gives its seed, else seeded by the score id), never the real name nor the photo, in the visual and in the caption. Its handle is shown to the volunteer with a warning, and left out of the caption: tagging would undo the anonymity.
- **Photo loading.** The photo is fetched into a local object URL before drawing, so the canvas is never tainted; a HEIC is converted on the way. The public bucket answers `Access-Control-Allow-Origin: *` (checked on the project). If the fetch fails anyway, the visual falls back to the placeholder and says so, with "Réessayer". No dependency added.
- **Caption.** Built in code (`instagramCaption()`): tutoiement, one exclamation mark per idea, the player's handle when there is one, the event, `@mate_dans_le_retro` and hashtags (with one for the game). The volunteer can edit it before copying. `settings.instagram_caption` is not used yet: it has no screen.
- **"Publié" status.** Stored in the existing `scores.instagram_post_id` column (in the first migration, already in production, players cannot set it), as `manual:<ISO date>`: no migration, and the status is shared between volunteers' devices. A future automatic post will store Instagram's media id there, which never starts with `manual:`. "Remettre à publier" clears it.

## 2026-11-05: deleting a game from the admin refuses when scores remain

Volunteers can remove a game from the list for good (SQL delete), not only hide it with `visible = false`. `scores.game_id` cascades on delete, so a live weekend must not wipe records by accident: `deleteGame` counts every score on that game (pending, approved, rejected) and throws `GameHasScoresError` when the count is not zero. The UI confirms before calling it, and on that error tells the volunteer to hide the game or delete the scores first. No migration: the existing `admins manage games` policy already allows delete; `game_event_setups` cascade and `detected_game_id` is set null.

## 2026-11-06: delete pending and rejected submissions from the queue

Reject alone left college-test junk in the database (only Records deleted approved scores). The submission detail now offers "Supprimer" for pending and rejected rows, with the same inline "Garder" / "Supprimer" confirm as records. Approved scores stay deletable from Records only. No migration: `deleteScore` and the existing `admins manage scores` policy already allow it.

## 2026-11-06: player photo on every public ranking row

Product idea "photo next to the record": each `ScoreTable` row shows a 48px square photo between the cup and the name, with the same anonymity rule as the wall and the record panel. `public_scores()` already strips name and photo of an off-screen score; the UI never rebuilds a URL from a null path. No migration.

## 2026-11-06: Screen Wake Lock on the public screen, failsafe

The projected public screen (`/`) requests a screen wake lock while the tab is visible, so the laptop does not sleep the display during the event. Admin and player routes do not. The request is failsafe: missing API, denied permission or any error leaves the screen running; the lock is released on unmount and re-acquired when the tab becomes visible again. Windows kiosk settings and Chrome `--kiosk` remain the primary procedure; the lock is only an extra safeguard.

## 2026-11-06: realtime fallback aligned with Tournaments

Venue wifi drops the Supabase channel; a phone admin that was backgrounded can look "connected" with a dead socket, so a new pending score never appeared without a hard refresh.

- Public `/` and admin both subscribe to `change_signals` through `useHighscoresRealtime`.
- While reconnecting, TanStack Query polls every 10 seconds (`realtimeFallbackInterval`).
- After 60 seconds still down: the public screen hard-reloads once the site answers a `HEAD`; the admin opens a dialog once and keeps polling (no reload), same split as Tournaments projector vs admin.
- `keepSubscribed` also resubscribes on tab resume (`visibilitychange` / `focus`), marking disconnected so polling starts until the new channel joins.
- Migration `20261106220000_signal_pending_scores`: every insert, update or delete on `scores` bumps the `scores` signal (pending included). The public still reads only approved rows; a pending bump only causes a harmless refetch there.

## 2026-11-05: game covers are cropped square before upload

Every public tile shows the cover as a square (`object-cover`). Picking a file in the admin game dialog opens a crop step (`react-easy-crop`, aspect 1:1) before the image is kept for save. Confirm encodes a square file for the `covers` bucket: PNG when the source has any transparent pixel (Donkey Konga logos), otherwise JPEG (~1024 px, quality 0.85). Opaque letterbox bands stay black; transparent sources keep clear bands instead of a forced black fill. Cancel discards the selection. `minZoom` is computed from the image size (`onMediaLoaded`) so a wide cover (Guitar Hero) can sit fully in the square. `restrictPosition={false}` is required so `croppedAreaPixels` can extend past the media (negative x/y) and match that letterboxed preview; with the default clamp the export was a tight center square on a black canvas. No migration.

## 2026-11-06: printable submission QR poster from the admin

The Screen settings QR card offers a PDF A4 sheet (300 dpi canvas, 2480 × 3508) with the submission QR. Two styles: Full MDLR (purple + pixel background) and printer-friendly (white, no pattern). 1, 2 or 4 posters per page (cut from one sheet). Primary download is PDF (JPEG embedded, no dependency); PNG remains as a secondary export. QR points to the current origin's `/score`; print from the production admin so it hits `scores.matedansleretro.fr`. Copy matches the public screen ("Un record à afficher ?", "Scanne, prends ta photo, c'est parti !").

## 2026-11-06: QR on the records wall, optional `?game=<slug>`

The wall had no QR while empty "À prendre !" cards begged for one. Light UX shipped:

- **Global QR** always on the wall (top right), pointing at `/score` with no game. A player can send any score without waiting for a game slide.
- **Per-game QR** only where the layout has room: empty wall cards and the empty-game invite, as `/score?game=<slug>`. Filled wall cards stay photo + score (no second QR). The game-slide "À toi de jouer" panel also uses `?game=<slug>` for the game on screen; a second global QR there would crowd the aside, and the wall already carries the unscoped one.
- **Form**: `?game=` preselects that visible game on step 2 when the draft has no game yet; the tiles stay changeable. Unknown slugs are ignored.
