package game

import (
	"fmt"
	"log"
	"os"

	c "server/config"

	"github.com/google/uuid"
	"github.com/notnil/chess"
)

type Hub struct {
	GamesInProgress       map[string]*GameMeta
	GamesAwaitingOpponent map[string]*GameMeta
	Broadcast             chan Message
	Register              chan *Player
	Unregister            chan *Player
	Config                *c.ClientConfig
}

func NewHub(config *c.ClientConfig) *Hub {
	return &Hub{
		Broadcast:             make(chan Message),
		Register:              make(chan *Player),
		Unregister:            make(chan *Player),
		GamesInProgress:       make(map[string]*GameMeta),
		GamesAwaitingOpponent: make(map[string]*GameMeta),
		Config:                config,
	}
}

func (h *Hub) Run() {
	for {
		select {
		case player := <-h.Register:
			// todo: randomize colors
			// if there are no games with only one player, make one
			if len(h.GamesAwaitingOpponent) == 0 {
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
				h.GamesAwaitingOpponent[gameId] = &gameMeta
				fmt.Printf("Creating new pending game...\n")
				// otherwise, pair up with pending game and move to in progress
			} else {
				// set game state to ready
				var game *GameMeta
				for key := range h.GamesAwaitingOpponent {
					game = h.GamesAwaitingOpponent[key]
					break
				}
				// todo: timer for both colors.
				// should not start on Register,
				// but on receipt of GameStarted message from client
				// which indicates on-screen countdown finished
				// and play has begun
				// game.Timer = time.Now()
				game.Black = player
				player.GameId = game.GameId
				player.Color = "black"
				delete(h.GamesAwaitingOpponent, game.GameId)
				// h.GamesAwaitingOpponent = make(map[string]*GameMeta, 0)
				h.GamesInProgress[game.GameId] = game

				fmt.Println("broadcasting game started to white...")
				player.Send <- sendGameStartMessage(h.Config, game, player.Color)
				game.White.Send <- sendGameStartMessage(h.Config, game, game.White.Color)
			}
		// todo: unregister
		case message := <-h.Broadcast:
			switch message.MessageType {
			case 0:
				return
			case 1:
				// move this to "get game" func
				game, ok := h.GamesInProgress[message.Move.GameId]
				if !ok {
					if len(h.GamesAwaitingOpponent) == 0 {
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

				switch message.Move.Type {
				case "move":
					handleMoveMessage(h.Config, message, game)
				case "premove":
					handlePremoveMessage(message, game)
				case "timeout":
					handleTimeoutMessage(message, game)
				case "gameStarted":
					handleGameStartedMessage(message, game)
				default:
					log.Println("Unknown move type: ", message.Move.Type)
				}
			case 2:
				game, ok := h.GamesInProgress[message.Move.GameId]
				if !ok {
					if len(h.GamesAwaitingOpponent) == 0 {
						log.Printf("Invalid gameId; no pending games: %s\n", message.Move.GameId)
						return
					}
				}

				if game != nil {
					fmt.Println("GAME ABANDONED")
					handleAbandonedMessage(game)
				}
				delete(h.GamesInProgress, message.Move.GameId)
				delete(h.GamesAwaitingOpponent, message.Move.GameId)
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
		// testing with same game every time
		fileName := files[1].Name()
		// fileName := files[rand.Intn(len(files))].Name()
		file, err := os.Open(dir + "\\" + fileName)
		if err != nil {
			return "", err
		}

		pgn, err := chess.PGN(file)
		if err != nil {
			return "", err
		}

		game := chess.NewGame(pgn)
		moveLength := len(game.MoveHistory())

		// only use games of at least 20 full moves
		if moveLength > 40 {
			isGameAcceptable = true
			result = game.MoveHistory()[moveLength-20].PrePosition.String()
		}
	}

	return result, nil
}
