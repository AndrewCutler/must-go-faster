package game

import (
	"encoding/json"
	"fmt"
	"log"
	c "server/config"
	"strings"
	"time"

	"github.com/notnil/chess"
)

type Message struct {
	Premove     Move
	Move        Move
	MessageType int
}

type Move struct {
	Type   string // 'move' || 'premove' || 'timeout'
	GameId string
	Data   []byte
}

type GameMeta struct {
	Game           *chess.Game
	White          *Player
	Black          *Player
	GameId         string
	Timer          time.Time
	CurrentPremove string // todo: premove type
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

func (g *GameMeta) getTimeRemaining(config *c.ClientConfig) float64 {
	gameTime, err := time.ParseDuration(fmt.Sprintf("%ds", config.StartingTime))
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

func parseMove(m string, g *chess.Game) (bool, error) {
	type move struct {
		Move struct {
			From string `json:"from"`
			To   string `json:"to"`
		}
		GameId string `json:"gameId"`
	}
	var result move

	if err := json.Unmarshal([]byte(m), &result); err != nil {
		return false, nil
	}

	if err := g.MoveStr(result.Move.From + result.Move.To); err != nil {
		return false, err
	}

	log.Println("move: ", result)
	return true, nil
}

func parsePremove(m string, g *chess.Game) (bool, error) {
	type premove struct {
		Premove struct {
			From string `json:"from"`
			To   string `json:"to"`
		}
		GameId string `json:"gameId"`
	}
	var result premove

	if err := json.Unmarshal([]byte(m), &result); err != nil {
		return false, nil
	}

	if err := g.MoveStr(result.Premove.From + result.Premove.To); err != nil {
		return false, err
	}

	log.Println("premove: ", result)
	return true, nil
}

func parseTimeout(m string, g *chess.Game) bool {
	type timeout struct {
		Timeout     bool   `json:"timeout"`
		PlayerColor string `json:"playerColor"`
	}
	var result timeout

	if err := json.Unmarshal([]byte(m), &result); err != nil {
		return false
	}
	// timeout: {false }
	log.Println("timeout: ", result)
	return true
}
