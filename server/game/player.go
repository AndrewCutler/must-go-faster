package game

import (
	"fmt"
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
