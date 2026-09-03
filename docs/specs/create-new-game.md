/*
 * CODEX-MODIFIED: the contents of this file were written by a human and modified after the fact by a Codex agent.
*/

# New game creation

## Status

Existing feature; needs refinement.

## Problem

A user needs to be able to create a new chess game if no pending lobbies exist.

## Goal

When a user clicks the "Play human" button, if no pending lobbies exist on the server, a new pending lobby record is created and left open until another user joins or the creating user disconnects.

## Non-goals

- Joining an existing lobby
- Handling another user joining the lobby
- Any sort of game logic

## Related behavior

- The "Play human" button is the entry point for this flow.
- If the computer opponent is selected, the existing immediate game-start behavior remains in effect and is not part of this spec.
- PGN selection happens only when an opponent joins the lobby and the active session is created.

## Constraints

- A user can only create one pending lobby per websocket connection.
- A client disconnect should discard the pending lobby.
- No authentication is necessary.
- Games live in memory only; no persistence is necessary.

## User-visible behavior

- The "Play human" button should be displayed on app load.
- The "Play human" button should only be enabled if the user does not already have a pending or active game.
- Upon clicking, the opponent Play buttons should be hidden while the lobby is pending, and a cancel `X` control should be shown.
- The opponent Play buttons should remain hidden if the pending lobby becomes an active game.
- The opponent Play buttons should become available again when the pending or active game ends.
- The right-side cancel control is actionable while the lobby is pending.
- If game creation fails, the user should be shown an error message.
- The user should be able to cancel a pending lobby via some interactive UI element.

## Acceptance criteria

- Users with no existing games can click the "Play human" button.
- The "Play human" button becomes disabled immediately after being clicked so duplicate game creation requests are not sent.
- The opponent Play buttons are hidden immediately after game creation begins and remain hidden while the lobby or resulting game is active.
- The opponent Play buttons become available again after cancellation, disconnect, or game over.
- The pending lobby times out after 2 minutes without being joined.
- A join takes precedence over the 2 minute timeout.
- Cancel or websocket disconnect takes precedence over a concurrent join.
- The user can cancel the lobby at any point before another user joins.
- An error message must be displayed if the game creation fails.
- A browser refresh does not preserve the pending lobby.
- A disconnect removes the pending lobby when the websocket closes.
- The pending lobby is discarded completely on cancel or disconnect.

## Non-functional requirements

- Add tests for as many code paths as is practical, especially the creation, cancel, timeout, join, and disconnect flows.
