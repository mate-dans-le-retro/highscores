# Migrer l'app Tournois

L'application tourne sur Next 16, React 19, Tailwind 4.2 et shadcn/ui en style *new-york*, avec lucide-react, next-intl et Supabase. Le système est conçu pour se poser dessus sans rien casser : shadcn pose déjà ses couleurs en variables CSS, et il suffit de rebrancher ces variables sur les tokens.

## Les couleurs ont dérivé

`src/app/global.css` définit ses couleurs en `oklch` et les nomme explicitement « Mate dans le Rétro branding ». Converties, elles ne sont pas celles de la marque :

| rôle | app aujourd'hui | marque | écart |
| --- | --- | --- | --- |
| violet | `oklch(0.25 0.115 295)` = `#280c51` | `#331655` | 15 en distance RGB |
| rose | `oklch(0.65 0.22 340)` = `#e048b8` | `#ea4592` | **39 en distance RGB** |

Le violet passe presque ; le rose, non. Celui de l'app tire vers le magenta violacé, celui de la marque vers le framboise. Posés côte à côte — un onglet du site et un onglet de l'app — la différence se voit.

Le correctif est court : remplacer les valeurs de `:root` par `var(--brand-purple)` et `var(--brand-pink)`, ou importer directement `tokens.css` et `tailwind.css` du système et faire pointer les alias shadcn dessus (`--primary: var(--surface-accent)`, `--background: var(--surface-base)`, `--card: var(--surface-raised)`, `--destructive: var(--state-danger)`).

## Quatre choses à corriger au passage

`a { color: var(--color-brand-secondary) }` : `brand-secondary` vaut exactement la couleur de fond. **Les liens sont invisibles**, à 1:1 de contraste. Les passer en `ink-accent`.

Le bloc `.dark` reproduit `:root` à l'identique, valeur par valeur. Il n'y a donc pas de thème clair : le sélecteur existe et ne fait rien. Soit le brancher sur le thème `console` du système, soit le supprimer. (Le `favicon.svg` du site a exactement le même défaut, avec deux variantes claire et sombre identiques — ça vaut le coup de vérifier d'où vient l'habitude.)

Dans `@theme inline`, cinq entrées sont auto-référentielles : `--color-brand-primary: var(--color-brand-primary)`. Ça ne fonctionne que parce que le bloc `:root` vient plus loin dans le fichier et l'emporte à la cascade. Les autres entrées suivent le bon schéma, avec deux noms distincts (`--color-card: var(--card)`). À aligner avant que quelqu'un réordonne le fichier.

`components.json` déclare `"css": "src/app/globals.css"`, mais le fichier s'appelle `global.css`, sans « s ». Le CLI shadcn écrirait au mauvais endroit à la prochaine génération de composant. Il déclare aussi `tailwind.config.ts`, qui n'existe pas — normal en v4, mais autant le vider.

## Rayons

L'app part de `--radius: 0.625rem` (10px) et en dérive 6, 8, 10 et 14px. Le système propose 0, 4, 8, 12, 16 — une échelle sur la grille de 4px, avec `radius-none` pour le registre pixel. Basculer d'un coup plutôt que composant par composant : c'est le genre d'écart de 2px qui ne se voit que quand les deux coexistent.

## Contraste

Du blanc sur le rose primaire donne 3,42:1, sous le seuil de 4,5. C'est la même question que sur le site, et le système la règle avec `ink-on-accent` (violet profond sur rose, 4,53:1). Les boutons primaires et la barre d'application sont concernés.

## Ce que le code apprend au système

Le tableau de tournoi connaît un état que les captures ne montraient pas : **« Qualifié d'office »**, pour un joueur exempté de tour. L'app le rend en vert — le même registre que « En cours », si bien que deux sens différents partagent une couleur. Le système ajoute `state-bye-surface` et `state-bye-ink`, sur l'axe bleu, distinguables du vert y compris en daltonisme rouge-vert.

`PoolBracket.tsx` fait 22 000 caractères et porte à lui seul le tableau, le podium et l'écran de fin. C'est le bon endroit pour commencer : `PixelPanel`, `BracketMatch`, `Podium` et `ScoreTable` couvrent l'essentiel de ce qu'il dessine à la main.

Le podium compose les médailles avec des emoji (`medals[index] || '🏆'`) et des dégradés `bg-linear-to-br`. `Podium` les remplace par des aplats `rank-*` et le rang écrit.

Le fond `public/images/background.svg` est dans le système, groupe `Motifs`. Son aplat, `#38195C`, est exactement `surface-raised` en thème arcade — c'est de là que vient la valeur.

Enfin, le sprite de Mario en kart posé au centre du tableau est un personnage sous droits Nintendo dans un produit, et non dans une communication d'événement. C'est le seul de tout le système, et le plus simple à remplacer.
