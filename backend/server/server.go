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
	log.Println("Server starting.")
	baseurl := os.Getenv("BASE_URL")
	port := os.Getenv("PORT")

	r := mux.NewRouter()

	var upgrader = websocket.Upgrader{
		ReadBufferSize:  1024,
		WriteBufferSize: 1024,
		CheckOrigin: func(r *http.Request) bool {
			origin := r.Header.Get("Origin")
			return checkCORS(origin)
		},
	}

	hub := game.NewHub()
	go hub.Run()

	r.HandleFunc("/ping", withCORS(func(w http.ResponseWriter, r *http.Request) {
		ip := r.RemoteAddr
		w.Write([]byte(fmt.Sprintf("Ping received from IP %s", ip)))
	}))

	r.HandleFunc("/connect", func(w http.ResponseWriter, r *http.Request) {
		queryParams := r.URL.Query()
		opponentType := queryParams.Get("opponentType")

		log.Println("Connection successful.")
		connection, err := upgrader.Upgrade(w, r, nil)
		if err != nil {
			log.Println("Failed to upgrade: ", err)
			return
		}

		player := &game.Player{Connection: connection, Hub: hub, WriteChan: make(chan []byte)}
		player.Hub.RegisterChan <- game.Registration{
			Player:       player,
			OpponentType: opponentType,
		}
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

func withCORS(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		origin := r.Header.Get("Origin")
		allowed := checkCORS(origin)

		if !allowed {
			message := fmt.Sprintf("Request from unallowed origin rejected: %s", origin)
			log.Println(message)
			http.Error(w, message, http.StatusForbidden)
			return
		}

		w.Header().Add("Access-Control-Allow-Origin", "*")
		w.Header().Add("Access-Control-Allow-Credentials", "true")
		w.Header().Add("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
		w.Header().Add("Access-Control-Allow-Methods", "POST, GET, OPTIONS, PUT, DELETE")

		next(w, r)
	}
}

func checkCORS(origin string) bool {
	allowedOriginsEnv := os.Getenv("ALLOWED_ORIGINS")
	allowed := false
	allowedOrigins := strings.Split(allowedOriginsEnv, ",")
	for _, curr := range allowedOrigins {
		if curr == origin {
			allowed = true
			break
		}
	}

	return allowed
}
