package game

import (
	"fmt"
	"log"

	"github.com/google/uuid"
	"github.com/gorilla/websocket"
)

type Move struct {
	GameId string
	Data   []byte
}

type Player struct {
	GameId     string
	Connection *websocket.Conn
	Send       chan []byte
	Hub        *Hub
}

func (p *Player) Read() {
	defer func() {
		p.Connection.Close()
	}()

	for {
		_ /* messageType */, content, err := p.Connection.ReadMessage()
		if err != nil {
			log.Println(err)
			return
		}

		fmt.Println("content: ", string(content))
		p.Hub.Broadcast <- Move{GameId: p.GameId, Data: content}
	}
}

// func (p *Player) Write() {
// 	defer func() {
// 		p.Connection.Close()
// 	}()

// 	for {
// 		select {
// 		case message, ok := <-p.Send:
// 			if !ok {
// 				p.Connection.WriteMessage(websocket.CloseMessage, []byte{})
// 				return
// 			}

// 			w, err := p.Connection.NextWriter(websocket.TextMessage)
// 			if err != nil {
// 				return
// 			}
// 			w.Write(message)

// 			n := len(p.Send)
// 			for i := 0; i < n; i++ {
// 				w.Write([]byte{'\n'})
// 				w.Write(<-p.Send)
// 			}

// 			if err := w.Close(); err != nil {
// 				return
// 			}
// 		}
// 	}
// }

type Game struct {
	GameId string
	White  *Player
	Black  *Player
}

func (g *Game) GetPlayers() []*Player {
	return []*Player{g.White, g.Black}
}

type Hub struct {
	GamesInProgress       map[string]Game
	GamesAwaitingOpponent []Game
	Broadcast             chan Move
	Register              chan *Player
	Unregister            chan *Player
}

func NewHub() *Hub {
	return &Hub{
		Broadcast:             make(chan Move),
		Register:              make(chan *Player),
		Unregister:            make(chan *Player),
		GamesInProgress:       make(map[string]Game),
		GamesAwaitingOpponent: make([]Game, 0),
	}
}

func (h *Hub) Run() {
	for {
		select {
		case player := <-h.Register:
			// if os.Getenv("DEVELOPMENT") == "true" {
			// 	gameId := uuid.New().String()
			// 	game := Game{GameId: gameId, White: player}
			// 	player.GameId = gameId
			// 	fakePlayer := Player{
			// 		// Connection *websocket.Conn
			// 		Connection: &websocket.Conn{},
			// 		GameId:     game.GameId,
			// 		Hub:        player.Hub,
			// 		Send:       make(chan []byte),
			// 	}
			// 	game.Black = &fakePlayer
			// 	h.GamesAwaitingOpponent = make([]Game, 0)
			// 	h.GamesInProgress[game.GameId] = game
			// } else {
			// todo: randomize colors
			// if there are no games with only one player, make one
			if len(h.GamesAwaitingOpponent) == 0 {
				gameId := uuid.New().String()
				game := Game{GameId: gameId, White: player}
				player.GameId = gameId
				h.GamesAwaitingOpponent = append(h.GamesAwaitingOpponent, game)
				// otherwise, pair up with pending game and move to in progress
			} else {
				game := h.GamesAwaitingOpponent[0]
				game.Black = player
				player.GameId = game.GameId
				h.GamesAwaitingOpponent = make([]Game, 0)
				h.GamesInProgress[game.GameId] = game
			}
			// fmt.Println(h.GamesAwaitingOpponent)
			// fmt.Println(h.GamesInProgress)

			// }
		// todo: unregister
		case message := <-h.Broadcast:
			fmt.Println("message", message)
			game, ok := h.GamesInProgress[message.GameId]
			if !ok {
				if len(h.GamesAwaitingOpponent) == 0 {
					log.Printf("Invalid gameId; no pending games: %s\n", message.GameId)
					return
				}

				log.Printf("Game awaiting opponent; gameId: %s\n", message.GameId)
				return
			}
			if game.GameId == "" {
				log.Printf("Unknown gameId: %s\n", message.GameId)
				return
			}

			fmt.Println("in game???")
			for _, player := range game.GetPlayers() {
				select {
				case player.Send <- message.Data:
					fmt.Println("sending data to players")
				default:
					fmt.Println("default")
					close(player.Send) // panic: close of nil channel
					// delete(game, player) // todo
				}
			}
		}
	}
}
