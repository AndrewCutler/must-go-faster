package game

import (
	"log"
	"strings"

	"github.com/notnil/chess"
)

type Move struct {
	From string `json:"from"`
	To   string `json:"to"`
}

type Session struct {
	Game              *chess.Game
	White             *Player
	Black             *Player
	IsAgainstComputer bool
	SessionId         string
}

func (s *Session) GetComputer() Player {
	if s.White != nil && s.White.IsComputer {
		return *s.White
	}

	if s.Black != nil && s.Black.IsComputer {
		return *s.Black
	}

	// todo: nil check
	return Player{}
}

func (s *Session) getFen() string {
	fen := s.Game.Position().String()

	return fen
}

func (s *Session) isAgainstComputer() bool {
	return (s.White != nil && s.White.IsComputer) || (s.Black != nil && s.Black.IsComputer)
}

func (s *Session) getTimeLefts() (float64, float64) {
	return s.White.Clock.TimeLeft, s.Black.Clock.TimeLeft
}

func (s *Session) GetPlayers() []*Player {
	var players []*Player

	if s.White != nil {
		players = append(players, s.White)
	}
	if s.Black != nil {
		players = append(players, s.Black)
	}

	return players
}

func (s *Session) whoseMoveIsIt() string {
	split := strings.Split(s.getFen(), " ")
	if len(split) == 6 {
		switch split[1] {
		case "w":
			return "white"
		case "b":
			return "black"
		default:
			return ""
		}
	}

	return ""
}

func ValidMovesMap(g *chess.Game) map[string][]string {
	validMoves := g.ValidMoves()
	result := make(map[string][]string)
	for _, move := range validMoves {
		originatingSquare := move.S1()
		destinationSquare := move.S2()
		result[originatingSquare.String()] = append(result[originatingSquare.String()], destinationSquare.String())
	}

	return result
}

func tryPlayMove(m MoveToServer, g *chess.Game) (Move, error) {
	log.Println("move: ", m)
	if err := g.MoveStr(m.Move.From + m.Move.To); err != nil {
		return m.Move, err
	}

	return m.Move, nil
}

func tryPlayPremove(m PremoveToServer, g *chess.Game) (Move, error) {
	log.Println("premove: ", m)
	if err := g.MoveStr(m.Premove.From + m.Premove.To); err != nil {
		return m.Premove, err
	}

	return m.Premove, nil
}

func PlayComputer(player *Player, computer *Player) {
	defer func() {
		log.Println("Exiting PlayComputer")
	}()

	for v := range computer.WriteChan {
		log.Println("message: ", string(v))
		value := string(v)

		if value == "start" {
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

			log.Println("Broadcasting game joined for computer player", player.Color)
			player.WriteChan <- sendGameJoinedMessage(&session, player.Color)
		}
	}

	// select {
	// case <-session.GetComputer().WriteChan:
	// 	log.Println("Message sent to computer player")
	// 	// TODO: add conditions such that this does not run infinitely.
	// 	// e.g. channels for GameStartedWithComputer, MoveToComputer, etc.
	// 	// start game
	// 	// if player.SessionId == "" {
	// 	// 	player.SessionId = uuid.New().String()
	// 	// }
	// 	// session := player.Hub.InProgressSessions[player.SessionId]
	// 	// if session == nil {
	// 	// 	log.Println("No session with id ", player.SessionId)
	// 	// 	fen, err := getGameFEN()
	// 	// 	if err != nil {
	// 	// 		log.Println("Cannot get game fen: ", err)
	// 	// 		return
	// 	// 	}

	// 	// 	f, err := chess.FEN(fen)
	// 	// 	if err != nil {
	// 	// 		log.Println("Cannot parse game fen: ", err)
	// 	// 		return
	// 	// 	}

	// 	// 	game := chess.NewGame(f, chess.UseNotation(chess.UCINotation{}))
	// 	// 	session := Session{
	// 	// 		SessionId: player.SessionId,
	// 	// 		Game:      game,
	// 	// 	}
	// 	// 	computer := &Player{Hub: player.Hub, WriteChan: make(chan []byte), IsComputer: true}

	// 	// 	if player.Color == "white" {
	// 	// 		computer.Color = "black"
	// 	// 		session.White = player
	// 	// 		session.Black = computer
	// 	// 	} else {
	// 	// 		computer.Color = "white"
	// 	// 		session.Black = player
	// 	// 		session.White = computer
	// 	// 	}
	// 	// 	computer.SessionId = session.SessionId
	// 	// 	player.Computer = computer

	// 	// 	player.Hub.InProgressSessions[session.SessionId] = &session

	// 	// 	log.Println("Broadcasting game joined for computer player", player.Color)
	// 	// 	player.Connection.WriteMessage(websocket.TextMessage, sendGameJoinedMessage(&session, player.Color))
	// 	// } else {
	// 	if session.whoseMoveIsIt() != player.Color {
	// 		log.Println("sending computer move...")
	// 		time.Sleep(3 * time.Second)

	// 		moves := session.Game.ValidMoves()
	// 		move := moves[rand.Intn(len(moves))]
	// 		session.Game.Move(move)
	// 		_move := Move{From: move.S1().String(), To: move.S2().String()}
	// 		player.Connection.WriteMessage(websocket.TextMessage, sendMoveMessage(session, player.Color, _move))
	// 	}
	// 	// }
	// default:
	// 	log.Println("default PlayComputer")
	// }
	// }
}
