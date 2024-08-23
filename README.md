# Must Go Faster

### Notes

-   Player.Read fires when receiving a message from connection
-   Player.Read sends Move to Broadcast channel
-   Broadcast channel, if game state is valid, sends data to Player.Send
-   Player.Send is handled in Player.Write

### TODO

1. Menu for piece selection during promotion (not supported by Chessground)
2. Make game over modal presentable
3. Increment?
4. Show material count
5. The clock is wrong; time jumps up after opponent move -- only because of premoves though
6. Clean up styling; get rid of inline styling and use classes, and be consistent