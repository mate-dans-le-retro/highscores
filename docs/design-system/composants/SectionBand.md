La bande pleine largeur du site, à alterner entre `tone="base"` (violet) et `tone="accent"` (rose) d'une section à l'autre. C'est la structure de `matedansleretro.fr`.

Les paddings sont ceux du site : `space-12` en haut, `space-16` sur les côtés, `space-24` en bas. Le contenu tient dans `layout-lg` (1024px).

Le titre est en `h2`, en majuscules, centré. Il prend `ink-accent` sur une bande violette et `ink-on-accent` sur une bande rose — le composant s'en charge, ne pas le forcer.

Passer `columns` pour la grille de trois colonnes (« Au programme », « Les infos importantes à connaitre ») : chaque colonne tient dans `layout-column` (296px) et peut porter une illustration de 147px de haut au plus. Ne jamais dépasser trois colonnes.

**Colonnes plates ou colonnes en carte.** Par défaut (`columnStyle="plain"`), les colonnes n'ont ni fond ni ombre : c'est le dessin du site, et il fonctionne parce que chaque colonne y porte une illustration. C'est elle qui donne sa présence à la colonne, pas une surface. Une colonne sans illustration, en revanche, flotte dans la bande et paraît inachevée.

Donc : une illustration pour chaque colonne, et on reste en `plain`. Pas d'illustration — des tarifs, un lieu, des horaires — et on passe en `columnStyle="card"`, qui pose une surface, un `radius-xl` et une `shadow-card`. Ne pas mélanger les deux dans une même page : c'est l'un ou l'autre selon qu'on a des images ou pas.

Les **carrés de coin** sont actifs par défaut. Ce sont les trois carrés de `space-4` par coin haut qui débordent sur la bande précédente : c'est ce qui coud les bandes entre elles, et c'est une signature du site autant que l'alternance des couleurs. Alterner `cornerVariant` entre `"a"` et `"b"` d'une bande à l'autre pour éviter la répétition, et passer `corners={false}` sur la première bande d'une page, qui n'a rien au-dessus d'elle.

Deux bandes de même teinte ne se suivent jamais : c'est l'alternance qui donne son rythme à la page.
