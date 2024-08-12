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
	SessionId   string      `json:"sessionId"`
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

func sendGameJoinedMessage(session *Session, playerColor string) []byte {
	message := Message{
		Type:        GameJoinedFromServerType.String(),
		SessionId:   session.SessionId,
		PlayerColor: playerColor,
		TimeStamp:   time.Now().Format(time.RFC3339),
		Payload: GameJoinedFromServer{
			Fen:        session.getFen(),
			ValidMoves: ValidMovesMap(session.Game),
			WhosNext:   session.whoseMoveIsIt(),
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
	whiteTimeLeft, blackTimeLeft := session.White.Clock.TimeLeft, session.Black.Clock.TimeLeft
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

func sendMoveMessage(session *Session, playerColor string) []byte {
	isCheckmated := ""
	switch session.Game.Outcome() {
	case "0-1":
		isCheckmated = "white"
	case "1-0":
		isCheckmated = "black"
	}

	message := Message{
		Type:        MoveFromServerType.String(),
		SessionId:   session.SessionId,
		PlayerColor: playerColor,
		TimeStamp:   time.Now().Format(time.RFC3339),
		Payload: MoveFromServer{
			Fen:           session.getFen(),
			ValidMoves:    ValidMovesMap(session.Game),
			WhosNext:      session.whoseMoveIsIt(),
			IsCheckmated:  isCheckmated,
			WhiteTimeLeft: session.White.Clock.TimeLeft,
			BlackTimeLeft: session.Black.Clock.TimeLeft,
		},
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
		Type:        TimeoutFromServerType.String(),
		SessionId:   session.SessionId,
		PlayerColor: playerColor,
		TimeStamp:   time.Now().Format(time.RFC3339),
		Payload: TimeoutFromServer{
			Fen:        session.getFen(),
			ValidMoves: ValidMovesMap(session.Game),
			WhosNext:   session.whoseMoveIsIt(),
			Loser:      loser,
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

// Receive
func handleAbandonedMessage(session *Session) {
	for _, player := range session.GetPlayers() {
		player.WriteChan <- sendAbandonedMessage()
	}
}

func handleMoveMessage(message Message, session *Session) {
	// log.Println("handleMoveMessage")
	payload := message.Payload.(MoveToServer)
	err := tryPlayMove(payload, session.Game)
	if err != nil {
		log.Println("Cannot make move: ", err)
		return
	}

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

	for _, player := range session.GetPlayers() {
		player.WriteChan <- sendMoveMessage(session, player.Color)
	}
}

func handlePremoveMessage(message Message, session *Session) {
	// log.Println("handlePremoveMessage")
	payload := message.Payload.(PremoveToServer)
	err := tryPlayPremove(payload, session.Game)
	if err != nil {
		log.Println("Cannot make premove: ", err)
		return
	}

	// play move on board and respond with updated fail/illegal premove response or updated fen
	for _, player := range session.GetPlayers() {
		player.WriteChan <- sendMoveMessage(session, player.Color)
	}
}

func handleGameStartedMessage(config *c.ClientConfig, session *Session) {
	session.White.Clock = Clock{
		TimeLeft:  config.StartingTime,
		TimeStamp: time.Now(),
	}
	session.Black.Clock = Clock{
		TimeLeft:  config.StartingTime,
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
