package game

import (
	"encoding/json"

	"github.com/notnil/chess"
)

type Message struct {
	Move        Move
	MessageType int
}

type Move struct {
	GameId string
	Data   []byte
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

func makeMove(m string, g *chess.Game) error {
	type move struct {
		Move struct {
			From string `json:"from"`
			To   string `json:"to"`
		}
		GameId string `json:"gameId"`
	}
	var result move

	if err := json.Unmarshal([]byte(m), &result); err != nil {
		return err
	}

	if err := g.MoveStr(result.Move.From + result.Move.To); err != nil {
		return err
	}

	return nil
}
