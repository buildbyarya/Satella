# Satella Big Deployment Design — 2026-10-01

## Goal
Bundle the currently agreed Satella backlog into one testable release: stabilize the recent Watch Together/Chat/Calendar work, complete the requested library and account-lifecycle behavior, finish the shared Notes polish, and expand Games into a mobile-first partner/bot game hub with Phase 1 and Phase 2 games plus the requested cooperative/single-player experiences.

## Product constraints

- Satella remains a private two-person Home; no public usernames or public profiles.
- Google OAuth remains the authentication mechanism.
- One Home contains exactly two members.
- Mobile is the first supported game layout; desktop improvements can follow testing.
- The release should be shipped as one production deployment after local/build verification; do not intentionally split it into multiple Vercel deployments.
- Existing working features should not be rewritten unnecessarily.
- Game history is not a long separate history UI; aggregate wins are recorded for Calendar.
- Game matches end and require an explicit restart/rematch.

## Feature scope

### 1. Watch Together and YouTube

- New Watch Together chat messages should keep the latest message visible automatically. If the user has scrolled away, show a compact down-arrow/unread indicator with a red dot and jump to the newest message when tapped.
- The currently playing video must expose Save/Like actions. Saving must support Watch Later, Liked Videos, Personal Playlist, and Common Playlist.
- Personal Playlist opens the current user's personal playlist picker; Common Playlist opens the Home's common playlist picker.
- Keep Watch Later and Liked Videos as protected system collections. Personal/Common are the initial custom collections; the data model should remain extensible for future multiple custom playlists without forcing a UI for them now.
- Saved videos must preserve enough metadata for useful thumbnails/titles/captions in library views.
- Preserve the current Watch Together synchronization behavior and avoid regressing the laptop black-screen path; player initialization must use the same robust mechanism already used by the working flow.
- Leaving Watch Together must return to the YouTube search/link screen, and the back action from that post-leave screen must go Home rather than reopening the departed room.
- Repeated Watch Together invites must be rate-limited in visible top notifications: at most the first three invites from the same relevant flow within a one-hour window should surface as top notices; excess repeats remain suppressed rather than spamming the user.

### 2. Partner chat-after-leaving notification

- If a partner leaves a Watch Together room and subsequently sends a Chat message, create a notification.
- A transient in-app popup lasts at most 8–10 seconds and does not navigate when tapped.
- The persistent Notifications section contains the item; tapping it opens Chat.

### 3. Shared Chat

- Seen state should remain, but compact it under the message timestamp, e.g. `Sent 8:10` then `Seen 9:12`, using a small font and no seconds.
- The wallpaper/background is fixed to the chat viewport and does not move with message scrolling.
- Keep the existing uniform three-dot message controls aligned at the lower/right edge of each bubble.

### 4. Shared Calendar

- Ensure events render on their correct date, including dates outside the current visible week/month boundary.
- Event color remains selectable and the entire date tile for an event is visibly tinted using that event's color while retaining readable text.
- Calendar background is independent from Chat background.
- Provide background presets and user-uploaded backgrounds.
- Game aggregates are shown in Calendar as a simple shared score summary, e.g. `Games: Arya 5 · Partner 7`, representing wins, not a long match history.

### 5. Shared Notes

- At the top of Shared Notes show the last editor and local time, e.g. `Last edited by you · 12:33 PM` or `Last edited by Mika · 12:41 PM`.
- The Shared Notes workspace/editor should use the available mobile width with comfortable edge padding instead of the current narrow centered column.
- Preserve existing collaborative formatting and note behavior.

### 6. Home/account deletion

- Settings exposes a permanent Delete Home/Account flow, distinct from logout.
- The initiating member requests deletion and the partner receives a persistent notification asking whether they also want to leave/delete the Home.
- Both members must explicitly confirm.
- The second confirmation clearly states that the operation is irreversible and all Home data and the members' Satella account records will be erased.
- If the partner declines, no deletion occurs and the request remains visible/marked in Notifications for later action.
- If the partner does not respond for three days, the initiating member may complete their exit/deletion flow without partner approval, with the same irreversible warning.
- On final deletion, cascade/remove Home data (chat, notes, YouTube library/playlists, Watch Together rooms, calendar, games, preferences, etc.) and remove the user's account/authentication records so the user is returned to the Google registration/login flow on a future visit.
- Do not retain a normal Satella username/profile record after deletion. Preserve only whatever minimal operational/audit data is legally or technically required; do not invent a public username system.
- Existing support functionality can be used as the escalation path for a blocked three-day/exception case; no admin dashboard is required in this release.

### 7. Games hub

Sidebar contains one `Games` entry only. Opening it shows the Games hub. The first card/action is `Invite Partner`, followed by the game catalog; individual games do not all appear in the sidebar.

