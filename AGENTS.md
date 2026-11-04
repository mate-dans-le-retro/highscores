# AGENTS.md

Guide pour tout agent (Claude, Codex, Cursor…) ou humain qui travaille sur ce dépôt. C'est la source de vérité : `CLAUDE.md` ne fait que pointer ici.

## Le projet en bref

Appli web des highscores de **Mate dans le Rétro… Gaming** (MDLR), association de rétro-gaming. Première utilisation : l'événement des **samedi 7 et dimanche 8 novembre 2026**.

- Un **écran public** (`/ecran`) projette les meilleurs scores des jeux choisis.
- Un joueur qui bat un record **envoie son score depuis son téléphone** (`/envoyer`, via un QR code) : jeu, pseudo, score, photo devant l'écran, consentement Instagram.
- Les bénévoles MDLR ont une **admin** (`/admin`) : gérer les jeux affichés, valider ou rejeter les soumissions, corriger un score à la main.

Le détail fonctionnel est dans [docs/produit.md](docs/produit.md), l'architecture dans [docs/architecture.md](docs/architecture.md), les choix déjà faits dans [docs/decisions.md](docs/decisions.md). Lire ces trois fichiers avant une tâche non triviale.

## Stack

- **TanStack Start** (React 19, TanStack Router en routage par fichiers, TanStack Query, TanStack Form), Vite, TypeScript strict.
- **Supabase** : Postgres + RLS, Realtime (écran public), Storage (photos), Auth (bénévoles).
- **Tailwind CSS v4** + **shadcn/ui** (style new-york, primitives Radix), thémés par le design system MDLR.
- Icônes : **lucide-react** uniquement.
- Hébergement : **Vercel** (adaptateur Nitro, preset détecté au build).
- Gestionnaire de paquets : **pnpm 11** (version fixée par `packageManager` dans `package.json`). Par défaut, pnpm 11 refuse un paquet publié il y a moins de 24 h (`minimumReleaseAge`) : ne pas exiger une version sortie le jour même, et ne pas désactiver cette protection.

## Commandes

```bash
pnpm install
pnpm dev            # http://localhost:3000
pnpm build          # build de production (.output/)
pnpm lint           # ESLint (@tanstack/eslint-config)
pnpm check          # Prettier en vérification
pnpm format         # Prettier + ESLint --fix
npx tsc --noEmit    # vérification des types

npx supabase start  # Supabase local (Docker), applique migrations + seed
npx supabase db reset   # rejoue migrations + seed sur la base locale
npx supabase migration new <nom>   # nouvelle migration
```

Avant de proposer un changement : `npx tsc --noEmit`, `pnpm lint`, `pnpm check` et `pnpm build` doivent passer.

## Arborescence

```
src/
  routes/            pages (routage par fichiers TanStack Router)
    __root.tsx       document HTML, polices, thème posé sur <html>
    index.tsx        accueil (liens vers les trois surfaces)
    ecran.tsx        écran public, thème scene
    envoyer.tsx      formulaire joueur, thème arcade
    admin.tsx        admin bénévoles, thème console
  components/ui/     composants shadcn (code copié, voir « shadcn » plus bas)
  lib/
    supabase.ts      client Supabase navigateur
    highscores.ts    types, requêtes TanStack Query, abonnement Realtime
    utils.ts         cn() pour shadcn
  styles.css         point d'entrée CSS
  styles/mdlr/       tokens MDLR, preset Tailwind, thème shadcn
supabase/
  migrations/        schéma SQL versionné (source de vérité de la base)
  seed.sql           jeux de démo pour le local
  config.toml        config Supabase locale (inscriptions fermées)
docs/                produit, architecture, décisions, design system
```

`src/routeTree.gen.ts` est généré par le plugin du routeur : ne pas l'éditer.

## Conventions

### Langue et ton

- **Interface en français**, au **vouvoiement**, voix « on » de l'association, chaleureuse et un peu taquine, jamais commerciale. Un point d'exclamation par idée, pas plus.
- Titres d'application en casse phrase (« Gestion des jeux »), pas en majuscules.
- Pas d'emoji dans l'interface (les médailles sont des `RankBadge`, pas 🥇).
- Scores formatés en français (`Intl.NumberFormat('fr-FR')`, espaces des milliers) : utiliser `formatScore()`.
- Code, noms de variables et de fichiers techniques en anglais ; commentaires en français, comme le reste du dépôt.

### Code

