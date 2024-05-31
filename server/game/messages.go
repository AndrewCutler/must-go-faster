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
	GameJoinedToServerType

	GameStartedFromServerType
	GameStartedToServerType

	MoveFromServerType
	MoveToServerType

	PremoveFromServerType
	PremoveToServerType

	TimeoutFromServerType
	TimeoutToServerType

	AbandonedFromServerType
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
	case PremoveToServerType:
		return "PremoveToServerType"
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
	case "PremoveFromServerType":
		return PremoveFromServerType, nil
	}

	return -1, fmt.Errorf("invalid message type: %s", s)
}

type Message struct {
	Payload     interface{} `json:"payload"`
	PlayerColor string      `json:"playerColor"`
	Type        string      `json:"type"`
	GameId      string      `json:"gameId"`
	TimeStamp   string      `json:"serverTimeStamp"`
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
}

type TimeoutFromServer struct {
	WhiteTimeLeft float64             `json:"whiteTimeLeft"`
	BlackTimeLeft float64             `json:"blackTimeLeft"`
	Fen           string              `json:"fen"`
	ValidMoves    map[string][]string `json:"validMoves"`
	WhosNext      string              `json:"whosNext"`
	Loser         string              `json:"loser"`
}

type AbandonedFromServer struct {
	Abandoned bool `json:"abandoned"`
}

type MoveToServer struct {
	Move Move `json:"move"`
}

type PremoveToServer struct {
	Premove Move `json:"premove"`
}

type TimeoutToServer struct {
	Timeout bool `json:"timeout"`
}

func sendGameJoinedMessage(gameMeta *GameMeta, playerColor string) []byte {
	message := Message{
		Type:        GameJoinedFromServerType.String(),
		GameId:      gameMeta.GameId,
		PlayerColor: playerColor,
		TimeStamp:   time.Now().Format(time.RFC3339),
		Payload: GameJoinedFromServer{
			Fen:        gameMeta.getFen(),
			ValidMoves: ValidMovesMap(gameMeta.Game),
			WhosNext:   gameMeta.whoseMoveIsIt(),
		},
	}

	jsonData, err := json.Marshal(message)
	if err != nil {
		fmt.Println("Error converting message to JSON: ", err)
		return []byte{}
	}

	return jsonData
}

func sendGameStartedMessage(gameMeta *GameMeta, playerColor string) []byte {
	whiteTimeLeft, blackTimeLeft := gameMeta.White.Clock.TimeLeft, gameMeta.Black.Clock.TimeLeft
	message := Message{
		Type:        GameStartedFromServerType.String(),
		GameId:      gameMeta.GameId,
		PlayerColor: playerColor,
		TimeStamp:   time.Now().Format(time.RFC3339),
		Payload: GameStartedFromServer{
			Fen:           gameMeta.getFen(),
			ValidMoves:    ValidMovesMap(gameMeta.Game),
			WhosNext:      gameMeta.whoseMoveIsIt(),
			WhiteTimeLeft: whiteTimeLeft,
			BlackTimeLeft: blackTimeLeft,
		},
	}

	jsonData, err := json.Marshal(message)
	if err != nil {
		fmt.Println("Error converting message to JSON: ", err)
		return []byte{}
	}

	return jsonData
}

func sendMoveMessage(gameMeta *GameMeta, playerColor string) []byte {
	isCheckmated := ""
	switch gameMeta.Game.Outcome() {
	case "0-1":
		isCheckmated = "white"
	case "1-0":
		isCheckmated = "black"
	}

	message := Message{
		Type:        MoveFromServerType.String(),
		GameId:      gameMeta.GameId,
		PlayerColor: playerColor,
		TimeStamp:   time.Now().Format(time.RFC3339),
		Payload: MoveFromServer{
			Fen:           gameMeta.getFen(),
			ValidMoves:    ValidMovesMap(gameMeta.Game),
			WhosNext:      gameMeta.whoseMoveIsIt(),
			IsCheckmated:  isCheckmated,
			WhiteTimeLeft: gameMeta.White.Clock.TimeLeft,
			BlackTimeLeft: gameMeta.Black.Clock.TimeLeft,
		},
	}

	jsonData, err := json.Marshal(message)
	if err != nil {
		fmt.Println("Error converting message to JSON: ", err)
		return []byte{}
	}

	return jsonData
}

