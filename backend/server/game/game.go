package game

import (
	"log"
	"math/rand"
	"strings"
	"time"

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
	// log.Println("move: ", m)
	if err := g.MoveStr(m.Move.From + m.Move.To); err != nil {
		return m.Move, err
	}

	return m.Move, nil
}

func tryPlayPremove(m PremoveToServer, g *chess.Game) (Move, error) {
	// log.Println("premove: ", m)
	if err := g.MoveStr(m.Premove.From + m.Premove.To); err != nil {
		return m.Premove, err
	}

	return m.Premove, nil
}

func normalizeStartingFEN(fen string) string {
	parts := strings.Split(fen, " ")
	if len(parts) != 6 {
		return fen
	}

	parts[4] = "0"
	return strings.Join(parts, " ")
}

func randomComputerDelay(remainingSeconds float64) time.Duration {
	delay := time.Duration(rand.Intn(7001)+500) * time.Millisecond
	remaining := time.Duration(remainingSeconds * float64(time.Second))
	if remaining > 0 && delay > remaining {
		return remaining
	}

	return delay
}

func PlayComputer(player *Player, computer *Player) {
	defer func() {
		log.Println("Exiting PlayComputer")
	}()

	for {
		select {
		case v, ok := <-computer.WriteChan:
			if !ok {
				return
			}
			value := string(v)

			// log.Println("value: ", value)

			// lazy way to check message type
			// if strings.Contains(value, "GameStartedToServerType") {
			// 	log.Println("GameStartedToServerType")
			// }
			// if strings.Contains(value, "GameStartedFromServerType") {
			// 	log.Println("GameStartedFromServerType")
			// }
			if strings.Contains(value, "MoveFromServerType") {
				session, ok := player.Hub.InProgressSessions[player.SessionId]
				if !ok {
					return
				}

				if session.Game.Outcome() != chess.NoOutcome {
					delete(player.Hub.InProgressSessions, player.SessionId)
					if computer.WriteChan != nil {
						close(computer.WriteChan)
						computer.WriteChan = nil
					}
					return
				}

				moves := session.Game.ValidMoves()
				if len(moves) == 0 {
					return
				}
				nextMove := moves[rand.Intn(len(moves))]

				c := session.White
				if player.Color == "white" {
					c = session.Black
				}

				delay := randomComputerDelay(c.Clock.TimeLeft)
				time.Sleep(delay)

				session, ok = player.Hub.InProgressSessions[player.SessionId]
				if !ok {
					return
				}

				if session.Game.Outcome() != chess.NoOutcome {
					delete(player.Hub.InProgressSessions, player.SessionId)
					if computer.WriteChan != nil {
						close(computer.WriteChan)
						computer.WriteChan = nil
					}
					return
				}

				updateClocks(session)

				if c.Clock.TimeLeft <= 0 {
					player.WriteChan <- sendTimeoutMessage(session, player.Color, c.Color)
					continue
				}

				session.Game.Move(nextMove)
				move := Move{
					From: nextMove.S1().String(),
					To:   nextMove.S2().String(),
				}

				player.WriteChan <- sendMoveMessage(session, player.Color, move)
			}
			// if strings.Contains(value, "MoveToServerType") {
			// 	log.Println("MoveToServerType")
			// }
			// if strings.Contains(value, "PremoveFromServerType") {
			// 	log.Println("PremoveFromServerType")
			// }
			// if strings.Contains(value, "PremoveToServerType") {
			// 	log.Println("PremoveToServerType")
			// }
			// if strings.Contains(value, "TimeoutFromServerType") {
			// 	log.Println("TimeoutFromServerType")
			// }
			// if strings.Contains(value, "TimeoutToServerType") {
			// 	log.Println("TimeoutToServerType")
			// }
			// if strings.Contains(value, "AbandonedFromServerType") {
			// 	log.Println("AbandonedFromServerType")
			// }
			// if strings.Contains(value, "AbandonedToServerType") {
			// 	log.Println("AbandonedToServerType")
			// }
		case <-time.After(time.Minute):
			if computer.WriteChan != nil {
				close(computer.WriteChan)
				computer.WriteChan = nil
			}
			return
		}
	}
}
