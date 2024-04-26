package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"strings"
	"time"

	c "server/config"
	"server/game"
	handlers "server/handlers"

	"github.com/gorilla/mux"
	"github.com/gorilla/websocket"
)

func main() {
	config, err := c.GetConfig()
	if err != nil {
		log.Panicln("Cannot get config: ", err)
	}
	clientConfig, err := c.GetClientConfig()
	if err != nil {
		log.Panicln("Cannot get client config: ", err)
	}

	os.Setenv("DEVELOPMENT", fmt.Sprintf("%t", config.Development))
	r := mux.NewRouter()

	var upgrader = websocket.Upgrader{
		ReadBufferSize:  1024,
		WriteBufferSize: 1024,
		CheckOrigin: func(r *http.Request) bool {
			origin := r.Header.Get("Origin")
			if os.Getenv("DEVELOPMENT") == "true" && strings.HasPrefix(origin, "http://"+config.BaseUrl) {
				return true
			}
			if strings.HasPrefix(origin, "https://"+config.BaseUrl) {
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
			log.Println("Failed to upgrade: ", err)
			return
		}

		player := &game.Player{Connection: connection, Hub: hub, Send: make(chan []byte)}
		player.Hub.Register <- player
		go player.ReadMessage()
		go player.WriteMessage()
	})

	r.HandleFunc("/config", func(w http.ResponseWriter, r *http.Request) {
		response, err := json.Marshal(clientConfig)
		if err != nil {
			http.Error(w, "Failed to marshal JSON", http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		w.Write(response)
	})

	spa := handlers.SpaHandler{StaticPath: "../client", IndexPath: "index.html"}
	r.PathPrefix("/").Handler(spa)
	srv := &http.Server{
		Handler:      r,
		Addr:         config.BaseUrl + ":" + config.Port,
		WriteTimeout: 5 * time.Second,
		ReadTimeout:  5 * time.Second,
	}

	log.Fatal(srv.ListenAndServe())
}
