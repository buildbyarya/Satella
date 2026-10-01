# Satella Games Rebuild Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current placeholder-heavy Games implementation with a genuinely playable, mobile-first subsystem covering the approved Phase 1/2 games, real bot difficulty, partner lobby/authority, cooperative games, rematch flow, and Calendar win totals.

**Architecture:** Keep `/games` as the single entry point, but replace the current per-phase placeholder logic with a shared server-authoritative `GameSession` model and a pure TypeScript game-engine layer. Each client sends validated intents to API routes; the server persists the canonical state and both clients poll the session until a realtime transport is introduced. Game-specific UI components render only validated state and expose real actions rather than generic `PLAY` buttons.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Prisma 6/PostgreSQL, NextAuth, Tailwind CSS 4. No new runtime dependency unless a required capability cannot reasonably be implemented with the existing stack.

**Spec:** `docs/superpowers/specs/2026-10-01-games-rebuild-design.md`

## Global Constraints

- Mobile-first; initial game controls target phones and touch.
- Server-authoritative multiplayer state; clients never decide winners locally.
- Bot difficulty must change observable behavior on every bot-capable game.
- No generic `PLAY` control may resolve a match without a real game action.
- Games notifications remain separate from Watch Together notifications.
- Match completion exposes only `Rematch` and `Another Game`.
- A player leaving Games during a partner match gets a 45-second rejoin window.
- Removed placeholder games: Coin Duel, High/Low, Color Clash, Target Tap.
- Calendar stores cumulative wins per Home member instead of a long game-history page.
- Keep the existing Satella visual language and avoid unrelated Chat/YouTube/Calendar-background/account-deletion changes.
- All implementation work stays on `games-rebuild-2026-10-01`; production `main` is not updated until the full build and verification pass is complete, so Vercel gets one production deployment from the final merge.

## Review Focus

- Invalid/stale actions — server rejects actions for the wrong turn, finished match, wrong participant, or malformed payload; cover in engine/API tests.
- Bot difficulty collapse — Easy/Normal/Hard must produce different decision policies or measurable timing/accuracy; cover with deterministic seeded bot tests.
- Duplicate/rapid submissions — repeated requests cannot award extra moves, scores, wins, or duplicate session transitions; cover with API/engine tests.
- Partner disconnect/rejoin — leaving the page does not immediately forfeit the session; the 45-second window and post-window behavior are tested.
- Mobile interaction overflow — every shipped game remains usable in a narrow phone viewport; cover with the browser verification pass and explicit touch-control checklist.

---

