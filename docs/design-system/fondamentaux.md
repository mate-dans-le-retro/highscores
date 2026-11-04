Le système sert trois surfaces : le site d'événement `matedansleretro.fr`, l'application de gestion et d'affichage des tournois, et l'affichage des highscores. Il tient en trois thèmes — `arcade` (sombre, par défaut), `console` (clair, pour les écrans de gestion denses) et `scene` (projection et grands écrans) — et en deux registres graphiques qui cohabitent sans se mélanger : le **registre pixel**, hérité du bloc RÉTRO du logo, pour tout ce que le public regarde ; le **registre application**, arrondi et sobre, pour ce que les bénévoles manipulent.

## Fondamentaux éditoriaux

Écrire en français, au **vouvoiement**, à la première personne du pluriel : « on vous attend les 7 et 8 novembre », « on prépare les tournois de Volume III ». Le « on » est la voix de l'association, pas un « nous » institutionnel.

Le ton est celui d'une bande de passionnés qui reçoit chez elle : direct, chaleureux, un peu taquin, jamais commercial. Écrire « Toujours l'ambiance comme à la maison, avec encore un peu plus de machines et de folie ! » plutôt que « une expérience immersive inédite ». Assumer l'enthousiasme avec un point d'exclamation par idée, pas trois.

Nommer l'association **Mate dans le Rétro… Gaming** en toutes lettres à la première mention d'un document, puis **MDLR** dans les interfaces internes et les noms de produits. Les points de suspension du nom complet sont dans la marque : les conserver.

Écrire les titres de section du site en **majuscules** (`AU PROGRAMME`, `LES TOURNOIS`, `LES INFOS IMPORTANTES À CONNAITRE`), accents compris sur les capitales. Dans les applications, écrire les titres en casse phrase (`Gestion du tournoi`, `Configuration du tournoi`) : ce sont des outils, pas des affiches.

