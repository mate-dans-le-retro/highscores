Le motif pixel de fond, en version fichier.

`pixel-background.svg` — 1920 × 1080, le fond exact de l'app Tournois : un aplat `#38195C` (la valeur de `surface-raised` en thème arcade) recouvert de 1351 carrés gris de tailles variables, à 40 % d'opacité et en mode de fusion `overlay`.

Les carrés vont de `#808080` à `#E6E6E6` : ce sont des gris, pas des violets. C'est la fusion `overlay` qui les teinte en reprenant le fond, ce qui veut dire que le motif s'adapte tout seul si on change l'aplat derrière lui.

Deux façons de poser le motif, à ne pas confondre. Ce fichier, pour une grande surface où la densité irrégulière des carrés se voit — un fond d'écran de bracket, un écran de projection. La classe `mdlr-pixelgrid` ou le composant `PixelGrid`, pour une maille régulière générée en CSS, moins lourde et qui suit le thème : à préférer dans une interface.

Le fichier est un SVG de 100 Ko environ. Ne pas le poser derrière du texte de moins de 18px, et ne pas l'employer en thème `scene` derrière du contenu : sa maille crée un moiré avec la grille physique des dalles.

Les carrés du site sont encore autre chose : trois carrés isolés par coin de bande, posés par `CornerSquares`.
