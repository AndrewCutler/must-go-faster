package utils

import (
	"fmt"
	"log"

	"github.com/gorilla/websocket"
)

type Player struct {
	Game       *Game
	Connection *websocket.Conn
	Send       chan []byte
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

		fmt.Println(string(content))

		if err := p.Connection.WriteMessage(messageType, []byte("test message")); err != nil {
			log.Println(err)
			return
		}
	}
}

type Game struct {
	Players    map[*Player]bool
	Broadcast  chan []byte
	Register   chan *Player
	Unregister chan *Player
}

func NewGame() *Game {
	return &Game{
		Broadcast:  make(chan []byte),
		Register:   make(chan *Player),
		Unregister: make(chan *Player),
		Players:    make(map[*Player]bool),
	}
}