- TypeScript strict, pas de `any`. Imports `@/…` ou `#/…` (les deux pointent sur `src/`).
- Données côté client : `queryOptions` + `useQuery` / `useMutation` de TanStack Query, regroupés dans `src/lib/`.
- Tout ce qui touche un secret (clé `service_role`, token Instagram, clé d'API IA) passe par une **server function** TanStack Start (`createServerFn`), jamais par le navigateur. Seules les variables `VITE_*` arrivent côté client.
- Ne jamais committer `.env` ni de clé. La clé Supabase _publishable_ est publique par conception : c'est la RLS qui protège.

### Base de données

- Toute modification du schéma passe par une **nouvelle migration** dans `supabase/migrations/` ; ne jamais modifier une migration déjà appliquée en production.
- Chaque table a la **RLS activée** avec des politiques explicites. Le public (`anon`) ne lit que les jeux visibles et les scores validés, et ne peut insérer qu'une soumission `pending`.
- Les bénévoles sont les utilisateurs listés dans `public.admins` ; vérifier avec `public.is_admin()` dans les politiques.
- Après un changement de schéma, tester les politiques en local avec la clé publishable (voir docs/architecture.md).

### Design system MDLR

Lire [docs/design-system/README.md](docs/design-system/README.md). L'essentiel :

- **Trois thèmes**, posés sur `<html data-theme>` par la route via `staticData.theme` : `scene` (écran projeté), `arcade` (téléphone, défaut), `console` (admin).
- **Jamais de couleur, rayon ou taille en dur** : utiliser les utilitaires issus des tokens (`bg-surface-raised`, `text-ink-accent`, `text-scene-row`, `font-display`…) ou les variables shadcn (`bg-primary`, `border-input`…), qui pointent elles-mêmes sur les tokens.
- Deux registres à ne pas mélanger : **pixel** (public : angles droits, bordure 4px, ombre nette `shadow-pixel`, police `font-display`) et **application** (admin : `rounded-md/lg/xl`, `shadow-card`).
- En projection (`scene`) : texte jamais sous `text-scene-row` (40px), dix lignes max par écran, rotation toutes les 15 s, aucune animation en boucle, pas de `ink-muted`.
- `font-display` (Press Start 2P) : trois mots maximum, jamais un paragraphe.

### shadcn/ui

- Les composants vivent dans `src/components/ui/` ; on peut les modifier, ils font partie du code.
- Ils prennent leurs couleurs des variables shadcn (`--primary`, `--background`…) définies dans `src/styles/mdlr/shadcn.css`, branchées sur les tokens MDLR. Ne pas ajouter de palette shadcn par défaut (neutral, zinc…).
- La variante Tailwind `dark:` cible les thèmes sombres `arcade` et `scene`, pas le réglage du système.
- Ajouter un composant : `npx shadcn@latest add <nom>` (lit `components.json`). Si le registre n'est pas joignable (réseau restreint), récupérer le source depuis `https://raw.githubusercontent.com/shadcn-ui/ui/main/apps/v4/registry/new-york-v4/ui/<nom>.tsx` et remplacer l'import `cn` par `@/lib/utils`.
- `src/components/ui/` est exclu d'ESLint et de Prettier pour rester proche de l'amont.
- À terme, les composants MDLR spécifiques (ScoreTable, RankBadge, Podium, PixelPanel…) seront construits ici puis extraits dans une lib partagée avec les autres projets MDLR.

## Environnements

- Local : Supabase CLI (Docker). Copier `.env.example` en `.env`, puis renseigner l'URL et la clé publishable affichées par `npx supabase start`.
- Préprod et production : projet Supabase dans l'organisation MDLR, déploiement Vercel de l'équipe MDLR (voir « Git et environnements Vercel »). Les variables `VITE_SUPABASE_URL` et `VITE_SUPABASE_PUBLISHABLE_KEY` sont posées dans Vercel.
- Le dépôt est **public** : rien de sensible dans le code, les seeds, les tests ou les captures (pas de vraies données de joueurs).

## Git et environnements Vercel

Même règle que les autres projets MDLR (`website`, `tournaments`) :

| Branche | Environnement                                      | URL                                     |
| ------- | -------------------------------------------------- | --------------------------------------- |
| `main`  | **préprod** (preview Vercel attachée à la branche) | `highscores.preview.matedansleretro.fr` |
| `prod`  | **production** (branche de production Vercel)      | `highscores.matedansleretro.fr`         |
| autre   | preview Vercel de la PR                            | URL générée par Vercel                  |

- Travailler sur une branche, ouvrir une PR vers `main`. Vérifier sur la préprod.
- Mettre en production = faire avancer `prod` sur `main` (PR `main` → `prod`). Ne jamais pousser directement sur `prod`.
- Messages de commit courts, à l'impératif.
