package game

import (
	"encoding/json"
	"fmt"
	"log"
	c "server/config"
)

// Send
func sendGameStartMessage(config *c.ClientConfig, gameMeta *GameMeta, playerColor string) []byte {
	data := map[string]interface{}{
		"gameStarted": true,
		"fen":         gameMeta.getFen(),
		"gameId":      gameMeta.GameId,
		"playerColor": playerColor, // is this necessary
		"validMoves":  ValidMovesMap(gameMeta.Game),
		"whosNext":    gameMeta.whoseMoveIsIt(),
		"timeLeft":    gameMeta.getTimeRemaining(config),
	}

	jsonData, err := json.Marshal(data)
	if err != nil {
		fmt.Println("Error converting message to JSON: ", err)
		return []byte{}
	}

	return jsonData
}

func sendMoveMessage(config *c.ClientConfig, gameMeta *GameMeta, playerColor string) []byte {
	isCheckmated := ""
	switch gameMeta.Game.Outcome() {
	case "0-1":
		isCheckmated = "white"
	case "1-0":
		isCheckmated = "black"
	}

	data := map[string]interface{}{
		"fen":          gameMeta.getFen(),
		"gameId":       gameMeta.GameId,
		"playerColor":  playerColor,
		"validMoves":   ValidMovesMap(gameMeta.Game),
		"whosNext":     gameMeta.whoseMoveIsIt(),
		"isCheckmated": isCheckmated,
		"timeLeft":     gameMeta.getTimeRemaining(config),
	}

	jsonData, err := json.Marshal(data)
	if err != nil {
		fmt.Println("Error converting message to JSON: ", err)
		return []byte{}
	}

	return jsonData
}

func sendTimeoutMessage(gameMeta *GameMeta, playerColor string, loser string) []byte {
	data := map[string]interface{}{
		"fen":         gameMeta.getFen(),
		"gameId":      gameMeta.GameId,
		"whosNext":    gameMeta.whoseMoveIsIt(),
		"playerColor": playerColor,
		"loser":       loser,
	}

	jsonData, err := json.Marshal(data)
	if err != nil {
		fmt.Println("Error converting message to JSON: ", err)
		return []byte{}
	}

	return jsonData
}

func sendAbandondedMessage() []byte {
	data := map[string]interface{}{
		"abandonded": true,
	}

	jsonData, err := json.Marshal(data)
	if err != nil {
		fmt.Println("Error converting message to JSON: ", err)
		return []byte{}
	}

	return jsonData
}

// Receive
func handleAbandonedMessage(game *GameMeta) {
	for _, player := range game.GetPlayers() {
		select {
		case player.Send <- sendAbandondedMessage():
		default:
			close(player.Send)
		}
	}
}

func handleTimeoutMessage(message Message, game *GameMeta) bool {
	type TimeoutRequest struct {
		Timeout     bool   `json:"timeout"`
		PlayerColor string `json:"playerColor"`
	}
	var timeout TimeoutRequest
	err := json.Unmarshal(message.Move.Data, &timeout)
	if err != nil {
		fmt.Println(err)
		return true
	}

	if timeout.Timeout {
		for _, player := range game.GetPlayers() {
			m := sendTimeoutMessage(game, player.Color, game.whoseMoveIsIt())
			select {
			case player.Send <- m:
			default:
				close(player.Send)
			}
		}

		return true
	}

	return false
}

func handleMoveMessage(config *c.ClientConfig, message Message, game *GameMeta) {
	if err := makeMove(string(message.Move.Data), game.Game); err != nil {
		log.Panicln("Cannot make move: ", err)
		return
	}

	for _, player := range game.GetPlayers() {
		select {
		case player.Send <- sendMoveMessage(config, game, player.Color):
		default:
			close(player.Send)
		}
	}
}
