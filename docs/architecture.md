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

Each route declares its theme in `staticData.theme`; `__root.tsx` sets the value of the deepest route on `<html data-theme>`, from the server render on.

## Data model

Defined in `supabase/migrations/`. Summary:

- **`games`**: `slug`, `name`, `machine`, `score_order` (`desc` | `asc`), `score_unit`, `visible`, `position`, `cover_path`.
- **`scores`**: a single lifecycle for submissions and admin entries. `game_id`, `player_name` (1 to 40 characters), `score` (bigint ≥ 0), `photo_path`, `instagram_consent`, `status` (`pending` | `approved` | `rejected`), `source` (`player` | `admin`), `rejection_reason`, `instagram_post_id`, `reviewed_at`, `reviewed_by`.
- **`leaderboard`** (view, `security_invoker`): approved scores with their `rank` per game, following the game's score order.
- **`admins`**: volunteers' `user_id`. `public.is_admin()` is used in every policy.

## Security (RLS)

| Who                      | games               | scores                                                                                                            | storage                                                                     |
| ------------------------ | ------------------- | ----------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| Public (`anon`)          | reads visible games | reads approved scores of visible games; only inserts a `pending` submission, `source = player`, on a visible game | uploads a photo to `photos/submissions/`, cannot list or overwrite anything |
| Volunteer (`is_admin()`) | everything          | everything                                                                                                        | everything on `photos` and `covers`                                         |

Auth sign-ups are closed (`enable_signup = false`). To add a volunteer: invite them from the Supabase dashboard, then insert their `user_id` into `public.admins`.

Check the policies locally after any change, for example:

```bash
K=<local publishable key>; A=http://127.0.0.1:54321
# must fail (401): a visitor cannot approve their own score
curl -s "$A/rest/v1/scores" -H "apikey: $K" -H "Content-Type: application/json" \
  -d '{"game_id":"<id>","player_name":"Cheater","score":1,"status":"approved"}'
# must return []: pending submissions are invisible
curl -s "$A/rest/v1/scores?status=eq.pending" -H "apikey: $K"
```

## Data sources

Pages only import `src/lib/highscores.ts` (TanStack Query options, `submitScore`, `useHighscoresRealtime`). Behind it, `src/lib/data/` holds the domain types and two implementations of `HighscoresSource`:

- `supabase-source.ts` (default): the tables and views above, with defaults for the fields the schema does not have yet.
- `mock/`: seed data in `localStorage`, shared between the tabs of one browser, so a submission from the `/score` tab shows up on the `/` tab. In mock mode, the browser console exposes `mdlrMock` (`pending()`, `approve(id)`, `reject(id)`, `setStationLabel(gameId, label)`, `setSettings({...})`, `reset()`).

Which source runs (`src/lib/data/mode.ts`):

1. `?mock=1` or `?mock=0` in the URL turns the mock on or off; the choice holds for the tab's session (sessionStorage), across navigation and reloads.
2. Otherwise, `VITE_DATA_SOURCE=mock` (local `.env.local` only) turns it on.
3. Otherwise, Supabase.

Both sources anonymize the scores a player kept off screen (`src/lib/data/anonymize.ts`): the row keeps its rank and score, with a retro nickname and no photo. The real backend must also enforce it on the server side.

## Public screen options

The rotation and the number of rows come from the settings (15 s and 5 rows by default). Search params override them, validated and clamped with zod (`src/lib/screen-options.ts`):

| Param      | Range    | Example         |
| ---------- | -------- | --------------- |
| `rotation` | 5 to 300 | `/?rotation=30` |
| `rows`     | 1 to 10  | `/?rows=10`     |

## Realtime

The `scores` and `games` tables are in the `supabase_realtime` publication. `useHighscoresRealtime()` (in `src/lib/highscores.ts`) subscribes to changes and invalidates the matching TanStack Query queries; RLS filters what each client receives.

## Storage

- `photos` (public, 10 MB max, jpeg/png/webp/heic): player photos under `submissions/<uuid>.<ext>`.
- `covers` (public, 5 MB max): game covers, managed from the admin.

## Environment variables

| Variable                        | Where                | Role                                                                             |
| ------------------------------- | -------------------- | -------------------------------------------------------------------------------- |
| `VITE_DATA_SOURCE`              | local (`.env.local`) | `mock`: fake data in `localStorage`, see "Data sources"                          |
| `VITE_SUPABASE_URL`             | client + server      | Supabase project URL                                                             |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | local (`.env`)       | public key (RLS)                                                                 |
| `VITE_SUPABASE_ANON_KEY`        | Vercel               | public key set by the Supabase integration (read if the previous one is missing) |

On Vercel, these variables come from the Marketplace Supabase integration, configured with the public `VITE_` prefix. Only `VITE_*` variables reach the browser; read them by their exact name (`import.meta.env.VITE_SUPABASE_URL`), never through the whole `import.meta.env` object.

Secrets (service role, Instagram, AI) stay in variables **without** the `VITE_` prefix, read only in server functions. The integration already sets `SUPABASE_SERVICE_ROLE_KEY` on the server.

## Deployment

Vercel, MDLR team, connected to the GitHub repository `mate-dans-le-retro/highscores`. The `main` branch is preprod (`scores.preview.matedansleretro.fr`), the `prod` branch is production (`scores.matedansleretro.fr`), as for `website` and `tournaments`. Nitro detects the Vercel environment at build time. The Supabase database comes from the Vercel Marketplace Supabase integration (Storage tab of the project), as for `tournaments`: a single database for preprod and production. Migrations are applied to the MDLR Supabase project with `npx supabase db push` (or Supabase's GitHub integration).
