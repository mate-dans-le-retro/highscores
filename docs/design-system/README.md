# Design system MDLR dans ce dépôt

La référence est l'artifact « Design System » de MDLR : https://claude.ai/artifact/Pja2gYg1rDtHBykCDhhrTX. Ce dossier en garde une copie lisible par n'importe quel agent, et explique comment il est branché dans l'app.

## Ce qu'il y a dans ce dossier

| Fichier                                                  | Contenu                                                                                                                    |
| -------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| [fondamentaux.md](fondamentaux.md)                       | Ton éditorial, couleurs, typo, espacements, registres, icônes, logo. **À lire en premier.**                                |
| [guidelines/10-ecrans.md](guidelines/10-ecrans.md)       | Règles de projection (thème `scene`) : tailles minimales, densité, pas d'animation en boucle. Indispensable pour `/ecran`. |
| [guidelines/20-produits.md](guidelines/20-produits.md)   | Les trois produits MDLR, dont la section **Highscores**.                                                                   |
| [guidelines/30-migration.md](guidelines/30-migration.md) | Brancher shadcn sur les tokens (écrit pour l'app Tournois, même principe ici).                                             |
| [composants/](composants/)                               | Une fiche par composant de référence (ScoreTable, RankBadge, Podium, PixelPanel, Button…).                                 |
| [assets/](assets/)                                       | Logos et motifs : déclinaisons et règles d'usage.                                                                          |
| [tokens.json](tokens.json)                               | Les tokens bruts des trois thèmes.                                                                                         |

Les fiches composants décrivent les composants du bundle de référence (props `variant`, `fresh`, `onSelectRow`…). Dans ce dépôt, on les **réimplémente** en React + Tailwind + shadcn en respectant le comportement décrit ; leurs props sont un bon point de départ pour l'API.

## Comment c'est branché dans le code

`src/styles.css` charge dans l'ordre :

1. `tailwindcss` et `tw-animate-css` (animations shadcn) ;
2. `src/styles/mdlr/tokens.css` : les variables des trois thèmes, copiées de `mdlr.css` du design system ;
3. `src/styles/mdlr/tailwind.css` : le preset Tailwind v4 du design system (`@theme inline`), qui crée les utilitaires `bg-surface-*`, `text-ink-*`, `text-h1…h6`, `text-scene-*`, `text-arcade-*`, `font-display`, `shadow-pixel`, `rounded-md/lg/xl`, et fixe `--spacing: 4px` ;
4. `src/styles/mdlr/shadcn.css` : les variables shadcn branchées sur les tokens, et la variante `dark:` liée aux thèmes sombres.

`tokens.css` et `tailwind.css` sont des **copies** : ne pas les éditer à la main, les recopier depuis l'artifact si le design system évolue.

### Correspondance shadcn → MDLR

| shadcn                           | MDLR                                         | Remarque                                     |
| -------------------------------- | -------------------------------------------- | -------------------------------------------- |
| `background` / `foreground`      | `surface-base` / `ink-primary`               |                                              |
| `card`                           | `surface-raised`                             |                                              |
| `popover`                        | `surface-overlay`                            |                                              |
| `primary` / `primary-foreground` | `surface-accent` / `ink-on-accent`           | rose, texte violet profond (contraste 4,5:1) |
| `secondary`, `muted`             | `surface-sunken`                             |                                              |
| `muted-foreground`               | `ink-secondary`                              | pas `ink-muted`, invisible en projection     |
| `accent`                         | `surface-overlay`                            | le survol éclaircit d'un cran                |
| `destructive`                    | `state-danger`                               | uniquement pour supprimer                    |
| `border` / `input` / `ring`      | `line-subtle` / `line-strong` / `focus-ring` |                                              |

### Thèmes

Chaque route déclare son thème : `createFileRoute('/ecran')({ staticData: { theme: 'scene' } })`. Valeurs : `scene` (écran projeté), `arcade` (téléphone, défaut), `console` (admin, clair).

## Règles à retenir

- Pas de hex, de rayon ni de taille en dur : passer par les utilitaires.
- Registre **pixel** pour le public (angles droits, `border-4`, `shadow-pixel`, `font-display`) ; registre **application** pour l'admin (`rounded-*`, `shadow-card`). Ne pas mélanger sur un même composant.
- `font-display` : trois mots maximum.
- Projection : `text-scene-row` (40px) minimum, dix lignes max, rotation toutes les 15 s, aucune animation en boucle, pas de motif pixel sous du texte.
- Une couleur d'état est toujours doublée d'un mot.
- Icônes : Lucide seulement, trait 2px, 20px en admin, 24px en public, jamais dans le registre pixel.
- Pas d'emoji dans l'interface, pas de personnages sous droits comme icônes.
