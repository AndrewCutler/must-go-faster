# Must Go Faster

### Notes

-   Player.Read fires when receiving a message from connection
-   Player.Read sends Move to Broadcast channel
-   Broadcast channel, if game state is valid, sends data to Player.Send
-   Player.Send is handled in Player.Write

### TODO

1. Menu for piece selection during promotion (not supported by Chessground)
2. Make game over modal presentable
3. Increment
4. Show material count
5. Fix timer; it doesn't stop when it's not the current player's move