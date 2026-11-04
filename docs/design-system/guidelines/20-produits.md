# Les trois produits

## Site d'événement

Le site est une suite de **bandes pleine largeur** qui alternent `surface-base` et `surface-accent`, chacune en `space-16` de padding vertical. Utiliser `SectionBand` : il pose le fond, le motif pixel en coins et le titre.

Les titres de bande sont en `h2`, en majuscules. Sur une bande violette, ils sont en `ink-accent` (c'est le traitement actuel du site) ; sur une bande rose, en `ink-on-accent`.

Le contenu d'une bande est centré, largeur maximale 720px pour le texte courant, et se décompose en trois colonnes au plus. Les cartes de programme (« … de consoles ! », « … de bornes d'arcade ! ») sont des `Card` sans fond, image en haut, `h4` en `ink-on-accent`, texte en `body-sm`.

Les informations pratiques — tarifs, lieu, paiement — sont les seules informations que le public vient vraiment chercher : les garder au-dessus du pied de page, en trois colonnes `eyebrow` + `body-strong`.

## Application Tournois

Deux modes, deux thèmes. Les écrans d'administration (liste de joueurs, configuration, gestion) sont en `console` : cartes blanches sur fond clair, registre arrondi, densité assumée. Les écrans d'affichage (tableau, podium) sont en `arcade`, ou en `scene` dès qu'ils sont projetés.

La barre d'application (`AppBar`) est en `surface-accent` avec le logo à gauche et l'identité de l'utilisateur à droite. C'est la seule zone rose des écrans de gestion : elle relie l'outil à la marque sans rose partout.

Les quatre cartes de statistiques en tête d'un tournoi (joueurs inscrits, format, lieu, début) sont des `StatCard` : icône dans une pastille, `eyebrow` pour le libellé, `numeric` pour un compteur, `h4` pour une valeur textuelle.

L'état du tournoi est un `Badge` posé à droite du titre, jamais une couleur de titre. Les trois états sont `soon` (À venir), `live` (En cours), `done` (Terminé).

Le tableau de tournoi est du registre pixel de bout en bout : `PixelPanel` pour le cadre, `BracketMatch` pour un bloc de match, `radius-none`, `border-pixel`, `shadow-pixel`, fonte `display`. Le vainqueur d'un match est marqué par un aplat `surface-accent` **et** une icône de manette pleine — pas par la couleur seule.

Les emplacements non joués sont en `state-pending-surface`, avec trois points, jamais vides : un cadre vide se lit comme un bug.

Les noms de joueurs longs sont tronqués à l'ellipse en fin de ligne, mais le nom complet reste disponible en `title`. Aujourd'hui la troncature est sèche : un joueur au nom long n'est identifiable nulle part dans le tableau.

Le podium utilise `Podium` : trois blocs `radius-none` en `rank-gold`, `rank-silver`, `rank-bronze`, le premier plus haut et plus large, les finalistes suivants listés en dessous. Chaque marche porte un `RankBadge` — une coupe en pixel art avec le numéro de la place — qui remplace les emoji médailles.

## Highscores

Le produit d'affichage des highscores n'existe pas encore ; `ScoreTable` est le composant sur lequel le construire.

Un tableau de highscores est du registre pixel, en thème `scene` par défaut : il vit sur un écran, pas sur un bureau.

Structurer chaque ligne en trois colonnes fixes : rang, joueur, score. Le rang est un `RankBadge` de 48px : une coupe colorée en `rank-gold`, `rank-silver` ou `rank-bronze` pour les trois premiers, un simple carré numéroté au-delà. Le joueur est en `arcade-name`, le score en `numeric` aligné à droite.

Aligner les scores sur la droite et les composer en `mono` : c'est ce qui permet de comparer deux nombres d'un coup d'œil et empêche la colonne de trembler quand un score se met à jour.

Afficher le jeu et la borne en tête de tableau, en `eyebrow` + `arcade-title`. Un classement sans le nom du jeu ne veut rien dire quand vingt bornes tournent en salle.

Dix lignes par écran au maximum. Pour un classement plus long, alterner les pages toutes les quinze secondes avec une transition de 120 ms, sans réduire la taille du texte.

Marquer un score qui vient de tomber par un aplat `surface-accent` sur la ligne pendant quelques secondes, puis le laisser retomber : c'est le seul mouvement autorisé sur un écran de highscores.

## Ajouts intentionnels

`ScoreTable`, `Field`, `Modal` et `SectionBand` ne sont pas extraits d'une source existante. `ScoreTable` est demandé par le produit highscores à venir ; `Field` et `Modal` recomposent la modale « Configuration du tournoi » de l'application actuelle, qui n'expose pas ses styles ; `SectionBand` formalise l'alternance de bandes du site, qui n'existe aujourd'hui que dans son gabarit.
