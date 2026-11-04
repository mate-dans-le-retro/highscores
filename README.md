# Highscores MDLR

L'appli des highscores de [Mate dans le Rétro… Gaming](https://matedansleretro.fr) : un écran public qui affiche les meilleurs scores, un formulaire pour que les joueurs envoient leur record depuis leur téléphone, et une admin pour les bénévoles.

- `/ecran` : l'écran projeté dans la salle
- `/envoyer` : l'envoi d'un score (via QR code)
- `/admin` : la gestion des jeux et la validation des scores

Stack : TanStack Start, Supabase, Tailwind CSS v4, shadcn/ui, déployé sur Vercel. Détails dans [docs/](docs/) et [AGENTS.md](AGENTS.md).

## Lancer en local

Prérequis : Node 22+, pnpm, Docker (pour Supabase en local).

```bash
pnpm install
npx supabase start          # base locale avec le schéma et des jeux de démo
cp .env.example .env        # puis y coller l'URL et la clé publishable affichées
pnpm dev                    # http://localhost:3000
```

## Vérifier avant de pousser

```bash
npx tsc --noEmit && pnpm lint && pnpm check && pnpm build
```

## Documentation

- [docs/produit.md](docs/produit.md) : ce que fait l'appli et pourquoi
- [docs/architecture.md](docs/architecture.md) : données, sécurité, temps réel, déploiement
- [docs/decisions.md](docs/decisions.md) : les choix déjà faits
- [docs/design-system/](docs/design-system/) : le design system MDLR et son branchement dans le code
