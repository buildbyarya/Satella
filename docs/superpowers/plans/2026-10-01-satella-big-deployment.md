# Satella Big Deployment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the approved Satella October release across Games, YouTube/Watch Together, Chat, Calendar, Notes, Notifications, and permanent Home/account deletion, verify the complete app, and ship one production deployment.

**Architecture:** Extend the existing Next.js App Router + API routes + Prisma/PostgreSQL model. Keep Home-scoped authorization at every mutation, use typed persistent notifications, and give Games a shared match/session contract with game-specific state and validation. Reuse the existing YouTube saved-video contract and make deletion transactional/idempotent.

**Tech Stack:** Next.js 16.2.9, React 19.2.4, TypeScript, Prisma 6.x, PostgreSQL, NextAuth 4.x, Tailwind CSS 4.

**Spec:** `docs/superpowers/specs/2026-10-01-satella-big-deployment-design.md`

## Global Constraints

- Satella remains a private two-person Home; no public usernames or public profiles.
- Google OAuth remains the authentication mechanism.
- One Home contains exactly two members.
- Mobile is the first supported game layout.
- The release ships as one production deployment after verification.
- Existing working features are preserved unless the spec explicitly changes them.
- Game history is aggregate wins in Calendar, not a long match-history UI.
- Match ends require explicit restart/rematch.
- Every mutation verifies authentication and Home membership server-side.
- Game actions validate state/turn/authority server-side.
- Invite/notification spam is rate-limited server-side and suppressed in UI.
- Account deletion is transactional, idempotent, and removes Home data plus Satella account/auth records.

## Review Focus

- Cross-Home access: a member must never read or mutate another Home's game, playlist, chat, calendar, notes, or deletion state.
- Duplicate/rapid game invites and Watch Together invites: only allowed notifications are persisted/surfaced within the configured rate limit.
- Reconnect after leaving Games: the 45-second recovery window must not duplicate or corrupt a match.
- Account deletion races: repeated confirmations or simultaneous requests must result in one safe deletion outcome.
- YouTube metadata gaps: a saved item must remain navigable even when optional caption/thumbnail metadata is unavailable.

---

### Task 1: Baseline and test harness

**Files:**
- Modify: `package.json` only if a missing test script/tool is required.
- Create: focused tests under `tests/` or the repository's existing test location after inspecting current conventions.

**Interfaces:**
- Consumes: current Prisma schema and API helpers.
- Produces: repeatable unit/integration checks for Home scoping, game state transitions, deletion authorization, playlist save semantics, and notification rate limits.

- [ ] Step 1: Inspect current test conventions and identify the smallest existing test runner compatible with the repo.
- [ ] Step 2: Add failing tests for the highest-risk shared helpers before changing production behavior.
- [ ] Step 3: Run each new test and confirm the failure is caused by the missing behavior rather than setup errors.
- [ ] Step 4: Keep the test setup isolated from production data and existing authentication secrets.
- [ ] Step 5: Commit the baseline test harness changes.

