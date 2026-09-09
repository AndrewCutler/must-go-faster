/*
 * CODEX-MODIFIED: the contents of this file were written by a human and modified after the fact by a Codex agent.
*/

# Computer-opponent gameplay

## Status

Existing feature; buggy; needs refinement.

## Problem

A user must be able to play a valid chess game with a computer opponent.

## Goal

After a game with a computer opponent is started, the user is able to play an actual chess game by interacting with the board UI.

## Non-goals

- Computer analysis
- Chess-engine-based move generation
- Computer-generated premove automation

## Related behavior

- Human-opponent chess games
- Premoves

## Constraints

- A user can only have one active game at a time.
- A client disconnect should discard the pending lobby.
- A client disconnect during an active computer game should discard that game immediately.
- No authentication is necessary.
- Games live in memory only; no persistence is necessary.
- The computer opponent should make moves within a random time window to make the game engaging for humans.
- The 50-move rule clock should start from the generated game position, not from the historic PGN moves used to source that position.

## User-visible behavior

- The chessboard is visible and interactive according to the rules of chess.
- The countdown overlay should say `[player color] moves first` for the human player.
- The human player should be able to cache a premove while waiting for the computer's turn.
- If the human player has a piece selected while waiting, that selected piece should remain selected when the computer's move arrives.
- The last played move is highlighted according to chessground norms to indicate to the user what has happened.

## Acceptance criteria

- The game starts once the user creates it (after 5 second countdown).
- Only valid chess moves are allowed.
- The user can interact with the chessboard.
- Moved pieces and the most recent move are highlighted according to online chess UI standards.
- If the user has a piece selected before an opponent move is rendered, the selected piece remains selected after the board updates.
- Game state is finalized for checkmate, stalemate, repetition, insufficient material, and similar legal outcomes.

## Non-functional requirements

- Add tests for as many code paths as is practical, especially the creation, cancel, timeout, join, and disconnect flows.
- The computer should play uniformly random legal moves chosen from the list of available legal moves for the computer player's color.
- With exactly one legal move, the computer chooses a random delay of 0.1–0.5 seconds, inclusive. With multiple legal moves, it chooses a random delay in whole milliseconds between 0.5 seconds and `min(2.5 seconds, 0.5 seconds + 50 ms * (legal move count - 1))`, inclusive. The delay is capped by the positive remaining clock time.
- The frontend must not perform independent chess legality checks; the backend must validate and authorize all move attempts and state transitions.
