package main

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"strings"
	"time"

	"server/game"
	handlers "server/handlers"

	"github.com/gorilla/mux"
	"github.com/gorilla/websocket"
)

func main() {
	baseurl := os.Getenv("BASE_URL")
	port := os.Getenv("PORT")
	allowedOriginsEnv := os.Getenv("ALLOWED_ORIGINS")

	r := mux.NewRouter()

	var upgrader = websocket.Upgrader{
		ReadBufferSize:  1024,
		WriteBufferSize: 1024,
		CheckOrigin: func(r *http.Request) bool {
			origin := r.Header.Get("Origin")
			allowed := false
			allowedOrigins := strings.Split(allowedOriginsEnv, ",")
			for _, curr := range allowedOrigins {
				fmt.Println("curr: ", curr)
				if curr == origin {
					allowed = true
					break
				}
			}

			return allowed
		},
	}

	hub := game.NewHub()
	go hub.Run()

	r.HandleFunc("/ping", func(w http.ResponseWriter, r *http.Request) {
		ip := r.RemoteAddr
		w.Write([]byte(fmt.Sprintf("Ping received from IP %s", ip)))
	})

	r.HandleFunc("/connect", func(w http.ResponseWriter, r *http.Request) {
		log.Println("Connection successful.")
		connection, err := upgrader.Upgrade(w, r, nil)
		if err != nil {
			log.Println("Failed to upgrade: ", err)
			return
		}

		player := &game.Player{Connection: connection, Hub: hub, WriteChan: make(chan []byte)}
		player.Hub.RegisterChan <- player
		go player.ReadMessage()
		go player.WriteMessage()
	})

	// TODO: why is a spa necessary? just use nginx docker image for frontend
	spa := handlers.SpaHandler{StaticPath: "../../client", IndexPath: "index.html"}
	r.PathPrefix("/").Handler(spa)
	srv := &http.Server{
		Handler:      r,
		WriteTimeout: 5 * time.Second,
		ReadTimeout:  5 * time.Second,
	}

	if baseurl != "" && port != "" {
		srv.Addr = baseurl + ":" + port
	}

	log.Fatal(srv.ListenAndServe())
}
