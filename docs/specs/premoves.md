/*
 * CODEX-GENERATED: this file was created by a Codex agent.
*/

# Premoves

## Status

Existing feature; needs refinement.

## Problem

Human players need a way to queue a single move in advance while waiting for their turn, without disrupting the visible board state or the clock until the move is actually played.

## Goal

During an active game, the local human player can cache one premove while it is not their turn. The premove is executed automatically if it is still legal when their turn arrives, or discarded if it becomes invalid.

## Non-goals

- Premove chaining or multiple queued premoves
- Chess analysis or move suggestion
- Reconnect logic
- Resignation or forfeiture controls
- Computer-generated premove automation

## Related behavior

- Human-opponent gameplay
- Board interactivity
- Clock timing

## Constraints

- The local human player may premove in any active game.
- A premove may only exist while the board is in an interactive, non-read-only state.
- Read-only phases block premoves entirely, including countdown and any other non-interactive state.
- Only one premove can be cached at a time.
- Entering a new premove replaces the previously cached premove.
- A premove that is no longer legal when the opponent moves is discarded silently.
- Right-clicking a cached premove discards it and clears its highlights.
- Premoves do not reduce the premover's clock when they are executed.
- Computer opponents do not premove.
- The board UI does not advance to the premove destination until the premover's turn actually begins.
- The server remains authoritative for whether a premove is legal at execution time.

## User-visible behavior

- When a player has a cached premove, the source square and destination square should both be highlighted on the board.
- The board should continue to show the current live position while a premove is waiting.
- If the opponent's move makes the premove legal, it should fire automatically as soon as the turn changes to the premover.
- If the opponent's move makes the premove illegal, the premove disappears with no user-facing error message.
- Right-clicking the cached premove clears it immediately.

## Acceptance criteria

- In any active game, a local human player who is waiting for their turn can cache one legal premove.
- A second premove replaces the first cached premove rather than creating a queue.
- Premoves are blocked during all read-only phases.
- Cached premoves are highlighted by source square and destination square.
- Right-clicking a cached premove clears it and removes the highlight.
- If the opponent makes a move that preserves the legality of the premove, the premove is executed automatically on the premover's turn.
- If the opponent makes a move that invalidates the premove, the premove is discarded silently.
- When a premove executes, the premover's clock does not lose time because of the premove being queued.
- The visible board position does not change to the premove result until the premover's turn actually begins.
- Computer opponents do not premove.

## Non-functional requirements

- Add tests for as many code paths as is practical, especially premove creation, replacement, cancellation, invalidation, execution, and clock behavior.
