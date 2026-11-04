# Écrans et projection

L'association affiche sur trois types de surfaces très différentes : des vidéoprojecteurs sur toile, un plasma de 70 pouces et des écrans plats LCD de 30 à 50 pouces. Un même écran de bracket doit tenir sur les trois. Le thème `scene` existe pour ça — il ne suffit pas d'agrandir le thème `arcade`.

## Choisir le thème

Poser `data-theme="scene"` sur tout affichage destiné à être regardé de loin, quelle que soit la dalle. Poser `data-theme="arcade"` sur ce qu'un joueur consulte à moins d'un mètre (téléphone, borne d'inscription). Poser `data-theme="console"` sur les écrans de gestion manipulés par les bénévoles.

Ne pas basculer un écran projeté en `console` pour « mieux voir » : un aplat clair de 3 m² au vidéoprojecteur éblouit une salle plongée dans le noir et brûle les bornes autour.

## Ce que `scene` change

Le fond descend à `#2a1148` au lieu du violet de marque. Un vidéoprojecteur relève les noirs : un fond déjà clair remonte en gris violacé et écrase tout le contraste utile. Le fond plus profond compense, et les textes gagnent mécaniquement en séparation (16,5:1 pour `ink-primary`, contre 15,1:1 en `arcade`).

Le rose d'aplat s'éclaircit (`surface-accent` à `#f457a0`) : les projecteurs DLP et LCD désaturent les magenta, et le rose de marque vire au brun sur toile.

Les ombres pixel passent à 6px et l'anneau de focus à 4px : sous 4px, un trait disparaît à la mise à l'échelle sur une toile de 3 m.

Les paddings de bord passent à `space-24`. Toutes les dalles rognent les bords — une toile est rarement tendue droit, un plasma applique parfois un overscan de 3 %. Rien d'informatif ne doit vivre à moins de 96px du bord.

## Tailles de texte en projection

Utiliser le groupe de styles **Scène** et rien d'autre. `scene-hero` pour le titre de l'écran, `scene-row` pour chaque ligne de classement ou de match, `scene-meta` pour l'horaire et le lieu, `scene-pixel` pour un titre pixel.

Attention à la chasse de la fonte pixel quand on dimensionne. Press Start 2P avance d'un cadratin par glyphe : à taille égale, elle occupe près du double d'une sans-serif, et un nombre de sept caractères à 28px fait déjà près de 200px de large. C'est pourquoi le tableau de scores projeté compose ses scores à 28px et non à 40 : ils y pèsent visuellement autant, et laissent la place au nom du joueur. Dimensionner une colonne en comptant 1 em par caractère, pas 0,6 comme pour Montserrat.

`scene-row` à 40px est le **plancher absolu** : c'est ce qui reste lisible depuis le fond d'une salle sur un LCD de 30 pouces, le plus petit et le plus contraignant des écrans du parc. Ne jamais afficher une information de tournoi en dessous.

Ne pas employer `ink-muted` en projection. Il tient le seuil sur une dalle, mais la perte de contraste d'un vidéoprojecteur en plein jour le fait disparaître. En `scene`, le texte secondaire est en `ink-secondary`.

## Densité

Compter au maximum **dix lignes** de `scene-row` par écran projeté, et huit sur une dalle de 30 pouces. Au-delà, paginer : un classement de vingt joueurs devient deux écrans qui alternent toutes les quinze secondes, pas une liste de vingt lignes rétrécies.

Un bracket projeté n'affiche jamais plus de deux tours à la fois. Sur les captures actuelles, les demi-finales et la finale tiennent dans le même cadre que les quarts : à la projection, plus rien n'est lisible.

## Contraintes de rendu

Ne pas poser de texte sur le motif `mdlr-pixelgrid` en projection : la maille de 24px crée un moiré avec la grille physique des dalles LCD et des matrices DLP. Le motif reste en bordure ou derrière des aplats pleins.

Éviter le blanc pur en très grands aplats sur vidéoprojecteur. Un panneau pixel blanc de bracket reste acceptable à la taille d'une carte de match ; un fond blanc plein écran ne l'est pas.

Ne pas animer en boucle. Une transition de changement d'écran de 120 ms suffit ; tout mouvement permanent devient pénible au bout de quelques minutes dans une salle.

## Vérifier avant l'événement

Afficher l'écran réel sur chaque dalle du parc, depuis le point le plus éloigné où un visiteur se tiendra, avec l'éclairage prévu. Lire un nom de joueur et un score à voix haute depuis ce point : si l'un des deux demande un effort, augmenter d'un cran, pas d'un demi.
