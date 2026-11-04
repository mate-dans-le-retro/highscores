# Architecture

## Vue d'ensemble

```
Téléphone joueur ──(clé publishable, RLS)──▶ Supabase ◀──(Realtime)── Écran public
        │                                     ▲  ▲
        └── upload photo ──▶ Storage "photos" │  └── Admin (session bénévole)
                                              │
                         Server functions TanStack Start (Vercel)
                         pour tout ce qui demande un secret :
                         détection du score sur photo, Instagram
```

L'app est une TanStack Start rendue côté serveur et déployée sur Vercel. Les pages parlent directement à Supabase avec la clé _publishable_ ; la sécurité repose entièrement sur la RLS. Les traitements qui ont besoin d'un secret passent par des server functions.

## Routes

| Route      | Thème   | Rôle                                   |
| ---------- | ------- | -------------------------------------- |
| `/`        | arcade  | Accueil, liens vers les trois surfaces |
| `/ecran`   | scene   | Écran public projeté                   |
| `/envoyer` | arcade  | Formulaire joueur (QR code)            |
| `/admin`   | console | Admin bénévoles                        |

Le thème est déclaré par chaque route dans `staticData.theme` ; `__root.tsx` pose la valeur de la route la plus profonde sur `<html data-theme>`, dès le rendu serveur.

## Modèle de données

Défini dans `supabase/migrations/`. Résumé :

- **`games`** : `slug`, `name`, `machine`, `score_order` (`desc` | `asc`), `score_unit`, `visible`, `position`, `cover_path`.
- **`scores`** : un seul cycle de vie pour les soumissions et les saisies admin. `game_id`, `player_name` (1 à 40 caractères), `score` (bigint ≥ 0), `photo_path`, `instagram_consent`, `status` (`pending` | `approved` | `rejected`), `source` (`player` | `admin`), `rejection_reason`, `instagram_post_id`, `reviewed_at`, `reviewed_by`.
- **`leaderboard`** (vue, `security_invoker`) : scores validés avec leur `rank` par jeu, selon le sens du jeu.
- **`admins`** : `user_id` des bénévoles. `public.is_admin()` sert dans toutes les politiques.

## Sécurité (RLS)

| Qui                     | games                 | scores                                                                                                                      | storage                                                                |
| ----------------------- | --------------------- | --------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Public (`anon`)         | lit les jeux visibles | lit les scores validés des jeux visibles ; insère seulement une soumission `pending`, `source = player`, sur un jeu visible | dépose une photo dans `photos/submissions/`, ne liste ni n'écrase rien |
| Bénévole (`is_admin()`) | tout                  | tout                                                                                                                        | tout sur `photos` et `covers`                                          |

Les inscriptions Auth sont fermées (`enable_signup = false`). Pour ajouter un bénévole : l'inviter depuis le dashboard Supabase, puis insérer son `user_id` dans `public.admins`.

Vérifier les politiques en local après tout changement, par exemple :

```bash
K=<clé publishable locale>; A=http://127.0.0.1:54321
# doit échouer (401) : un visiteur ne peut pas s'auto-valider
curl -s "$A/rest/v1/scores" -H "apikey: $K" -H "Content-Type: application/json" \
  -d '{"game_id":"<id>","player_name":"Triche","score":1,"status":"approved"}'
# doit renvoyer [] : les soumissions en attente sont invisibles
curl -s "$A/rest/v1/scores?status=eq.pending" -H "apikey: $K"
```

## Realtime

Les tables `scores` et `games` sont dans la publication `supabase_realtime`. `useHighscoresRealtime()` (dans `src/lib/highscores.ts`) s'abonne aux changements et invalide les requêtes TanStack Query concernées ; la RLS filtre ce que chaque client reçoit.

## Storage

- `photos` (public, 10 Mo max, jpeg/png/webp/heic) : photos des joueurs sous `submissions/<uuid>.<ext>`.
- `covers` (public, 5 Mo max) : visuels des jeux, gérés par l'admin.

## Variables d'environnement

| Variable                        | Où               | Rôle                                                                             |
| ------------------------------- | ---------------- | -------------------------------------------------------------------------------- |
| `VITE_SUPABASE_URL`             | client + serveur | URL du projet Supabase                                                           |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | local (`.env`)   | clé publique (RLS)                                                               |
| `VITE_SUPABASE_ANON_KEY`        | Vercel           | clé publique posée par l'intégration Supabase (lue si la précédente est absente) |

Sur Vercel, ces variables viennent de l'intégration Supabase de la Marketplace, configurée avec le préfixe public `VITE_`. Seules les variables `VITE_*` arrivent dans le navigateur ; les lire par leur nom exact (`import.meta.env.VITE_SUPABASE_URL`), jamais via l'objet `import.meta.env` entier.

Les secrets (service role, Instagram, IA) restent dans des variables **sans** préfixe `VITE_`, lues uniquement dans des server functions. L'intégration pose déjà `SUPABASE_SERVICE_ROLE_KEY` côté serveur.

## Déploiement

Vercel, équipe MDLR, branché sur le dépôt GitHub `mate-dans-le-retro/highscores`. La branche `main` est la préprod (`scores.preview.matedansleretro.fr`), la branche `prod` est la production (`scores.matedansleretro.fr`), comme pour `website` et `tournaments`. Nitro détecte l'environnement Vercel au build. La base Supabase vient de l'intégration Supabase de la Marketplace Vercel (onglet Storage du projet), comme pour `tournaments` : une seule base pour la préprod et la prod. Les migrations sont appliquées sur le projet Supabase MDLR avec `npx supabase db push` (ou l'intégration GitHub de Supabase).
