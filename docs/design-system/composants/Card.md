Le conteneur de contenu des écrans de gestion : `surface-raised`, `radius-xl`, `space-6` de padding, `shadow-card`.

Passer `title` pour l'en-tête et `actions` pour les boutons. Même mécanique que `Modal` : on passe les boutons eux-mêmes, la carte les place. Le produit garde la main sur la variante, la taille et l'icône.

Par défaut les actions vont en tête, à droite du titre — c'est le motif des panneaux « Joueurs » et « Gestion du tournoi » de l'application, et c'est la bonne place pour des actions qui portent sur le contenu listé en dessous : ajouter, vider, filtrer.

`actionsIn="footer"` les pose sous le contenu, alignées à droite et séparées par un filet. À utiliser quand l'action conclut ce qu'on vient de lire plutôt que d'agir sur une liste — « Démarrer le tournoi » après un récapitulatif. Une carte n'a jamais d'actions aux deux endroits.

Les colonnes de programme du site (« … de consoles ! ») ne sont **pas** des cartes : ce sont des colonnes de texte centrées dans une bande, sans fond ni ombre. Elles se posent avec la propriété `columns` de `SectionBand`, pas ici.

Une carte ne contient qu'un sujet. Deux sujets demandent deux cartes, pas un séparateur.

Ne pas imbriquer de carte dans une carte : passer à une liste bordée de `line-subtle`.

Ne pas employer `Card` dans le registre pixel — un bracket utilise `PixelPanel`, qui a des angles droits et une ombre nette.
