/*
 * CODEX-MODIFIED: the contents of this file were written by a human and modified after the fact by a Codex agent.
*/

# Server wakeup ping

## Status

Existing feature.

## Problem

The backend server hosted on render.com's free tier does not support always-awake so after some time with no traffic, it shuts down to save on hosting costs.

## Goal

Ping the backend on page load to see if the backend is responsive and, when it is, allow the application to start.

## Non-goals

- Keeping the backend server running artificially

## Constraints

- Nothing except the loading spinner can be rendered until the ping request succeeds.
- The application must not become usable unless the ping request returns a 2xx status code.
- There is no retry action. The user must refresh the page to try again after a failed request.

## User-visible behavior

- On page load, nothing is rendered except the loading spinner, centered horizontally and vertically in the viewport.
- While the ping request is pending, the loading spinner remains the only rendered content and the application is not actionable.
- If the ping request returns a 2xx status code, the spinner is removed and the page renders normally and becomes usable.
- If the ping request returns anything other than a 2xx status code, or cannot be completed, the spinner is replaced with a `danger` error message and nothing else is rendered.
- After a failed request, no retry control or other action is provided. The user must refresh the page to try again.

## Acceptance criteria

- `ping` route is hit on every page load.
- Before the ping request succeeds, the loading spinner is the only rendered content and is centered horizontally and vertically.
- A 2xx ping response causes the spinner to be removed, the application to render, and the page to become usable.
- Any non-2xx ping response causes the spinner to be replaced by a `danger` error message, with no other content rendered.
- A network failure or timeout is treated as a failed ping and produces the same `danger` error state.
- The failed state has no retry action; refreshing the page is the only way to issue another ping request.
