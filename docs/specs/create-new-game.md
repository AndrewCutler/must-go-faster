# New game creation

## Status

Existing feature; needs refinement.

## Problem

A user needs to be able to create a new chess game if no pending games exist.

## Goal

When a user clicks the Play button, if no pending games exist on the server, a new lobby record is created and left open until another user joins or the creating user disconnects.

## Non-goals

- Joining an existing game
- Handling another user joining the game
- Any sort of game logic

## Related behavior

- Opponent type selection is part of this flow.
- If the computer opponent is selected, the existing immediate game-start behavior remains in effect and is not part of this spec.
- PGN selection happens only when an opponent joins the lobby.

## Constraints

- A user can only create one pending game per websocket connection.
- A client disconnect should discard the pending game.
- No authentication is necessary.
- Games live in memory only; no persistence is necessary.

## User-visible behavior

- The Play button should be displayed on app load.
- The Play button should only be enabled if the user does not already have a pending or active game.
- Upon clicking, the Play button should change into a split-button state with a loading spinner on the left and a cancel `X` icon on the right.
- The left side of the split-button is not actionable while the lobby is pending.
- The right-side cancel control is actionable while the lobby is pending.
- If game creation fails, the user should be shown an error message.
- The user should be able to cancel a pending game via some interactive UI element.

## Acceptance criteria

- Users with no existing games can click a Play button.
- The Play button becomes disabled immediately after being clicked so duplicate clicks do not send duplicate game creation requests.
- The Play button shows a loading spinner while the pending game is open and as long as it remains in an "unjoined" state.
- The pending game times out after 2 minutes without being joined.
- A join takes precedence over the 2 minute timeout.
- Cancel or websocket disconnect takes precedence over a concurrent join.
- The user can cancel the game at any point before another user joins.
- An error message must be displayed if the game creation fails.
- A browser refresh does not preserve the pending game.
- A disconnect removes the pending game when the websocket closes.
- The pending game is discarded completely on cancel or disconnect.

## Non-functional requirements

- Add tests for as many code paths as is practical, especially the creation, cancel, timeout, join, and disconnect flows.
