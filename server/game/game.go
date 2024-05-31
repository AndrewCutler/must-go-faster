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

type GameMeta struct {
	Game   *chess.Game
	White  *Player
	Black  *Player
	GameId string
}

func (g *GameMeta) getFen() string {
	fen := g.Game.Position().String()

	return fen
}

func (g *GameMeta) GetPlayers() []*Player {
	return []*Player{g.White, g.Black}
}

func (g *GameMeta) whoseMoveIsIt() string {
	split := strings.Split(g.getFen(), " ")
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

func tryPlayMove(m MoveToServer, g *chess.Game) error {
	log.Println("move: ", m)
	if err := g.MoveStr(m.Move.From + m.Move.To); err != nil {
		return err
	}

	return nil
}

func tryPlayPremove(m PremoveToServer, g *chess.Game) error {
	log.Println("premove: ", m)
	if err := g.MoveStr(m.Premove.From + m.Premove.To); err != nil {
		return err
	}

	return nil
}
