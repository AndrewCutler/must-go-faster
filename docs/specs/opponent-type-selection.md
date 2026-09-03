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

- Joining/creating a game with the opponent buttons

## Constraints

- A user must select either Human or Computer.
- No authentication is necessary.
- Games live in memory only; no persistence is necessary.

## User-visible behavior

- Separate "Play computer" and "Play human" buttons should appear.
- Selecting either button immediately starts that opponent type.
- Both buttons are disabled while the connection is pending or the game is active.
- The buttons become available again if the socket disconnects.
- Computer play starts an active session immediately instead of waiting in a pending lobby.

## Acceptance Criteria

- A user can start a computer game by clicking the "Play computer" button.
- A user can start a human game by clicking the "Play human" button.
- Both buttons are disabled immediately after either button is clicked.
- Selecting Computer starts a game immediately instead of creating a pending lobby.
- Disconnecting makes both opponent buttons available again.

## Non-functional requirements

- Add tests for as many code paths as is practical, especially the creation, cancel, timeout, join, and disconnect flows.
