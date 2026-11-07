# Screens

The reference mockups are the "MDLR – Highscores" design canvas (https://claude.ai/artifact/1RCiKeMKxRwkV2Ru5XuFVV), built with the MDLR design system. This page sums up what they decide, screen by screen, and what that changes in the data model. The interface text quoted here stays in French, as it appears in the app.

## Public screen (`/`, `scene` theme, 1920 × 1080)

`/scores` redirects to `/`.

Three views. Volunteers choose which ones run in the admin ("Écran et Instagram").

**One game** ("Un jeu à la fois"). Header with the "HIGHSCORES" title and the logo on the right, over the pixel pattern background. Left: a `ScoreTable` panel with the machine as eyebrow ("Borne 3"), the game name, then the rows: `RankBadge` (pixel cups for the top three, numbered squares after), a square player photo (same Incognito / Sans photo bust as the wall when the score is anonymous or has no photo), player name and score in `font-display`. The newest score is highlighted (`fresh`). Right column, 560px wide:

- "LE RECORD": the photo of the record holder, with "Julie · samedi à 14h32" under it.
- "À TOI DE JOUER": the QR code to `/score?game=<slug>` for the game on screen, "Un record à afficher ?" and "Scanne, prends ta photo, c'est parti !". The player can still change the game on the phone.

In the app (see docs/decisions.md, "public screen after the visual review"): the first place is white and a new score pink for 30 s; current-event scores outside the all-time top sit under a separator labelled with the event name, with their all-time rank in a plain square. The record panel is "Record évènement" (photo, name, score, time), or "Record absolu" with its date and event when the current event has no score yet; panel titles sit inside the white frame, in pink. A game without any score shows a large QR code to `/score?game=<slug>` in the table and no side panels.

**Record wall** ("Mur des records", "LES RECORDS"). A 3 × 2 grid of `PixelPanel`s, one per visible game: game name as label, record photo, gold cup, player and score. When the all-time record (previous events) differs from the current one, a smaller line with a gold star shows it ("★ Marc · 31 200"). Beyond six games, the games are shared evenly between pages and each row of cards is centred. In the app, the cards have no cup: a large gold pixel star left of the name marks a record that is also the all-time one. The wall always shows a global QR to `/score` (any game) at the top right. An empty "À prendre !" card also shows a per-game QR to `/score?game=<slug>` under the copy (filled cards do not: no room next to the photo).

**New record** ("NOUVEAU RECORD !"). Shown when an approved score takes first place: big pink title, the player's photo (640px square), then the game, a gold "RECORD ABSOLU" badge when it beats the all-time record, the cup, the name, the score in very large type, and "Ancien record : Marc, 98 200".

Rotation: the mode "Alterner les deux" shows the wall, then each game in turn. Durations and number of rows are settings (see admin). After a new record, the screen shows that game; a click on a pill shows that slide from the start of its time.

While the tab is visible, the public screen asks for a Screen Wake Lock so the projector laptop stays awake. Missing API or a denied permission leaves the screen running as before (admin and `/score` do not request it).

## Player form (`/score`, `arcade` theme, phone)

Four steps, with a header that holds the logo or "Retour", "Étape X sur 3" and a three-segment progress bar.

1. **Photo** ("Un record à afficher ?"). "Prends ton score en photo, si possible avec toi devant l'écran." (no promise that the game and score are read from the photo, while detection is a stub) A frame "Cadre l'écran de score", the buttons "Prendre la photo" (camera) and "Choisir dans la galerie", and the note "Ta photo n'apparaît sur l'écran que si tu l'acceptes à la dernière étape, et une fois validée par l'équipe." Once a photo is chosen (coming back with "Retour" included), the frame shows it, with "Continuer avec cette photo" and two smaller buttons "Reprendre" and "Galerie".
2. **Details** ("Vérifie tes infos", with no subtitle). Thumbnail of the photo with "Reprendre"; the game as a 2-column grid of tiles (initials thumbnail + name) plus "Un autre jeu"; the selected tile has a pink border, a pink initials thumbnail and a check after the name. A `?game=<slug>` from the QR preselects that visible game when the draft has no game yet; the player can still pick another. The score field ("Tel qu'affiché sur l'écran du jeu."), labelled "Temps" for a timed game, with a numeric keyboard, the hint "Tape les chiffres d'affilée, comme sur le chrono : 13248 pour 1'32"48.", the reading "On lit 1'32"48." and a plain error message when the time does not hold. Values read from the photo carry a "Lu sur la photo" tag. Button "Continuer".
3. **Consent** ("Tes autorisations", "Deux cases, et un mot sur ce qu'on fait de ta photo."). In this order: the checkbox "Affichage sur l'écran", ticked by default ("J'accepte que ma photo, mon nom et mon score soient affichés sur l'écran de l'événement."); when ticked, the field "Ton nom ou pseudo (facultatif)" ("Laisse vide et on t'invente un nom."), when unticked "On t'invente un nom au hasard et on n'affiche pas ta photo."; the preview "Sur l'écran, ça donnera :" (photo or masked bust, real name or generated nickname, game, score); the checkbox "Instagram (facultatif)" ("J'accepte que Mate dans le Rétro… Gaming publie ma photo et mon score sur son compte @mate_dans_le_retro."), and only when it is ticked the field "Ton compte Instagram, pour te taguer (facultatif)". "Tu changes d'avis ? Dis-le à un bénévole, on retire ta photo." Button "Envoyer mon score".
4. **Sent** ("MERCI !", "Score envoyé"). "Un bénévole vérifie ton score. Une fois validé, tu apparais sur l'écran, près de la scène." Status pill "En attente de validation", button "Envoyer un autre score".

## Admin (`/admin`, `console` theme by default, desktop)

Pink top bar (aligned with Tournois TanStack): Brand Color dark logo (white block under « dans le rétro »), stacked "MDLR" / "Highscores", tabs "Soumissions" (with the pending count), "Jeux", "Écran", "Utilisateurs", Moon / Sun theme toggle, truncated email linking to Mon compte, Admin pill, "Ouvrir l'écran public", and logout. Dark remaps the admin to `arcade` tokens (`mdlr-admin-theme` in `localStorage`); public routes stay on their own themes.

**Sign-in.** Arcade pink-framed card (like Tournois): Color dark logo, "Connexion" / "Inscription", Google first, then email/password. The line "Ton accès admin sera disponible après validation d'un admin" shows in sign-up mode only. A new Auth account lands on "Pas encore admin" until an admin promotes it; from that page (and from Mon compte), they can set a password after a Google sign-up.

**Utilisateurs.** List of Auth users (email, providers, admin flag, sign-up date). "Promouvoir admin" / "Retirer admin".

**Mon compte** (`/admin/account`). Set or change password; reached from the truncated email in the app bar.

**Submissions.** Filters "À valider", "Validées", "Rejetées" with counts. Each card: photo, name, game, relative time, score, and tags ("Record battu", "1re place", "Instagram" or "Sans Instagram", "Masqué"); rejected cards also show the optional rejection reason when one was saved. Detail panel: photo, "Lu sur la photo : Tetris · 128 400", editable game, score and display name, the current record ("Ce score prend la 1re place."), "Afficher sur l'écran public" (unchecked: the score stays ranked, but the name and photo are replaced by a neutral nickname and image), "Publier sur Instagram" (only if the player agreed), the Instagram caption, and the "Rejeter" / "Valider et afficher" actions. Reject opens an optional reason field before "Confirmer le rejet"; the reason is shown again on a rejected detail. Pending and rejected submissions can also be deleted for good (inline confirm "Garder" / "Supprimer", same pattern as records); approved scores stay deletable from Records. A switch "Envois ouverts" opens or closes submissions.

Built (no mockup for it): a fourth filter "À publier" lists approved scores whose player agreed to Instagram and not posted yet. Its detail, also shown under an approved submission, has the visual with "Télécharger l'image" (PNG, or JPEG, or "Partager" on a phone), four short steps, the caption with "Copier la légende", the player's account with "Copier" (or "Pas de compte Instagram renseigné : publie sans taguer."), and "Marquer comme publié" / "Remettre à publier". `/dev` previews it with demo scores.

**Games.** Table: drag handle (order), initials thumbnail, name, score type ("Points · le plus haut gagne", "Temps · le plus bas gagne"), number of records, best score, "Affiché"/"Masqué" switch, edit, delete (with confirm; blocked when the game still has scores of any status, with a nudge to hide it instead), "Records". Button "Ajouter un jeu".

**Add a game** (dialog). Name, thumbnail (initials by default, or an uploaded image), score type "Points" / "Temps" / "Autre", "Le meilleur score est" "Le plus haut" / "Le plus bas", "Affiché" switch. Picking a cover opens a square crop step (`react-easy-crop`) before the file is kept for save; the uploaded file is a PNG when the source has transparency, otherwise a JPEG.

**Records of a game.** "Record all-time" line (with the event it comes from), then the current event's ranking: rank, photo, player (masked names shown greyed with a "Masqué" tag), score, origin ("Soumission validée" or "Saisie à la main"), edit, delete. Side panels: "Ajouter un record à la main" (name, score, optional photo, show on screen) and "Archiver l'évènement" (archive the current event: scores are kept and still count for the all-time record, the leaderboard starts from zero), with "Voir les évènements archivés".

**Screen and Instagram.** Screen mode ("Un jeu à la fois", "Mur des records", "Alterner les deux"), "Durée par jeu" (15, 30, 60 s), "Durée du mur" (10, 20, 30 s), "Durée Nouveau record" (8, 12, 20 s), "Places affichées" (top 3, 5, 10). The submission QR code with "Télécharger le PDF" (A4 at 300 dpi; Clair or Sombre; 1, 2 or 4 posters per page; optional one poster per selected game with the cover in the QR and `?game=<slug>`; multipage PDF when needed; PNG also available; QR to the current origin's `/score`). Instagram: on/off, connected account, publishing mode ("À la validation, si le joueur a accepté", "Me demander avant chaque publication", "Ne pas publier automatiquement"), default caption with `[jeu]`, `[joueur]`, `[score]` placeholders, "Aperçu d'une publication".

## Instagram visual (720 × 900, 4:5)

"NOUVEAU RECORD" eyebrow, the photo in a pink frame, a panel with the cup, the game, the name and the score, then the logo and "@mate_dans_le_retro".

Exported at 1080 × 1350. The photo frame is taller than on the mockup; the panel at the bottom also names the event and when the score was sent, in Paris time ("7 nov. 2026 à 14h32"). Headline by rank ("NOUVEAU RECORD !", "SUR LE PODIUM !", "BEAU SCORE !"), a gold "RECORD ABSOLU" tag on the score panel when it applies, and the masked bust with "INCOGNITO !" (or "SANS PHOTO") instead of the photo, as on the screen.

## What this adds to the data model

The current schema (`games`, `scores`, `leaderboard`) covers one event. The mockups add:

- **Events**: scores belong to an event; archiving one starts a new leaderboard. The all-time record is computed across events.
- **Display consent and masking**: a score can stay ranked with a neutral name and image (`display_on_screen`).
- **Instagram handle** of the player, optional.
- **Values read from the photo** (detected game and score), to show "Lu sur la photo" and compare with what the player entered.
- **Game score type**: points, time (formatted `1'32"48`) or other, on top of the existing `score_order`; and a short label for the initials thumbnail.
- **Settings**: submissions open or closed, screen mode, durations, number of rows, Instagram mode and caption template.

## Tone

The player screens and the public screen use "tu", the admin uses "vous". We use "tu" everywhere, in a simple, fun and retro voice (see docs/decisions.md): the admin copy quoted above is to be rewritten that way when it is built.

## Open points

- **Projection rules**: the design system asks for a 15 s rotation and no looping animation; the mockups offer 30 s by default and loop confetti on "NOUVEAU RECORD !". Some secondary text on the wall is under 40px.
