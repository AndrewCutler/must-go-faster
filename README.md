# Must Go Faster

## How to run

1. `cd` into root directory
2. `docker compose up`

### TODO

1. Menu for piece selection during promotion (not supported by Chessground)
2. Make game over modal presentable
3. Increment?
4. Show material count
5. Clean up styling; get rid of inline styling and use classes, and be consistent
6. Now that config is gone, allow selecting starting time from a dropdown on the frontend (e.g. 10, 15, 30)
7. Responsive design
8. Abandonment message doesn't work
9. Frontend errors when server is not responsive
10. Acknowledgement packets
11. Allow canceling of find a game requests


## top priority
premove to server is sent by client in between move to server and move from server. should be
1. send move to server
2. make premove and keep in frontend state
3. receive move from server
4. send premove to server

