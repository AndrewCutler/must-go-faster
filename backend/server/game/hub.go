/*
 * CODEX-MODIFIED: the contents of this file were written by a human and modified after the fact by a Codex agent.
*/

package game

import (
	"log"
	"math/rand"
	"os"
	"path/filepath"
	"time"

	"github.com/google/uuid"
	"github.com/gorilla/websocket"
	"github.com/notnil/chess"
)

type Registration struct {
	Player   *Player
	Computer *Player
}

type PendingLobby struct {
	SessionId string
	Player    *Player
	CreatedAt time.Time
	Cancelled bool
}

type Hub struct {
	InProgressSessions       map[string]*Session
	AwaitingOpponentSessions map[string]*PendingLobby
	ReadChan                 chan Message
	RegisterChan             chan Registration
	UnregisterChan           chan *Player
}

func NewHub() *Hub {
	return &Hub{
		ReadChan:                 make(chan Message),
		RegisterChan:             make(chan Registration),
		UnregisterChan:           make(chan *Player),
		InProgressSessions:       make(map[string]*Session),
		AwaitingOpponentSessions: make(map[string]*PendingLobby),
	}
}

func (h *Hub) Run() {
	ticker := time.NewTicker(1 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case registration := <-h.RegisterChan:
			h.onRegister(registration.Player, registration.Computer)
		case player := <-h.UnregisterChan:
			h.onDisconnect(player, false)
		case message, ok := <-h.ReadChan:
			// 	log.Println("message, ok: ", message, ok)
			if !ok {
				log.Println("ReadChan is closed.")
				return
			}

			h.onMessage(message)
			// todo: unregister
			// case <-time.After(2 * time.Second):
			// 	log.Println("No message received by Hub after 2 seconds...")
		case <-ticker.C:
			h.expirePendingLobbies()
		}
	}
}

func (h *Hub) onRegister(player *Player, computer *Player) {
	if computer != nil {
		joinComputerGame(player, computer)
	} else {
		if len(h.AwaitingOpponentSessions) == 0 {
			createNewLobby(h, player)
		} else {
			joinPendingGame(h, player)
		}
	}
}

func (h *Hub) onDisconnect(player *Player, abandoned bool) {
	if lobby, ok := h.AwaitingOpponentSessions[player.SessionId]; ok {
		if lobby.Player != nil && lobby.Player.WriteChan != nil {
			lobby.Cancelled = true
			lobby.Player.Connection = nil
			delete(h.AwaitingOpponentSessions, player.SessionId)
			close(lobby.Player.WriteChan)
			lobby.Player.WriteChan = nil
		}
		return
	}

	session, ok := h.InProgressSessions[player.SessionId]
	if !ok {
		return
	}

	delete(h.InProgressSessions, player.SessionId)

	if abandoned {
		if session.White != nil && session.White != player {
			session.White.WriteChan <- sendAbandonedMessage()
		}
		if session.Black != nil && session.Black != player {
			session.Black.WriteChan <- sendAbandonedMessage()
		}
	}

	if player.WriteChan != nil {
		close(player.WriteChan)
		player.WriteChan = nil
		return
	}
}

func (h *Hub) onMessage(message Message) {
	// todo: lots of fields on message that may or may not be unnecessary
	// log.Println("onMessage message: ", message)
	session, ok := h.InProgressSessions[message.SessionId]
	if !ok {
		log.Printf("Session not found; sessionId: %s\n", message.SessionId)
		return
	}

	switch message.Type {
	case GameStartedToServerType.String():
		handleGameStartedMessage(session)
	case MoveToServerType.String():
		handleMoveMessage(message, session)
	case PremoveToServerType.String():
		handlePremoveMessage(message, session)
	case TimeoutToServerType.String():
		handleTimeoutMessage(session)
	case AbandonedToServerType.String():
		handleAbandonedMessage(session)
	default:
		log.Println(message)
		return
	}
}

func (h *Hub) expirePendingLobbies() {
	now := time.Now()
	for sessionId, lobby := range h.AwaitingOpponentSessions {
		if now.Sub(lobby.CreatedAt) < 2*time.Minute {
			continue
		}

		lobby.Cancelled = true
		var connection *websocket.Conn
		if lobby.Player != nil {
			connection = lobby.Player.Connection
			lobby.Player.Connection = nil
		}
		delete(h.AwaitingOpponentSessions, sessionId)
		if connection != nil {
			_ = connection.WriteControl(
				websocket.CloseMessage,
				websocket.FormatCloseMessage(
					websocket.CloseNormalClosure,
					"Lobby expired after 2 minutes.",
				),
				time.Now().Add(time.Second),
			)
			_ = connection.Close()
		}
	}
}

