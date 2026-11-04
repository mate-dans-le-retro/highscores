La barre d'application rose, en tête de chaque écran produit.

C'est la **seule zone `surface-accent` d'un écran de gestion** : elle relie l'outil à la marque sans inonder l'interface de rose. Ne pas ajouter d'autre aplat rose sur la même page.

Le produit fournit le titre, l'URL d'accueil et, à droite, ce qu'il veut : identité de l'utilisateur, rôle via `AppBar.Tag`, bouton de déconnexion.

Tout le texte de la barre est en `ink-on-accent`, y compris les icônes. Ne pas y poser de texte en blanc sous 24px.

Passer `logoSrc` pour afficher le lockup à gauche du titre ; l'omettre sur un écran étroit et ne garder que le titre.

La barre est en `z-appbar` : le produit lui applique son propre positionnement collant s'il en a besoin.
