package game

import (
	"encoding/json"
	"fmt"
)

func gameStartMessage(gameMeta *GameMeta, playerColor string) []byte {
	data := map[string]interface{}{
		"gameStarted": true,
		"fen":         gameMeta.getFen(),
		"gameId":      gameMeta.GameId,
		"playerColor": playerColor, // is this necessary
		"validMoves":  ValidMovesMap(gameMeta.Game),
		"whosNext":    gameMeta.whoseMoveIsIt(),
		"timeLeft":    gameMeta.getTimeRemaining(),
	}

	jsonData, err := json.Marshal(data)
	if err != nil {
		fmt.Println("Error converting message to JSON: ", err)
		return []byte{}
	}

	return jsonData
}

func moveMessage(gameMeta *GameMeta, playerColor string) []byte {
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
		"timeLeft":     gameMeta.getTimeRemaining(),
	}

	jsonData, err := json.Marshal(data)
	if err != nil {
		fmt.Println("Error converting message to JSON: ", err)
		return []byte{}
	}

	return jsonData
}

func timeoutMessage(gameMeta *GameMeta, playerColor string, loser string) []byte {
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
