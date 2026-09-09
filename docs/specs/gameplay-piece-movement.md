/*
 * CODEX-GENERATED: the contents of this file were fully constructed by a Codex agent and not a human.
*/

# Gameplay and piece movement UX

## Purpose

This document consolidates the requirements found across the existing specifications that affect playing a game through the chessboard UI and explicitly identifies behavior that the existing specifications do not define.

## Source specifications

The requirements below were consolidated from:

- `computer-opponent-gameplay.md`
- `human-opponent-gameplay.md`
- `premoves.md`
- `join-pending-game.md`
- `create-new-game.md`
- `opponent-type-selection.md`
- `winner-confetti.md`
- `wakeup-ping.md`

## Board availability

- Nothing in the application is usable until the server wakeup ping succeeds with a 2xx response.
- During the wakeup request, only the centered loading spinner is rendered and the application is not actionable.
- A failed or timed-out wakeup request renders only a danger error message. Refreshing the page is the only retry action.
- The chessboard is displayed once a game session begins.
- During the shared five-second countdown, the board is visible but not actionable.
- The countdown text tells the local player which color moves first: `[player color] moves first`.
- The board becomes interactive when the countdown completes.
- The board is oriented according to the local player's color.
- Opponent-selection controls remain unavailable while a game is pending or active and become available again after cancellation, disconnect, or game over.

## Normal piece movement

- The user can interact with the board during an active game after the countdown.
- The user can make legal moves on their turn.
- Only valid chess moves are allowed.
- Illegal move attempts are rejected.
- The frontend must not perform independent chess legality checks. The backend is authoritative for move legality, move acceptance or rejection, board state, clocks, and game outcomes.
- After an accepted move, the board updates to the latest server-provided position.
- The moved piece and most recent move are highlighted according to Chessground or comparable online-chess UI conventions.
- The chess clock is visible for both players and updates as turns change.
- A client disconnect ends the active game immediately. A browser refresh does not preserve an active human game.

## Piece selection

- A player can select a piece in preparation for a click-to-move action.
- If the local player has a piece selected while waiting for the opponent's turn, that piece remains selected when the opponent's move arrives and the board position is updated.
- Clicking another own piece replaces the current selection immediately. The user should not need a separate deselection action before selecting the new piece.
- Clicking an empty square or a move destination continues through the normal move or premove interaction for the currently selected piece.
- A selection must not be preserved after the game enters a read-only or ended state unless a more specific UI requirement says otherwise.

## Legal-move feedback

- Legal moves should be highlighted according to the current position.
- The most recent played move should remain highlighted after each accepted move.
- When an opponent move updates the board, any preserved local selection should continue to represent the selected piece in the new position.

## Premoves

- A local human player may cache a premove in any active game while it is not their turn.
- Premoves are allowed only when the board is interactive and non-read-only.
- Premoves are blocked during the countdown and every other read-only phase.
- Only one premove can be cached at a time.
- Creating a second premove replaces the previously cached premove; premoves do not form a queue.
- A cached premove highlights both its source and destination squares.
- While a premove is waiting, the board continues to display the current live position.
- The board does not advance to the premove destination until the premover's turn begins.
- If the opponent's move leaves the premove legal, it executes automatically as soon as the premover's turn begins.
- If the opponent's move makes the premove illegal, it is discarded silently with no user-facing error.
- Right-clicking a cached premove cancels it immediately and clears its highlights.
- Executing a premove does not reduce the premover's clock because the move was queued in advance.
- The server remains authoritative for whether a premove is legal at execution time.
- Computer opponents do not premove.

## Game-end presentation

- The server finalizes checkmate, stalemate, repetition, insufficient material, timeout, abandonment, and other supported legal outcomes.
- A local win displays a presentation-only confetti effect.
- Confetti remains fully visible for approximately one second, fades over the next 0.5 seconds, and is then hidden.
- Losses, draws, timeout losses, and abandonment losses do not display confetti.
- The confetti effect must not block board or connection cleanup.

## Timing related to gameplay

- A game starts after the five-second countdown.
- A computer opponent makes uniformly random legal moves from its available legal moves.
- Forced computer moves (exactly one legal move) take a random 0.1–0.5 seconds. With multiple legal moves, delays range from 0.5 seconds to a maximum that increases by 50 ms per additional legal move, capped at 2.5 seconds. All delays are limited by positive remaining clock time.
- The 50-move-rule clock starts from the generated game position rather than historical PGN moves used to source that position.

## Unspecified behavior and open UX gaps

The existing specifications do not define the following details:

- Hover behavior, including whether hovering a piece or destination previews legal moves or changes the cursor.
- Whether movement must support click-click, drag-and-drop, or both.
- The exact visual treatment for a selected piece, legal destinations, an illegal destination, or a rejected server move.
- Whether clicking the currently selected piece toggles it off in every input mode.
- Keyboard navigation or keyboard-based piece movement.
- Touch-specific selection, dragging, and cancellation behavior.
- Promotion-piece selection; the existing implementation currently auto-promotes to a queen, but this consolidated gameplay requirement is not stated in the source specifications.
- Whether a selected piece or pending premove should be cleared when the game ends, the connection closes, or a server rejection arrives, beyond the premove cancellation requirements above.

These details should be specified before being treated as product requirements or used to drive additional UX changes.

## Test coverage expected by the source specifications

Tests should cover, where practical:

- Board non-actionability during wakeup and countdown phases.
- Board activation after the countdown.
- Legal move submission and server-authoritative rejection.
- Board and last-move updates after accepted moves.
- Selection preservation across opponent moves.
- Replacing one selected own piece by clicking another own piece.
- Premove creation, replacement, highlighting, right-click cancellation, invalidation, execution, and clock behavior.
- Game end states, timeout, abandonment, disconnect, and win-only confetti behavior.
