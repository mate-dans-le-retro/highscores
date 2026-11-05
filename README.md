# MDLR Highscores

The highscores app of [Mate dans le Rétro… Gaming](https://matedansleretro.fr): a public screen showing the best scores, a form for players to submit their record from their phone, and an admin for the volunteers.

- `/`: the screen projected in the room (`/scores` redirects to it)
- `/score`: score submission (through the QR code on the screen)
- `/admin`: game management and score approval

Stack: TanStack Start, Supabase, Tailwind CSS v4, shadcn/ui, deployed on Vercel. Details in [docs/](docs/) and [AGENTS.md](AGENTS.md).

## Run locally

Requirements: Node 22+, pnpm, and a Vercel account in the MDLR team. The Vercel CLI is a dev dependency of the project.

```bash
pnpm install
pnpm vercel:login           # once per machine
pnpm vercel:link            # once per checkout: writes .vercel/
pnpm env:pull               # writes .env.local with the variables of the Vercel development environment
pnpm dev                    # http://localhost:3000
```

Vite reads, from lowest to highest priority, `.env`, `.env.local`, `.env.development` and `.env.development.local` (the last two only for `pnpm dev`). `.env.local` belongs to Vercel: every `env:pull` overwrites it. Put your own settings in `.env.development.local`, which wins over it:

```dotenv
# .env.development.local
# Fake data in localStorage; comment it out to use the real database
VITE_DATA_SOURCE=mock
```

With `VITE_DATA_SOURCE` commented out, `pnpm dev` talks to the real Supabase project, **shared by preprod and production**. Restart `pnpm dev` after any change to an env file. In the browser, `?mock=1` and `?mock=0` switch the current tab without restarting. `/admin` always talks to Supabase, even in mock mode.

Without Vercel access, or with a local Supabase (`pnpm supabase start`, needs Docker), set `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` in `.env.development.local` instead.

## Check before pushing

```bash
pnpm typecheck && pnpm lint && pnpm check && pnpm test && pnpm build
```

## Documentation

- [docs/product.md](docs/product.md): what the app does and why
- [docs/architecture.md](docs/architecture.md): data, security, realtime, deployment
- [docs/decisions.md](docs/decisions.md): decisions already made
- [docs/design-system/](docs/design-system/): the MDLR design system and how it is wired into the code
