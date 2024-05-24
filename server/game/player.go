package game

import (
	"encoding/json"
	"log"
	"time"

	"github.com/gorilla/websocket"
)

type Player struct {
	GameId     string
	Connection *websocket.Conn
	SendChan   chan []byte
	Hub        *Hub
	Color      string
	Timer      time.Time
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
			p.Hub.BroadcastChan <- BroadcastMessage{GameId: p.GameId, Type: AbandonedType}
			// game is over, send game abandoned message to winner and remove from active games
			return
		}
		if err != nil {
			log.Println("Cannot read message: ", err)
			return
		}

		type moveType struct {
			Type        string `json:"type"`
			Move        Move   `json:"-"`
			Timeout     string `json:"-"`
			GameId      string `json:"-"`
			PlayerColor string `json:"-"`
			Premove     string `json:"-"`
		}
		var movetype moveType
		if err := json.Unmarshal(content, &movetype); err != nil {
			// todo: properly handle error
			log.Println("Cannot unmarshal message content: ", string(content))
			return
		}

		movetypeString, err := MessageTypeFromString(movetype.Type)
		if err != nil {
			log.Panic(err)
		}
		p.Hub.BroadcastChan <- BroadcastMessage{GameId: p.GameId, Payload: content, Type: movetypeString}
	}
}

func (p *Player) WriteMessage() {
	defer func() {
		p.Connection.Close()
	}()

	for message := range p.SendChan {
		writer, err := p.Connection.NextWriter(websocket.TextMessage)
		if err != nil {
			return
		}
		writer.Write(message)

		n := len(p.SendChan)
		for i := 0; i < n; i++ {
			writer.Write([]byte{'\n'})
			writer.Write(<-p.SendChan)
		}

		if err := writer.Close(); err != nil {
			log.Println("Failed to close writer: ", err)
			return
		}
	}
}
