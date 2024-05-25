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
			p.Hub.BroadcastChan <- MessageToServer{GameId: p.GameId, Type: AbandonedFromServerType.String()}
			// game is over, send game abandoned message to winner and remove from active games
			return
		}
		if err != nil {
			log.Println("Cannot read message: ", err)
			return
		}

		type MoveFromServerType struct {
			Type        string `json:"type"`
			GameId      string `json:"-"`
			PlayerColor string `json:"-"`
			Payload     string `json:"-"`
		}
		var MoveFromServerType MoveFromServerType
		// var m BroadcastMessage
		if err := json.Unmarshal(content, &MoveFromServerType); err != nil {
			// todo: properly handle error
			log.Println("Cannot unmarshal message content: ", string(content))
			return
		}

		// MoveFromServerTypeString, err := MessageTypeFromString(m.Type)
		if err != nil {
			log.Panic(err)
		}
		// todo: conditionally unmarshal content here, based on message type
		payload := deserialize(string(content), MoveFromServerType.Type)
		p.Hub.BroadcastChan <- MessageToServer{GameId: p.GameId, Payload: payload, Type: MoveFromServerType.Type}
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

func deserialize(content string, messageType string) interface{} {
	switch messageType {
	case "MoveFromServerType":
		var result MoveToServer
		if err := json.Unmarshal([]byte(content), &result); err != nil {
			log.Println("cannot deserialize: ", content)
			return err
		}
		return result
	case "TimeoutFromServerType":
		var result TimeoutToServer
		if err := json.Unmarshal([]byte(content), &result); err != nil {
			log.Println("cannot deserialize: ", content)
			return err
		}
		return result
	}

	return nil
}
