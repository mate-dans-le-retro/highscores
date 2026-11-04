La modale de configuration : voile sur `surface-sunken`, panneau sur `surface-overlay`, `space-8` de padding.

Le titre dit ce que la modale fait (« Configuration du tournoi »), le sous-titre ce qu'elle attend (« Définissez les paramètres de votre tournoi »).

Les deux actions reçoivent des **boutons**, pas des libellés : `cancel` et `confirm` prennent le nœud tel quel. Le produit garde donc la main sur la variante, la taille, l'icône et le comportement, sans que la modale ait à exposer une propriété pour chacun. Pas de nœud, pas de bouton — une modale informative n'a qu'un `confirm`, une modale sans décision n'a ni l'un ni l'autre.

Elles se posent en pied, alignées à droite, annulation puis confirmation — l'ordre de l'application actuelle. La convention : `ghost` pour annuler, `primary` pour confirmer, et `danger` quand la confirmation détruit quelque chose. Le rouge du système est réservé à ça.

`actionsIn="header"` remonte les deux boutons à droite du titre. À réserver aux modales courtes où le pied serait loin du texte, typiquement une confirmation de deux lignes. Y passer des boutons en `size="sm"`, voire un bouton à icône seule pour l'annulation. Sur un formulaire, garder les actions en pied : on les cherche après avoir rempli, pas avant.

## Fermeture

Trois gestes ferment la modale : la croix, le clic sur le voile, la touche Échap. Ils passent tous par le même chemin, donc ils se comportent tous pareil — il n'y a pas de sortie dérobée qui contournerait la règle posée sur la croix.

`dismissable` est à `true` par défaut. La croix reste visible même quand la modale porte des actions : c'est au produit de décider s'il veut une sortie sans choisir, pas au composant de le déduire. Quand les actions sont en tête, la croix se pose à leur droite, après elles.

`dismissable={false}` retire la croix **et** neutralise le voile et Échap. `onDismiss` est quand même appelé, avec `prevented: true` : le produit sait que l'utilisateur a cherché à sortir et peut le lui dire — secouer le panneau, souligner les actions, afficher « termine d'abord ». Une modale dont on ne peut pas sortir sans rien qui l'explique, c'est une impasse ; si `dismissable` est à `false`, il faut un bouton d'annulation dans les actions.

Sinon `onDismiss({ reason, prevented: false })` est appelé **avant** la fermeture, où `reason` vaut `"close"`, `"scrim"` ou `"escape"`. S'il retourne exactement `false`, la fermeture est annulée : c'est là qu'on branche un « des modifications ne sont pas enregistrées ». Toute autre valeur, `undefined` compris, ferme.

Un dismiss ferme vraiment la modale. `onDismiss` est une notification, pas la mécanique de masquage — inutile de tenir un état juste pour ça.

Pour reprendre la main, passer `open` : le composant bascule alors en mode contrôlé, il ne se ferme plus tout seul et c'est `open` qui décide. À utiliser quand la modale doit rouvrir sans être remontée, ou quand sa visibilité vient d'ailleurs (une route, un store).

```jsx
<Modal
  title="Vider la liste"
  dismissable={false}
  cancel={<Button variant="ghost" size="sm">Annuler</Button>}
  confirm={<Button variant="danger" size="sm">Vider</Button>}
  onDismiss={(e) => e.prevented && secouer()}
/>
```

Échap est écouté au niveau du document tant que la modale est affichée : n'en afficher qu'une à la fois, sinon toutes répondent.

Une modale porte une seule décision. Un formulaire de plus de six champs n'est pas une modale : c'est une page.

Le composant rend le voile et le panneau, pas le portail ni le piège à focus — le produit les fournit, et rend le focus à l'élément déclencheur à la fermeture.

Ne pas empiler deux modales.
