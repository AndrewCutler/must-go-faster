/*
 * CODEX-MODIFIED: the contents of this file were written by a human and modified after the fact by a Codex agent.
*/

# Select game type

## Status

Existing feature.

## Problem

A user needs to be able to select an opponent type, either human or computer.

## Goal

A user can select either a human or computer opponent. If human, the game starts when two human users join the same lobby. If computer, the user plays against a "computer" opponent.

## Non-goals

- Any sort of game logic
- Game rendering/board interactivity

## Related behavior

- Joining/creating a game with the Play button

## Constraints

- A user must select either Human or Computer.
- No authentication is necessary.
- Games live in memory only; no persistence is necessary.

## User-visible behavior

- A dropdown should appear with Human and Computer as options.
- By default, Computer should be selected.
- The dropdown disappears immediately once Play is clicked.
- The selected opponent type is locked once Play is clicked.
- A "Playing computer" or "Playing human" message is shown above the chess clock while the game is in action.
- The dropdown resets to Computer if the page refreshes or the socket disconnects.
- Computer play starts an active session immediately instead of waiting in a pending lobby.

## Acceptance Criteria

- A user can change the opponent type before the Play button is clicked.
- Once Play is clicked, the selected opponent type is locked and cannot be changed for that attempt.
- The dropdown disappears once Play is clicked.
- Messaging is displayed above the chess clock to indicate opponent type while game is in action.
- Selecting Computer starts a game immediately instead of creating a pending lobby.
- Refreshing or disconnecting resets the dropdown to Computer.

## Non-functional requirements

- Add tests for as many code paths as is practical, especially the creation, cancel, timeout, join, and disconnect flows.
