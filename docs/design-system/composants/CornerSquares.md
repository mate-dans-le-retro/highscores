Les trois carrés de `space-4` posés à chaque coin haut d'une bande de section, en `brand-pink` et `brand-purple`.

C'est une signature du site autant que l'alternance violet / rose : certains carrés portent un décalage négatif et débordent sur la bande précédente, ce qui coud visuellement les sections les unes aux autres au lieu de les empiler.

Les décalages sont relevés du gabarit du site, en unités de `space-1`. Deux grappes sont fournies, `variant="a"` et `variant="b"` : les alterner d'une bande à l'autre pour que le motif ne se répète pas à l'identique sur toute la page.

`SectionBand` les pose par défaut — il est rare d'avoir à utiliser ce composant directement. Les couper sur la première bande d'une page, qui n'a rien au-dessus d'elle sur quoi déborder.

Le composant est purement décoratif : il est marqué `aria-hidden` et n'intercepte pas les clics. Ne rien y accrocher d'informatif.

Ne pas en ajouter d'autres, ne pas en mettre en bas de bande, ne pas les agrandir. Trois par coin, deux coins, 16px : c'est ce dosage qui fait qu'ils se remarquent sans devenir un motif.
