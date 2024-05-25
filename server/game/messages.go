package game

import (
	"encoding/json"
	"errors"
	"fmt"
	"log"
	c "server/config"
	"time"
)

type MessageType int

const (
	GameJoinedType = MessageType(iota)
	GameStartedType
	MoveType
	TimeoutType
	AbandonedType
)

func (m MessageType) String() string {
	switch m {
	case GameJoinedType:
		return "GameJoinedType"
	case GameStartedType:
		return "GameStartedType"
	case MoveType:
		return "MoveType"
	case TimeoutType:
		return "TimeoutType"
	case AbandonedType:
		return "AbandonedType"
	default:
		return ""
	}
}

func MessageTypeFromString(s string) (MessageType, error) {
	switch s {
	case "gameJoined":
		return GameJoinedType, nil
	case "gameStarted":
		return GameStartedType, nil
	case "move":
		return MoveType, nil
	case "timeout":
		return TimeoutType, nil
	case "abandoned":
		return AbandonedType, nil
	}

	return -1, errors.New("invalid message type")
}

type BroadcastMessage struct {
	Payload []byte      `json:"payload"`
	Type    MessageType `json:"type"`
	GameId  string      `json:"gameId"`
}

type SendMessage struct {
	Payload     interface{} `json:"payload"`
	Type        string      `json:"type"`
	GameId      string      `json:"gameId"`
	PlayerColor string      `json:"playerColor"`
}

type GameJoinedPayload struct {
	Fen           string              `json:"fen"`
	ValidMoves    map[string][]string `json:"validMoves"`
	WhosNext      string              `json:"whosNext"`
	WhiteTimeLeft float64             `json:"whiteTimeLeft"`
	BlackTimeLeft float64             `json:"blackTimeLeft"`
}

type GameStartedPayload struct {
	Fen           string              `json:"fen"`
	ValidMoves    map[string][]string `json:"validMoves"`
	WhosNext      string              `json:"whosNext"`
	WhiteTimeLeft float64             `json:"whiteTimeLeft"`
	BlackTimeLeft float64             `json:"blackTimeLeft"`
}

type MovePayload struct {
	WhiteTimeLeft float64             `json:"whiteTimeLeft"`
	BlackTimeLeft float64             `json:"blackTimeLeft"`
	Fen           string              `json:"fen"`
	ValidMoves    map[string][]string `json:"validMoves"`
	WhosNext      string              `json:"whosNext"`
	IsCheckmated  string              `json:"isCheckmated"`
	// WhiteTimeLeft float64             `json:"whiteTimeLeft"`
	// BlackTimeLeft float64             `json:"blackTimeLeft"`
}

type TimeoutPayload struct {
	WhiteTimeLeft float64             `json:"whiteTimeLeft"`
	BlackTimeLeft float64             `json:"blackTimeLeft"`
	Fen           string              `json:"fen"`
	ValidMoves    map[string][]string `json:"validMoves"`
	WhosNext      string              `json:"whosNext"`
	Loser         string              `json:"loser"`
	// WhiteTimeLeft float64             `json:"whiteTimeLeft"`
	// BlackTimeLeft float64             `json:"blackTimeLeft"`
}

type AbandonedPayload struct {
	Abandoned bool `json:"abandoned"`
}

// Send
func sendGameJoinedMessage(config *c.ClientConfig, gameMeta *GameMeta, playerColor string) []byte {
	// todo: logic for time left is a disaster
	// set previous time for whosNext to time.Now()
	gameMeta.LastMoveTime = time.Now()
	whiteTimeLeft, blackTimeLeft := gameMeta.getTimeLeft(config)
	message := SendMessage{
		Type:        GameJoinedType.String(),
		GameId:      gameMeta.GameId,
		PlayerColor: playerColor,
		Payload: GameJoinedPayload{
			Fen:           gameMeta.getFen(),
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

func sendGameStartedMessage(config *c.ClientConfig, gameMeta *GameMeta, playerColor string) []byte {
	// todo: logic for time left is a disaster
	// set previous time for whosNext to time.Now()
	gameMeta.LastMoveTime = time.Now()
	whiteTimeLeft, blackTimeLeft := gameMeta.getTimeLeft(config)
	message := SendMessage{
		Type:        GameStartedType.String(),
		GameId:      gameMeta.GameId,
		PlayerColor: playerColor,
		Payload: GameStartedPayload{
			Fen:           gameMeta.getFen(),
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

func sendMoveMessage(config *c.ClientConfig, gameMeta *GameMeta, playerColor string) []byte {
	isCheckmated := ""
	switch gameMeta.Game.Outcome() {
	case "0-1":
		isCheckmated = "white"
	case "1-0":
		isCheckmated = "black"
	}

	message := SendMessage{
		Type:        MoveType.String(),
		GameId:      gameMeta.GameId,
		PlayerColor: playerColor,
		Payload: MovePayload{
			Fen:          gameMeta.getFen(),
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

func sendTimeoutMessage(gameMeta *GameMeta, playerColor string, loser string) []byte {
	message := SendMessage{
		Type:        TimeoutType.String(),
		GameId:      gameMeta.GameId,
		PlayerColor: playerColor,
		Payload: TimeoutPayload{
			Fen:        gameMeta.getFen(),
			ValidMoves: ValidMovesMap(gameMeta.Game),
			WhosNext:   gameMeta.whoseMoveIsIt(),
			Loser:      loser,
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

func sendAbandonedMessage() []byte {
	message := SendMessage{
		Type: AbandonedType.String(),
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
		case player.SendChan <- sendAbandonedMessage():
		default:
			close(player.SendChan)
		}
	}
}

func handlePremoveMessage(message SendMessage, game *GameMeta) {
	err := parsePremove("", game.Game)
	// err := parsePremove(string(message.Move.Data), game.Game)
	if err != nil {
		log.Println("Cannot make premove: ", err)
		return
	}
	// play move on board and respond with updated fail/illegal premove response or updated fen
	for _, player := range game.GetPlayers() {
		select {
		case player.SendChan <- sendMoveMessage(nil, game, player.Color):
		default:
			close(player.SendChan)
		}
	}
}

func handleGameStartedMessage(config *c.ClientConfig, game *GameMeta) {
	fmt.Println("game started")
	for _, player := range game.GetPlayers() {
		m := sendGameStartedMessage(config, game, player.Color)
		select {
		case player.SendChan <- m:
		default:
			close(player.SendChan)
		}
	}
}

// is message necessary?
func handleTimeoutMessage(game *GameMeta) {
	err := parseTimeout("", game.Game)
	// err := parseTimeout(string(message.Move.Data), game.Game)
	if err != nil {
		fmt.Println("Failed to parse timeout move data")
		return
	}

	for _, player := range game.GetPlayers() {
		m := sendTimeoutMessage(game, player.Color, game.whoseMoveIsIt())
		select {
		case player.SendChan <- m:
		default:
			close(player.SendChan)
		}
	}
}

func handleMoveMessage(config *c.ClientConfig, game *GameMeta) {
	// err := parseMove(string(message.Move.Data), game.Game)
	err := parseMove("", game.Game)
	if err != nil {
		log.Println("Cannot make move: ", err)
		return
	}

	for _, player := range game.GetPlayers() {
		select {
		case player.SendChan <- sendMoveMessage(config, game, player.Color):
		default:
			close(player.SendChan)
		}
	}
}
