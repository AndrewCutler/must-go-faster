# Must Go Faster Codebase Analysis

## Summary

`must-go-faster` is a chess application built as a Go backend plus a vanilla TypeScript frontend. The product is centered on fast, short games that start from random midgame positions, with support for human-vs-human matchmaking and human-vs-computer play.

The application is intentionally lightweight:

- No database is present.
- No authentication layer is present.
- Game state lives in memory.
- The only persisted chess content is a repository of PGN files under `backend/server/pgns/`.

The main runtime flow is:

1. A browser loads the frontend bundle.
2. The frontend opens a WebSocket connection to the Go server.
3. The server creates or joins a session, assigns colors, and selects a random starting position from a PGN corpus.
4. The client and server exchange game state messages over the socket.
5. Clocks, premoves, timeouts, abandonment, and game-over state are handled in memory and mirrored to the UI.

## Architecture

### Backend

The backend lives in `backend/server/` and is a small websocket-centric game server.

Main responsibilities:

- Serve a ping endpoint for startup checks.
- Upgrade `/connect` requests to WebSockets.
- Create sessions and match players.
- Validate moves using `github.com/notnil/chess`.
- Broadcast game state updates to all players in a session.
- Serve the frontend as a single-page app fallback in development.

Important files:

- `backend/server/server.go`
- `backend/server/game/hub.go`
- `backend/server/game/messages.go`
- `backend/server/game/player.go`
- `backend/server/game/game.go`
- `backend/server/constants/constants.go`
- `backend/server/handlers/handlers.go`

### Frontend

The frontend lives in `client/` and is a vanilla TypeScript application bundled with webpack.

Main responsibilities:

- Render and control the chessboard with Chessground.
- Maintain client-side session state.
- Open and manage the WebSocket connection.
- Render clocks, countdowns, and game-over UI.
- Send move, premove, start-game, and timeout messages to the server.

Important files:

- `client/index.ts`
- `client/must-go-faster.ts`
- `client/dom.ts`
- `client/models.ts`
- `client/webpack.config.js`
- `client/index.html`
- `client/css/index.css`

### Game Domain Model

The game model is centered on a few small concepts:

- `Hub` manages `AwaitingOpponentSessions` and `InProgressSessions`.
- `Session` wraps a `chess.Game`, the white and black players, and a session id.
- `Player` stores the websocket connection, write channel, color, clock, and whether the opponent is a computer.
- `Message` and the typed payload structs define the protocol between client and server.

The design is simple and highly stateful:

- Session routing happens by `SessionId`.
- The server is the authority for legal moves.
- The client is responsible for presentation and a local countdown timer.

## Feature Set

### Supported

- Human-vs-human matchmaking.
- Human-vs-computer play.
- Random starting positions pulled from stored PGNs.
- Legal move validation.
- Premoves.
- Per-side clocks.
- Timeout handling.
- Abandonment handling.
- Game-over modal with play-again flow.
- Basic mobile-responsive layout.

### Computer Opponent

The "computer" opponent is not a chess engine. It chooses a random legal move from the current position after a short random delay.

This means the intent is closer to a quick, chaotic training opponent than a strong AI.

### Starting Positions

The server chooses a random PGN from `backend/server/pgns/`, loads it with `notnil/chess`, and starts the game from a midgame position that is at least 20 full moves deep.

This strongly suggests the app is meant for:

- rapid tactical practice,
- speed-chess style games,
- and replayable short sessions rather than full-length classical chess.

## Runtime Flow

### Initial Page Load

`client/index.ts` initializes the UI, seeds the clocks with the configured game duration, and wires up the connect button and opponent-type selector.

`client/must-go-faster.ts` then:

- creates a Chessground board,
- points the client at `API_BASE_URL` and `WS_BASE_URL`,
- pings the backend,
- and waits for the user to start matchmaking.

### Matchmaking

When the user clicks "Find a game":

- the client opens `ws://.../connect?opponentType=...`,
- the backend upgrades the request,
- the server picks a random color for the human player,
- and either:
  - pairs the player with a waiting human opponent, or
  - creates a computer opponent immediately.

### Game Start

When the client receives `GameJoinedFromServerType`:

- it sets up the board state from the FEN and legal move map,
- shows a countdown,
- and sends `GameStartedToServerType` when the countdown ends.

At that point the server initializes both clocks and sends `GameStartedFromServerType` to the session.

