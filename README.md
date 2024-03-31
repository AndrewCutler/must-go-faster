# Must Go Faster


### Notes
* Player.Read fires when receiving a message from connection
* Player.Read sends Move to Broadcast channel
* Broadcast channel 
* If game state is valid, send data to Player.Send
* Player.Send is handled in Player.Write