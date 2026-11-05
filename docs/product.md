# Product: MDLR highscores

## Context

Mate dans le Rétro… Gaming (MDLR, https://matedansleretro.fr) runs a retro gaming weekend. During the event, games are free to play (for example _Tetris_, _Duck Hunt_, _Super Mario Bros._, _Guitar Hero_; the list changes). We want to show off the best scores on a big screen, and let players submit them themselves.

First use: **Saturday 7 and Sunday 8 November 2026**.

## The three surfaces

The reference mockups detail each screen: see [screens.md](screens.md).

### 1. Public screen (`/`, `scene` theme; `/scores` redirects to it)

- Projected or shown on a TV in the room, watched from afar, without a mouse.
- Shows the leaderboard of one game at a time: game name and console at the top, then rank, player, score. Ten rows max.
- Rotates through the visible games every 15 seconds.
- Updates by itself when a score is approved (Supabase Realtime). A new score can be highlighted for a few seconds (a passing pink row); that is the only movement allowed.
- Always shows a QR code to `/score` next to the leaderboard.
- Ideas for later: the player's photo next to the record, a podium of the top three.

### 2. Score submission (`/score`, `arcade` theme)

- Opened from the QR code on the public screen, on the player's phone.
- The player picks the game, enters their nickname and score, takes a photo of themselves in front of the game's screen (proof), and ticks whether they accept an Instagram post.
- The submission is sent with the **pending** status; it only shows on the public screen once a volunteer approves it.
- Planned next step: the player takes the photo first, we **detect the game and the score** automatically (vision model, called from a server function), then they fix it if needed.

### 3. Admin (`/admin`, `console` theme)

Reserved for MDLR volunteers (email sign-in, public sign-ups closed).

- **Games**: add, rename, choose the console, the score type (points, time or other), the score order (higher or lower wins), the display order, and **show or hide** a game on the public screen.
- **Submissions**: see the queue of pending scores with the photo, **approve** or **reject** (with an optional reason).
- **Scores**: enter a score by hand (approved right away), fix or delete an existing score.
- **Instagram** (bonus): when approving a submission whose player gave consent, post the photo and score on the MDLR Instagram account. If the Meta API is not ready in time, fall back to a "Download the visual" button to post by hand.

## Business rules

- A score is a positive integer. A game's leaderboard is sorted by its score order (`desc`: highest wins, `asc`: lowest wins, for a time).
- Rank follows the `rank()` function: two equal scores share the same place.
- The same player can appear several times in a leaderboard (no deduplication by nickname for now: nicknames are not accounts).
- Photos are stored in a public bucket (`photos`), under `submissions/`. Players can neither list nor overwrite photos.
- Instagram consent is stored with the submission; without it, we never post.

## Out of scope for 7 November

- Player accounts.
- Automatic nickname moderation (volunteers approve every submission, that is enough).
- Multi-event history (we can add a notion of edition later).
