package game

import (
	"encoding/json"
	"fmt"
	"log"
	c "server/config"
	"time"
)

type Message struct {
	Payload interface{} `json:"payload"`
	Type    int         `json:"type"`
}

type GameJoinedPayload struct {
	GameJoined    bool                `json:"gameJoined"`
	Fen           string              `json:"fen"`
	GameId        string              `json:"gameId"`
	PlayerColor   string              `json:"playerColor"`
	ValidMoves    map[string][]string `json:"validMoves"`
	WhosNext      string              `json:"whosNext"`
	WhiteTimeLeft float64             `json:"whiteTimeLeft"`
	BlackTimeLeft float64             `json:"blackTimeLeft"`
}

// Send
func sendGameJoinedMessage(config *c.ClientConfig, gameMeta *GameMeta, playerColor string) []byte {
	// todo: logic for time left is a disaster
	// set previous time for whosNext to time.Now()
	gameMeta.LastMoveTime = time.Now()
	whiteTimeLeft, blackTimeLeft := gameMeta.getTimeLeft(config)
	message := Message{
		Type: 1,
		Payload: GameJoinedPayload{
			GameJoined:    true,
			Fen:           gameMeta.getFen(),
			GameId:        gameMeta.GameId,
			PlayerColor:   playerColor, // is this necessary
			ValidMoves:    ValidMovesMap(gameMeta.Game),
			WhosNext:      gameMeta.whoseMoveIsIt(),
			WhiteTimeLeft: whiteTimeLeft,
			BlackTimeLeft: blackTimeLeft,
		},
	}
	// data := map[string]interface{}{
	// 	"gameJoined":    true,
	// 	"fen":           gameMeta.getFen(),
	// 	"gameId":        gameMeta.GameId,
	// 	"playerColor":   playerColor, // is this necessary
	// 	"validMoves":    ValidMovesMap(gameMeta.Game),
	// 	"whosNext":      gameMeta.whoseMoveIsIt(),
	// 	"whiteTimeLeft": whiteTimeLeft,
	// 	"blackTimeLeft": blackTimeLeft,
	// }

	jsonData, err := json.Marshal(message)
	if err != nil {
		fmt.Println("Error converting message to JSON: ", err)
		return []byte{}
	}

	return jsonData
}

type GameStartedPayload struct {
	GameStarted   bool                `json:"gameStarted"`
	Fen           string              `json:"fen"`
	GameId        string              `json:"gameId"`
	PlayerColor   string              `json:"playerColor"`
	ValidMoves    map[string][]string `json:"validMoves"`
	WhosNext      string              `json:"whosNext"`
	WhiteTimeLeft float64             `json:"whiteTimeLeft"`
	BlackTimeLeft float64             `json:"blackTimeLeft"`
}

func sendGameStartedMessage(config *c.ClientConfig, gameMeta *GameMeta, playerColor string) []byte {
	// todo: logic for time left is a disaster
	// set previous time for whosNext to time.Now()
	gameMeta.LastMoveTime = time.Now()
	whiteTimeLeft, blackTimeLeft := gameMeta.getTimeLeft(config)
	message := Message{
		Type: 1,
		Payload: GameStartedPayload{
			GameStarted:   true,
			Fen:           gameMeta.getFen(),
			GameId:        gameMeta.GameId,
			PlayerColor:   playerColor, // is this necessary
			ValidMoves:    ValidMovesMap(gameMeta.Game),
			WhosNext:      gameMeta.whoseMoveIsIt(),
			WhiteTimeLeft: whiteTimeLeft,
			BlackTimeLeft: blackTimeLeft,
		},
	}
	// data := map[string]interface{}{
	// 	"gameStarted":   true,
	// 	"fen":           gameMeta.getFen(),
	// 	"gameId":        gameMeta.GameId,
	// 	"playerColor":   playerColor, // is this necessary
	// 	"validMoves":    ValidMovesMap(gameMeta.Game),
	// 	"whosNext":      gameMeta.whoseMoveIsIt(),
	// 	"whiteTimeLeft": whiteTimeLeft,
	// 	"blackTimeLeft": blackTimeLeft,
	// }

	jsonData, err := json.Marshal(message)
	if err != nil {
		fmt.Println("Error converting message to JSON: ", err)
		return []byte{}
	}

	return jsonData
}

