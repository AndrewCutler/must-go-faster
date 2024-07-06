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
}

func (p *Player) ReadMessage(quit chan bool) {
	defer func() {
		log.Println("Closing for player color and quitting: ", p.Color)
		p.Connection.Close()
		quit <- true
	}()

	for {
		// MessageType: 1, TextMessage
		// MessageType: 2, GoingAwayMessage
		messageType, content, err := p.Connection.ReadMessage()
		log.Println("playerColor ", p.Color, "messageType: ", messageType)

		// this will fire for the player who is doing the abandonment
		if websocket.IsCloseError(err, websocket.CloseGoingAway) {
			log.Println("playerColor ", p.Color, " close going away error: ", err)

			// game is over, send game abandoned message to winner and remove from active games
			p.Hub.ReadChan <- Message{SessionId: p.SessionId, Type: AbandonedFromServerType.String()}
			return
		}

		if websocket.IsCloseError(err, websocket.CloseNormalClosure) {
			log.Println("playerColor ", p.Color, " normal closure")
			// handle game over here
		}

		if err != nil {
			log.Println("playerColor ", p.Color, "Cannot read message: ", err)
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

		payload, err := deserialize(string(content), typeOnly.Type)
		if err != nil {
			log.Printf("Deserialization failed for type %s: %s\n", typeOnly.Type, err)
			return
		}

		p.Hub.ReadChan <- Message{SessionId: p.SessionId, Payload: payload, Type: typeOnly.Type}
	}
}

func (p *Player) WriteMessage(quit chan bool) {
	defer func() {
		log.Println("Closing in WriteMessage for player ", p.Color)
		p.Connection.Close()
		quit <- true
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
			log.Println("playerColor ", p.Color, "Failed to close writer: ", err)
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
		// case "NewGameToServerType":
		// 	log.Println("NewGameToServerType")
		// 	return nil, nil
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
		log.Println("Error marshalling map to JSON:", err)
		return nil, err
	}

	return payloadData, nil
}
