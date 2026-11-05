# Architecture

## Overview

```
Player phone ──(publishable key, RLS)──▶ Supabase ◀──(Realtime)── Public screen
        │                                 ▲  ▲
        └── photo upload ──▶ Storage "photos" │  └── Admin (volunteer session)
                                          │
                     TanStack Start server functions (Vercel)
                     for anything that needs a secret:
                     score detection from a photo, Instagram
```

The app is a server-rendered TanStack Start app deployed on Vercel. Pages talk directly to Supabase with the _publishable_ key; security relies entirely on RLS. Anything that needs a secret goes through server functions.

## Routes

| Route     | Theme   | Role                                |
| --------- | ------- | ----------------------------------- |
| `/`       | scene   | Projected public screen             |
| `/scores` | none    | Redirects to `/`                    |
| `/score`  | arcade  | Player form (QR code on the screen) |
| `/admin`  | console | Volunteer admin, reached by its URL |

The admin (client-rendered, `ssr: false`) has four pages: `/admin` (submissions queue), `/admin/games` (games, order, display), `/admin/games/$gameId` (ranking of the current event, scores by hand, archiving) and `/admin/settings` (screen, submissions, QR code, event name). Its data access is in `src/lib/admin.ts`, straight to Supabase with the volunteer's session.

Each route declares its theme in `staticData.theme`; `__root.tsx` sets the value of the deepest route on `<html data-theme>`, from the server render on.

## Data model

Defined in `supabase/migrations/`. Summary:

