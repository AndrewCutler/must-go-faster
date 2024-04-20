package game

import (
	"encoding/json"
	"log"
	"strings"
	"time"

	"github.com/notnil/chess"
)

type Message struct {
	Move        Move
	MessageType int
}

type Move struct {
	// Timeout []byte
	GameId string
	Data   []byte
}

type GameMeta struct {
	Game   *chess.Game
	White  *Player
	Black  *Player
	GameId string
	Timer  time.Time
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

func (g *GameMeta) getTimeRemaining() float64 {
	gameTime, err := time.ParseDuration("30s")
	if err != nil {
		log.Println("Unable to create duration of 30s")
	} else {
		return (gameTime - time.Since(g.Timer)).Seconds()
	}

	return 0
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
