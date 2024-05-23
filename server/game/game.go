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
	Type   string // 'move' || 'premove' || 'timeout' || 'gameStarted'
	GameId string
	Data   []byte
}

type Timer struct {
	WhosNext     string // 'white' || 'black'
	LastMoveTime time.Time
}

func (t *Timer) GetTimeLeft(lastMoveTime time.Time, config *c.ClientConfig) {
	gameTime, err := time.ParseDuration(fmt.Sprintf("%ds", config.StartingTime))
	if err != nil {
		log.Println("Unable to create duration of 30s")
	} else {
		x := (gameTime - time.Since(lastMoveTime)).Seconds()
		fmt.Println(x)
	}
}

type GameMeta struct {
	Game   *chess.Game
	White  *Player
	Black  *Player
	GameId string
	// Timer          time.Time
	CurrentPremove string // todo: premove type
	LastMoveTime   time.Time
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

// todo: separate timeLeft for each color
func (g *GameMeta) getTimeLeft(config *c.ClientConfig) (float64, float64) {
	gameTime, err := time.ParseDuration(fmt.Sprintf("%ds", config.StartingTime))
	if err != nil {
		log.Println("Unable to create duration of 30s")
		return 0, 0
	} else {
		whiteTimeLeft := (gameTime - time.Since(g.White.Timer)).Seconds()
		blackTimeLeft := (gameTime - time.Since(g.Black.Timer)).Seconds()
		return whiteTimeLeft, blackTimeLeft
	}
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

func parseMove(m string, g *chess.Game) error {
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

	log.Println("move: ", result)
	return nil
}

func parsePremove(m string, g *chess.Game) error {
	type premove struct {
		Premove struct {
			From string `json:"from"`
			To   string `json:"to"`
		}
		GameId string `json:"gameId"`
	}
	var result premove

	if err := json.Unmarshal([]byte(m), &result); err != nil {
		return err
	}

	if err := g.MoveStr(result.Premove.From + result.Premove.To); err != nil {
		return err
	}

	log.Println("premove: ", result)
	return nil
}

func parseTimeout(m string, g *chess.Game) error {
	type timeout struct {
		Timeout     bool   `json:"timeout"`
		PlayerColor string `json:"playerColor"`
	}
	var result timeout

	if err := json.Unmarshal([]byte(m), &result); err != nil {
		return err
	}

	log.Println("timeout: ", result)
	return nil
}
