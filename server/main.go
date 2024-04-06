package main

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"strings"
	"time"

	"mustgofaster/game"
	handlers "mustgofaster/handlers"

	"github.com/gorilla/mux"
	"github.com/gorilla/websocket"
	"github.com/notnil/chess"
)

func main() {
	os.Setenv("DEVELOPMENT", "true")
	r := mux.NewRouter()

	if os.Getenv("DEVELOPMENT") == "true" {
		_fen, err := chess.FEN("8/7R/1P6/2K3p1/2P3k1/7p/1r6/8 b - - 1 63")
		if err != nil {
			log.Println(err)
		}
		game := chess.NewGame(_fen)
		validMoves := game.ValidMoves()
		fmt.Println(game.Position().Board().Draw())
		chessgroundValidMoves := make(map[string][]string)
		for _, move := range validMoves {
			originatingSquare := move.S1()
			destinationSquare := move.S2()
			chessgroundValidMoves[originatingSquare.String()] = append(chessgroundValidMoves[originatingSquare.String()], destinationSquare.String())
		}
		fmt.Println(chessgroundValidMoves)
		// fmt.Println(validMoves)
		fmt.Printf("\n\n")
	}

	var upgrader = websocket.Upgrader{
		ReadBufferSize:  1024,
		WriteBufferSize: 1024,
		CheckOrigin: func(r *http.Request) bool {
			origin := r.Header.Get("Origin")
			if strings.HasPrefix(origin, "http://10.0.0.73") {
				return true
			}
			if os.Getenv("DEVELOPMENT") == "true" && strings.HasPrefix(origin, "chrome-extension://") {
				return true
			}

			return false
		},
	}

	hub := game.NewHub()
	go hub.Run()

	r.HandleFunc("/connect", func(w http.ResponseWriter, r *http.Request) {
		fmt.Println("connection successful")
		connection, err := upgrader.Upgrade(w, r, nil)
		if err != nil {
			log.Println(err)
			return
		}

		player := &game.Player{Connection: connection, Hub: hub, Send: make(chan []byte)}
		player.Hub.Register <- player
		go player.Read()
		go player.Write()
	})

	spa := handlers.SpaHandler{StaticPath: "../client", IndexPath: "index.html"}
	r.PathPrefix("/").Handler(spa)
	srv := &http.Server{
		Handler:      r,
		Addr:         "10.0.0.73:8000",
		WriteTimeout: 5 * time.Second,
		ReadTimeout:  5 * time.Second,
	}

	log.Fatal(srv.ListenAndServe())
}
