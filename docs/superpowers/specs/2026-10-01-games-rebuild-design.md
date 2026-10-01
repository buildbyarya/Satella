# Satella Games Rebuild — Design Specification

**Date:** 2026-10-01  
**Status:** Awaiting user review before implementation planning

## Goal

Replace the current placeholder-heavy Games implementation with a genuinely playable, mobile-first games subsystem. Multiplayer games must synchronize through authoritative shared state; bot games must have meaningful Easy/Normal/Hard behavior; partner-only games must actually require the partner. The result should be testable game-by-game without relying on automatic outcome generation.

## Product structure

The existing Games entry remains a single sidebar item. Opening it shows a Games lobby:

1. Invite Partner
2. Tic-Tac-Toe
3. Connect Four
4. Rock Paper Scissors
5. Memory Match
6. Snake
7. Nuts & Bolts
8. Liquid Sort
9. Animal Stack
10. Pong
11. Air Hockey
12. Penalty Shootout
13. Basketball Duel
14. Mini Golf
15. Maze Race
16. Target Range

Individual game screens offer the applicable modes. For bot-capable games, the flow is Invite Partner / Play with Bot, followed by Easy / Normal / Hard when Bot is selected.

## Multiplayer session model

A game session belongs to the current shared Home. The server is authoritative for state transitions. A client sends an intent/action; the API validates the current turn/state and writes the next state. Both clients poll/refresh the shared state using the existing project mechanism until a realtime transport is introduced.

Every game must define:
- initial state
- legal actions
- turn/round state where relevant
- win/loss/draw condition
- rematch/reset state
- multiplayer participant mapping
- bot action generation where supported

No game may resolve a match merely because the user pressed a generic `PLAY` button. A control must represent a real action in that game.

## Bot behavior

Bot difficulty is selected on every bot match.

- **Easy:** intentionally weaker/random or shallow decision-making.
- **Normal:** competent heuristics.
- **Hard:** stronger game-specific strategy, search or prediction where practical.

Difficulty must change observable decisions, not just a label.

## Game requirements

### Tic-Tac-Toe

Keep the existing board concept, but preserve proper turn validation and win/draw handling. Bot mode must use the difficulty strategy.

### Connect Four

Use a 7-column gravity board. A move selects a column and drops a piece into the lowest empty cell. Implement four-in-a-row detection in all directions, draw detection, turn validation and bot responses.

### Rock Paper Scissors

Use simultaneous choices. Bot chooses according to difficulty rather than a fixed or visibly predictable pattern. Multiplayer resolves only after both choices are present.

### Memory Match

Make this a real memory game rather than a placeholder. Use matching emoji pairs. Support 4×4, 5×5 and 8×8 board sizes. Multiplayer alternates turns and awards matched pairs appropriately. Bot mode is supported with difficulty-dependent memory behavior. A solo option may also be exposed if the existing lobby architecture supports it cleanly.

### Reaction Duel

Either rebuild as a real timing duel with a server-generated signal window and false-start handling, or remove it from the lobby if it cannot be made reliable. No automatic winner immediately after pressing Play.

### Quick Math Duel

Generate varied questions and shuffle answer choices so the correct answer is not always the first option. Bot must answer on a difficulty-dependent delay/accuracy model. Multiplayer must permit both players to answer each round.

### Button Smash

Keep only if it is implemented as an actual competitive speed/tap game with a clear target and meaningful bot behavior. Otherwise omit it from the production lobby rather than retaining a filler experience.

### Snake

Implement the requested two-player snake concept as a distinct game:
- food is randomly scattered as star-like pickups
- both human snakes grow by eating food
- other snakes/bots exist as hazards/opponents
- leaderboard/ranking shows position, nickname and health/score
- **Play Together:** partners cannot kill each other; touching a partner's tail does not kill them. A dead partner can be revived using a food cost, starting at 1000 and increasing after each revive. While waiting for revival, their view can spectate the surviving partner.
- **Fight:** partners can kill one another; death ends the match according to the agreed win condition.

