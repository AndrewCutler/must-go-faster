package utils

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
	// GameId     string
	Connection *websocket.Conn
	Send       chan []byte
	Hub        *Hub
}

func (p *Player) Read() {
	defer func() {
		p.Connection.Close()
	}()

	for {
		messageType, content, err := p.Connection.ReadMessage()
		if err != nil {
			log.Println(err)
			return
		}

		fmt.Println("content: ", string(content))

		// this response shows up on client
		if err := p.Connection.WriteMessage(messageType, []byte("test message")); err != nil {
			log.Println(err)
			return
		}
	}
}

func (p *Player) Write() {
	defer func() {
		p.Connection.Close()
	}()

	for {
		select {
		case message, ok := <-p.Send:
			fmt.Printf("Write message: %s\n", message)
			if !ok {
				p.Connection.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}

			w, err := p.Connection.NextWriter(websocket.TextMessage)
			if err != nil {
				return
			}
			w.Write(message)

			n := len(p.Send)
			for i := 0; i < n; i++ {
				w.Write([]byte{'\n'})
				w.Write(<-p.Send)
			}

			if err := w.Close(); err != nil {
				return
			}
		}
	}

}

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
			// todo: randomize colors
			// if there are no games with only one player, make one
			if len(h.GamesAwaitingOpponent) == 0 {
				gameId := uuid.New().String()
				game := Game{GameId: gameId, White: player}
				h.GamesAwaitingOpponent = append(h.GamesAwaitingOpponent, game)
				// otherwise, pair up with pending game and move to in progress
			} else {
				game := h.GamesAwaitingOpponent[0]
				game.Black = player
				h.GamesAwaitingOpponent = make([]Game, 0)
				h.GamesInProgress[game.GameId] = game
			}
			fmt.Println(h.GamesAwaitingOpponent)
			fmt.Println(h.GamesInProgress)
			// fmt.Printf("register player gameId %s\n", player.GameId)
			// game := h.GamesAwaitingOpponent[0]
			// if game.Black == nil && game.White == nil {
			// 	game.White = player
			// } else {
			// 	game.Black = player
			// 	h.GamesInProgress[game.GameId] = game
			// }
			// game := h.GamesInProgress[player.GameId]
			// if game == nil {
			// 	game = make(map[*Player]bool)
			// 	h.GamesInProgress[player.GameId] = game
			// }
			// game[player] = true
		case message := <-h.Broadcast:
			fmt.Printf("Message: %s\n", message.Data)
			game := h.GamesInProgress[message.GameId]
			if game.GameId == "" {
				log.Printf("Unknown gameId: %s\n", message.GameId)
			}

			for _, player := range game.GetPlayers() {
				select {
				case player.Send <- message.Data:
				default:
					close(player.Send)
					// delete(game, player) // todo
				}
			}
			fmt.Println("message", message)
		}
	}
}

// func (h *Hub) JoinGame() string {
// 	if len(h.GamesAwaitingOpponent) == 0 {
// 		gameId := uuid.New().String()
// 		h.GamesAwaitingOpponent = append(h.GamesAwaitingOpponent, )
// 		// h.GamesAwaitingOpponent = append(h.GamesAwaitingOpponent, )
// 		return gameId
// 	} else {

// 	}
// }
