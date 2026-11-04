Le motif de carrés pixel qui court derrière les bandeaux de tournoi et dans les coins des sections du site. C'est la texture signature de la marque.

Envelopper n'importe quel conteneur : le motif est posé en pseudo-élément à `z-grid`, derrière le contenu, sans intercepter les clics.

Le motif est **décoratif**. Il se tient à environ 1,2:1 de son fond et ne porte jamais d'information. Ne pas y poser de texte sous 18px.

Utiliser `over` quand le motif passe sur une image ou une affiche d'événement : il est alors atténué à `opacity-grid`.

**Ne pas l'utiliser en thème `scene`** derrière du texte : la maille de 24px crée un moiré avec la grille physique des dalles LCD et des matrices DLP. En projection, le motif reste en bordure ou derrière des aplats pleins.

Passer `as` pour changer la balise rendue — `section` pour une bande de page, `div` par défaut.
