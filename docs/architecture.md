# architecture.md

## Backend

### Server

The backend server is written in golang and manages WebSocket connections to the client.

### Parser

The PGN parser is written in go and compiles to a standalone executable which takes a very large PGN file dump sourced from [lichess](https://www.lichess.org) and splits individual games into separate files for use by the sever.

## Frontend

The frontend is a vanilla TypeScript app using [chessground](https://github.com/lichess-org/chessground/tree/master) to display moves.

## Logic vs. presentation

All chess logic is meant to live on the server; valid moves, endgame status, premove validity checks, etc. are all server-side responsibilities. The frontend is to be a display mechanism only.