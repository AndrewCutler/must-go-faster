package game

import (
	"encoding/json"
	"fmt"
	"log"
	c "server/config"
	"time"
)

type MessageType int

const (
	GameJoinedFromServerType = MessageType(iota)
	GameStartedFromServerType
	MoveFromServerType
	TimeoutFromServerType
	AbandonedFromServerType
	GameJoinedToServerType
	GameStartedToServerType
	MoveToServerType
	TimeoutToServerType
	AbandonedToServerType
)

func (m MessageType) String() string {
	switch m {
	case GameJoinedFromServerType:
		return "GameJoinedFromServerType"
	case GameStartedFromServerType:
		return "GameStartedFromServerType"
	case MoveFromServerType:
		return "MoveFromServerType"
	case TimeoutFromServerType:
		return "TimeoutFromServerType"
	case AbandonedFromServerType:
		return "AbandonedFromServerType"
	case GameJoinedToServerType:
		return "GameJoinedToServerType"
	case GameStartedToServerType:
		return "GameStartedToServerType"
	case MoveToServerType:
		return "MoveToServerType"
	case TimeoutToServerType:
		return "TimeoutToServerType"
	case AbandonedToServerType:
		return "AbandonedToServerType"
	default:
		return ""
	}
}

func MessageTypeFromString(s string) (MessageType, error) {
	switch s {
	case "GameJoinedFromServerType":
		return GameJoinedFromServerType, nil
	case "GameStartedFromServerType":
		return GameStartedFromServerType, nil
	case "MoveFromServerType":
		return MoveFromServerType, nil
	case "TimeoutFromServerType":
		return TimeoutFromServerType, nil
	case "AbandonedFromServerType":
		return AbandonedFromServerType, nil
	}

	return -1, fmt.Errorf("invalid message type: %s", s)
}

type MessageToServer struct {
	Payload     interface{} `json:"payload"`
	PlayerColor string      `json:"playerColor"`
	Type        string      `json:"type"`
	GameId      string      `json:"gameId"`
}

type MessageFromServer struct {
	Payload     interface{} `json:"payload"`
	Type        string      `json:"type"`
	GameId      string      `json:"gameId"`
	PlayerColor string      `json:"playerColor"`
}

type GameJoinedFromServer struct {
	Fen           string              `json:"fen"`
	ValidMoves    map[string][]string `json:"validMoves"`
	WhosNext      string              `json:"whosNext"`
	WhiteTimeLeft float64             `json:"whiteTimeLeft"`
	BlackTimeLeft float64             `json:"blackTimeLeft"`
}

type GameStartedFromServer struct {
	Fen           string              `json:"fen"`
	ValidMoves    map[string][]string `json:"validMoves"`
	WhosNext      string              `json:"whosNext"`
	WhiteTimeLeft float64             `json:"whiteTimeLeft"`
	BlackTimeLeft float64             `json:"blackTimeLeft"`
}

type MoveFromServer struct {
	WhiteTimeLeft float64             `json:"whiteTimeLeft"`
	BlackTimeLeft float64             `json:"blackTimeLeft"`
	Fen           string              `json:"fen"`
	ValidMoves    map[string][]string `json:"validMoves"`
	WhosNext      string              `json:"whosNext"`
	IsCheckmated  string              `json:"isCheckmated"`
	// WhiteTimeLeft float64             `json:"whiteTimeLeft"`
	// BlackTimeLeft float64             `json:"blackTimeLeft"`
}

type TimeoutFromServer struct {
	WhiteTimeLeft float64             `json:"whiteTimeLeft"`
	BlackTimeLeft float64             `json:"blackTimeLeft"`
	Fen           string              `json:"fen"`
	ValidMoves    map[string][]string `json:"validMoves"`
	WhosNext      string              `json:"whosNext"`
	Loser         string              `json:"loser"`
	// WhiteTimeLeft float64             `json:"whiteTimeLeft"`
	// BlackTimeLeft float64             `json:"blackTimeLeft"`
}

type AbandonedFromServer struct {
	Abandoned bool `json:"abandoned"`
}

type MoveToServer struct {
	Move Move `json:"move"`
}

type TimeoutToServer struct {
	Timeout bool `json:"timeout"`
}

type PremoveToServer struct {
	Premove Move `json:"move"`
}

// Send
func sendGameJoinedMessage(config *c.ClientConfig, gameMeta *GameMeta, playerColor string) []byte {
	// todo: logic for time left is a disaster
	// set previous time for whosNext to time.Now()
	gameMeta.LastMoveTime = time.Now()
	whiteTimeLeft, blackTimeLeft := gameMeta.getTimeLeft(config)
	message := MessageFromServer{
		Type:        GameJoinedFromServerType.String(),
		GameId:      gameMeta.GameId,
		PlayerColor: playerColor,
		Payload: GameJoinedFromServer{
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
	message := MessageFromServer{
		Type:        GameStartedFromServerType.String(),
		GameId:      gameMeta.GameId,
		PlayerColor: playerColor,
		Payload: GameStartedFromServer{
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

	message := MessageFromServer{
		Type:        MoveFromServerType.String(),
		GameId:      gameMeta.GameId,
		PlayerColor: playerColor,
		Payload: MoveFromServer{
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
	message := MessageFromServer{
		Type:        TimeoutFromServerType.String(),
		GameId:      gameMeta.GameId,
		PlayerColor: playerColor,
		Payload: TimeoutFromServer{
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
	message := MessageFromServer{
		Type: AbandonedFromServerType.String(),
		Payload: AbandonedFromServer{
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

func handlePremoveMessage(message MessageFromServer, game *GameMeta) {
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

func handleMoveMessage(config *c.ClientConfig, message MessageToServer, game *GameMeta) {
	// fmt.Println("payload: ", string(message.Payload))
	payload := message.Payload.(MoveToServer)
	err := parseMove(payload, game.Game)
	// err := parseMove(string(message.Payload), game.Game)
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