### Task 1: Replace the placeholder session storage with a real game-session model

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/<timestamp>_add_game_sessions/migration.sql`
- Create: `lib/games/types.ts`
- Create: `lib/games/session.ts`
- Create: `lib/games/validation.ts`
- Create: `tests/games/session.test.ts`

**Interfaces:**
- Produces `GameKind`, `GameMode`, `BotDifficulty`, `GameSessionState`, participant/session helpers, and action validation used by all later tasks.
- `GameSession` must belong to `Home`, reference the two Home members when applicable, store `game`, `mode`, `difficulty`, serialized canonical state, `status`, `turn/round metadata`, `winnerMemberId`, `startedAt`, `finishedAt`, `updatedAt`, and rejoin timestamps.
- Add cumulative per-member win counters on the Home game record (or a dedicated `GameScore` model) so Calendar can read wins without reconstructing history.

- [ ] **Step 1: Write failing engine/session tests** for creating a session, identifying Player A/B, rejecting a non-member, rejecting a finished-session action, and recording exactly one win.
- [ ] **Step 2: Run the focused tests** and confirm they fail because the new interfaces/model do not exist.
- [ ] **Step 3: Add the Prisma models/enums and migration** without modifying unrelated models.
- [ ] **Step 4: Implement `lib/games/session.ts`** with transaction-safe session creation, state update, finish, rematch reset, and win-counter increment semantics.
- [ ] **Step 5: Implement `lib/games/validation.ts`** so every action is checked against session status, participant, turn, and game-specific payload constraints before persistence.
- [ ] **Step 6: Run the focused tests and Prisma validation**; expected result is PASS and a valid migration.
- [ ] **Step 7: Commit** `feat: add authoritative game sessions` on the feature branch.

---

### Task 2: Build pure game engines and deterministic bot policies

**Files:**
- Create: `lib/games/engines/tictactoe.ts`
- Create: `lib/games/engines/connect4.ts`
- Create: `lib/games/engines/rps.ts`
- Create: `lib/games/engines/reaction.ts`
- Create: `lib/games/engines/quickMath.ts`
- Create: `lib/games/engines/memoryMatch.ts`
- Create: `lib/games/engines/pong.ts`
- Create: `lib/games/engines/airHockey.ts`
- Create: `lib/games/engines/penaltyShootout.ts`
- Create: `lib/games/engines/basketball.ts`
- Create: `lib/games/engines/miniGolf.ts`
- Create: `lib/games/engines/mazeRace.ts`
- Create: `lib/games/engines/targetRange.ts`
- Create: `lib/games/engines/buttonSmash.ts`
- Create: `lib/games/bots/*.ts` for game-specific difficulty policies
- Create: `tests/games/engines/*.test.ts`

**Interfaces:**
- Each engine exposes pure `createState`, `applyAction`, `isFinished`, and where applicable `getBotAction` functions. They receive canonical state plus a validated action and return a new state; they do not touch Prisma or HTTP.
- Bot policies accept a seeded RNG/context so tests can prove difficulty differences without flaky randomness.

- [ ] **Step 1: Write failing tests** for legal moves, win/draw detection, round completion, and bot policy differences for each engine.
- [ ] **Step 2: Run focused tests** and confirm failure.
- [ ] **Step 3: Implement board engines** for Tic-Tac-Toe and Connect Four, including all directional win checks and draw detection.
- [ ] **Step 4: Implement simultaneous/round engines** for RPS, Reaction Duel, Quick Math, and Memory Match. Quick Math must generate varied answer choices and Memory Match must support 4×4, 5×5, and 8×8 emoji-pair boards.
- [ ] **Step 5: Implement arcade engines** for Pong, Air Hockey, Penalty Shootout, Basketball Duel, Mini Golf, Maze Race, Target Range, and Button Smash. They must model real player actions, collision/score/round state where relevant, and never auto-finish from a generic start button.
- [ ] **Step 6: Implement Easy/Normal/Hard bot policies** with visibly different reaction timing, accuracy, search depth, memory retention, or aim/error ranges as appropriate.
- [ ] **Step 7: Run the full game-engine test suite** and confirm PASS.
- [ ] **Step 8: Commit** `feat: add deterministic game engines and bot policies`.

---

### Task 3: Rebuild the Games lobby, partner invite flow, authority, and notifications

**Files:**
- Modify: `app/(rooms)/games/page.tsx`
- Modify: `components/games/GamesHub.tsx`
- Create: `components/games/GamesLobby.tsx`
- Create: `components/games/GameLobbyChat.tsx`
- Create: `components/games/GameNotificationPanel.tsx`
- Create: `app/api/games/lobby/route.ts`
- Create: `app/api/games/invite/route.ts`
- Create: `app/api/games/authority/route.ts`
- Create: `app/api/games/notifications/route.ts`
- Modify: existing sidebar/notification component that currently registers the Games item, after locating the exact implementation.

**Interfaces:**
- Lobby returns current Home members, pending game invitation, authority state, and active session.
- Invite endpoint accepts `{ game?: GameKind }` and creates a pending lobby notification; accept/decline actions are explicit and idempotent.
- Authority endpoint toggles the partner-selection authority and records who currently holds it.
- Notification records remain scoped to the Home/user and are marked read independently.

- [ ] **Step 1: Write failing API tests** for invite, accept, decline, authority toggle, duplicate invite suppression, and notification read state.
- [ ] **Step 2: Implement the lobby notification persistence using the new game-session/lobby model** rather than piggybacking on Watch Invite rows.
- [ ] **Step 3: Implement the Games lobby UI** in the requested order: Invite Partner, then the game list; keep only the Games icon in the global sidebar.
- [ ] **Step 4: Add the lobby chat area** and make it available while partners choose a game.
- [ ] **Step 5: Add the green-to-red Authority control directly below Invite Partner**; when enabled, notify the partner and automatically start their selected game.
- [ ] **Step 6: Add accept/decline flows** including the declined-game message and automatic start when authority is active.
- [ ] **Step 7: Add the 45-second rejoin timer behavior** and post-expiry reinvite/bot fallback where supported.
- [ ] **Step 8: Run API tests and lint**; expected result is PASS with no placeholder game routes exposed.
- [ ] **Step 9: Commit** `feat: add games lobby and partner invitations`.

---

### Task 4: Build the real board, duel, and memory-match screens

**Files:**
- Replace: `components/games/PhaseOneGame.tsx`
- Replace: `components/games/BotGame.tsx`
- Create: `components/games/GameShell.tsx`
- Create: `components/games/BoardGameView.tsx`
- Create: `components/games/MemoryMatchView.tsx`
- Create: `components/games/ReactionDuelView.tsx`
- Create: `components/games/QuickMathView.tsx`
- Create: `components/games/RpsView.tsx`
- Modify: `app/(rooms)/games/phase-one/[game]/page.tsx`
- Modify: `app/(rooms)/games/bot/[game]/page.tsx` after locating its current route.
- Create: `app/api/games/session/route.ts`

**Interfaces:**
- Session API accepts a game action and returns the authoritative state plus player role and connection status.
- Views receive state/actions from `GameShell` and do not contain winner logic.

- [ ] **Step 1: Write failing component-level interaction checks** for real moves, turn locking, difficulty selection, match completion, Rematch, and Another Game.
- [ ] **Step 2: Implement the common `GameShell`** with mobile header, player status, connection status, result card, Rematch, and Another Game.
- [ ] **Step 3: Implement Tic-Tac-Toe, Connect Four, and RPS** against the session API.
- [ ] **Step 4: Implement Reaction Duel with a real server-generated signal window and false-start handling.**
- [ ] **Step 5: Implement Quick Math with shuffled answer choices and difficulty-dependent bot response.
- [ ] **Step 6: Implement Memory Match with 4×4/5×5/8×8 selectors, emoji pairs, alternating turns, matched-pair scoring, and bot memory behavior.
- [ ] **Step 7: Remove Coin Duel, High/Low, Color Clash, and Target Tap from all lobby/config routes.
- [ ] **Step 8: Verify all board/duel games manually in a narrow mobile viewport and run tests/lint.
- [ ] **Step 9: Commit** `feat: rebuild board and duel games`.

---

### Task 5: Build the arcade games as actual playable games

**Files:**
- Create: `components/games/arcade/PongGame.tsx`
- Create: `components/games/arcade/AirHockeyGame.tsx`
- Create: `components/games/arcade/PenaltyShootoutGame.tsx`
- Create: `components/games/arcade/BasketballDuelGame.tsx`
- Create: `components/games/arcade/MiniGolfGame.tsx`
- Create: `components/games/arcade/MazeRaceGame.tsx`
- Create: `components/games/arcade/TargetRangeGame.tsx`
- Create: `components/games/arcade/ButtonSmashGame.tsx`
- Create: `components/games/arcade/ArcadeCanvas.tsx` only if a shared canvas abstraction is useful after inspecting existing code.
- Modify: game route/config to map these game IDs to their screens.

**Interfaces:**
- Arcade views consume the same authoritative session API but may keep high-frequency visual simulation local; authoritative checkpoints/results are persisted through explicit actions/ticks rather than one database write per animation frame.
- Bot controllers use the difficulty policy interface from Task 2.

- [ ] **Step 1: Write focused tests** for scoring and terminal conditions for each arcade engine.
- [ ] **Step 2: Implement Pong with moving ball, two paddles, collision, score, reset, and bot paddle movement.
- [ ] **Step 3: Implement Air Hockey with puck, paddles, boundaries, goals, score, and bot movement.
- [ ] **Step 4: Implement Penalty Shootout with aim/power input, goalkeeper behavior, alternating attempts, and a fixed score limit.
- [ ] **Step 5: Implement Basketball Duel with actual aim/timing and a scored basket interaction.
- [ ] **Step 6: Implement Mini Golf with aim/power strokes and hole completion by stroke count.
- [ ] **Step 7: Implement Maze Race with generated maze, player movement, completion timing, and difficulty-based bot pathing.
- [ ] **Step 8: Implement Target Range as a moving/varied-target skill round and keep Button Smash only as a genuine speed/tap competition.
- [ ] **Step 9: Run the arcade engine tests plus mobile interaction checks.
- [ ] **Step 10: Commit** `feat: add playable arcade games`.

---

### Task 6: Build Snake, Nuts & Bolts, Liquid Sort, and Animal Stack

**Files:**
- Create: `lib/games/engines/snake.ts`
- Create: `lib/games/engines/nutsAndBolts.ts`
- Create: `lib/games/engines/liquidSort.ts`
- Create: `lib/games/engines/animalStack.ts`
- Create: `components/games/cooperative/SnakeGame.tsx`
- Create: `components/games/cooperative/NutsAndBoltsGame.tsx`
- Create: `components/games/cooperative/LiquidSortGame.tsx`
- Create: `components/games/cooperative/AnimalStackGame.tsx`
- Create: `components/games/cooperative/StackCrane.tsx`
- Modify: game route/config to register these games.
- Create: `tests/games/cooperative/*.test.ts`

**Interfaces:**
- Nuts & Bolts and Liquid Sort are partner-only cooperative sessions with no Bot button.
- Snake supports Play Together and Fight; its authoritative state contains food, snakes, health/score, ranking, revive cost, and mode.
- Animal Stack contains the current tower/pieces and turn; UI uses an actual crane/drop interaction rather than a static wall graphic.

- [ ] **Step 1: Write failing puzzle tests** for legal color moves, completion, turn ownership, and reset.
- [ ] **Step 2: Implement Nuts & Bolts state transitions** so matching colors are grouped by valid moves and completion is detected.
- [ ] **Step 3: Implement Liquid Sort legal pours, capacity rules, completion, and reset.
- [ ] **Step 4: Write failing Snake tests** for movement, food growth, collisions, ranking, Play Together immunity, Fight kills, and increasing revive cost starting at 1000 food.
- [ ] **Step 5: Implement Snake simulation/checkpoint state and spectator/revive transitions.** Do not write one database row per animation frame.
- [ ] **Step 6: Write failing Animal Stack tests** for turn order, placement/fall detection, height progression, and match completion.
- [ ] **Step 7: Implement Animal Stack with touch-friendly crane positioning and visually stacked rigid pieces; remove the current fake wall UI.
- [ ] **Step 8: Run cooperative tests and mobile interaction checks.
- [ ] **Step 9: Commit** `feat: add cooperative puzzle and stack games`.

---

### Task 7: Finish match lifecycle, Calendar win totals, and Games navigation cleanup

**Files:**
- Modify: `components/games/GamesHub.tsx`
- Modify: `app/(rooms)/calendar/page.tsx` after locating the current calendar implementation.
- Create or modify: the Calendar API/helper that reads cumulative Home game scores.
- Modify: `components/common/PageHeader.tsx` only if required to preserve the existing per-section title behavior.
- Modify: `app/(rooms)/games/page.tsx` and route configuration for final game ordering.

**Interfaces:**
- Calendar receives `{games:{members:[{nickname,wins}], totalPlayed:number}}` from a Home-scoped endpoint/helper.
- Match result handling increments only the winner's cumulative score and never counts abandoned/incomplete matches.

- [ ] **Step 1: Write failing Calendar score tests** for zero wins, one-sided wins, multiple wins, and Home-member ordering.
- [ ] **Step 2: Implement the Calendar game-score read and display** using the existing calendar visual language.
- [ ] **Step 3: Wire completed sessions to exactly-once win-counter increments.
- [ ] **Step 4: Implement Rematch and Another Game consistently across every shipped game.
- [ ] **Step 5: Finalize lobby ordering and remove stale phase-one/phase-two links that expose removed or placeholder games.
- [ ] **Step 6: Verify the Games sidebar entry remains a single item and the lobby contains the full approved game list only.
- [ ] **Step 7: Run Calendar tests and lint.
- [ ] **Step 8: Commit** `feat: integrate game scores with calendar`.

---

### Task 8: Full verification, regression check, and one production merge/deploy

**Files:**
- Modify only files required by verification failures.
- Create: `docs/superpowers/verification/games-rebuild-2026-10-01.md` with the final test matrix and observed results.

**Interfaces:**
- No new product interfaces; this task proves the completed subsystem against the spec and protects unrelated Satella functionality.

- [ ] **Step 1: Run `npx prisma validate` and `npm run lint` on the complete feature branch.
- [ ] **Step 2: Run the complete game-engine/API test suite and record results.
- [ ] **Step 3: Run `npm run build` and fix every build/type/runtime compile failure before proceeding.
- [ ] **Step 4: Use browser verification against a local/dev build to check the Games lobby, every listed game, bot difficulty selection, multiplayer turn flow, rematch, Another Game, notification flow, 45-second rejoin behavior, Memory Match sizes, Snake modes, cooperative puzzles, Animal Stack, and Calendar scores on a phone-sized viewport.
- [ ] **Step 5: Regression-check authentication, Home loading, Chat, Watch Together, YouTube, Notes, Calendar rendering, and account settings for obvious breakage caused by shared model changes.
- [ ] **Step 6: If any verification fails, fix it on the feature branch and repeat the affected verification plus the full build.
- [ ] **Step 7: Commit the verification record and final fixes.
- [ ] **Step 8: Open one PR from `games-rebuild-2026-10-01` into `main`, wait for its checks, review the complete diff, and merge only after the build is green.
- [ ] **Step 9: Confirm the resulting `main` deployment is the single production deployment for this rebuild; do not create intermediate production commits.

## Final self-check

- [ ] Every spec section maps to at least one task.
- [ ] No task relies on an undefined interface from another task.
- [ ] All four explicitly removed placeholder games are absent from the production lobby.
- [ ] Snake, Nuts & Bolts, Liquid Sort, and Animal Stack are real games, not placeholder screens.
- [ ] Bot difficulty is behaviorally different and testable.
- [ ] Game scores are cumulative per Home member and visible in Calendar.
- [ ] One production merge/deploy is reserved for the finished branch.
