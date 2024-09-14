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
	return s.White.IsComputer || s.Black.IsComputer
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