- **`events`**: one edition each (`name`, `archived_at`). Exactly one current event (`archived_at is null`), given by `public.current_event_id()`. `archive_current_event(name)` (volunteers only) archives it and opens the next one: archived scores still count for the all-time records.
- **`games`**: `slug`, `name`, `console` (stable, "Super NES"), `short_label` (tile fallback, "TET"), `score_type` (`points` | `time` | `other`), `score_order` (`desc` | `asc`), `score_unit`, `visible`, `position`, `cover_path` (in the `covers` bucket).
- **`game_event_setups`**: the station label of a game for one event ("Étage"), unique per event and game.
- **`scores`**: a single lifecycle for submissions and admin entries. `event_id` (the current event by default), `game_id` or `custom_game_name` (exactly one: a free game name waits for a volunteer to create or link the game; an approved score always has a game), `player_name` (1 to 40 characters, or null when the player left it empty), `id` (chosen by the phone for player submissions), `score` (bigint ≥ 0; milliseconds for a time, 1'32"48 = 92480), `photo_path` (proof) and `thumb_path` (thumbnail), `display_on_screen`, `instagram_consent`, `instagram_handle`, `detected_game_id` and `detected_score` (read from the photo), `status` (`pending` | `approved` | `rejected`), `source` (`player` | `admin`), `rejection_reason`, `instagram_post_id`, `reviewed_at`, `reviewed_by`.
- **`settings`**: a single row. `submissions_open`, `screen_mode` (`game` | `wall` | `both`), `game_duration_s`, `wall_duration_s`, `rows_shown`, `min_all_time_rows`, and the Instagram options (`instagram_enabled`, `instagram_mode`, `instagram_caption`).
- **`displayed_games`** (view, `security_invoker`): visible games with their station label for the current event.
- **`public_scores()`** (function, security definer): approved scores of visible games, every event, with `event_name`, `is_current_event` and `station_label`. A score kept off screen comes without name and photo, with `anonymous_seed` instead (see docs/decisions.md).
- **`change_signals`**: one row per topic (`games`, `scores`, `settings`), bumped by triggers for realtime.
- **`admins`**: volunteers' `user_id`. `public.is_admin()` is used in every policy.
- **`private.secrets`** (schema not exposed by the API): the key of the anonymous seeds.

## Security (RLS)

| Who                      | games, events, settings | scores                                                                                                                                                                                                                                          | storage                                                                                        |
| ------------------------ | ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Public (`anon`)          | reads (visible games)   | no read: `public_scores()` only. Inserts a `pending` submission, `source = player`, with its photo, in the current event, while submissions are open, on a visible game or a free game name. 30 player submissions per minute at most, in total | uploads to `photos/submissions/` while submissions are open, cannot list or overwrite anything |
| Volunteer (`is_admin()`) | everything              | everything                                                                                                                                                                                                                                      | everything on `photos` and `covers`                                                            |

Auth sign-ups are closed: `enable_signup = false` in `supabase/config.toml` locally, and "Allow new users to sign up" turned off in the dashboard of the remote project, which does not read that file. Volunteers sign in with Google, or with an email and a password as a fallback.

To add a volunteer: create the user from the Supabase dashboard (Authentication, Add user, with the email of their Google account, a random password and "Auto confirm"), then insert their `user_id` into `public.admins`. On their first Google sign-in, Supabase links the Google identity to this user through the email. A Google account with no user is refused, because creating it would be a sign-up. A signed-in account that is not in `public.admins` sees a "Pas encore bénévole" page and nothing else.

Google sign-in needs an OAuth client in Google Cloud, whose redirect URI is `https://<project ref>.supabase.co/auth/v1/callback`, and the Google provider enabled in the dashboard. The redirect URLs allowed by Supabase must cover production, preprod and the Vercel previews.

Check the policies locally after any change, for example:

```bash
K=<local publishable key>; A=http://127.0.0.1:54321
# must fail (401): a visitor cannot approve their own score
curl -s "$A/rest/v1/scores" -H "apikey: $K" -H "Content-Type: application/json" \
  -d '{"game_id":"<id>","player_name":"Cheater","score":1,"status":"approved","photo_path":"submissions/x.jpg"}'
# must return []: the public reads no score row
curl -s "$A/rest/v1/scores" -H "apikey: $K"
# anonymous rows: player_name and photo_path null, anonymous_seed set
curl -s "$A/rest/v1/rpc/public_scores?anonymous=is.true" -H "apikey: $K"
```

## Data sources

Pages only import `src/lib/highscores.ts` (TanStack Query options, `submitScore`, `useHighscoresRealtime`). Behind it, `src/lib/data/` holds the domain types and two implementations of `HighscoresSource`:

- `supabase-source.ts` (default): `displayed_games`, `settings` and `public_scores()`; it ranks and lays out the rows with the same helpers as the mock, and turns each `anonymous_seed` into a nickname.
- `mock/`: seed data in `localStorage`, shared between the tabs of one browser, so a submission from the `/score` tab shows up on the `/` tab. Photos (proof ~2000 px + thumb ~800 px) live in IndexedDB under `mock-photo:{id}`. In mock mode, the browser console exposes `mdlrMock` (`pending()`, `approve(id)`, `reject(id)`, `setStationLabel(gameId, label)`, `setSettings({...})`, `reset()`), and the UI shows a "Données de démo" watermark.

Which source runs (`src/lib/data/mode.ts`):

1. `?mock=1` or `?mock=0` in the URL turns the mock on or off; the choice holds for the tab's session (sessionStorage), across navigation and reloads.
2. Otherwise, `VITE_DATA_SOURCE=mock` (local `.env.development.local` only) turns it on.
3. Otherwise, Supabase.

Both sources anonymize the scores a player kept off screen: the row keeps its rank and score, with a retro nickname and no photo. With Supabase, the database already hides the name and the photo; the browser only builds the nickname from the seed. A score sent without a name shows under a nickname seeded by its id, with its photo when displayed (`displayedPlayerName()` in `src/lib/data/anonymize.ts`, also used by the player form for its preview).

## Public screen options

The rotation and the number of rows come from the settings (15 s and 10 rows by default). Search params override them, validated and clamped with zod (`src/lib/screen-options.ts`):

| Param      | Range    | Example         |
| ---------- | -------- | --------------- |
| `rotation` | 5 to 300 | `/?rotation=30` |
| `rows`     | 1 to 10  | `/?rows=10`     |
| `header`   | 0 or 1   | `/?header=1`    |

## Realtime

Only `change_signals` is in the `supabase_realtime` publication: triggers bump its `games`, `scores` or `settings` row when something the public screen shows changes (approved scores only). `useHighscoresRealtime()` (in `src/lib/highscores.ts`) subscribes to it and invalidates the matching TanStack Query queries. No score row travels through realtime.

The connection can drop on the venue wifi, and the signals sent meanwhile are lost. `keepSubscribed()` (`src/lib/data/realtime-connection.ts`) watches the channel status (`CHANNEL_ERROR`, `TIMED_OUT`, `CLOSED`) and the browser's `offline` and `online` events. It replaces a lost channel with a new one after 1 s, 2 s, 4 s and so on (30 s at most), or as soon as the browser is back online. When the connection comes back, the hook refetches every query to catch up. On the public screen, if the connection is still lost after 60 seconds, the page reloads, but only once the site answers a `HEAD` request: reloading while offline would leave the browser's error page on the projector. The mock source has no socket; it goes through the same path, so the browser's offline mode exercises it.

## Storage

- `photos` (public, 10 MB max, any image type): player photos under `submissions/<uuid>.<ext>` (proof) and `submissions/<uuid>.thumb.<ext>` (thumbnail), hand-entered ones under `admin/`.

Photos are prepared on the phone by `preparePhoto()` (`src/lib/data/photo.ts`): a JPEG proof (~2000 px) and thumbnail (~800 px). A HEIC the browser cannot decode loads `heic-to` (WebAssembly, its own chunk) on demand. If nothing can read the file, the original is uploaded alone (no thumbnail) and the admin converts a stored `.heic` on display (`useReadablePhotoUrl()`). While the player fills in the form, the photo lives in memory and IndexedDB (`src/lib/draft-photo.ts`); the sessionStorage draft only keeps its id.

- `covers` (public, 5 MB max): game covers, managed from the admin.

## Environment variables

| Variable                        | Where                                        | Role                                                                         |
| ------------------------------- | -------------------------------------------- | ---------------------------------------------------------------------------- |
| `VITE_DATA_SOURCE`              | local only (`.env.development.local`)        | `mock`: fake data in `localStorage`, see "Data sources"                      |
| `VITE_SUPABASE_URL`             | Vercel, pulled into `.env.local`             | Supabase project URL                                                         |
| `VITE_SUPABASE_ANON_KEY`        | Vercel, pulled into `.env.local`             | public key set by the Supabase integration                                   |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | optional override (`.env.development.local`) | public key (RLS), read before `VITE_SUPABASE_ANON_KEY`, for a local Supabase |

On Vercel, these variables come from the Marketplace Supabase integration, configured with the public `VITE_` prefix. Only `VITE_*` variables reach the browser; read them by their exact name (`import.meta.env.VITE_SUPABASE_URL`), never through the whole `import.meta.env` object.

Locally, the same variables come from Vercel through its CLI, a dev dependency: `pnpm vercel:login` once per machine, `pnpm vercel:link` once per checkout (it writes `.vercel/`; answer no when it offers to pull the development variables), then `pnpm env:pull`, which writes the variables of the Vercel **preview** environment for the `main` branch into `.env.local`: the variables preprod runs with. The Supabase integration may not have set them for the Vercel development environment. Variables marked "Sensitive" on Vercel come back empty.

Vite loads, from lowest to highest priority, `.env`, `.env.local`, `.env.[mode]` and `.env.[mode].local` (`mode` is `development` for `pnpm dev`). Hence the split:

- `.env.local` belongs to Vercel: every `pnpm env:pull` overwrites it. Do not edit it.
- `.env.development.local` holds personal overrides for `pnpm dev` and wins over `.env.local`: `VITE_DATA_SOURCE=mock`, or the URL and key of a local Supabase. Since the code reads `VITE_SUPABASE_PUBLISHABLE_KEY` before `VITE_SUPABASE_ANON_KEY`, an override must set `VITE_SUPABASE_PUBLISHABLE_KEY`.
- `.env` is no longer needed. If it defines `VITE_SUPABASE_PUBLISHABLE_KEY` (an old local Supabase key), that key wins over the pulled `VITE_SUPABASE_ANON_KEY` and the remote project answers 401: remove the line.

With the pulled variables and no mock, `pnpm dev` reads and writes the real database, shared by preprod and production. The pull also brings the integration's server-only secrets (`SUPABASE_SERVICE_ROLE_KEY`, Postgres URLs…) into `.env.local`; no code reads them today, git ignores the file, and they must never be copied into a `VITE_` variable.

Secrets (service role, Instagram, AI) stay in variables **without** the `VITE_` prefix, read only in server functions. The integration already sets `SUPABASE_SERVICE_ROLE_KEY` on the server.

## Deployment

Vercel, MDLR team, connected to the GitHub repository `mate-dans-le-retro/highscores`. The `main` branch is preprod (`scores.preview.matedansleretro.fr`), the `prod` branch is production (`scores.matedansleretro.fr`), as for `website` and `tournaments`. Nitro detects the Vercel environment at build time. The Supabase database comes from the Vercel Marketplace Supabase integration (Storage tab of the project), as for `tournaments`: a single database for preprod and production. Migrations are applied to the MDLR Supabase project with `pnpm supabase db push` (or Supabase's GitHub integration).
