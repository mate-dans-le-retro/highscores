# Demo data for the remote database

Scripts to fill the real Supabase database with demo data, then remove exactly that data. They are run by hand: the Supabase CLI never runs this folder (`supabase db reset` replays `migrations/` and `seed.sql` only, see `[db.seed]` in `config.toml`).

The remote database is shared by preprod and production. Whatever the seed creates shows at once on both public screens, and its games are offered to players in the form. **Clean before the event opens.**

| File                | Does                                                                                |
| ------------------- | ----------------------------------------------------------------------------------- |
| `demo-seed.sql`     | Creates or resets the demo data                                                     |
| `demo-status.sql`   | Read-only: counts the demo rows, lists what would stop the cleanup                  |
| `demo-clean.sql`    | Deletes the demo data, and nothing else                                             |
| `demo-photos.ps1`   | Uploads the demo photos to `photos/demo/` with the Supabase CLI, or removes them    |
| `photos/demo/*.svg` | Placeholder photos drawn for this repository: a coloured card, a name, "PHOTO DÉMO" |

## How demo rows are marked

Every demo row has a fixed id starting with `de30de30-de30-0000-`. That is UUID version 0: `gen_random_uuid()` and the app's `randomUuid()` only make version 4 ids, so no real row can get this prefix. Station labels have no id of their own: the demo ones are those of a demo game. Slugs (`demo-…`) and the photo folder only help humans; the cleanup trusts the id prefix and nothing else.

## What the seed creates

In the spirit of the mock seed (`src/lib/data/mock/seed.ts`):

- two archived events, "Novembre 2025" and "Weekend d'avril 2026";
- eight games after the real ones (positions 901 to 908): Tetris, Duck Hunt (past records only), Super Mario Bros., Guitar Hero (dense past top with current scores in and under it, the 5+5 layout), Pac-Man, Mario Kart (times), Space Invaders (visible, no score) and Street Fighter II (hidden);
- station labels per event (Duck Hunt: "Salon", "Tournoi", then "Étage");
- 43 scores: anonymous, nameless, three pending (a free "Un autre jeu" submission, a new Guitar Hero event record, a nameless Mario Kart best time) and one rejected. Past scores are in the demo events; the others go into the real current event, dated from `now()`: yesterday, earlier today and less than an hour ago.

It never touches the settings (screen mode, durations, rows), the current event row (the schema allows a single current event, so it only reads its id), real games or real scores. To see the wall in the rotation, switch the screen mode in the admin, and switch it back after.

Running it again creates no duplicate: it resets the demo rows to their initial state, with fresh dates. Approvals or edits made in the admin on demo rows are undone.

## What the cleanup deletes

Demo scores, station labels of demo games, demo games and archived demo events. It never deletes a row without the demo id, not even through a foreign key:

- a demo game that a real score points to (a real score approved on a demo game, for example) is kept and hidden;
- a demo event that a real score or station label points to is kept;
- a game created in the admin from the demo "Un autre jeu" submission (Bomberman) is a real game: delete it in the admin.

It rolls everything back if a foreign key to `games`, `events` or `scores` is not one it knows (a later migration: update the script), or if any row without the demo id changed during the run. The summary lists what was deleted and what was kept.

## Photos

SQL cannot put files in Storage. Without the upload, demo scores have no photo and the screen shows its placeholder. With it, a demo score points to `photos/demo/<name>.svg` (only once the file is there), and the screen and the admin show the card. The demo volunteer entry has no photo, and anonymous scores show none on the screen, as in real life.

The files stay in the bucket after the cleanup, unused, until `demo-photos.ps1 -Remove`. They only ever go to `photos/demo/`, where neither players nor volunteers upload, and the removal names each file.

The local folder `photos/demo/` mirrors the bucket path, and must only hold the demo SVG files, since all of it is uploaded. Two quirks of the Supabase CLI 3.0 shape the script:

- `storage cp` reads its paths like URLs: a Windows drive (`D:\…`) parses as a scheme, and the copy fails with "Unsupported operation". The script passes a path relative to the repository root, with forward slashes.
- A single-file `cp` never overwrites; a recursive one does. But a recursive copy into an existing folder nests the source folder in it, like `cp -r`. So the script copies the folder named `demo` into the bucket root (`ss:///photos/`), which always exists: the files land in `photos/demo/` and replace the old ones on every run.

## Running them

1. Optional, photos. From a checkout linked to the project (`pnpm exec supabase login`, then `pnpm exec supabase link`; or pass `-ProjectRef <ref>`), check the commands with `-DryRun`, then upload. Running it again replaces the files. To check the bucket: `pnpm exec supabase storage ls --recursive ss:///photos/demo/ --remote --experimental`.

   ```powershell
   powershell -ExecutionPolicy Bypass -File supabase/scripts/demo-photos.ps1 -DryRun
   powershell -ExecutionPolicy Bypass -File supabase/scripts/demo-photos.ps1
   ```

   Or by hand: dashboard, Storage, `photos`, create a `demo` folder and upload the files of `photos/demo/`.

2. Seed: run `demo-seed.sql` (again after uploading the photos). The result table counts the demo rows.
3. Clean: run `demo-status.sql` first, then `demo-clean.sql`, and read its summary. If it kept rows, fix them in the admin (the status lists them) and run it again. Optionally remove the photos with `demo-photos.ps1 -Remove`.

Each SQL script runs in one transaction: an error leaves the database as it was.

### SQL Editor of the dashboard

New query, paste the whole file, Run. The last query's result shows the summary (notices do not show there). The dashboard may ask to confirm a destructive query: the seed only drops its own temporary helpers, the cleanup only deletes demo rows.

### psql

```bash
psql "<connection string>" -v ON_ERROR_STOP=1 -f supabase/scripts/demo-seed.sql
```

Take the direct connection or the session pooler (port 5432) from the dashboard's Connect button, not the transaction pooler (port 6543): the cleanup's summary reads a temporary table after the commit, in the same session. psql also prints the notices.

## Precautions

- Never run them during the event. Clean before the doors open, then check the screen and the form.
- Do not edit the demo ids, and keep `demo-seed.sql` and `demo-clean.sql` in step.
- A migration that adds a foreign key to `games`, `events` or `scores` must update `demo-clean.sql` (the list in its header and its check).