Écrire les dates en toutes lettres et en minuscules (« samedi 7 novembre de 10h à minuit »), les heures au format `20h00`, les prix avec l'espace insécable avant l'euro (« Pass week'end : 8 € »). Les noms de jeux gardent leur graphie officielle : *Super Bomberman 2*, *Mario Kart*, *Just Dance*, *Super Smash Bros*.

Les emoji appartiennent à la communication, pas aux produits. La marque les emploie dans ses métadonnées et ses publications — « Association de quarantenaires geeks nostalgiques 🎮 📺 » est la description du site — et c'est très bien ainsi. Dans une interface, en revanche, ils ne rendent pas de la même façon d'un poste à l'autre et sont mal annoncés par les lecteurs d'écran : les médailles de podium sont des blocs colorés en `rank-gold`, `rank-silver`, `rank-bronze` avec le rang écrit, pas des caractères emoji — l'écran de podium actuel en utilise, à remplacer.

Employer les mots de l'association pour les objets métier : un **tournoi** se compose de **poules** puis de **phases finales**, chaque **match** oppose des **joueurs**, un tournoi est **à venir**, **en cours** ou **terminé**. Ne pas introduire « bracket », « seed » ou « round » dans l'interface française ; ces termes restent dans le code.

## Fondations visuelles

### Couleur

Deux couleurs font la marque et ne bougent jamais : `brand-purple` (#331655) et `brand-pink` (#ea4592). Elles sont identiques dans les trois thèmes. Toute interface MDLR est une alternance de ces deux aplats, ponctuée de blanc.

Poser les fonds avec `surface-base`, `surface-sunken`, `surface-raised` et `surface-overlay`, jamais avec `brand-purple` en dur : c'est ce qui permet au même composant de basculer en thème clair et en thème projection.

Alterner les grandes bandes de page entre `surface-base` et `surface-accent`, comme le fait le site. Une bande rose ne porte jamais deux niveaux de gris : sur `surface-accent`, utiliser `ink-on-accent` pour tout le texte, et `ink-on-accent-large` uniquement en titrage 24px et plus.

Utiliser `ink-accent` pour le texte rose, pas `brand-pink` : `brand-pink` sur `surface-base` tient 4,16:1, ce qui le réserve aux titres de 24px et plus ou en gras à partir de 19px. `ink-accent` passe à toute taille.

Réserver `state-danger` aux actions destructives et `state-live-*`, `state-soon-*`, `state-done-*` aux trois états de tournoi. Ces quatre couleurs ne servent à rien d'autre : un bouton rouge dans MDLR supprime.

Doubler toujours la couleur d'état par un mot. Les pastilles portent le libellé (« À venir », « En cours », « Terminé ») et le tableau de bracket marque le vainqueur par un aplat `surface-accent` **et** une icône, jamais par la couleur seule.

### Typographie

**Montserrat** est la fonte de la marque, en variable de 100 à 900, italiques comprises, chargée depuis Google Fonts. C'est la valeur exacte du site, avec sa pile de repli complète dans `type.families.sans`. Elle porte tout : titres et texte courant.

Trois graisses seulement, et ce sont celles du site : **400** pour le texte courant, **600** pour une mise en avant moyenne et les liens, **800** pour les titres et les passages forts. Ne pas introduire de 500 ni de 700 — le gras de la marque est un 800, plus lourd que le gras par défaut de la plupart des systèmes.

Tous les titres du site sont en **majuscules**. C'est une règle de gabarit, pas une propriété du token : ajouter `text-transform: uppercase` ou la classe `uppercase`. Dans les applications, les titres restent en casse phrase — ce sont des outils.

L'interlignage du texte courant est serré (18px sur 24px, soit 1,33). C'est volontaire et c'est la respiration de la marque : ne pas le détendre pour « aérer ».

`display` (Press Start 2P) est la fonte pixel, réservée aux moments où le public regarde un écran de jeu : titres de bracket, noms de joueurs, podium, tableau de highscores. `mono` porte les valeurs numériques qui se rafraîchissent (`numeric`), pour que les chiffres ne dansent pas.

Ne jamais composer un paragraphe en `display`. Au-delà de trois mots, la fonte pixel cesse d'être lisible : passer en `arcade-label` court, ou en `eyebrow`. Ne pas descendre `arcade-name` sous 16px ni `scene-pixel` sous 28px — en dessous, les contreformes se ferment, d'autant plus sur un vidéoprojecteur.

**Press Start 2P** est la fonte pixel confirmée : l'app Tournois la charge par `next/font/google` et s'en sert pour le tableau de tournoi, l'écran de podium et le numéro de rang du vainqueur. Ce n'est donc plus une substitution. Aucune des deux fontes du système n'a besoin d'être hébergée : Montserrat et Press Start 2P viennent toutes deux de Google Fonts.

### Espacement et grille

Tout est un multiple de `space-1` (4px). Cette grille n'est pas une convention arbitraire : c'est la maille du pixel art de la marque, et c'est aussi la maille de Tailwind une fois le preset en place — `p-6` vaut `space-6`.

Les valeurs du site : une bande de section fait `space-12` de padding en haut, `space-16` sur les côtés et `space-24` en bas, ses blocs sont séparés de `space-10`, et son contenu tient dans `layout-lg` (1024px), en colonnes de `layout-column` (296px) au plus.

Ailleurs : `space-6` dans une carte, `space-4` horizontalement dans un bouton ou un champ, `space-8` dans une modale, `space-24` en bordure de tout écran projeté.

### Angles et profondeur

Choisir le registre avant le rayon. Registre pixel : `radius-none`, bordure `border-pixel` en `line-accent` ou `line-strong`, profondeur par `shadow-pixel` (décalage net, sans flou). Registre application : `radius-md` pour les champs, `radius-lg` pour les boutons, `radius-xl` pour les cartes, `radius-pill` pour les pastilles, profondeur par `shadow-card`.

Ne pas mélanger les deux sur un même composant : un panneau de bracket à angles arrondis avec une ombre floue perd toute identité.

### Motif de fond

Le motif de carrés pixel est la texture signature de la marque — il court derrière les bandeaux de tournoi et dans les coins des sections du site. Le poser avec la classe `mdlr-pixelgrid` ou le composant `PixelGrid`, en `grid-dot` et `grid-dot-bright`, à la maille `space-6`.

Ce motif est décoratif : il se tient à environ 1,2:1 de son fond et ne doit jamais porter d'information ni passer sous du texte de moins de 18px. Sur une photo ou une affiche, l'atténuer à `opacity-grid`.

Le site en emploie une seconde forme, plus économe : trois carrés isolés de `space-4` par coin haut de bande, en `brand-pink` et `brand-purple`, certains débordant sur la bande du dessus. Ce sont eux qui cousent les sections entre elles. Les poser avec `CornerSquares`, ou `SectionBand`, qui les pose par défaut.

### États et focus

Donner un focus visible à tout élément interactif : `shadow-focus`, plein, avec 2px d'écart. L'anneau est choisi pour tenir 3:1 sur toutes les surfaces du thème, bandeau rose compris — ne pas le remplacer par un anneau rose, qui échoue sur `surface-raised`.

Un état désactivé combine `opacity-disabled` et `aria-disabled` : l'opacité seule ne suffit pas à passer le seuil de contraste.

Sur un survol, éclaircir la surface d'un cran (`surface-raised` → `surface-overlay`) plutôt que de changer la teinte.

### Mouvement

Le mouvement est bref et net, jamais fluide : transitions de 120 ms en `steps(3)` ou `linear` pour rester dans l'esprit 8 bits, pas d'accélération élastique. Les écrans projetés ne portent aucune animation en boucle : un mouvement permanent sur un vidéoprojecteur fatigue une salle en quelques minutes.

## Iconographie

Le système garde **un seul jeu d'icônes : Lucide.** L'app Tournois l'utilise déjà via `lucide-react`, et c'est un trait de 2px, géométrique, qui s'accorde au dessin de la marque.

Trait de 2px, 20px dans les interfaces de gestion, 24px sur les écrans publics, en `ink-secondary` au repos et `ink-accent` à l'état actif.

N'ajouter aucune seconde bibliothèque. Font Awesome, Material Symbols ou Phosphor apporteraient un second vocabulaire et surtout un second style — Font Awesome est massivement en pleins, Lucide en filets — et deux styles d'icônes dans un même produit se voient immédiatement. C'est exactement la dérive que ce système existe pour corriger. Une fonte d'icônes tierce ajoute aussi ses propres conditions de licence et d'attribution, à vérifier avant tout usage.

Si l'ergonomie d'une fonte d'icônes est souhaitée — écrire `<i class="icon-trophy"></i>` plutôt que d'importer un composant — **Lucide en fournit une**, sans changer de vocabulaire : importer `lucide-static/font/lucide.css` et poser les classes `icon-<nom>`. Même dessin, même licence, mêmes noms que les composants React.

Attention toutefois : la documentation de Lucide signale que cette fonte embarque **toutes** les icônes et alourdit sensiblement le chargement. Sur un écran projeté en salle, derrière le wifi d'une salle des fêtes, ça se paie. Réserver la fonte aux pages statiques et garder `lucide-react` dans l'application, qui ne charge que les icônes réellement utilisées.

Dans le registre pixel, ne pas utiliser Lucide du tout : les brackets emploient une manette dessinée en pixels, et la coupe de `RankBadge` est un tracé original sur maille de 16. Une icône en filet de 2px posée à côté d'un dessin pixel jure. Pour un nouvel élément pixel, dessiner sur la maille de 4px en `radius-none`.

Ne jamais porter une information par un emoji. Le rendu change d'un système à l'autre, la couleur n'est pas contrôlable, et les lecteurs d'écran les annoncent mal ou pas du tout — l'écran de podium actuel emploie 🥇🥈🥉, que `RankBadge` remplace.

Les visuels de jeux (Mario, Kirby, Bomberman, Chun-Li…) sont des personnages sous droits, utilisés en communication d'événement. Ils n'entrent pas dans le système et ne servent jamais d'icônes d'interface. Le tableau de tournoi affiche aujourd'hui un sprite de Mario en kart en son centre : c'est le seul endroit où un personnage sous droits s'est glissé dans un produit, et celui où il serait le plus simple de le remplacer par une figure MDLR.

## Marque et logo

Le logo est le lockup complet — « mate » en script rose, le bloc « DANS LE / RÉTRO » en lettres pixel blanches sur violet, la pastille « GAMING ». Il est fourni dans le groupe d'assets `Logos` et se pose tel quel : ne pas le redessiner, ne pas le recomposer, ne pas séparer le mot « mate » du bloc.

Poser le logo sur `surface-base`, `surface-raised` ou blanc. Réserver autour de lui une marge d'au moins `space-6`. Largeur minimale 160px, maximale `layout-logo` (240px) : en dessous de 160px, les lettres pixel du bloc RÉTRO se brouillent.

En en-tête de site, le logo est **incliné de 3° vers la gauche** et chevauche le bas de la bannière. C'est un geste de marque délibéré, pas un accident de gabarit : le reproduire avec `tilted`. Dans une barre d'application ou un pied de page, le poser droit.

Le logo existe en **quatre déclinaisons vectorielles**, toutes dans le groupe d'assets `Logos` : une version couleur cernée d'un filet blanc qui tient sur tous les fonds, la même sans filet pour les fonds clairs et le rose, et deux déclinaisons monochromes. Le maître est un fichier Illustrator en CMYK quadri dont tout le texte est vectorisé.

Les fichiers sont nommés par le fond sur lequel ils se posent. Par défaut, poser `mdlr-logo-couleur-fond-sombre.svg`, qui porte un filet blanc et tient partout. La version `fond-clair` ne va jamais sur `brand-purple` : le bloc RÉTRO est de ce violet-là et disparaît. Le détail de chaque déclinaison est dans le README du groupe.

Les fichiers du système ont été re-teintés sur les couleurs du site : l'export Illustrator sort en couleurs converties depuis le CMYK, ce qui désature les roses d'une quarantaine d'unités. Le maître `.ai` porte encore les valeurs converties et reste à corriger.

Attention à ne pas confondre avec le `favicon.svg` du dépôt du site : celui-là n'est pas vectoriel du tout, c'est une enveloppe SVG autour de deux PNG en base64.

## Comment consommer ce système

Chaque produit charge `tokens.css` puis `components/bundle.css`, et pose `data-theme` sur `<html>` : `arcade` par défaut, `console` sur les écrans de gestion, `scene` sur tout affichage projeté ou sur grand écran.

Trois façons de consommer le système, selon le produit.

**Site statique, sans outil de build.** Lier `mdlr.css` et rien d'autre. Ce fichier contient les variables des trois thèmes, une classe par style typographique et toutes les classes de composants. Poser `data-theme` sur `<html>` et la classe `mdlr-root` sur `<body>`, ajouter le lien Google Fonts pour Montserrat et Press Start 2P, c'est tout. C'est la voie pour `matedansleretro.fr`, qui n'a pas de chaîne de compilation.

**Application en Tailwind v4.** Charger `tailwind.css`, le preset `@theme`, qui fait des tokens des utilitaires natifs : `bg-surface-raised`, `text-ink-accent`, `text-h2`, `font-display`, `rounded-xl`, `max-w-column`. Il pose aussi `--spacing: 4px`, ce qui aligne toute l'échelle numérique de Tailwind sur la grille de la marque, et fournit `bg-purple`, `bg-pink`, `text-purple`, `text-pink` — les classes que le site écrit aujourd'hui à la main. Ne pas charger `mdlr.css` en plus : les deux feraient double emploi.

**Composants React.** `components/bundle.js` expose le global `MDLR` et rend exactement les classes de `bundle.css`, donc un produit peut migrer composant par composant sans rupture visuelle.

Parce que le preset Tailwind est déclaré en `@theme inline`, les utilitaires pointent sur les variables du système : `bg-surface-base` suit `data-theme` sans recompilation. Les couleurs d'état du système remplacent les palettes Tailwind employées aujourd'hui dans l'app Tournois — écrire `bg-state-danger` plutôt que `bg-red-600`.

`mdlr.css` est un fichier **généré** depuis `tokens.json` et `bundle.css`. Ne pas l'éditer à la main : corriger la source et régénérer, sinon la prochaine génération écrase la retouche.

Ne jamais recopier une valeur hexadécimale, un rayon ou une taille dans le code d'un produit. Toute valeur passe par une variable CSS `--nom-du-token` ou par l'utilitaire Tailwind correspondant.
