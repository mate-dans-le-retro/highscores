Le champ de saisie et la liste déroulante des formulaires de configuration.

Le libellé est **toujours visible** et lié au contrôle : ne jamais le remplacer par un texte indicatif dans le champ, qui disparaît dès la première frappe.

Passer `hint` pour l'aide de saisie — « Nombre de manches par match ». Elle est reliée au contrôle par `aria-describedby`.

Passer `invalid` pour l'erreur : la bordure passe en `border-thick` `state-danger` et l'aide devient le message d'erreur en gras. Écrire ce que l'utilisateur doit faire (« Indiquez un nombre entre 2 et 64 »), pas ce qui ne va pas.

Utiliser `as="select"` avec `options` pour une liste déroulante ; le chevron est fourni, ne pas en ajouter un autre.

Composer les formulaires sur deux colonnes au maximum, en `space-5` de gouttière, en groupant les champs qui se lisent ensemble — « Joueurs par match » et « Qualifiés par match » côte à côte.

## Désactivé et lecture seule

Les deux ne disent pas la même chose, et le choix a des conséquences sur ce que le formulaire envoie.

`disabled` sort le champ du formulaire : la valeur n'est pas soumise, le contrôle s'efface et refuse le pointeur. C'est pour un réglage qui n'a pas encore de sens — « Format des phases finales » tant que les poules ne sont pas terminées. Dire pourquoi dans `hint`, sinon le champ éteint est une énigme.

`readonly` verrouille la saisie mais garde la valeur : elle reste lisible à plein contraste, et elle est bien soumise avec le formulaire. C'est pour une donnée qui compte mais que l'utilisateur ne fixe pas — un code de tournoi généré à la création. Le champ prend le fond enfoncé et une bordure en pointillés, le même vocabulaire que l'emplacement en attente d'un match.

`readonly` n'existe pas sur un `select` en HTML. Le composant verrouille donc la liste et porte la valeur dans un champ caché de même `name` : le formulaire continue de l'envoyer, ce qui est justement ce qui distingue la lecture seule du désactivé. Le chevron disparaît, puisqu'il n'y a plus rien à dérouler.

Le focus est celui du système : `shadow-focus` plein, 2px d'écart. Ne pas le remplacer par un anneau rose, qui échoue sur `surface-raised`.