Each multiplayer game offers:
1. Invite Partner
2. Play with Bot
3. Bot difficulty: Easy / Normal / Hard, selected before every bot match.

Partner invitation behavior:
- Inviting adds the partner to a game lobby and creates a dedicated Games notification.
- The notification pattern follows Watch Together: partner can accept/decline.
- If the partner chooses a game first, the other member receives `nickname chose XYZ — accept/decline`.
- Declining reports that choice back to the requester and returns both to the lobby.
- Lobby includes a small chat area for choosing games.
- `Authority` is directly below `Invite Partner`, green when inactive and red when active. When granted, the partner is notified they have authority. The authorized partner's selected game starts immediately without another accept prompt.
- Games can be played with a partner who is online without forcing them out of YouTube or another Satella module. Bot play is independent.
- If a player leaves the Games section, they have 45 seconds to return to the active match. After that, the remaining player can invite them again or continue against a bot.
- Match-end controls are `Rematch` and `Another game`. No explicit `Leave` button is added to the match-end UI yet.

### 8. Games catalog

Retain the existing Phase 1 games, but wire them into the new lobby/invite/bot architecture and make their rules real rather than merely sharing a generic state shell:
- Tic-Tac-Toe
- Connect Four
- Rock Paper Scissors
- Reaction Duel
- Quick Math Duel
- Button Smash
- Target Tap
- Coin Duel
- High / Low
- Color Clash

Add Phase 2 medium-difficulty games in the same release. The implementation may choose a practical catalog of mobile-first two-player games that fits the existing architecture, but each must have deterministic match state, rematch, partner synchronization, and bot behavior where applicable.

Add the requested cooperative/single-player experiences:
- Nuts & Bolts: shared puzzle where partners move pieces in turns/coordination to put matching colors into matching nuts.
- Liquid Sort: shared tube color-sorting puzzle where both partners manipulate the same puzzle state; no bot option.
- Snake: two-player snake arena with food scattered as stars and other snakes/bots. Include `Play Together` (partners cannot kill each other; revive costs food and increases after each revive; dead partner can spectate the survivor and use a revive action) and `Fight` (partners can kill each other; first death ends the match). Show a leaderboard with rank, nickname, and health/score.
- Animal Stack: physics-style cooperative/competitive stacking of rigid animals on a floating platform; keep pieces from falling off.

Single-player/cooperative puzzle games do not expose a bot option where the rules require a partner.

### 9. Game scoring and Calendar

- Record only aggregate wins per Home/member, not an extensive match-history screen.
- A completed multiplayer match increments exactly one member's win total unless it is a draw.
- Calendar displays the current aggregate score for both members.
- Rematches count as separate matches.

## Architecture

Use the existing Next.js App Router + API route + Prisma/PostgreSQL architecture. Extend the current Home-scoped models rather than introducing a second persistence system. Games should have a shared match/session abstraction with game-specific state and validation, while UI components remain game-specific. Notifications should be persisted and typed so Watch Together and Games can share presentation without sharing semantics.

For account deletion, use a single transactional server-side deletion operation after the authorization/confirmation rules are satisfied. Home-owned records should cascade from Home; user-owned auth/session records should be removed explicitly. The deletion endpoint must verify the current session user is one of the two Home members before mutating anything.

For YouTube/library metadata, keep a normalized saved-video contract and reuse it across Watch Later, Liked Videos, Personal Playlist, Common Playlist, and the current-player save controls.

## Error handling and safety

- Every mutating API must verify the authenticated user and current Home membership.
- Game actions must validate turn/authority/state on the server, not trust client state.
- Invite and notification spam must be rate-limited server-side as well as hidden in the UI.
- Account deletion must be idempotent and safe against duplicate confirmation requests.
- If a partner becomes inactive/disconnected, game state remains recoverable during the 45-second reconnect window.
- A failed background/upload update must not blank the Calendar or Notes page.

## Verification

Before production deployment:

- Run dependency installation and Prisma generation.
- Run lint and production build.
- Exercise API authorization for Home scoping and account deletion.
- Verify Calendar event rendering/color/background on mobile.
- Verify Notes last-editor and full-width layout.
- Verify Chat compact seen timestamps and fixed wallpaper.
- Verify YouTube save controls, metadata, current-video saving, and unread chat behavior.
- Verify Watch Together leave/back behavior and invite notification rate limit.
- Verify Games lobby, partner notification, authority, bot difficulty, reconnect window, rematch/another-game flows, and score aggregation.
- Smoke-test every listed game on two mobile browser sessions where multiplayer is required.
- Only after the complete build is green, deploy once to production and report the deployment URL plus any remaining known limitations.
