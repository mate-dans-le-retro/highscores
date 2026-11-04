The pink app bar, at the top of every product screen.

It is the **only `surface-accent` area of a management screen**: it ties the tool to the brand without flooding the interface with pink. Do not add any other pink fill on the same page.

The product provides the title, the home URL and, on the right, whatever it wants: user identity, role through `AppBar.Tag`, sign-out button.

All text in the bar is `ink-on-accent`, icons included. Do not put white text under 24px in it.

Pass `logoSrc` to show the lockup to the left of the title; leave it out on a narrow screen and keep only the title.

The bar is at `z-appbar`: the product applies its own sticky positioning if it needs one.
