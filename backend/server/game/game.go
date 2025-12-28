package game

import (
	"encoding/json"
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
	Game      *chess.Game
	White     *Player
	Black     *Player
	SessionId string
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

func tryPlayPremove(p *Move, g *chess.Game) (*Move, error) {
	// log.Println("premove: ", m)
	if err := g.MoveStr(p.From + p.To); err != nil {
		return p, err
	}

	return p, nil
}

func playPremove(m PremoveToServer, g *chess.Game) (Move, error) {
	// func tryPlayPremove(m PremoveToServer, g *chess.Game) (Move, error) {
	// log.Println("premove: ", m)
	if err := g.MoveStr(m.Premove.From + m.Premove.To); err != nil {
		return m.Premove, err
	}

	return m.Premove, nil
}

func checkGameOutcome(session *Session, player *Player) bool {
	isCheckmated := ""
	switch session.Game.Outcome() {
	case "0-1":
		isCheckmated = "white"
	case "1-0":
		isCheckmated = "black"
	}

	// log.Println("is checkmated", isCheckmated)
	if isCheckmated != "" {
		player.WriteChan <- sendGameOverMessage(session, "checkmate", isCheckmated)
		return true
	}

	return false
}

func PlayComputer(player *Player, computer *Player) {
	defer func() {
		log.Println("Exiting PlayComputer")
	}()

	for {
		select {
		case v := <-computer.WriteChan:
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
					// check for checkmate as well
					log.Println("OUTCOME, ", session.Game.Outcome())
					checkGameOutcome(session, player)
					delete(player.Hub.InProgressSessions, player.SessionId)
					close(computer.WriteChan)
					return
				}

				var premove *Move
				if player.CurrentPremove != nil {
					// if player.CurrentPremove != (Move{}) {
					log.Println("PREMOVE")
					// session.Game.Move(player.CurrentPremove)
					// player.CurrentPremove = nil
					if _premove, err := tryPlayPremove(player.CurrentPremove, session.Game); err != nil {
						log.Println("Cannot make premove: ", err)
						_premove = nil
					} else {
						premove = _premove
					}
				}

				if premove != nil {
					// do something
					log.Println("make premove and send new fen")
					return
				}

				moves := session.Game.ValidMoves()
				nextMove := moves[rand.Intn(len(moves))]
				session.Game.Move(nextMove)
				move := Move{
					From: nextMove.S1().String(),
					To:   nextMove.S2().String(),
				}

				hasOutcome := checkGameOutcome(session, player)
				if !hasOutcome {
					// player.WriteChan <- sendMoveMessage(session, player.Color, move)
					player.WriteChan <- func() []byte {

						log.Println("move", move)

						var message Message
						whiteTimeLeft, blackTimeLeft := session.getTimeLefts()

						message = Message{
							Type:              "MoveAcknowledgementFromServerType",
							SessionId:         session.SessionId,
							PlayerColor:       player.Color,
							TimeStamp:         time.Now().Format(time.RFC3339),
							IsAgainstComputer: session.isAgainstComputer(),
							Payload: MoveFromServer{
								Fen:        session.getFen(),
								ValidMoves: ValidMovesMap(session.Game),
								WhosNext:   session.whoseMoveIsIt(),
								// IsCheckmated:  isCheckmated,
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
					}()
				}

				go func() {
					c := session.White
					if player.Color == "white" {
						c = session.Black
					}

					t := time.Duration(rand.Intn(10000) * int(time.Millisecond))
					// t := time.Duration(rand.Intn(3000) * int(time.Millisecond))
					if c.Clock.TimeLeft-t.Seconds() <= 0 {
						t = time.Duration(c.Clock.TimeLeft * float64(time.Second))
					}
					time.Sleep(t)

					// Update clocks after computer makes its move
					updateClocks(session, false)

					// todo: how is this used?
					if c.Clock.TimeLeft <= 0 {
						player.WriteChan <- sendTimeoutMessage(session, player.Color, c.Color)
					} else {
						// isCheckmated := ""
						// switch session.Game.Outcome() {
						// case "0-1":
						// 	isCheckmated = "white"
						// case "1-0":
						// 	isCheckmated = "black"
						// }

						// // log.Println("is checkmated", isCheckmated)
						// if isCheckmated != "" {
						// 	player.WriteChan <- sendGameOverMessage(session, "checkmate", isCheckmated)
						// } else {
						// 	player.WriteChan <- sendMoveMessage(session, player.Color, move)
						// }

						hasOutcome := checkGameOutcome(session, player)
						if !hasOutcome {
							player.WriteChan <- sendMoveMessage(session, player.Color, move)
						}
					}
				}()
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
			if strings.Contains(value, "TryPremoveFromServerType") {
				log.Println("TryPremoveFromServerType")
				// implement here
				value := string(v)
				log.Println("premove value: ", value)
			}
		case <-time.After(time.Minute):
			close(computer.WriteChan)
			return
		}
	}
}
