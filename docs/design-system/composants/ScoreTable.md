Le tableau de highscores, socle du produit d'affichage à venir. Registre pixel, thème `scene` par défaut : il vit sur un écran, pas sur un bureau.

Trois colonnes fixes : rang, joueur, score. Le rang est un bloc carré coloré en `rank-*` pour les trois premiers, en `surface-overlay` au-delà. Le score est en chasse fixe, aligné à droite, en chiffres tabulaires — c'est ce qui permet de comparer deux nombres d'un coup d'œil et empêche la colonne de trembler à la mise à jour.

Renseigner `game` et `machine` : un classement sans le nom du jeu ne veut rien dire quand vingt bornes tournent en salle.

Passer des nombres en `score` — ils sont formatés en français, par milliers séparés d'espaces. Une chaîne est rendue telle quelle, pour les scores à format particulier (temps, combo).

**Dix lignes au maximum** par écran, huit sur une dalle de 30 pouces. Pour un classement plus long, alterner les pages toutes les quinze secondes ; ne jamais réduire la taille du texte pour faire tenir plus de monde.

Utiliser `fresh` sur la ligne d'un score qui vient de tomber : elle passe en `surface-accent` quelques secondes puis retombe. C'est le seul mouvement autorisé sur un écran de highscores.

`fresh` est un **état passager, pas une sélection** : c'est le produit qui le pose à l'arrivée du score et le retire ensuite. Ne pas s'en servir pour marquer une ligne en permanence — une ligne rose qui ne bouge plus perd tout son pouvoir d'attirer l'œil, et c'est justement ce qu'on lui demande.

## Survol et clic

Par défaut, **aucune ligne ne réagit au survol**. Le tableau vit sur un vidéoprojecteur ou une dalle en salle, où il n'y a pas de pointeur ; et dans un écran de gestion, un survol qui ne mène à rien promet une action qui n'existe pas.

Passer `onSelectRow(index, row)` quand les lignes font quelque chose — corriger un score, invalider une partie, ouvrir la fiche d'un joueur. Elles deviennent alors de vrais boutons, avec le même vocabulaire que les lignes de `BracketMatch` : liseré accent au survol, descente d'un pixel à l'appui, focus clavier visible. Le nom accessible reprend le joueur, son score et sa place — « Alice — 128 400 points, 1re place ».
