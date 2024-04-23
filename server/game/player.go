package game

import (
	"log"

	"github.com/gorilla/websocket"
)

type Player struct {
	GameId     string
	Connection *websocket.Conn
	Send       chan []byte
	Hub        *Hub
	Color      string
}

func (p *Player) ReadMessage() {
	defer func() {
		p.Connection.Close()
	}()

	for {
		// MessageType: 1, TextMessage
		// MessageType: 2, GoingAwayMessage
		_, content, err := p.Connection.ReadMessage()
		if websocket.IsCloseError(err, websocket.CloseGoingAway) {
			p.Hub.Broadcast <- Message{Move: Move{GameId: p.GameId}, MessageType: 2}
			// game is over, send game abandoned message to winner and remove from active games
			return
		}
		if err != nil {
			log.Println("Cannot read message: ", err)
			return
		}

		p.Hub.Broadcast <- Message{Move: Move{GameId: p.GameId, Data: content}, MessageType: 1}
	}
}

func (p *Player) WriteMessage() {
	defer func() {
		p.Connection.Close()
	}()

	for message := range p.Send {
		writer, err := p.Connection.NextWriter(websocket.TextMessage)
		if err != nil {
			return
		}
		writer.Write(message)

		n := len(p.Send)
		for i := 0; i < n; i++ {
			writer.Write([]byte{'\n'})
			writer.Write(<-p.Send)
		}

		if err := writer.Close(); err != nil {
			log.Println("Failed to close writer: ", err)
			return
		}
	}
}
