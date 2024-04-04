package game

import (
	"encoding/json"
	"fmt"
	"log"

	"github.com/google/uuid"
	"github.com/gorilla/websocket"
)

type Message struct {
	Move    Move
	Message string
	// todo: not this
	// 0 = Game Started, 1 = Move
	MessageType int
}

type Move struct {
	GameId string
	Data   []byte
}

type Player struct {
	GameId     string
	Connection *websocket.Conn
	Send       chan []byte
	Hub        *Hub
	Color      string
}

func (p *Player) Read() {
	defer func() {
		p.Connection.Close()
	}()

	for {
		// // TextMessage denotes a text data message. The text message payload is
		// // interpreted as UTF-8 encoded text data.
		// TextMessage = 1

		// // BinaryMessage denotes a binary data message.
		// BinaryMessage = 2

		// // CloseMessage denotes a close control message. The optional message
		// // payload contains a numeric code and text. Use the FormatCloseMessage
		// // function to format a close message payload.
		// CloseMessage = 8

		// // PingMessage denotes a ping control message. The optional message payload
		// // is UTF-8 encoded text.
		// PingMessage = 9

		// // PongMessage denotes a pong control message. The optional message payload
		// // is UTF-8 encoded text.
		// PongMessage = 10
		_ /* messageType */, content, err := p.Connection.ReadMessage()
		if err != nil {
			log.Println(err)
			return
		}

		fmt.Println("content: ", string(content))
		p.Hub.Broadcast <- Message{Move: Move{GameId: p.GameId, Data: content}, MessageType: 1}
	}
}

func (p *Player) Write() {
	defer func() {
		p.Connection.Close()
	}()

	for message := range p.Send {
		fmt.Printf("message in Send for player %s: %s\n\n", p.Color, string(message))
		// if !ok {
		// 	p.Connection.WriteMessage(websocket.CloseMessage, []byte{})
		// 	return
		// }

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

type Game struct {
	GameId string
	Fen    string
	White  *Player
	Black  *Player
}

func (g *Game) GetPlayers() []*Player {
	return []*Player{g.White, g.Black}
}

type Hub struct {
	GamesInProgress       map[string]Game
	GamesAwaitingOpponent []Game
	Broadcast             chan Message
	Register              chan *Player
	Unregister            chan *Player
}

func NewHub() *Hub {
	return &Hub{
		Broadcast:             make(chan Message),
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
			// todo: get starting position
			// testing: 8/7R/1P6/2K3p1/2P3k1/7p/1r6/8 b - - 1 63
			fen := "8/7R/1P6/2K3p1/2P3k1/7p/1r6/8 b - - 1 63"
			// if there are no games with only one player, make one
			if len(h.GamesAwaitingOpponent) == 0 {
				gameId := uuid.New().String()
				game := Game{GameId: gameId, White: player, Fen: fen}
				player.GameId = gameId
				player.Color = "white"
				h.GamesAwaitingOpponent = append(h.GamesAwaitingOpponent, game)
				// otherwise, pair up with pending game and move to in progress
			} else {
				// set game state to ready
				game := h.GamesAwaitingOpponent[0]
				game.Black = player
				player.GameId = game.GameId
				player.Color = "black"
				h.GamesAwaitingOpponent = make([]Game, 0)
				fmt.Println("broadcasting game started to white...")
				blackMessage := formatGameStartMessage(game.Fen, "black")
				whiteMessage := formatGameStartMessage(game.Fen, "white")
				player.Send <- blackMessage
				game.White.Send <- whiteMessage
			}
			// fmt.Println(h.GamesAwaitingOpponent)
			// fmt.Println(h.GamesInProgress)

			// }
		// todo: unregister
		case message := <-h.Broadcast:
			fmt.Printf("message in Broadcast of type %d", message.MessageType)
			switch message.MessageType {
			case 0:
				fmt.Println("case 0: game started")
				return
			case 1:
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
					log.Printf("Unknown gameId: %s\n", message.Move.GameId)
					return
				}

				_message := formatMoveMessage(message.Move.Data, game.Fen)

				for _, player := range game.GetPlayers() {
					select {
					case player.Send <- _message:
					default:
						fmt.Println("default")
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

func formatGameStartMessage(fen string, playerColor string) []byte {
	data := map[string]interface{}{
		"gameStarted": true,
		"fen":         fen,
		"color":       playerColor,
	}

	jsonData, err := json.Marshal(data)
	if err != nil {
		fmt.Println("Error converting message to JSON: ", err)
		return []byte{}
	}

	return jsonData
}

func formatMoveMessage(moveData []byte, fen string) []byte {
	data := map[string]interface{}{
		"move": string(moveData),
		"fen":  fen,
	}

	jsonData, err := json.Marshal(data)
	if err != nil {
		fmt.Println("Error converting message to JSON: ", err)
		return []byte{}
	}

	return jsonData
}
