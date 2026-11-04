Le lockup complet de l'association : « mate » en script rose, le bloc « DANS LE / RÉTRO » en lettres pixel sur violet, la pastille « GAMING ».

Quatre déclinaisons, toutes au même dessin, chacune en SVG et en PNG. Les SVG sont en `viewBox` 450,57 × 247,84 ; les PNG font 2362px de large, sur fond transparent, et sont générés depuis les SVG corrigés — mêmes couleurs, mêmes noms. Préférer le SVG partout où il est accepté.

`mdlr-logo.png` est l'ancien fichier du site, conservé pour référence. Il correspond à `mdlr-logo-couleur-fond-sombre` : utiliser celui-là désormais.

## Laquelle poser

Le nom dit le fond sur lequel la déclinaison se pose. Chacune a été vérifiée au rendu sur blanc, sur `brand-purple` et sur noir.

`mdlr-logo-couleur-fond-sombre.svg` — **la version par défaut.** Un filet blanc la détache de n'importe quel fond, et elle tient donc aussi bien sur violet que sur blanc ou sur rose. En cas de doute, c'est celle-là.

`mdlr-logo-couleur-fond-clair.svg` — la même sans filet, pour un rendu plus intégré sur fond clair. Elle ne contient **aucun pixel clair** : posée sur `brand-purple`, le bloc RÉTRO — qui est exactement de ce violet — disparaît entièrement. Réservée au blanc, aux fonds clairs et au rose de marque.

`mdlr-logo-mono-fond-sombre.svg` — déclinaison un ton, contours noirs et intérieur blanc. C'est la monochrome la plus robuste : elle tient sur blanc, sur violet et sur noir. Pour la sérigraphie, le marquage et tout support sans quadrichromie.

`mdlr-logo-mono-fond-clair.svg` — déclinaison en contours et gris clairs, pour fond clair uniquement. Sur violet elle devient terne, et sur noir le script « mate » disparaît : il y est dessiné en contour sombre.

Attention au nom de cette dernière dans le fichier d'origine, « Monochrome white » : ce n'est pas un aplat blanc d'une seule encre, elle mêle noir, gris moyen, gris clair et blanc. **Une vraie version blanche une encre manque encore** — c'est ce qu'il faudrait pour une broderie, une découpe vinyle ou un marquage à chaud sur support sombre.

## Correspondance avec les fichiers d'origine

Les noms de l'export étaient inversés par rapport à l'usage. Le tableau ci-dessous fait le lien, une fois pour toutes :

| fichier d'origine | nom dans le système | se pose sur |
| --- | --- | --- |
| `Color light.svg` | `mdlr-logo-couleur-fond-sombre.svg` | tous fonds |
| `Color dark.svg` | `mdlr-logo-couleur-fond-clair.svg` | fonds clairs et rose |
| `Monochrome black.svg` | `mdlr-logo-mono-fond-sombre.svg` | tous fonds |
| `Monochrome white.svg` | `mdlr-logo-mono-fond-clair.svg` | fonds clairs |

## Règles de pose

Poser le logo sur `surface-base`, `surface-raised` ou blanc, avec au moins `space-6` de marge autour. Largeur minimale 160px, maximale `layout-logo` (240px) : sous 160px les lettres pixel du bloc RÉTRO se brouillent.

En en-tête de site, le logo est incliné de 3° vers la gauche et chevauche le bas de la bannière. C'est un geste de marque, à reproduire avec la propriété `tilted` du composant `Logo`. Ailleurs, le poser droit.

Ne pas recomposer le lockup, ne pas séparer « mate » du bloc, ne pas retracer les lettres, ne pas appliquer de filtre, d'ombre portée ni de contour supplémentaire.

## Couleurs : ces fichiers ont été corrigés

L'export SVG issu du maître Illustrator sort en couleurs converties depuis le CMYK, et cette conversion désature les roses. Les valeurs d'origine de l'export étaient `#d12a7c` pour le rose principal et `#d65490` pour le rose clair — soit 43 et 30 unités de distance RGB avec le rose de la marque. Posés à côté du site, ces logos paraissaient poussiéreux.

Les fichiers de ce groupe sont donc **re-teintés sur les valeurs du site, qui font foi** :

| export Illustrator | corrigé en | occurrences |
| --- | --- | --- |
| `#d12a7c` | `#ea4592` (`brand-pink`) | 27 |
| `#d65490` | `#f14794` (rose clair du logo) | 16 |
| `#321356`, `#331456` | `#331655` (`brand-purple`) | 19 |

Le `#4fa9d0` du fichier est conservé tel quel : ce n'est pas une couleur de marque mais un voile posé à 20 % d'opacité, qui dessine la bande diagonale du bloc RÉTRO. Rendu sur le violet, il donne `#39336e` — à 2,4 unités du token `brand-slate`, ce qui confirme cette valeur au passage.

Le maître Illustrator n'a pas été modifié : il porte toujours les valeurs converties. **À faire au prochain passage sur le fichier `.ai`** : y appliquer la même correspondance, pour que les exports suivants n'aient plus besoin d'être retouchés. Tant que ce n'est pas fait, ne pas réexporter par-dessus ces fichiers sans repasser la correction.

## Ce qui reste à fournir

Le `favicon.svg` du dépôt du site n'est toujours pas vectoriel : c'est une enveloppe SVG autour de deux PNG en base64, et ses variantes claire et sombre sont deux images identiques. Il est à régénérer depuis `mdlr-logo-couleur.svg`, qui lui l'est vraiment.
