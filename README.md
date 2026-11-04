# MDLR Highscores

The highscores app of [Mate dans le Rétro… Gaming](https://matedansleretro.fr): a public screen showing the best scores, a form for players to submit their record from their phone, and an admin for the volunteers.

- `/`: the screen projected in the room (`/scores` redirects to it)
- `/score`: score submission (through the QR code on the screen)
- `/admin`: game management and score approval

Stack: TanStack Start, Supabase, Tailwind CSS v4, shadcn/ui, deployed on Vercel. Details in [docs/](docs/) and [AGENTS.md](AGENTS.md).

## Run locally

Requirements: Node 22+, pnpm, Docker (for local Supabase).

```bash
pnpm install
npx supabase start          # local database with the schema and demo games
cp .env.example .env        # then paste the URL and publishable key it prints
pnpm dev                    # http://localhost:3000
```

## Check before pushing

```bash
npx tsc --noEmit && pnpm lint && pnpm check && pnpm build
```

## Documentation

- [docs/product.md](docs/product.md): what the app does and why
- [docs/architecture.md](docs/architecture.md): data, security, realtime, deployment
- [docs/decisions.md](docs/decisions.md): decisions already made
- [docs/design-system/](docs/design-system/): the MDLR design system and how it is wired into the code
