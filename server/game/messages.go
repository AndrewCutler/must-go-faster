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
		// "timeLeft":     gameMeta.getTimeRemaining(config),
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

func handlePremoveMessage(message Message, game *GameMeta) {
	err := parsePremove(string(message.Move.Data), game.Game)
	if err != nil {
		log.Println("Cannot make premove: ", err)
		return
	}
	// play move on board and respond with updated fail/illegal premove response or updated fen
	for _, player := range game.GetPlayers() {
		select {
		case player.Send <- sendMoveMessage(nil, game, player.Color):
		default:
			close(player.Send)
		}
	}
}

func handleTimeoutMessage(message Message, game *GameMeta) {
	err := parseTimeout(string(message.Move.Data), game.Game)
	if err != nil {
		fmt.Println("Failed to parse timeout move data")
		return
	}

	for _, player := range game.GetPlayers() {
		m := sendTimeoutMessage(game, player.Color, game.whoseMoveIsIt())
		select {
		case player.Send <- m:
		default:
			close(player.Send)
		}
	}
}

func handleMoveMessage(config *c.ClientConfig, message Message, game *GameMeta) {
	err := parseMove(string(message.Move.Data), game.Game)
	if err != nil {
		log.Println("Cannot make move: ", err)
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
