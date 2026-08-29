/*
 * CODEX-MODIFIED: the contents of this file were written by a human and modified after the fact by a Codex agent.
*/

# Human-opponent gameplay

## Status

Existing feature; needs refinement.

## Problem

Two human users need to be able to play a valid chess game against each other after a shared session is created.

## Goal

After two human users are matched into the same session, both users can play a complete chess game through the board UI until the game ends or one user disconnects.

## Non-goals

- Opponent-type selection
- Lobby creation and join matching logic
- Computer opponent behavior
- Premoves
- Chess analysis or hints

## Related behavior

- New game creation
- Pending game joining
- Opponent type selection

## Constraints

- A user can only have one active game at a time.
- A client disconnect should discard the active game for both players.
- Refreshing the page is treated as a new websocket connection.
- No authentication is necessary.
- Games live in memory only; no persistence is necessary.
- The server is authoritative for legal moves, clocks, and game outcome.

## User-visible behavior

- The board should be visible once the shared game session begins.
- The board should become interactive after the shared countdown completes.
- The selected player color should be respected when orienting the board.
- Legal moves should be highlighted according to the current position.
- The last played move should be highlighted according to chessground norms.
- A chess clock should be visible for both players.
- The active side should be indicated clearly while the game is in progress.
- Game-end messaging should be shown when the game finishes.

## Acceptance criteria

- Once two human users have joined the same session, both users receive the same game state and the same countdown start time.
- The board is not actionable until the shared countdown completes.
- After the countdown, the user can make legal moves on their turn.
- Illegal moves are rejected.
- The board updates to show the most recent move after each accepted move.
- The chess clock updates as turns change.
- The game ends properly for checkmate, stalemate, repetition, insufficient material, timeout, abandonment, and any other legal draw or win state the server supports for the session.
- A client disconnect ends the active game immediately for both players.
- A refresh does not preserve the active human game.

## Non-functional requirements

- Add tests for as many code paths as is practical, especially the join, move, timeout, abandonment, disconnect, and end-state flows.