### Task 2: Prisma model and migration foundation

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/<timestamp>_big_satella_release/migration.sql`
- Modify: existing shared Prisma/helper files only where required by the new models.

**Interfaces:**
- Consumes: existing `User`, `Account`, `Home` and Home-owned models.
- Produces: typed persistence for game matches/scores, custom playlists/saved videos if missing, typed notifications, deletion requests/confirmations, and last-editor metadata.

- [ ] Step 1: Write failing schema-level/integration tests for the new Home-scoped records and deletion cascade expectations.
- [ ] Step 2: Add the minimal Prisma models/relations and indexes required by the approved spec.
- [ ] Step 3: Generate the migration and verify foreign-key/cascade behavior against the current schema rather than introducing parallel storage.
- [ ] Step 4: Run `npx prisma validate` and `npx prisma generate`.
- [ ] Step 5: Run the focused persistence tests and confirm they pass.
- [ ] Step 6: Commit schema and migration changes.

### Task 3: Typed notification and Home authorization infrastructure

**Files:**
- Modify/Create: `app/api/notifications/**`
- Modify: shared auth/Home helper files discovered during implementation.
- Modify: `components/TopBar.tsx` and notification UI components.

**Interfaces:**
- Produces typed notification records for Watch Together, Games, partner-chat-after-leave, and deletion requests.
- Produces a shared `requireHomeMember()`-style server guard and a server-side notification rate-limit helper.

- [ ] Step 1: Write failing tests for Home membership checks and three-per-hour Watch Together invite suppression.
- [ ] Step 2: Implement the shared authorization/rate-limit helpers.
- [ ] Step 3: Implement notification creation/list/read semantics with typed payloads and navigation targets.
- [ ] Step 4: Add persistent notification rendering and the short 8–10 second partner-chat-after-leave popup without navigation on popup click.
- [ ] Step 5: Verify notification tests pass and no duplicate notification is created for repeated identical requests.
- [ ] Step 6: Commit notification infrastructure.

### Task 4: Games hub, lobby, match session, and scoring

**Files:**
- Modify: `app/(rooms)/games/page.tsx`
- Modify/Create: `components/games/**`
- Modify: `app/api/games/**`
- Modify: sidebar/drawer component that owns navigation.
- Modify: Calendar score API/UI files under `app/api/calendar/**` and `app/(rooms)/calendar/**`.

**Interfaces:**
- `GameCatalogEntry`: id, title, mode (`multiplayer` | `partner_only`), botSupported, difficultySupported.
- `GameSession`: id, homeId, gameId, mode, status, state, activePlayer, reconnectDeadline, winnerId.
- API actions: invite, accept, decline, authority, create/rematch, submitMove, reconnect, finish.

- [ ] Step 1: Write failing tests for lobby invitation, accept/decline, authority mode, 45-second reconnect, rematch, another-game, and exactly-one-winner score increments.
- [ ] Step 2: Implement server-validated game session state and Home-scoped APIs.
- [ ] Step 3: Build the Games hub with only one sidebar `Games` entry, `Invite Partner` first, catalog below, and per-game `Invite Partner` / `Play with Bot` / Easy-Normal-Hard controls where supported.
- [ ] Step 4: Add dedicated Games notifications and the lobby chat/authority interaction.
- [ ] Step 5: Wire aggregate wins into Calendar without adding long match history.
- [ ] Step 6: Run game session tests and verify invalid/out-of-turn moves are rejected.
- [ ] Step 7: Commit the shared Games architecture.

### Task 5: Game implementations — Phase 1 and Phase 2

**Files:**
- Modify: `components/games/PhaseOneGame.tsx` or replace with focused game components if its current generic implementation cannot support real rules cleanly.
- Create: focused components/state helpers for Tic-Tac-Toe, Connect Four, Rock Paper Scissors, Reaction Duel, Quick Math Duel, Button Smash, Target Tap, Coin Duel, High/Low, Color Clash, plus a practical mobile-first Phase 2 catalog.
- Modify: `app/(rooms)/games/phase-one/**` and related routes as needed.

**Interfaces:**
- Each game consumes the shared `GameSession` contract from Task 4 and exposes deterministic `initialState`, `validateMove`, `applyMove`, `isTerminal`, and `winner` behavior.

- [ ] Step 1: Write failing rules tests for each Phase 1 game, including terminal state and rematch reset.
- [ ] Step 2: Implement minimal deterministic rules for each Phase 1 game.
- [ ] Step 3: Add bot move selection for Easy/Normal/Hard where supported, with difficulty selected before every match.
- [ ] Step 4: Write and implement Phase 2 game rules using the same contract; keep the catalog mobile-first and bounded to games that can be completed reliably in this release.
- [ ] Step 5: Run all game rules tests and confirm terminal matches do not mutate after completion.
- [ ] Step 6: Commit Phase 1/2 games.

### Task 6: Nuts & Bolts, Liquid Sort, Snake, and Animal Stack

**Files:**
- Create: focused components/state modules under `components/games/` for each requested game.
- Modify: Games catalog/lobby registration.
- Modify: game API validators for game-specific actions.

**Interfaces:**
- Nuts & Bolts and Liquid Sort share Home-scoped cooperative puzzle state and have no bot option.
- Snake exposes `Play Together` and `Fight`, food/health leaderboard, revive cost escalation, spectator mode, and match termination rules.
- Animal Stack exposes synchronized piece placement and platform/fall detection.

- [ ] Step 1: Write failing deterministic tests for puzzle moves, Snake collision/revive/score rules, and Animal Stack placement/fall rules.
- [ ] Step 2: Implement Nuts & Bolts and Liquid Sort with server-validated shared state.
- [ ] Step 3: Implement Snake with star food, bot snakes, health/score ranking, cooperative revive flow, spectator focus, and Fight mode.
- [ ] Step 4: Implement Animal Stack with a deterministic mobile-friendly physics approximation that is synchronized by authoritative match state rather than trusting client physics.
- [ ] Step 5: Run all four rule suites and verify no bot control is exposed where the spec says partner-only.
- [ ] Step 6: Commit requested special games.

### Task 7: YouTube/Watch Together completion

**Files:**
- Modify: `app/api/youtube/**` and `components/library/**` for normalized saved-video metadata.
- Modify: Watch Together player/search/chat components under `app/(rooms)/watch/**` and `components/**`.
- Modify: related library routes under `app/(rooms)/library/**`.

**Interfaces:**
- `saveVideo({video, collectionType, playlistId?})` supports `watch_later`, `liked`, `personal`, `common`.
- Current-player save controls open personal/common playlist pickers as specified.
- Watch Together chat exposes latest-message autoscroll or unread-down-arrow state.

- [ ] Step 1: Write failing tests for four collection types, metadata persistence, and latest-message scroll/unread behavior.
- [ ] Step 2: Implement normalized saved-video metadata and playlist selection APIs/UI.
- [ ] Step 3: Add current-video Watch Later/Like/Personal/Common save controls.
- [ ] Step 4: Fix Watch Together chat latest-message behavior and retain the robust player initialization path that avoids the laptop black-screen regression.
- [ ] Step 5: Fix post-leave back navigation to Home and server-side invite notification rate limiting.
- [ ] Step 6: Run YouTube/Watch Together tests and verify saved library items retain title/thumbnail/caption when available.
- [ ] Step 7: Commit YouTube/Watch Together changes.

### Task 8: Chat, Calendar, and Notes polish

**Files:**
- Modify: `components/chat/**`, `app/api/chat/**`.
- Modify: `app/(rooms)/calendar/**`, `components/**` calendar components, `app/api/calendar/**`.
- Modify: `components/notes/**`, `app/(rooms)/notes/**`, `app/api/notes/**`.

**Interfaces:**
- Seen metadata renders compactly as `Sent HH:MM` and `Seen HH:MM` with no seconds.
- Calendar event color controls the entire event date tile; background presets/uploads remain independent from Chat.
- Notes expose last editor/time and use the available mobile width.

- [ ] Step 1: Write failing UI/data tests for compact seen timestamps, fixed wallpaper, event tile color, calendar background persistence, and last-editor metadata.
- [ ] Step 2: Implement compact seen metadata and fixed chat wallpaper.
- [ ] Step 3: Fix Calendar event date rendering and full-tile event color; retain independent background presets/uploads.
- [ ] Step 4: Add aggregate Games score display to Calendar.
- [ ] Step 5: Add Notes last-editor/time metadata and full-width responsive layout.
- [ ] Step 6: Run focused UI/data tests and build checks.
- [ ] Step 7: Commit Chat/Calendar/Notes changes.

### Task 9: Permanent Home/account deletion

**Files:**
- Modify: `app/account-settings/**` or current Settings surface.
- Modify/Create: `app/api/account/**` and deletion-request API routes.
- Modify: Prisma schema/migration if deletion-request persistence was not completed in Task 2.
- Modify: notification UI/API from Task 3.

**Interfaces:**
- `requestHomeDeletion()` creates a pending two-member request.
- `respondHomeDeletion({requestId, approve})` records the partner decision.
- `finalizeHomeDeletion({requestId})` performs one transactional cascade after both approvals or the three-day timeout rule.

- [ ] Step 1: Write failing authorization/idempotency tests for requester, partner approval, rejection, three-day timeout, and repeated finalization.
- [ ] Step 2: Implement persistent request/response state and notification flow.
- [ ] Step 3: Add Settings UI with clear irreversible warning and separate Logout action.
- [ ] Step 4: Implement the transactional cascade for Home data plus both members' Satella account/auth records, ensuring no normal Satella username/profile record remains.
- [ ] Step 5: Verify a deleted user is routed back to Google registration/login on the next visit and cannot access the deleted Home by stale session data.
- [ ] Step 6: Run deletion tests and commit the complete lifecycle.

### Task 10: Full verification and single production deployment

**Files:**
- Modify only files required to resolve verified build/test failures.
- No intentional feature additions during this task.

- [ ] Step 1: Run `npm install` and `npx prisma generate`.
- [ ] Step 2: Run the complete test suite and fix every regression before deployment.
- [ ] Step 3: Run `npm run lint` and resolve all lint errors.
- [ ] Step 4: Run `npm run build` and resolve all prerender/type/runtime build failures.
- [ ] Step 5: Start the dev server and perform browser verification of Home, Chat, Calendar, Notes, Library/YouTube, Watch Together, Games, Settings, and auth entry points; capture console errors and key interactive elements.
- [ ] Step 6: Run two-mobile-session smoke checks for multiplayer Games and Watch Together, including reconnect and notification flows.
- [ ] Step 7: Review the complete diff against `main`, confirm no secrets or debug artifacts are present, and create the final release commit/PR as appropriate.
- [ ] Step 8: Deploy **once** to production from the verified release branch/commit.
- [ ] Step 9: Verify the production deployment loads and report the exact production URL, deployment result, and any remaining known limitations.

## Final release rule

Do not intentionally create intermediate production deployments for individual tasks. Preview/build verification may be used where available, but the production deployment happens only after the complete release is green.
