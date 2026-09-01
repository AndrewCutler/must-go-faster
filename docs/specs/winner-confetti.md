/*
 * CODEX-GENERATED: the contents of this file were fully constructed by a Codex agent and not a human.
*/

# Winner confetti

## Status

New feature.

## Problem

A winning player needs a brief visual celebration when the game ends in a win.

## Goal

Show a confetti effect for the local player when the server reports that they won.

## Non-goals

- Celebrating losses or draws
- Replacing game-state handling
- Playing audio or adding persistent rewards

## Related behavior

- Human-opponent gameplay
- Computer-opponent gameplay

## Constraints

- The effect must be presentation-only.
- The server remains authoritative for the win outcome.
- The effect must not block the board or connection cleanup.

## User-visible behavior

- Confetti appears when the local player wins.
- Confetti remains fully visible for approximately 1 second.
- Confetti fades out over the following 0.5 seconds.
- The confetti element is set to `display: none` after the fade completes.
- Losses and draws do not show confetti.

## Acceptance criteria

- A server-reported local win displays the confetti element.
- The confetti element remains visible for 1 second before fading.
- The fade completes within the next 0.5 seconds.
- The confetti element has `display: none` after the fade.
- A loss, draw, timeout loss, or abandonment loss does not display confetti.

## Non-functional requirements

- Add tests for the winner and non-winner outcomes where practical.