func sendTimeoutMessage(gameMeta *GameMeta, playerColor string, loser string) []byte {
	message := Message{
		Type:        TimeoutFromServerType.String(),
		GameId:      gameMeta.GameId,
		PlayerColor: playerColor,
		TimeStamp:   time.Now().Format(time.RFC3339),
		Payload: TimeoutFromServer{
			Fen:        gameMeta.getFen(),
			ValidMoves: ValidMovesMap(gameMeta.Game),
			WhosNext:   gameMeta.whoseMoveIsIt(),
			Loser:      loser,
		},
	}

	jsonData, err := json.Marshal(message)
	if err != nil {
		fmt.Println("Error converting message to JSON: ", err)
		return []byte{}
	}

	return jsonData
}

func sendAbandonedMessage() []byte {
	message := Message{
		Type:      AbandonedFromServerType.String(),
		TimeStamp: time.Now().Format(time.RFC3339),
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
		case player.WriteChan <- sendAbandonedMessage():
		default:
			close(player.WriteChan)
		}
	}
}

func handleMoveMessage(message Message, game *GameMeta) {
	payload := message.Payload.(MoveToServer)
	err := tryPlayMove(payload, game.Game)
	if err != nil {
		log.Println("Cannot make move: ", err)
		return
	}

	if game.White.Clock.IsRunning {
		game.White.Clock.TimeLeft -= time.Since(game.White.Clock.TimeStamp).Seconds()
		game.White.Clock.IsRunning = false
		game.Black.Clock.IsRunning = true
	} else {
		game.Black.Clock.TimeLeft -= time.Since(game.Black.Clock.TimeStamp).Seconds()
		game.White.Clock.IsRunning = true
		game.Black.Clock.IsRunning = false
	}
	game.White.Clock.TimeStamp = time.Now()
	game.Black.Clock.TimeStamp = time.Now()

	for _, player := range game.GetPlayers() {
		select {
		case player.WriteChan <- sendMoveMessage(game, player.Color):
		default:
			close(player.WriteChan)
		}
	}
}

func handlePremoveMessage(message Message, game *GameMeta) {
	payload := message.Payload.(PremoveToServer)
	err := tryPlayPremove(payload, game.Game)
	if err != nil {
		log.Println("Cannot make premove: ", err)
		return
	}

	// play move on board and respond with updated fail/illegal premove response or updated fen
	for _, player := range game.GetPlayers() {
		select {
		case player.WriteChan <- sendMoveMessage(game, player.Color):
		default:
			close(player.WriteChan)
		}
	}
}

func handleGameStartedMessage(config *c.ClientConfig, game *GameMeta) {
	fmt.Println("game started")
	game.White.Clock = Clock{
		TimeLeft:  config.StartingTime,
		TimeStamp: time.Now(),
	}
	game.Black.Clock = Clock{
		TimeLeft:  config.StartingTime,
		TimeStamp: time.Now(),
	}

	if game.whoseMoveIsIt() == "white" {
		game.White.Clock.IsRunning = true
	} else {
		game.Black.Clock.IsRunning = true
	}

	for _, player := range game.GetPlayers() {
		m := sendGameStartedMessage(game, player.Color)
		select {
		case player.WriteChan <- m:
		default:
			close(player.WriteChan)
		}
	}
}

func handleTimeoutMessage(game *GameMeta) {
	for _, player := range game.GetPlayers() {
		m := sendTimeoutMessage(game, player.Color, game.whoseMoveIsIt())
		select {
		case player.WriteChan <- m:
		default:
			close(player.WriteChan)
		}
	}
}
