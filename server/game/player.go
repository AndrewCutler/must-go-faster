package game

import (
	"encoding/json"
	"errors"
	"fmt"
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
	GameId     string
	Connection *websocket.Conn
	WriteChan  chan []byte
	Hub        *Hub
	Color      string
	Clock      Clock
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
			p.Hub.ReadChan <- Message{GameId: p.GameId, Type: AbandonedFromServerType.String()}
			// game is over, send game abandoned message to winner and remove from active games
			return
		}
		if err != nil {
			log.Println("Cannot read message: ", err)
			return
		}

		typeOnly := struct {
			Type        string `json:"type"`
			GameId      string `json:"-"`
			PlayerColor string `json:"-"`
			Payload     string `json:"-"`
		}{
			Type: "",
		}
		if err := json.Unmarshal(content, &typeOnly); err != nil {
			log.Println("Cannot unmarshal message type: ", string(content))
			return
		}

		payload, err := deserialize(string(content), typeOnly.Type)
		if err != nil {
			log.Printf("Deserialization failed for type %s: %s\n", typeOnly.Type, err)
			return
		}

		fmt.Printf("\nPayload: %s\n\n", payload)

		p.Hub.ReadChan <- Message{GameId: p.GameId, Payload: payload, Type: typeOnly.Type}
	}
}

func (p *Player) WriteMessage() {
	defer func() {
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
			log.Println("Failed to close writer: ", err)
			return
		}
	}
}

func deserialize(content string, messageType string) (interface{}, error) {
	switch messageType {
	case "GameStartedToServerType":
		return nil, nil
	case "MoveToServerType":
		payloadData, err := toServerMessage(content)
		if err != nil {
			return nil, err
		}
		var payload MoveToServer
		if err := json.Unmarshal([]byte(payloadData), &payload); err != nil {
			log.Println("cannot deserialize: ", content, err)
			return nil, err
		}

		return payload, nil
	case "TimeoutToServerType":
		payloadData, err := toServerMessage(content)
		if err != nil {
			return nil, err
		}

		var payload TimeoutToServer
		if err := json.Unmarshal([]byte(payloadData), &payload); err != nil {
			log.Println("cannot deserialize: ", content, err)
			return nil, err
		}

		return payload, nil
	case "PremoveToServerType":
		payloadData, err := toServerMessage(content)
		if err != nil {
			return nil, err
		}

		var payload PremoveToServer
		if err := json.Unmarshal([]byte(payloadData), &payload); err != nil {
			log.Println("cannot deserialize: ", content, err)
			return nil, err
		}

		return payload, nil
	}

	return nil, errors.New("cannot deserialize unknown message type")
}

// first we unmarshal into MessageToServer, which sets payload to map[string]interface{}
// then we marshal the payload into a string to unmarshal again into appropriate type
func toServerMessage(content string) ([]byte, error) {
	var result Message
	if err := json.Unmarshal([]byte(content), &result); err != nil {
		log.Println("cannot deserialize: ", content, err)
		return nil, err
	}
	payloadData, err := json.Marshal(result.Payload)
	if err != nil {
		fmt.Println("Error marshalling map to JSON:", err)
		return nil, err
	}

	return payloadData, nil
}
