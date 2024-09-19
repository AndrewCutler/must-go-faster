package game

import (
	"log"
	"math/rand"
	"os"
	"path/filepath"

	"github.com/google/uuid"
	"github.com/notnil/chess"
)

type Registration struct {
	Player   *Player
	Computer *Player
}

type Hub struct {
	InProgressSessions       map[string]*Session
	AwaitingOpponentSessions map[string]*Session
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
		AwaitingOpponentSessions: make(map[string]*Session),
	}
}

func (h *Hub) Run() {
	for {
		select {
		case registration := <-h.RegisterChan:
			h.onRegister(registration.Player, registration.Computer)
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
		}
	}
}

func (h *Hub) onRegister(player *Player, computer *Player) {
	if computer != nil {
		joinComputerGame(player, computer)
	} else {
		if len(h.AwaitingOpponentSessions) == 0 {
			createNewGame(h, player)
		} else {
			joinPendingGame(h, player)
		}
	}
}

func (h *Hub) onMessage(message Message) {
	// todo: lots of fields on message that may or may not be unnecessary
	log.Println("onMessage message: ", message)
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

	if player.Color == "white" {
		computer.Color = "black"
		session.White = player
		session.Black = computer
	} else {
		computer.Color = "white"
		session.Black = player
		session.White = computer
	}
	computer.SessionId = session.SessionId

	player.Hub.InProgressSessions[session.SessionId] = &session

	log.Println("Broadcasting game joined for player", player.Color)
	player.WriteChan <- sendGameJoinedMessage(&session, player.Color)
	log.Println("Broadcasting game joined for computer player", computer.Color)
	computer.WriteChan <- sendGameJoinedMessage(&session, computer.Color)
}

func createNewGame(hub *Hub, player *Player) {
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
		SessionId: sessionId,
		Game:      game,
	}
	if player.Color == "white" {
		session.White = player
	} else {
		session.Black = player
	}
	hub.AwaitingOpponentSessions[sessionId] = &session
	log.Println("Creating new pending game for player", player.Color)
}

func joinPendingGame(hub *Hub, player *Player) {
	var session *Session
	for key := range hub.AwaitingOpponentSessions {
		session = hub.AwaitingOpponentSessions[key]
		break
	}

	player.SessionId = session.SessionId
	if session.Black == nil {
		session.Black = player
		player.Color = "black"
	} else {
		session.White = player
		player.Color = "white"
	}
	delete(hub.AwaitingOpponentSessions, session.SessionId)
	hub.InProgressSessions[session.SessionId] = session

	log.Println("Broadcasting game joined for player", player.Color)
	player.WriteChan <- sendGameJoinedMessage(session, player.Color)
	if player.Color == "white" {
		session.Black.WriteChan <- sendGameJoinedMessage(session, session.Black.Color)
	} else {
		session.White.WriteChan <- sendGameJoinedMessage(session, session.White.Color)
	}
}