type MovePayload struct {
	Fen          string              `json:"fen"`
	GameId       string              `json:"gameId"`
	PlayerColor  string              `json:"playerColor"`
	ValidMoves   map[string][]string `json:"validMoves"`
	WhosNext     string              `json:"whosNext"`
	IsCheckmated string              `json:"isCheckmated"`
	// WhiteTimeLeft float64             `json:"whiteTimeLeft"`
	// BlackTimeLeft float64             `json:"blackTimeLeft"`
}

func sendMoveMessage(config *c.ClientConfig, gameMeta *GameMeta, playerColor string) []byte {
	isCheckmated := ""
	switch gameMeta.Game.Outcome() {
	case "0-1":
		isCheckmated = "white"
	case "1-0":
		isCheckmated = "black"
	}

	message := Message{
		Type: 1,
		Payload: MovePayload{
			Fen:          gameMeta.getFen(),
			GameId:       gameMeta.GameId,
			PlayerColor:  playerColor,
			ValidMoves:   ValidMovesMap(gameMeta.Game),
			WhosNext:     gameMeta.whoseMoveIsIt(),
			IsCheckmated: isCheckmated,
			// "timeLeft":     gameMeta.getTimeRemaining(config),

		},
	}
	// data := map[string]interface{}{
	// 	"fen":          gameMeta.getFen(),
	// 	"gameId":       gameMeta.GameId,
	// 	"playerColor":  playerColor,
	// 	"validMoves":   ValidMovesMap(gameMeta.Game),
	// 	"whosNext":     gameMeta.whoseMoveIsIt(),
	// 	"isCheckmated": isCheckmated,
	// 	// "timeLeft":     gameMeta.getTimeRemaining(config),
	// }

	jsonData, err := json.Marshal(message)
	if err != nil {
		fmt.Println("Error converting message to JSON: ", err)
		return []byte{}
	}

	return jsonData
}

type TimeoutPayload struct {
	Fen         string              `json:"fen"`
	GameId      string              `json:"gameId"`
	PlayerColor string              `json:"playerColor"`
	ValidMoves  map[string][]string `json:"validMoves"`
	WhosNext    string              `json:"whosNext"`
	Loser       string              `json:"loser"`
	// WhiteTimeLeft float64             `json:"whiteTimeLeft"`
	// BlackTimeLeft float64             `json:"blackTimeLeft"`
}

func sendTimeoutMessage(gameMeta *GameMeta, playerColor string, loser string) []byte {
	message := Message{
		Type: 1,
		Payload: TimeoutPayload{
			Fen:         gameMeta.getFen(),
			GameId:      gameMeta.GameId,
			PlayerColor: playerColor,
			ValidMoves:  ValidMovesMap(gameMeta.Game),
			WhosNext:    gameMeta.whoseMoveIsIt(),
			Loser:       loser,
			// "timeLeft":     gameMeta.getTimeRemaining(config),

		},
	}
	// data := map[string]interface{}{
	// 	"fen":         gameMeta.getFen(),
	// 	"gameId":      gameMeta.GameId,
	// 	"whosNext":    gameMeta.whoseMoveIsIt(),
	// 	"playerColor": playerColor,
	// 	"loser":       loser,
	// }

	jsonData, err := json.Marshal(message)
	if err != nil {
		fmt.Println("Error converting message to JSON: ", err)
		return []byte{}
	}

	return jsonData
}

type AbandonedPayload struct {
	Abandoned bool `json:"abandoned"`
}

func sendAbandonedMessage() []byte {
	message := Message{
		Type: 1,
		Payload: AbandonedPayload{
			Abandoned: true,
		},
	}

	jsonData, err := json.Marshal(message)
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
		case player.Send <- sendAbandonedMessage():
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

func handleGameStartedMessage(config *c.ClientConfig, message Message, game *GameMeta) {
	fmt.Println("game started")
	for _, player := range game.GetPlayers() {
		m := sendGameStartedMessage(config, game, player.Color)
		select {
		case player.Send <- m:
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
