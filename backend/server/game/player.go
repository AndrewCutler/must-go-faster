/*
 * CODEX-MODIFIED: the contents of this file were written by a human and modified after the fact by a Codex agent.
 */

package game

import (
	"encoding/json"
	"errors"
	"log"
	"time"

	"github.com/gorilla/websocket"
)

type Clock struct {
	TimeLeft  float64
	TimeStamp time.Time
	IsRunning bool
}

type Player struct {
	SessionId  string
	Connection *websocket.Conn
	WriteChan  chan []byte
	Hub        *Hub
	Color      string
	Clock      Clock
	IsComputer bool
}

func (p *Player) ReadMessage() {
	defer func() {
		// log.Println("Closing in ReadMessage for player ", p.Color)
		p.Connection.Close()
	}()

	for {
		messageType, content, err := p.Connection.ReadMessage()
		log.Println("playerColor ", p.Color, "messageType: ", messageType)

		// this will fire for the player who is doing the abandonment
		if websocket.IsCloseError(err, websocket.CloseGoingAway) {
			// log.Println("playerColor ", p.Color, " close going away error: ", err)
			p.Hub.onDisconnect(p, true)
			return
		}

		if websocket.IsCloseError(err, websocket.CloseNormalClosure) {
			// log.Println("playerColor ", p.Color, " normal closure")
			p.Hub.onDisconnect(p, false)
			return
		}

		if err != nil {
			// log.Println("playerColor ", p.Color, "Cannot read message: ", err)
			p.Hub.onDisconnect(p, false)
			return
		}

		typeOnly := struct {
			Type        string `json:"type"`
			PlayerColor string `json:"-"`
			Payload     string `json:"-"`
		}{
			Type: "",
		}
		if err := json.Unmarshal(content, &typeOnly); err != nil {
			log.Println("Cannot unmarshal message type: ", string(content))
			return
		}

		message, payload, err := deserialize(string(content), typeOnly.Type)
		if err != nil {
			log.Printf("Deserialization failed for type %s: %s\n", typeOnly.Type, err)
			return
		}

		// todo: don't deserialize message and payload separately and then return new Message from original deserialized message.
		// just do something like message.Payload = payload and return message
		p.Hub.ReadChan <- Message{SessionId: p.SessionId, Payload: payload, Type: typeOnly.Type, IsAgainstComputer: message.IsAgainstComputer, PlayerColor: message.PlayerColor}
	}
}

func (p *Player) WriteMessage() {
	defer func() {
		// log.Println("Closing in WriteMessage for player ", p.Color)
		p.Connection.Close()
	}()

	for message := range p.WriteChan {
		writer, err := p.Connection.NextWriter(websocket.TextMessage)
		if err != nil {
			return
		}
		writer.Write(message)

		n := len(p.WriteChan)
		for i := 0; i < n; i++ {
			writer.Write([]byte{'\n'})
			writer.Write(<-p.WriteChan)
		}

		if err := writer.Close(); err != nil {
			// log.Println("playerColor ", p.Color, "Failed to close writer: ", err)
			return
		}
	}
}

func deserialize(content string, messageType string) (Message, interface{}, error) {
	switch messageType {
	case "GameStartedToServerType":
		return Message{}, nil, nil
	case "MoveToServerType":
		message, payloadData, err := toServerMessage(content)
		if err != nil {
			return Message{}, nil, err
		}
		var payload MoveToServer
		if err := json.Unmarshal([]byte(payloadData), &payload); err != nil {
			log.Println("cannot deserialize: ", content, err)
			return Message{}, nil, err
		}

		return message, payload, nil
	case "TimeoutToServerType":
		message, payloadData, err := toServerMessage(content)
		if err != nil {
			return Message{}, nil, err
		}

		var payload TimeoutToServer
		if err := json.Unmarshal([]byte(payloadData), &payload); err != nil {
			log.Println("cannot deserialize: ", content, err)
			return Message{}, nil, err
		}

		return message, payload, nil
	case "PremoveToServerType":
		message, payloadData, err := toServerMessage(content)
		if err != nil {
			return Message{}, nil, err
		}

		var payload PremoveToServer
		if err := json.Unmarshal([]byte(payloadData), &payload); err != nil {
			log.Println("cannot deserialize: ", content, err)
			return Message{}, nil, err
		}

		return message, payload, nil
	}

	return Message{}, nil, errors.New("cannot deserialize unknown message type")
}

// first we unmarshal into MessageToServer, which sets payload to map[string]interface{}
// then we marshal the payload into a string to unmarshal again into appropriate type
func toServerMessage(content string) (Message, []byte, error) {
	var result Message
	if err := json.Unmarshal([]byte(content), &result); err != nil {
		log.Println("cannot deserialize: ", content, err)
		return Message{}, nil, err
	}
	payloadData, err := json.Marshal(result.Payload)
	if err != nil {
		log.Println("Error marshalling map to JSON:", err)
		return Message{}, nil, err
	}

	return result, payloadData, nil
}
