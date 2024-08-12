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
5. Various bugs with channels and messages.
    * GameStartedToServerType is sent when player's clock starts,
        so whoever goes second will send this message after the first player makes a move,
        so the server responds with __two__ GameStartedFromServerMessages
6. When oppoent moves, his piece moves but is not highlighted
7. Clean up styling; get rid of inline styling and use classes, and be consistent