// todo: consider using https://github.com/notnil/chess?tab=readme-ov-file#scan-pgn
func getGameFEN() (string, error) {
	// unless this app has actual users,
	// we're gonna just store the PGNs in the repository
	// and pull one at random
	dir := "./pgns"
	files, err := os.ReadDir(dir)
	if err != nil {
		return "", err
	}

	var result string
	for isGameAcceptable := false; !isGameAcceptable; {
		// for testing with same game every time
		// fileName := files[1].Name()

		// for random file read
		fileName := files[rand.Intn(len(files))].Name()
		path := filepath.Join(dir, fileName)
		file, err := os.Open(path)
		if err != nil {
			return "", err
		}

		pgn, err := chess.PGN(file)
		if err != nil {
			return "", err
		}

		game := chess.NewGame(pgn)
		moveLength := len(game.MoveHistory())

		// only use games of at least 20 full moves
		if moveLength > 40 {
			isGameAcceptable = true
			result = game.MoveHistory()[moveLength-20].PrePosition.String()
		}
	}

	return result, nil
}

func createNewLobby(hub *Hub, player *Player) {
	sessionId := uuid.New().String()
	player.SessionId = sessionId

	hub.AwaitingOpponentSessions[sessionId] = &PendingLobby{
		SessionId: sessionId,
		Player:    player,
		CreatedAt: time.Now(),
	}
}

func joinComputerGame(player *Player, computer *Player) {
	fen, err := getGameFEN()
	if err != nil {
		log.Println("Cannot get game fen: ", err)
		return
	}

	f, err := chess.FEN(fen)
	if err != nil {
		log.Println("Cannot parse game fen: ", err)
		return
	}

	game := chess.NewGame(f, chess.UseNotation(chess.UCINotation{}))
	sessionId := uuid.New().String()
	player.SessionId = sessionId
	session := Session{
		SessionId:         player.SessionId,
		Game:              game,
		IsAgainstComputer: true,
	}

	// make human player always have first move
	// so computer never needs logic to move first
	if session.whoseMoveIsIt() == "white" {
		player.Color = "white"
		computer.Color = "black"
		session.White = player
		session.Black = computer
	} else {
		player.Color = "black"
		computer.Color = "white"
		session.Black = player
		session.White = computer
	}
	computer.SessionId = session.SessionId

	player.Hub.InProgressSessions[session.SessionId] = &session
	sendJoinedMessages(&session)
}

func joinPendingGame(hub *Hub, player *Player) {
	var lobby *PendingLobby
	for key := range hub.AwaitingOpponentSessions {
		lobby = hub.AwaitingOpponentSessions[key]
		break
	}

	if lobby == nil || lobby.Player == nil {
		createNewLobby(hub, player)
		return
	}

	if lobby.Cancelled || lobby.Player.Connection == nil {
		if lobby.SessionId != "" {
			delete(hub.AwaitingOpponentSessions, lobby.SessionId)
		}
		createNewLobby(hub, player)
		return
	}

	creator := lobby.Player
	fen, err := getGameFEN()
	if err != nil {
		log.Println("Cannot get game fen: ", err)
		rejectJoiningPlayer(player)
		return
	}

	f, err := chess.FEN(fen)
	if err != nil {
		log.Println("Cannot parse game fen: ", err)
		rejectJoiningPlayer(player)
		return
	}

	game := chess.NewGame(f, chess.UseNotation(chess.UCINotation{}))
	session := &Session{
		SessionId: lobby.SessionId,
		Game:      game,
	}

	if rand.Intn(100) < 50 {
		session.White = creator
		session.Black = player
		creator.Color = "white"
		player.Color = "black"
	} else {
		session.White = player
		session.Black = creator
		creator.Color = "black"
		player.Color = "white"
	}

	creator.SessionId = session.SessionId
	player.SessionId = session.SessionId
	delete(hub.AwaitingOpponentSessions, lobby.SessionId)

	hub.InProgressSessions[session.SessionId] = session

	sendJoinedMessages(session)
}

func sendJoinedMessages(session *Session) {
	for _, player := range session.GetPlayers() {
		player.WriteChan <- sendGameJoinedMessage(session, player.Color)
	}
}

func rejectJoiningPlayer(player *Player) {
	if player.Connection != nil {
		_ = player.Connection.WriteControl(
			websocket.CloseMessage,
			websocket.FormatCloseMessage(
				websocket.CloseNormalClosure,
				"Unable to create game. Please try again.",
			),
			time.Now().Add(time.Second),
		)
		_ = player.Connection.Close()
	}
	if player.WriteChan != nil {
		close(player.WriteChan)
		player.WriteChan = nil
	}
}
