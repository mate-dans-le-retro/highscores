The configuration modal: scrim over `surface-sunken`, panel on `surface-overlay`, `space-8` padding.

The title says what the modal does (« Configuration du tournoi »), the subtitle what it expects (« Définissez les paramètres de votre tournoi »).

The two actions receive **buttons**, not labels: `cancel` and `confirm` take the node as is. The product therefore keeps control of the variant, size, icon and behavior, without the modal exposing a prop for each. No node, no button — an informative modal only has a `confirm`, a modal without a decision has neither.

They sit in the footer, right-aligned, cancel then confirm — the current app's order. The convention: `ghost` to cancel, `primary` to confirm, and `danger` when confirming destroys something. The system's red is reserved for that.

`actionsIn="header"` moves both buttons to the right of the title. Keep it for short modals where the footer would be far from the text, typically a two-line confirmation. Pass `size="sm"` buttons there, or even an icon-only button to cancel. On a form, keep the actions in the footer: people look for them after filling in, not before.

## Closing

Three gestures close the modal: the cross, a click on the scrim, the Escape key. They all go through the same path, so they all behave the same — there is no back door that would bypass the rule set on the cross.

`dismissable` is `true` by default. The cross stays visible even when the modal has actions: it is up to the product to decide whether it wants an exit without choosing, not up to the component to infer it. When the actions are in the header, the cross sits to their right, after them.

`dismissable={false}` removes the cross **and** neutralizes the scrim and Escape. `onDismiss` is still called, with `prevented: true`: the product knows the user tried to leave and can tell them — shake the panel, highlight the actions, show « termine d'abord ». A modal you cannot leave with nothing explaining why is a dead end; if `dismissable` is `false`, there must be a cancel button in the actions.

Otherwise `onDismiss({ reason, prevented: false })` is called **before** closing, where `reason` is `"close"`, `"scrim"` or `"escape"`. If it returns exactly `false`, closing is cancelled: this is where an "unsaved changes" prompt goes. Any other value, `undefined` included, closes.

A dismiss really closes the modal. `onDismiss` is a notification, not the hiding mechanism — no need to hold state just for that.

To take back control, pass `open`: the component then switches to controlled mode, it no longer closes by itself and `open` decides. Use it when the modal must reopen without being remounted, or when its visibility comes from elsewhere (a route, a store).

```jsx
<Modal
  title="Vider la liste"
  dismissable={false}
  cancel={<Button variant="ghost" size="sm">Annuler</Button>}
  confirm={<Button variant="danger" size="sm">Vider</Button>}
  onDismiss={(e) => e.prevented && shake()}
/>
```

Escape is listened to at the document level while the modal is shown: only show one at a time, otherwise they all respond.

A modal carries a single decision. A form with more than six fields is not a modal: it is a page.

The component renders the scrim and the panel, not the portal or the focus trap — the product provides them, and returns focus to the triggering element on close.

Do not stack two modals.