### Move Handling

When a move is made:

- the client sends `MoveToServerType`.
- the server validates the move with `chess.Game.MoveStr`.
- the server updates clocks.
- the server broadcasts `MoveFromServerType` to both players.

Premoves are handled similarly through `PremoveToServerType`.

### End States

The application supports several end conditions:

- checkmate,
- timeout,
- abandonment.

The client shows a modal for game over and lets the user start a new game from there.

## Deployment and Containerization

### Development Compose

`docker-compose.yml` is the local development path.

Key patterns:

- Backend uses `cosmtrek/air` for live reload.
- Backend listens on port `8000`.
- Client exposes port `4200`.
- The two services share a bridge network named `mustgofaster`.
- The client build is parameterized with `API_BASE_URL`, `WS_BASE_URL`, and `NODE_ENV`.

Observed intent:

- backend API and websocket traffic stay on `8000`,
- the frontend is served separately on `4200`,
- and the browser talks to the backend through configured base URLs.

### Production Compose

`docker-compose.prod.yml` is the production-oriented compose file.

It expects:

- a backend image built from `backend/server/Dockerfile.prod`,
- and a client image built from `client/Dockerfile` with the `production` target.

### Important Containerization Observations

- `docker-compose.prod.yml` points the backend build at `backend/server/Dockerfile.prod`, but the checked-in production Dockerfile appears to live at `backend/Dockerfile.prod` instead. That makes the production backend build path look broken or incomplete as committed.
- `backend/Dockerfile.prod` is currently only commented-out instructions. As checked in, it does not define a buildable production image.
- `client/Dockerfile` contains two separate build pipelines:
  - a multi-stage `builder` / `development` / `production` flow at the top,
  - and a second `node:20 -> nginx` pipeline at the bottom.
- The compose file targets the earlier `production` stage, so the trailing pipeline looks stale or unused.
- The backend server in development serves the frontend via a spa handler rooted at `../../client`, which is a dev convenience rather than a true packaged artifact flow.
- The frontend production bundle is served by nginx with `/build/` as the bundle path.
- `backend/server/server.go` performs exact string matching for `ALLOWED_ORIGINS`, so a wildcard-looking value like `https://*.onrender.com` will not match unless the browser origin is literally that string.

### Environment Variables

The deployment story relies on a small set of env vars:

- `BASE_URL`
- `PORT`
- `ALLOWED_ORIGINS`
- `API_BASE_URL`
- `WS_BASE_URL`
- `NODE_ENV`

This is a simple, configuration-by-environment approach rather than a secrets-heavy deployment model.

## Dependency Profile

### Backend Dependencies

The Go backend depends on:

- `github.com/gorilla/mux` for routing,
- `github.com/gorilla/websocket` for realtime transport,
- `github.com/notnil/chess` for chess rules and PGN/FEN handling,
- `github.com/google/uuid` for session and PGN file ids.

The backend uses Go 1.21.5 and a workspace layout defined in `backend/go.work`.

### Frontend Dependencies

The frontend depends on:

- `chessground` for the board UI,
- `webpack` and `ts-loader` for bundling TypeScript,
- `style-loader` and `css-loader` for CSS handling,
- `copy-webpack-plugin` for asset copying,
- Bulma and Font Awesome from CDNs.

The frontend is intentionally not framework-heavy. There is no React, Vue, Svelte, or state-management library.

### Parser Utility

The `backend/parser/` module is a small offline utility that splits a large PGN file into separate game files.

Its purpose is to populate the `pgns/` directory used by the main server.

## Intent

This repository looks like a deliberately compact chess playground focused on speed and repetition.

The design choices point to a specific product idea:

- start from a random interesting position,
- keep the clocks short,
- make it easy to jump into a game,
- and give the user a lightweight opponent without requiring an account or a backend database.

The tone of the UI and code suggests this is a personal or prototype-style project rather than a polished commercial chess platform.

## Notes and Gaps

- I did not find a `docs/specs/` directory in this checkout, so this analysis is based on implementation rather than formal product specs.
- The TODO list in `README.md` shows unfinished UX and reliability work, including promotion UI, responsive polish, abandonment messaging, and frontend resilience when the server is unavailable.
- Draw handling appears incomplete.
- The application is currently highly stateful and in-memory, so restarts will wipe active games.
- Production packaging should be reviewed before release because the checked-in Dockerfiles do not currently look internally consistent.
