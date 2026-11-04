Le bouton du système, en cinq variantes qui répondent chacune à une intention précise.

`primary` porte l'action principale d'un écran — une seule par écran. `secondary` porte les actions de rang deux. `ghost` porte les actions discrètes d'une barre d'outils. `danger` est réservé aux actions destructives, et à rien d'autre : dans MDLR, un bouton rouge supprime. `pixel` relève du registre arcade et ne s'emploie que sur un écran regardé par le public, jamais dans une interface de gestion.

Écrire les libellés à l'infinitif ou au verbe d'action, en casse phrase : « Démarrer le tournoi », « Ajouter », « Enregistrer », « Vider ». Ne pas utiliser de majuscules d'imprimerie hors variante `pixel`.

Passer `icon` pour une icône avant le libellé, `iconEnd` pour une icône après. L'écart est de `space-2` dans les deux cas. Le produit fournit le glyphe — le système n'embarque pas de bibliothèque d'icônes, il attend du Lucide en trait de 2px.

`icon` porte le sens de l'action : une flèche de lecture sur « Démarrer », un plus sur « Ajouter ». `iconEnd` porte une direction ou une suite : un chevron de menu, une flèche d'étape suivante, un lien sortant. Ne pas en mettre des deux côtés.

**Sans libellé, le bouton devient carré et n'affiche que son icône.** Il garde toute la chrome de sa variante — un `danger` reste rouge, un `pixel` garde son cadre. Dans ce cas `aria-label` est **obligatoire** : c'est le seul nom accessible du bouton, et sans lui un lecteur d'écran annonce « bouton » sans rien d'autre.

Ne pas confondre avec `IconButton`. Le bouton à icône seule sert quand l'action a besoin de la chrome d'un bouton : une barre d'outils, une tête de modale, une action isolée qui doit se voir. `IconButton` est sans fond, plus petit, fait pour les actions répétées en bout de ligne d'une liste, où une chrome par ligne saturerait l'écran.

Un bouton désactivé prend `disabled`, qui pose `aria-disabled` plutôt que l'attribut natif : le bouton reste atteignable au clavier, donc annonçable — un bouton natif désactivé sort de l'ordre de tabulation et devient invisible pour qui navigue au clavier. En contrepartie le navigateur ne bloque plus le clic : c'est le composant qui le neutralise, et un lien désactivé perd son `href`. Le curseur passe en `not-allowed` au survol, ce qui suppose de garder les événements de pointeur — d'où l'absence de `pointer-events: none`.

Deux états d'appui, à ne pas confondre. L'**enfoncement** est automatique et dure le temps du clic : le bouton descend d'un pixel, et dans le registre pixel il glisse de `space-1` en diagonale en perdant son ombre portée — le geste d'une touche d'arcade qu'on presse.

L'**état activé** est persistant et se déclare par `pressed`, pour une bascule : plein écran, pause, un filtre qu'on laisse enclenché. C'est `aria-pressed` qui porte l'état, et le style suit cet attribut plutôt qu'une classe : l'aspect et la sémantique ne peuvent donc pas diverger, et un lecteur d'écran annonce « activé » en même temps que l'œil le voit.

Le bouton activé **garde la couleur de sa variante**. Le repeindre en rose ferait d'une bascule secondaire enfoncée le sosie d'un bouton primaire au repos, et l'état deviendrait illisible dans une barre d'outils où les deux se côtoient. Trois signaux se cumulent à la place, qui ne disent que « enfoncé » : le bouton descend d'un pixel, se creuse d'une ombre interne et prend un liseré rose à l'intérieur de son bord. La variante `pixel` garde son propre vocabulaire — elle glisse sur son ombre portée, ce qui dit déjà tout.

Ne poser `pressed` que sur une vraie bascule. Un bouton d'action ordinaire — « Enregistrer », « Ajouter » — le laisse absent : `aria-pressed="false"` sur un bouton qui ne bascule pas fait annoncer un état qui n'existe pas.

Renseigner `href` pour rendre un lien qui a l'apparence d'un bouton — utile pour les appels à l'action du site.
