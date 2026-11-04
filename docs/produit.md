# Produit : les highscores MDLR

## Contexte

Mate dans le Rétro… Gaming (MDLR, https://matedansleretro.fr) organise un week-end de rétro-gaming. Pendant l'événement, des jeux sont en libre accès (par exemple _Tetris_, _Duck Hunt_, _Super Mario Bros._, _Guitar Hero_, la liste évolue). On veut mettre en valeur les meilleurs scores sur un grand écran, et laisser les joueurs les envoyer eux-mêmes.

Première utilisation : **samedi 7 et dimanche 8 novembre 2026**.

## Les trois surfaces

### 1. Écran public (`/ecran`, thème `scene`)

- Projeté ou affiché sur une TV dans la salle, regardé de loin, sans souris.
- Montre le classement d'un jeu à la fois : nom du jeu et machine en tête, puis rang, joueur, score. Dix lignes maximum.
- Fait tourner les jeux visibles toutes les 15 secondes.
- Se met à jour tout seul quand un score est validé (Supabase Realtime). Un nouveau score peut être mis en avant quelques secondes (ligne rose passagère), c'est le seul mouvement autorisé.
- Idées pour la suite : photo du joueur à côté du record, QR code vers `/envoyer` affiché en permanence, podium des trois premiers.

### 2. Envoi d'un score (`/envoyer`, thème `arcade`)

- Ouvert depuis un QR code collé près des bornes, sur le téléphone du joueur.
- Le joueur choisit le jeu, saisit son pseudo et son score, prend une photo de lui devant l'écran du jeu (preuve), et coche s'il accepte une publication Instagram.
- La soumission part en statut **en attente** ; elle n'apparaît sur l'écran public qu'une fois validée par un bénévole.
- Évolution envisagée : le joueur prend d'abord la photo, on **détecte le jeu et le score** automatiquement (modèle de vision, appelé depuis une server function), puis il corrige si besoin.

### 3. Admin (`/admin`, thème `console`)

Réservée aux bénévoles MDLR (connexion par email, inscriptions publiques fermées).

- **Jeux** : ajouter, renommer, choisir la machine, le sens du classement (plus haut ou plus bas gagne), l'ordre d'affichage, et **afficher ou masquer** un jeu sur l'écran public.
- **Soumissions** : voir la file des scores en attente avec la photo, **valider** ou **rejeter** (avec un motif facultatif).
- **Scores** : saisir un score à la main (validé directement), corriger ou supprimer un score existant.
- **Instagram** (bonus) : à la validation d'une soumission dont le joueur a donné son accord, publier la photo et le score sur le compte Instagram MDLR. Si l'API Meta n'est pas prête à temps, repli sur un bouton « Télécharger le visuel » pour publier à la main.

## Règles métier

- Un score est un entier positif. Le classement d'un jeu est trié selon son sens (`desc` : le plus haut gagne, `asc` : le plus bas gagne, pour un temps).
- Le rang suit la fonction `rank()` : deux scores égaux partagent la même place.
- Un même joueur peut apparaître plusieurs fois dans un classement (pas de dédoublonnage par pseudo pour l'instant : les pseudos ne sont pas des comptes).
- Les photos sont stockées dans un bucket public (`photos`), sous `submissions/`. Les joueurs ne peuvent ni lister ni écraser les photos.
- Le consentement Instagram est enregistré avec la soumission ; sans lui, on ne publie jamais.

## Hors périmètre pour le 7 novembre

- Comptes joueurs.
- Modération automatique des pseudos (les bénévoles valident chaque soumission, ça suffit).
- Historique multi-événements (on pourra ajouter une notion d'édition plus tard).
