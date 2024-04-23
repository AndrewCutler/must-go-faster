package game

import (
	"encoding/json"
	"fmt"
	"log"
	"math/rand"
	"os"
	"time"

	"github.com/google/uuid"
	"github.com/notnil/chess"
)

type Hub struct {
	GamesInProgress       map[string]*GameMeta
	GamesAwaitingOpponent *[]*GameMeta
	Broadcast             chan Message
	Register              chan *Player
	Unregister            chan *Player
}

func NewHub() *Hub {
	gao := make([]*GameMeta, 0)
	return &Hub{
		Broadcast:             make(chan Message),
		Register:              make(chan *Player),
		Unregister:            make(chan *Player),
		GamesInProgress:       make(map[string]*GameMeta),
		GamesAwaitingOpponent: &gao,
	}
}

func (h *Hub) Run() {
	for {
		select {
		case player := <-h.Register:
			// todo: randomize colors
			// if there are no games with only one player, make one
			if len(*h.GamesAwaitingOpponent) == 0 {
				fen, err := getGameFEN()
				if err != nil {
					log.Println("Cannot get game fen: ", err)
					return
				}

				f, err := chess.FEN(fen)
				if err != nil {
					log.Println("Cannot parse game fen: ", err)
					return
				}

				gameId := uuid.New().String()
				game := chess.NewGame(f, chess.UseNotation(chess.UCINotation{}))
				player.GameId = gameId
				player.Color = "white"
				gameMeta := GameMeta{
					Game:   game,
					White:  player,
					GameId: gameId,
				}
				*h.GamesAwaitingOpponent = append(*h.GamesAwaitingOpponent, &gameMeta)
				fmt.Printf("Creating new pending game...\n")
				// otherwise, pair up with pending game and move to in progress
			} else {
				// set game state to ready
				game := (*h.GamesAwaitingOpponent)[0]
				game.Timer = time.Now()
				game.Black = player
				player.GameId = game.GameId
				player.Color = "black"
				*h.GamesAwaitingOpponent = make([]*GameMeta, 0)
				h.GamesInProgress[game.GameId] = game

				fmt.Println("broadcasting game started to white...")
				player.Send <- gameStartMessage(game, player.Color)
				game.White.Send <- gameStartMessage(game, game.White.Color)
			}
		// todo: unregister
		case message := <-h.Broadcast:
			switch message.MessageType {
			case 0:
				return
			case 1:
				game, ok := h.GamesInProgress[message.Move.GameId]
				if !ok {
					if len(*h.GamesAwaitingOpponent) == 0 {
						log.Printf("Invalid gameId; no pending games: %s\n", message.Move.GameId)
						return
					}

					log.Printf("Game awaiting opponent; gameId: %s\n", message.Move.GameId)
					return
				}

				if game.GameId == "" {
					log.Printf("Missing gameId.")
					return
				}

				timeout := handleTimeout(message, game)
				if timeout {
					return
				}

				handleMove(message, game)
			case 2:
				game, ok := h.GamesInProgress[message.Move.GameId]
				if !ok {
					if len(*h.GamesAwaitingOpponent) == 0 {
						log.Printf("Invalid gameId; no pending games: %s\n", message.Move.GameId)
						return
					}
				}

				handleAbandoned(game)
				delete(h.GamesInProgress, message.Move.GameId)
			default:
				log.Println("Broadcast default case reached.")
				return
			}
		}
	}
}

// todo: consider using https://github.com/notnil/chess?tab=readme-ov-file#scan-pgn
func getGameFEN() (string, error) {
	// todo: grab from database or something
	dir := "./pgns"
	files, err := os.ReadDir(dir)
	if err != nil {
		return "", err
	}

	var result string
	var isGameAcceptable bool
	for !isGameAcceptable {
		fileName := files[rand.Intn(len(files))].Name()
		file, err := os.Open(dir + "\\" + fileName)
		if err != nil {
			return "", err
		}

		pgn, err := chess.PGN(file)
		if err != nil {
			return "", err
		}

		game := chess.NewGame(pgn)
		fmt.Println(fileName)
		fmt.Println(game.Position().String())
		fmt.Println(game.Outcome())

		moveLength := len(game.MoveHistory())
		fmt.Println(moveLength)

		// only use games of at least 20 full moves
		if moveLength > 40 {
			isGameAcceptable = true
			result = game.MoveHistory()[moveLength-20].PrePosition.String()
		}
	}

	return result, nil
}

func handleAbandoned(game *GameMeta) {
	fmt.Println("handle abandoned")
}

func handleTimeout(message Message, game *GameMeta) bool {
	type TimeoutRequest struct {
		Timeout     bool   `json:"timeout"`
		PlayerColor string `json:"playerColor"`
	}
	var timeout TimeoutRequest
	err := json.Unmarshal(message.Move.Data, &timeout)
	if err != nil {
		fmt.Println(err)
		return true
	}

	if timeout.Timeout {
		for _, player := range game.GetPlayers() {
			m := timeoutMessage(game, player.Color, game.whoseMoveIsIt())
			select {
			case player.Send <- m:
			default:
				close(player.Send)
			}
		}

		return true
	}

	return false
}

func handleMove(message Message, game *GameMeta) {
	if err := makeMove(string(message.Move.Data), game.Game); err != nil {
		log.Panicln("Cannot make move: ", err)
		return
	}

	for _, player := range game.GetPlayers() {
		select {
		case player.Send <- moveMessage(game, player.Color):
		default:
			close(player.Send)
		}
	}
}
