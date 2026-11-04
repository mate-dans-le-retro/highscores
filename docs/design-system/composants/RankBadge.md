La marque de rang d'un joueur : une coupe en pixel art portant le numéro de la place, en `rank-gold`, `rank-silver` ou `rank-bronze`.

La coupe est un dessin original du système, tracé sur une maille de 16 unités comme le reste du registre pixel. Ce n'est ni un emoji ni un glyphe de fonte d'icônes : elle se teinte par `currentColor`, suit donc le thème, et reste nette à toute taille.

**Le numéro est du vrai texte**, pas une forme. C'est lui qui porte l'information ; la coupe est décorative. Le composant expose un nom accessible complet — « 1re place », « 2e place » — et masque le reste aux lecteurs d'écran.

Par défaut, la coupe est posée en encre sombre sur une **plaque** de la couleur du rang. Sur un podium, la marche porte déjà cette couleur : passer `bare`, sinon la plaque disparaîtrait sur son propre fond. `Podium` le fait déjà.

Les trois métaux sont posés en **dégradé à deux tons** — un reflet clair en haut à gauche, la teinte pleine en bas à droite. C'est le seul dégradé du système : un or plat n'a aucun clinquant, et deux arrêts suffisent à le faire briller sans sortir du registre pixel. L'encre sombre tient de 5,35:1 à 11,32:1 selon le métal et l'endroit du dégradé.

Les trois métaux sont identiques dans les trois thèmes. Ils ne se re-teintent pas selon le thème : un or reste un or, et comme ils servent toujours de remplissage sous une encre sombre, leur lisibilité ne dépend pas du fond de page. C'est ce qui évite les ors ternes et les bronzes boueux d'un thème clair.

Seuls les trois premiers reçoivent une coupe. Au-delà, `RankBadge` rend un simple carré numéroté sur `surface-overlay` : une coupe pour la dix-septième place ne veut rien dire, et le numéro reste à un seul chiffre dans la coupe, donc toujours lisible.

La coupe est dessinée avec deux unités de marge en haut comme en bas de sa maille, et le numéro descend dans la cuve plutôt que de se coller au rebord. Ne pas réduire ces marges : collée au bord de sa plaque, la coupe paraît tomber.

Quatre tailles : `xs` (28px), `sm` (40px) pour une ligne de tableau dense, la taille par défaut (48px) pour un classement, `lg` (80px) pour la marche du vainqueur sur un podium.

`sm` est le plancher en lecture seule : en dessous, le chiffre passe sous 12px et la fonte pixel commence à se fermer. `xs` descend le chiffre à 10px et n'existe que pour un cas précis, la marque d'une ligne de `BracketMatch` : là, la place est aussi portée par la couleur de la plaque, elle ne dépasse jamais un chiffre, et le nom accessible de la ligne l'énonce en toutes lettres. Ne pas s'en servir ailleurs — un classement complet en `xs` serait illisible.

`Podium` et `ScoreTable` le posent déjà. Il est rare d'avoir à l'utiliser directement — le cas typique est un encart « meilleur score du week-end » hors tableau.

Passer `label` pour remplacer le nom accessible quand le contexte le demande, par exemple « vainqueur du tournoi Mario Kart » plutôt que « 1re place ».

Ne pas remplacer la coupe par un emoji 🏆 : le rendu change d'un poste à l'autre, la couleur n'est pas contrôlable, et les lecteurs d'écran l'annoncent mal. C'est précisément ce que ce composant remplace dans l'écran de podium actuel.
