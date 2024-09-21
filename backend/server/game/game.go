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

	for {
		select {
		case v := <-computer.WriteChan:
			value := string(v)

			log.Println("value: ", value)

			// lazy way to check message type
			if strings.Contains(value, "GameStartedToServerType") {
				log.Println("GameStartedToServerType")
			}
			if strings.Contains(value, "GameStartedFromServerType") {
				log.Println("GameStartedFromServerType")
			}
			if strings.Contains(value, "MoveFromServerType") {
				log.Println("MoveFromServerType")
				session, ok := player.Hub.InProgressSessions[player.SessionId]
				if !ok {
					log.Println("Cannot find session with id: ", player.SessionId)
					return
				}

				// create random move times, but weight towards faster moves
				// randomTimes := make([]time.Duration, time.Duration(rand.Intn(1000)+4000)*time.Millisecond)
				// for i := 0; i < 4; {
				// 	randomTimes = append(randomTimes, time.Duration(rand.Intn(3000))*time.Millisecond)
				// }
				// t := randomTimes[rand.Intn(len(randomTimes))]

				// stalemate doesn't work
				// computer doesn't play first move
				// premoved checkmate doesn't render in UI

				if session.Game.Outcome() != chess.NoOutcome {
					// handle stalemate here
					delete(player.Hub.InProgressSessions, player.SessionId)
					close(computer.WriteChan)
					return
				}

				moves := session.Game.ValidMoves()
				nextMove := moves[rand.Intn(len(moves))]
				session.Game.Move(nextMove)
				move := Move{
					From: nextMove.S1().String(),
					To:   nextMove.S2().String(),
				}

				t := time.Duration(rand.Intn(3000) * int(time.Millisecond))
				time.Sleep(t)

				player.WriteChan <- sendMoveMessage(session, player.Color, move)
			}
			if strings.Contains(value, "MoveToServerType") {
				log.Println("MoveToServerType")
			}
			if strings.Contains(value, "PremoveFromServerType") {
				log.Println("PremoveFromServerType")
			}
			if strings.Contains(value, "PremoveToServerType") {
				log.Println("PremoveToServerType")
			}
			if strings.Contains(value, "TimeoutFromServerType") {
				log.Println("TimeoutFromServerType")
			}
			if strings.Contains(value, "TimeoutToServerType") {
				log.Println("TimeoutToServerType")
			}
			if strings.Contains(value, "AbandonedFromServerType") {
				log.Println("AbandonedFromServerType")
			}
			if strings.Contains(value, "AbandonedToServerType") {
				log.Println("AbandonedToServerType")
			}
		case <-time.After(time.Minute):
			close(computer.WriteChan)
			return
		}
	}
}
