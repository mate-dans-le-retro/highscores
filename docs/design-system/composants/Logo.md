Le lockup complet de l'association, posé tel quel depuis le groupe d'assets `Logos`.

Le produit fournit l'URL de l'asset en `src` : le système ne redessine jamais la marque et n'embarque pas le fichier dans le bundle.

Poser le logo sur `surface-base`, `surface-raised` ou un aplat blanc. Il garde `space-6` de marge autour de lui, appliquée par le composant.

Passer `tilted` pour l'inclinaison de 3° de l'en-tête du site — c'est un geste de marque, à garder pour la pose en en-tête et non pour une barre d'application. Ne pas descendre sous 160px de large : en dessous, les lettres pixel du bloc RÉTRO se brouillent. Pour une barre d'application, utiliser `AppBar` avec `logoSrc`, qui gère la hauteur réduite.

Ne pas recomposer le lockup, ne pas séparer le mot « mate » du bloc, ne pas appliquer de filtre ni de teinte. Il n'existe pas de version vectorielle ni monochrome dans les sources : pour une impression grand format, demander le fichier d'origine.

Renseigner `alt` uniquement si le logo n'est pas déjà accompagné du nom de l'association en texte ; sinon passer `alt=""`.
