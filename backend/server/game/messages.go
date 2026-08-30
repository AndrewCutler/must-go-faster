package game

import (
	"encoding/json"
	"fmt"
	"log"
	"math/rand"
	"time"

	"server/constants"

	"github.com/notnil/chess"
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
	Payload           interface{} `json:"payload"`
	PlayerColor       string      `json:"playerColor"`
	Type              string      `json:"type"`
	SessionId         string      `json:"sessionId"`
	TimeStamp         string      `json:"serverTimeStamp"`
	IsAgainstComputer bool        `json:"isAgainstComputer"`
}

type GameJoinedFromServer struct {
	Fen              string              `json:"fen"`
	ValidMoves       map[string][]string `json:"validMoves"`
	WhosNext         string              `json:"whosNext"`
	WhiteTimeLeft    float64             `json:"whiteTimeLeft"`
	BlackTimeLeft    float64             `json:"blackTimeLeft"`
	CountdownStartAt time.Time           `json:"countdownStartAt"`
}

type GameStartedFromServer struct {
	Fen           string              `json:"fen"`
	ValidMoves    map[string][]string `json:"validMoves"`
	WhosNext      string              `json:"whosNext"`
	WhiteTimeLeft float64             `json:"whiteTimeLeft"`
	BlackTimeLeft float64             `json:"blackTimeLeft"`
}

type MoveFromServer struct {
	WhiteTimeLeft     float64             `json:"whiteTimeLeft"`
	BlackTimeLeft     float64             `json:"blackTimeLeft"`
	Fen               string              `json:"fen"`
	ValidMoves        map[string][]string `json:"validMoves"`
	WhosNext          string              `json:"whosNext"`
	Accepted          bool                `json:"accepted"`
	IsCheckmated      string              `json:"isCheckmated"`
	GameOutcome       string              `json:"gameOutcome"`
	GameOutcomeMethod string              `json:"gameOutcomeMethod"`
	Move              Move                `json:"move"`
}

type PremoveFromServer struct {
	Accepted bool `json:"accepted"`
	Premove  Move `json:"premove"`
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
	Cancel  bool `json:"cancel"`
}

type TimeoutToServer struct {
	Timeout bool `json:"timeout"`
}

