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
	Player       *Player
	OpponentType string
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
			h.onRegister(registration.Player, registration.OpponentType)
		case message, ok := <-h.ReadChan:
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

func (h *Hub) onRegister(player *Player, opponentType string) {
	// todo: randomize colors
	log.Println(opponentType)
	if opponentType == "computer" {
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
		player.Color = "white"
		session := Session{
			White:             player,
			SessionId:         sessionId,
			Game:              game,
			IsAgainstComputer: true,
		}
		h.InProgressSessions[session.SessionId] = &session

		log.Println("Broadcasting game joined for player", player.Color)
		player.WriteChan <- sendGameJoinedMessage(&session, player.Color)
		log.Println("Creating new pending game for player", player.Color)
	} else {
		if len(h.AwaitingOpponentSessions) == 0 {
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
			player.Color = "white"
			session := Session{
				White:     player,
				SessionId: sessionId,
				Game:      game,
			}
			h.AwaitingOpponentSessions[sessionId] = &session
			log.Println("Creating new pending game for player", player.Color)
		} else {
			// set session state to ready
			var session *Session
			for key := range h.AwaitingOpponentSessions {
				session = h.AwaitingOpponentSessions[key]
				break
			}
			session.Black = player
			player.SessionId = session.SessionId
			player.Color = "black"
			delete(h.AwaitingOpponentSessions, session.SessionId)
			h.InProgressSessions[session.SessionId] = session

			log.Println("Broadcasting game joined for player", player.Color)
			player.WriteChan <- sendGameJoinedMessage(session, player.Color)
			session.White.WriteChan <- sendGameJoinedMessage(session, session.White.Color)
		}
	}
}

func (h *Hub) onMessage(message Message) {
	log.Printf("onMessage message for player %s: %s\n", message.PlayerColor, message)
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
