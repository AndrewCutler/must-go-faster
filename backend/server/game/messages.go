package game

import (
	"encoding/json"
	"fmt"
	"log"
	"time"

	"server/constants"
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

	TimeoutToServerType

	AbandonedFromServerType
	AbandonedToServerType

	GameOverFromServerType
)

func (m MessageType) String() string {
	switch m {
	case GameJoinedFromServerType:
		return "GameJoinedFromServerType"
	case GameStartedFromServerType:
		return "GameStartedFromServerType"
	case MoveFromServerType:
		return "MoveFromServerType"
	case GameOverFromServerType:
		return "GameOverFromServerType"
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
	case "AbandonedFromServerType":
		return AbandonedFromServerType, nil
	case "PremoveFromServerType":
		return PremoveFromServerType, nil
	case "GameOverFromServerType":
		return GameOverFromServerType, nil
	}

	return -1, fmt.Errorf("invalid message type: %s", s)
}

type Message struct {
	Payload           interface{} `json:"payload"`
	PlayerColor       string      `json:"playerColor"`
	Type              string      `json:"type"`
	SessionId         string      `json:"sessionId"`
	TimeStamp         string      `json:"serverTimeStamp"`
	IsAgainstComputer bool        `json:"isAgainstComputer"`
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
	Move          Move                `json:"move"`
}

// type TimeoutFromServer struct {
// 	WhiteTimeLeft float64             `json:"whiteTimeLeft"`
// 	BlackTimeLeft float64             `json:"blackTimeLeft"`
// 	Fen           string              `json:"fen"`
// 	ValidMoves    map[string][]string `json:"validMoves"`
// 	WhosNext      string              `json:"whosNext"`
// 	Loser         string              `json:"loser"`
// }

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

type GameOverFromServer struct {
	Outcome string `json:"outcome"`
	Loser   string `json:"loser"`
	Move    Move   `json:"move"`
}

func sendGameJoinedMessage(session *Session, playerColor string) []byte {
	message := Message{
		Type:              GameJoinedFromServerType.String(),
		SessionId:         session.SessionId,
		PlayerColor:       playerColor,
		TimeStamp:         time.Now().Format(time.RFC3339),
		IsAgainstComputer: session.isAgainstComputer(),
		Payload: GameJoinedFromServer{
			Fen:           session.getFen(),
			ValidMoves:    ValidMovesMap(session.Game),
			WhosNext:      session.whoseMoveIsIt(),
			WhiteTimeLeft: constants.GameClockDuration,
			BlackTimeLeft: constants.GameClockDuration,
		},
	}

	jsonData, err := json.Marshal(message)
	if err != nil {
		log.Println("Error converting message to JSON: ", err)
		return []byte{}
	}

	return jsonData
}

func sendGameStartedMessage(session *Session, playerColor string) []byte {
	whiteTimeLeft, blackTimeLeft := session.getTimeLefts()

	message := Message{
		Type:        GameStartedFromServerType.String(),
		SessionId:   session.SessionId,
		PlayerColor: playerColor,
		TimeStamp:   time.Now().Format(time.RFC3339),
		Payload: GameStartedFromServer{
			Fen:           session.getFen(),
			ValidMoves:    ValidMovesMap(session.Game),
			WhosNext:      session.whoseMoveIsIt(),
			WhiteTimeLeft: whiteTimeLeft,
			BlackTimeLeft: blackTimeLeft,
		},
	}

	jsonData, err := json.Marshal(message)
	if err != nil {
		log.Println("Error converting message to JSON: ", err)
		return []byte{}
	}

	return jsonData
}

func sendMoveMessage(session *Session, playerColor string, move Move) []byte {
	isCheckmated := ""
	switch session.Game.Outcome() {
	case "0-1":
		isCheckmated = "white"
	case "1-0":
		isCheckmated = "black"
	}

	var message Message
	if isCheckmated != "" {
		message = Message{
			Type:        GameOverFromServerType.String(),
			SessionId:   session.SessionId,
			PlayerColor: playerColor,
			TimeStamp:   time.Now().Format(time.RFC3339),
			Payload: GameOverFromServer{
				Loser:   isCheckmated,
				Outcome: "checkmate",
				Move:    move,
			},
		}

	} else {
		whiteTimeLeft, blackTimeLeft := session.getTimeLefts()

		message = Message{
			Type:        MoveFromServerType.String(),
			SessionId:   session.SessionId,
			PlayerColor: playerColor,
			TimeStamp:   time.Now().Format(time.RFC3339),
			Payload: MoveFromServer{
				Fen:           session.getFen(),
				ValidMoves:    ValidMovesMap(session.Game),
				WhosNext:      session.whoseMoveIsIt(),
				IsCheckmated:  isCheckmated,
				WhiteTimeLeft: whiteTimeLeft,
				BlackTimeLeft: blackTimeLeft,
				Move:          move,
			},
		}
	}

	jsonData, err := json.Marshal(message)
	if err != nil {
		log.Println("Error converting message to JSON: ", err)
		return []byte{}
	}

	return jsonData
}

