/*
 * CODEX-MODIFIED: the contents of this file were written by a human and modified after the fact by a Codex agent.
*/

# Pending game joining

## Status

Existing feature; needs refinement.

## Problem

A user needs to be able to join an existing lobby that is waiting for a second player.

## Goal

When a user clicks the "Play human" button, if a pending lobby exists on the server, that second player is added to the oldest pending lobby.

## Non-goals

- Any sort of game logic
- Game rendering/board interactivity

## Related behavior

- PGN selection happens when the second player joins and the active session is created
- Countdown timing should be server-coordinated so both clients begin the same 5-second countdown together

## Constraints

- A user can only be part of one lobby/game at a time.
- A client disconnect should result in a forfeiture.
- Expired lobbies are not joinable.
- No authentication is necessary.
- Games live in memory only; no persistence is necessary.

## User-visible behavior

- The "Play human" button should be displayed on app load.
- The "Play human" button should only be enabled if the user does not already have a pending or active game.
- Upon clicking the "Play human" button, the opponent Play buttons should be hidden and the user should be added to a pending lobby.
- The opponent Play buttons should remain hidden while the lobby becomes an active game and throughout that game.
- The opponent Play buttons should become available again when the game ends or the connection is closed.
- Once the game is started, the chessboard should display and a 5-second countdown should overlay it to give both players time to prepare for game start.
- The countdown overlay should say `[player color] moves first` for the local user.
- A chess clock with both players' times should be displayed.
- The board should be displayed, but pieces should not be clickable in this flow.

## Acceptance criteria

- Users with no existing games can click the "Play human" button.
- The "Play human" button becomes disabled immediately after being clicked so duplicate game join requests are not sent.
- The opponent Play buttons are hidden immediately after joining begins and remain hidden while the lobby or resulting game is active.
- The opponent Play buttons become available again after cancellation, disconnect, or game over.
- If multiple pending lobbies exist, the oldest one is joined.
- Joining an expired lobby is not allowed.
- The board renders with the selected PGN but is not actionable.
- A countdown of 5 seconds overlays the board once the session is created and starts at the same time for both clients.
- A page refresh/client disconnect removes the player from the lobby and ends the game with a forfeit.

## Non-functional requirements

- Add tests for as many code paths as is practical, especially the creation, cancel, timeout, join, and disconnect flows.