This is a larger game and may require a dedicated client simulation plus periodic authoritative synchronization rather than treating every frame as a database write.

### Nuts & Bolts

Partner-only cooperative puzzle. Colored bolts/nuts are presented so players move pieces to group matching colors. Both partners contribute moves toward the same puzzle state. No bot option.

### Liquid Sort

Partner-only cooperative puzzle using colored liquid tubes. Players move pours to separate colors into completed tubes. No bot option. The puzzle must validate legal pours and completion.

### Animal Stack

Partner-only stacking game. Players take turns dropping rigid/falling animal pieces onto a floating platform/tower. Physics-like placement should make balance meaningful; pieces that fall off count as a failure/round loss according to the final game rule. No fake static wall graphic.

### Pong

Build an actual ball-and-paddle game. Multiplayer requires two paddles and a moving ball with collision/score state. Bot mode controls one paddle with difficulty-dependent reaction behavior.

### Air Hockey

Actual puck and two paddles with boundaries, scoring and reset. Bot mode gets difficulty-dependent paddle behavior.

### Penalty Shootout

Actual shot direction/power/aim versus goalkeeper behavior, with alternating shots and a defined score limit. Bot goalkeeper/shot strategy varies by difficulty.

### Basketball Duel

Actual aim/timing/shooting interaction with a basket and score. Bot takes meaningful attempts rather than returning an immediate result.

### Mini Golf

Actual stroke/aim/power interaction through a hole layout. Multiplayer compares strokes; bot uses a difficulty-dependent shot model.

### Maze Race

Two racers navigate the same generated maze. Multiplayer compares completion time; bot pathing varies by difficulty.

### Target Range

Keep as a real skill game rather than the removed Target Tap concept. Use moving/varied targets, scoring and a defined round. Bot mode can compete on score where appropriate.

## Games to remove

The current placeholder versions of Coin Duel, High/Low, Color Clash and Target Tap are removed from the production lobby. They are not replaced by thin variants of the same tap/guess mechanic.

## Match completion

Every completed match shows:
- result
- Rematch
- Another Game

**Rematch** resets the current game and starts it again. **Another Game** returns to the Games lobby. There is no permanent Leave button inside the game screen yet.

If a player navigates away from Games during a partner match, the existing agreed 45-second rejoin window applies. After that the remaining player can invite them again or continue with a bot where that game supports bots.

## Game notifications and lobby authority

The Games section retains a dedicated notification type similar to Watch Together. Inviting a partner adds them to a game lobby and sends a notification. If the partner chooses a game first, the other player receives a request that can be accepted or declined.

The lobby includes an Authority control directly below Invite Partner. It starts green. When enabled it becomes red and the partner is informed that they have authority. With authority granted, the partner's game selection automatically starts the selected game without a second confirmation notification.

A small chat area is available inside the game lobby so partners can discuss which game to play.

## Calendar integration

Do not create a long game-history page. Instead, record cumulative wins per Home member and expose the totals in the shared Calendar, e.g. `Games: Arya: 5, Partner: 7`. The total games played is the sum of both win counts when draws/unfinished matches are not counted as wins.

## Mobile-first UI

The initial implementation targets phones. Controls must be large enough for touch, avoid requiring desktop hover, and fit the existing Satella visual language. Desktop refinement can follow after mobile testing.

## Testing requirements

Before deployment, verify at minimum:
- every listed lobby item opens the intended game
- no removed placeholder game remains in the lobby
- each bot-capable game visibly changes behavior between Easy/Normal/Hard
- multiplayer games synchronize actions between two Home members
- game outcomes are not generated without valid player actions
- rematch resets correctly
- Another Game returns to the lobby
- Memory Match supports 4×4, 5×5 and 8×8
- Snake, Nuts & Bolts, Liquid Sort and Animal Stack are present and playable
- mobile controls are usable
- no obvious runtime/build errors are introduced

## Scope boundary

This rebuild focuses on the Games subsystem and its Calendar win-total integration. It does not intentionally change unrelated Chat, YouTube, Calendar background, account deletion, or Watch Together behavior except where an existing shared-session primitive must be reused safely.
