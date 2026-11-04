Le bouton sans libellé visible, pour les actions répétées en fin de ligne : éditer un joueur, le supprimer, mettre un tournoi en pause.

`label` est **obligatoire** : c'est le nom accessible du bouton, lu par les lecteurs d'écran. Écrire l'action complète (« Supprimer le joueur »), pas le nom de l'icône.

Utiliser `tone="danger"` pour la suppression : l'icône passe en `state-danger` au survol, sans jamais l'être au repos — une ligne de liste ne doit pas paraître rouge en permanence.

La cible fait 36 × 36 px. Ne pas la réduire : c'est déjà le minimum confortable pour une souris, et les écrans de gestion de l'association sont parfois manipulés au trackpad dans le noir.

Grouper au maximum trois boutons d'icône par ligne. Au-delà, passer à un menu.

Passer `pressed` pour une bascule — un outil de barre qu'on laisse enclenché. Le bouton se creuse et prend un liseré rose, comme le bouton plein, et c'est `aria-pressed` qui porte l'état. Ne pas l'employer sur une action ordinaire : annoncer un état de bascule à un bouton qui n'en a pas est pire que de ne rien annoncer.

`disabled` pose `aria-disabled`, neutralise le clic et passe le curseur en `not-allowed`, sans retirer le bouton de l'ordre de tabulation. Sur une ligne de liste, préférer masquer l'action qui n'a pas de sens plutôt que d'aligner des icônes éteintes.
