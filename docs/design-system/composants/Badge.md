Les états d'un tournoi : `soon` (À venir), `live` (En cours), `done` (Terminé) — plus `bye` (Qualifié d'office), pour un joueur exempté de tour dans un tableau.

Le composant fournit le libellé français par défaut. Ne pas le remplacer par une abréviation : **la couleur ne porte jamais l'information seule**, c'est le mot qui la porte, et le point coloré qui la renforce.

Les trois couleurs sont reprises telles quelles de l'application Tournois et sont identiques dans les trois thèmes : la pastille reste claire pour ressortir sur le violet, y compris en projection.

Poser le badge à droite du titre du tournoi, jamais comme couleur du titre lui-même.

`bye` est sur l'axe bleu et non dans le vert. L'app Tournois rend aujourd'hui « Qualifié d'office » en vert, le même registre que « En cours » : deux sens différents portés par une seule couleur, que rien ne distingue au premier coup d'œil. Le bleu les sépare, y compris pour un daltonisme rouge-vert.

Ne pas détourner ces états pour d'autres statuts. Un nouvel état métier demande un nouveau jeu de tokens `state-*`, pas la réutilisation de « En cours ».

## Étiquette libre

Sans `state`, le composant devient une étiquette générique : le texte vient de `children`, la teinte de `tone`, et le point disparaît — un point coloré a du sens pour signaler un état qui évolue, pas pour nommer une console.

Cinq teintes vérifiées : `brand` (le rose de marque), `gold` (le métal du premier), `neutral` (gris, la valeur par défaut), `info` (bleu) et `outline`, qui n'a qu'un filet et convient quand plusieurs étiquettes se suivent et qu'aucune ne doit dominer. Chaque paire tient au-dessus de 4,5:1 dans les trois thèmes.

C'est de quoi étiqueter un jeu, une console, une borne, une édition — tout ce qui classe sans être un état.

Pour une couleur hors de cette liste, passer `color` et `textColor` ensemble. **Le contraste devient alors ta responsabilité** : le système ne peut pas le garantir sur une valeur qu'il ne connaît pas. Viser 4,5:1 entre les deux, et se souvenir que l'étiquette se posera aussi bien sur un fond sombre que sur une carte blanche selon le thème.

Ne pas fabriquer un cinquième état de tournoi avec une étiquette libre. Un nouvel état métier demande ses propres tokens `state-*` et son entrée dans `BADGE_LABEL`, pour que le libellé et le point suivent partout.
