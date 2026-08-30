package game

import (
	"fmt"
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

type CachedPremove struct {
	Color string
	Move  Move
}

type Session struct {
	Game              *chess.Game
	White             *Player
	Black             *Player
	IsAgainstComputer bool
	SessionId         string
	PendingPremove    *CachedPremove
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

func (s *Session) playerForColor(color string) *Player {
	switch color {
	case "white":
		return s.White
	case "black":
		return s.Black
	default:
		return nil
	}
}

func (s *Session) setPendingPremove(color string, move Move) {
	s.PendingPremove = &CachedPremove{
		Color: color,
		Move:  move,
	}
}

func (s *Session) clearPendingPremove() {
	s.PendingPremove = nil
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
	temp := g.Clone()
	if err := temp.MoveStr(m.Move.From + m.Move.To); err != nil {
		return m.Move, err
	}

	return m.Move, nil
}

func tryPlayMoveForColor(move Move, g *chess.Game, color string) error {
	fenParts := strings.Split(g.Position().String(), " ")
	if len(fenParts) != 6 {
		return fmt.Errorf("invalid fen: %s", g.Position().String())
	}

	switch color {
	case "white":
		fenParts[1] = "w"
	case "black":
		fenParts[1] = "b"
	default:
		return fmt.Errorf("invalid color: %s", color)
	}

	fen, err := chess.FEN(strings.Join(fenParts, " "))
	if err != nil {
		return err
	}

	temp := chess.NewGame(fen, chess.UseNotation(chess.UCINotation{}))
	return temp.MoveStr(move.From + move.To)
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
	delay := time.Duration(rand.Intn(4001)+500) * time.Millisecond
	remaining := time.Duration(remainingSeconds * float64(time.Second))
	if remaining > 0 && delay > remaining {
		return remaining
	}

	return delay
}

var scheduleComputerMoveDelay = randomComputerDelay

func PlayComputer(player *Player, computer *Player) {
	defer func() {
		log.Println("Exiting PlayComputer")
	}()

	for {
		_, ok := <-computer.WriteChan
		if !ok {
			return
		}
	}
}