func sendGameJoinedMessage(session *Session, playerColor string, countdownStartAt time.Time) []byte {
	message := Message{
		Type:              GameJoinedFromServerType.String(),
		SessionId:         session.SessionId,
		PlayerColor:       playerColor,
		TimeStamp:         time.Now().Format(time.RFC3339),
		IsAgainstComputer: session.isAgainstComputer(),
		Payload: GameJoinedFromServer{
			Fen:              session.getFen(),
			ValidMoves:       ValidMovesMap(session.Game),
			WhosNext:         session.whoseMoveIsIt(),
			WhiteTimeLeft:    constants.GameClockDuration,
			BlackTimeLeft:    constants.GameClockDuration,
			CountdownStartAt: countdownStartAt,
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

func sendMoveMessage(session *Session, playerColor string, move Move, accepted bool) []byte {
	isCheckmated := ""
	switch session.Game.Outcome() {
	case chess.BlackWon:
		if session.Game.Method() == chess.Checkmate {
			isCheckmated = "white"
		}
	case chess.WhiteWon:
		if session.Game.Method() == chess.Checkmate {
			isCheckmated = "black"
		}
	}

	whiteTimeLeft, blackTimeLeft := session.getTimeLefts()

	message := Message{
		Type:        MoveFromServerType.String(),
		SessionId:   session.SessionId,
		PlayerColor: playerColor,
		TimeStamp:   time.Now().Format(time.RFC3339),
		Payload: MoveFromServer{
			Fen:               session.getFen(),
			ValidMoves:        ValidMovesMap(session.Game),
			WhosNext:          session.whoseMoveIsIt(),
			Accepted:          accepted,
			IsCheckmated:      isCheckmated,
			GameOutcome:       session.Game.Outcome().String(),
			GameOutcomeMethod: session.Game.Method().String(),
			WhiteTimeLeft:     whiteTimeLeft,
			BlackTimeLeft:     blackTimeLeft,
			Move:              move,
		},
	}

	jsonData, err := json.Marshal(message)
	if err != nil {
		log.Println("Error converting message to JSON: ", err)
		return []byte{}
	}

	return jsonData
}

func sendPremoveMessage(session *Session, playerColor string, premove Move, accepted bool) []byte {
	message := Message{
		Type:        PremoveFromServerType.String(),
		SessionId:   session.SessionId,
		PlayerColor: playerColor,
		TimeStamp:   time.Now().Format(time.RFC3339),
		Payload: PremoveFromServer{
			Accepted: accepted,
			Premove:  premove,
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
	// kill session if against computer
	for _, player := range session.GetPlayers() {
		player.WriteChan <- sendAbandonedMessage()
	}

}

func handleMoveMessage(message Message, session *Session) {
	payload := message.Payload.(MoveToServer)
	mover := session.playerForColor(message.PlayerColor)
	if mover == nil {
		log.Println("Cannot resolve mover for color: ", message.PlayerColor)
		return
	}

	move, err := tryPlayMove(payload, session.Game)
	if err != nil {
		log.Println("Cannot make move: ", err)
		for _, player := range session.GetPlayers() {
			if player.Color == message.PlayerColor {
				player.WriteChan <- sendMoveMessage(session, player.Color, payload.Move, false)
			}
		}
		return
	}

	broadcastMoveWithPossiblePremove(session, mover, move)
}

func handlePremoveMessage(message Message, session *Session) {
	payload := message.Payload.(PremoveToServer)
	mover := session.playerForColor(message.PlayerColor)
	if mover == nil {
		log.Println("Cannot resolve premover for color: ", message.PlayerColor)
		return
	}

	if payload.Cancel {
		if session.PendingPremove != nil && session.PendingPremove.Color == message.PlayerColor {
			session.clearPendingPremove()
		}
		return
	}

	if session.whoseMoveIsIt() == message.PlayerColor {
		for _, player := range session.GetPlayers() {
			if player.Color == message.PlayerColor {
				player.WriteChan <- sendPremoveMessage(session, player.Color, payload.Premove, false)
			}
		}
		return
	}

	if err := tryPlayMoveForColor(payload.Premove, session.Game, message.PlayerColor); err != nil {
		log.Println("Cannot make premove: ", err)
		for _, player := range session.GetPlayers() {
			if player.Color == message.PlayerColor {
				player.WriteChan <- sendPremoveMessage(session, player.Color, payload.Premove, false)
			}
		}
		return
	}

	session.setPendingPremove(message.PlayerColor, payload.Premove)
	for _, player := range session.GetPlayers() {
		if player.Color == message.PlayerColor {
			player.WriteChan <- sendPremoveMessage(session, player.Color, payload.Premove, true)
		}
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

func updateClocks(session *Session, mover *Player) {
	if mover == nil {
		return
	}

	mover.Clock.TimeLeft -= time.Since(mover.Clock.TimeStamp).Seconds()
	if mover.Clock.TimeLeft < 0 {
		mover.Clock.TimeLeft = 0
	}
	mover.Clock.IsRunning = false
	session.White.Clock.IsRunning = false
	session.Black.Clock.IsRunning = false
	session.White.Clock.TimeStamp = time.Now()
	session.Black.Clock.TimeStamp = time.Now()
}

func switchClocksWithoutDeducting(session *Session) {
	now := time.Now()
	switch session.whoseMoveIsIt() {
	case "white":
		session.White.Clock.IsRunning = true
		session.Black.Clock.IsRunning = false
	case "black":
		session.White.Clock.IsRunning = false
		session.Black.Clock.IsRunning = true
	default:
		session.White.Clock.IsRunning = false
		session.Black.Clock.IsRunning = false
	}
	session.White.Clock.TimeStamp = now
	session.Black.Clock.TimeStamp = now
}

func broadcastMove(session *Session, move Move, accepted bool) {
	for _, player := range session.GetPlayers() {
		player.WriteChan <- sendMoveMessage(session, player.Color, move, accepted)
	}
}

func broadcastMoveWithPossiblePremove(session *Session, mover *Player, move Move) {
	updateClocks(session, mover)

	if err := session.Game.MoveStr(move.From + move.To); err != nil {
		log.Println("Failed to apply move after validation: ", err)
		return
	}

	switchClocksWithoutDeducting(session)
	broadcastMove(session, move, true)

	if session.Game.Outcome() != chess.NoOutcome {
		session.clearPendingPremove()
		return
	}

	premove := session.PendingPremove
	if premove == nil {
		maybeScheduleComputerMove(session)
		return
	}

	if premove.Color != session.whoseMoveIsIt() {
		session.clearPendingPremove()
		maybeScheduleComputerMove(session)
		return
	}

	if err := tryPlayMoveForColor(premove.Move, session.Game, premove.Color); err != nil {
		log.Println("Dropping cached premove: ", err)
		session.clearPendingPremove()
		maybeScheduleComputerMove(session)
		return
	}

	if err := session.Game.MoveStr(premove.Move.From + premove.Move.To); err != nil {
		session.clearPendingPremove()
		maybeScheduleComputerMove(session)
		return
	}

	session.clearPendingPremove()
	switchClocksWithoutDeducting(session)
	broadcastMove(session, premove.Move, true)

	maybeScheduleComputerMove(session)
}

func maybeScheduleComputerMove(session *Session) {
	if session == nil || !session.isAgainstComputer() || session.Game == nil {
		return
	}

	if session.Game.Outcome() != chess.NoOutcome {
		return
	}

	computer := session.White
	if computer != nil && !computer.IsComputer {
		computer = session.Black
	}

	if computer == nil || !computer.IsComputer {
		return
	}

	if session.whoseMoveIsIt() != computer.Color {
		return
	}

	moves := session.Game.ValidMoves()
	if len(moves) == 0 {
		return
	}

	nextMove := moves[rand.Intn(len(moves))]
	delay := scheduleComputerMoveDelay(computer.Clock.TimeLeft)

	go func() {
		time.Sleep(delay)

		if session.Game.Outcome() != chess.NoOutcome {
			return
		}

		if session.whoseMoveIsIt() != computer.Color {
			return
		}

		if computer.Clock.TimeLeft-time.Since(computer.Clock.TimeStamp).Seconds() <= 0 {
			human := session.White
			if human != nil && human.IsComputer {
				human = session.Black
			}
			if human != nil {
				human.WriteChan <- sendTimeoutMessage(session, human.Color, computer.Color)
			}
			return
		}

		move := Move{
			From: nextMove.S1().String(),
			To:   nextMove.S2().String(),
		}

		broadcastMoveWithPossiblePremove(session, computer, move)
	}()
}
