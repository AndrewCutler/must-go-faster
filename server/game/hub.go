package game

import (
	"encoding/json"
	"fmt"
	"log"
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
			// todo: get starting position
			fen := "rnbqkbnr/pppp1ppp/4p3/8/6P1/5P2/PPPPP2P/RNBQKBNR b KQkq g3 0 2"
			// if there are no games with only one player, make one
			if len(*h.GamesAwaitingOpponent) == 0 {
				gameId := uuid.New().String()
				_fen, err := chess.FEN(fen)
				if err != nil {
					log.Println(err)
				}
				// game := chess.NewGame(chess.UseNotation(chess.UCINotation{}))
				game := chess.NewGame(_fen, chess.UseNotation(chess.UCINotation{}))
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

				if err := makeMove(string(message.Move.Data), game.Game); err != nil {
					log.Panicln(err)
					return
				}

				fmt.Println("Outcome: ", game.Game.Outcome())

				// if len(game.Game.MoveHistory()) > 0 {
				// 	for _, history := range game.Game.MoveHistory() {
				// 		fmt.Println(history)
				// 	}
				// }

				for _, player := range game.GetPlayers() {
					select {
					case player.Send <- moveMessage(game, player.Color):
					default:
						close(player.Send)
						// delete(game, player) // todo
					}
				}
			default:
				return
			}
		}
	}
}

func gameStartMessage(gameMeta *GameMeta, playerColor string) []byte {
	data := map[string]interface{}{
		"gameStarted": true,
		"fen":         gameMeta.getFen(),
		"gameId":      gameMeta.GameId,
		"playerColor": playerColor, // is this necessary
		"validMoves":  ValidMovesMap(gameMeta.Game),
		"whosNext":    gameMeta.whoseMoveIsIt(),
		"timeLeft":    gameMeta.getTimeRemaining(),
	}

	jsonData, err := json.Marshal(data)
	if err != nil {
		fmt.Println("Error converting message to JSON: ", err)
		return []byte{}
	}

	return jsonData
}

func moveMessage(gameMeta *GameMeta, playerColor string) []byte {
	isCheckmated := ""
	switch gameMeta.Game.Outcome() {
	case "0-1":
		isCheckmated = "white"
	case "1-0":
		isCheckmated = "black"
	}

	data := map[string]interface{}{
		"fen":          gameMeta.getFen(),
		"gameId":       gameMeta.GameId,
		"playerColor":  playerColor,
		"validMoves":   ValidMovesMap(gameMeta.Game),
		"whosNext":     gameMeta.whoseMoveIsIt(),
		"isCheckmated": isCheckmated,
		"timeLeft":     gameMeta.getTimeRemaining(),
	}

	jsonData, err := json.Marshal(data)
	if err != nil {
		fmt.Println("Error converting message to JSON: ", err)
		return []byte{}
	}

	return jsonData
}
