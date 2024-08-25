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
	baseurl := os.Getenv("BASE_URL")
	port := os.Getenv("PORT")
	allowedOriginsEnv := os.Getenv("ALLOWED_ORIGINS")

	log.Println("baseurl: ", baseurl)
	log.Println("port: ", port)
	log.Println("allowedOriginsEnv: ", allowedOriginsEnv)

	clientConfig, err := c.GetClientConfig()
	if err != nil {
		log.Panicln("Cannot get client config: ", err)
	}

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

	hub := game.NewHub(clientConfig)
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

	r.HandleFunc("/config", func(w http.ResponseWriter, r *http.Request) {
		// todo: don't use *
		w.Header().Set("Access-Control-Allow-Origin", "*")
		response, err := json.Marshal(clientConfig)
		if err != nil {
			http.Error(w, "Failed to marshal config JSON", http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		w.Write(response)
	})

	// TODO: why is a spa necessary? just use nginx docker image for frontend
	spa := handlers.SpaHandler{StaticPath: "../../client", IndexPath: "index.html"}
	r.PathPrefix("/").Handler(spa)
	srv := &http.Server{
		Handler: r,
		// testing
		// Addr:         config.BaseUrl + ":" + config.Port,
		WriteTimeout: 5 * time.Second,
		ReadTimeout:  5 * time.Second,
	}

	if baseurl != "" && port != "" {
		srv.Addr = baseurl + ":" + port
	}

	log.Fatal(srv.ListenAndServe())
}
