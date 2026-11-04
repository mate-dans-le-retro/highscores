Le cadre du registre arcade : `radius-none`, bordure `border-pixel` en `line-accent`, ombre `shadow-pixel` nette et sans flou.

C'est le conteneur de tout ce que le public regarde sur un écran de jeu : blocs de match, encarts de classement, panneaux d'information d'un bracket.

Passer `label` pour l'étiquette en fonte display au-dessus du contenu — « QUARTS DE FINALE », « FINALE ». Trois mots au maximum : au-delà, la fonte pixel cesse d'être lisible.

Utiliser `tone="plain"` pour border en `line-strong` plutôt qu'en rose, quand plusieurs panneaux voisins se disputent l'attention.

Ne jamais arrondir les angles ni ajouter d'ombre floue : un panneau de bracket arrondi perd toute identité. Pour un conteneur de gestion, utiliser `Card`.

La surface intérieure est `surface-inverse` : blanche en thème arcade et scene, violette en console. Le texte à l'intérieur est en `ink-inverse`.