func sendTimeoutMessage(session *Session, playerColor string, loser string) []byte {
	message := Message{
		Type:        GameOverFromServerType.String(),
		SessionId:   session.SessionId,
		PlayerColor: playerColor,
		TimeStamp:   time.Now().Format(time.RFC3339),
		Payload: GameOverFromServer{
			Outcome: "timeout",
			Loser:   loser,
		},
	}

	jsonData, err := json.Marshal(message)
	if err != nil {
		log.Println("Error converting message to JSON: ", err)
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
		log.Println("Error converting message to JSON: ", err)
		return []byte{}
	}

	return jsonData
}

func sendGameOverMessage(session *Session, outcome string, loser string) []byte {
	message := Message{
		Type:      GameOverFromServerType.String(),
		TimeStamp: time.Now().Format(time.RFC3339),
		Payload: GameOverFromServer{
			Loser:   loser,
			Outcome: outcome,
		},
	}

	jsonData, err := json.Marshal(message)
	if err != nil {
		log.Println("Error converting message to JSON: ", err)
		return []byte{}
	}

	return jsonData

}

// Receive
func handleAbandonedMessage(session *Session) {
	// kill session if against computer
	for _, player := range session.GetPlayers() {
		player.WriteChan <- sendAbandonedMessage()
	}

}

func handleMoveMessage(message Message, session *Session) {
	payload := message.Payload.(MoveToServer)
	move, err := tryPlayMove(payload, session.Game)
	if err != nil {
		log.Println("Cannot make move: ", err)
		return
	}

	updateClocks(session)

	for _, player := range session.GetPlayers() {
		player.WriteChan <- sendMoveMessage(session, player.Color, move)
	}
}

func handlePremoveMessage(message Message, session *Session) {
	// log.Println("handlePremoveMessage")
	payload := message.Payload.(PremoveToServer)
	premove, err := tryPlayPremove(payload, session.Game)
	fmt.Println(premove)
	if err != nil {
		log.Println("Cannot make premove: ", err)
		return
	}

	updateClocks(session)

	for _, player := range session.GetPlayers() {
		player.WriteChan <- sendMoveMessage(session, player.Color, premove)
	}
}

func handleGameStartedMessage(session *Session) {
	session.White.Clock = Clock{
		TimeLeft:  constants.GameClockDuration,
		TimeStamp: time.Now(),
	}
	session.Black.Clock = Clock{
		TimeLeft:  constants.GameClockDuration,
		TimeStamp: time.Now(),
	}

	if session.whoseMoveIsIt() == "white" {
		session.White.Clock.IsRunning = true
	} else {
		session.Black.Clock.IsRunning = true
	}

	for _, player := range session.GetPlayers() {
		m := sendGameStartedMessage(session, player.Color)
		player.WriteChan <- m
	}
}

func handleTimeoutMessage(session *Session) {
	for _, player := range session.GetPlayers() {
		player.WriteChan <- sendTimeoutMessage(session, player.Color, session.whoseMoveIsIt())
	}
}

func updateClocks(session *Session) {
	if session.White.Clock.IsRunning {
		session.White.Clock.TimeLeft -= time.Since(session.White.Clock.TimeStamp).Seconds()
		session.White.Clock.IsRunning = false
		session.Black.Clock.IsRunning = true
	} else {
		session.Black.Clock.TimeLeft -= time.Since(session.Black.Clock.TimeStamp).Seconds()
		session.White.Clock.IsRunning = true
		session.Black.Clock.IsRunning = false
	}
	session.White.Clock.TimeStamp = time.Now()
	session.Black.Clock.TimeStamp = time.Now()
}
