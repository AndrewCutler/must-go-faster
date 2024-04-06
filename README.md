# Must Go Faster

### Notes

-   Player.Read fires when receiving a message from connection
-   Player.Read sends Move to Broadcast channel
-   Broadcast channel, if game state is valid, sends data to Player.Send
-   Player.Send is handled in Player.Write

### TODO

1. [move chess logic to backend](https://github.com/notnil/chess)
