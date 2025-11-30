package main

import (
	"fmt"
	"log"
	"math/rand"
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
	allowedOrigins := os.Getenv("ALLOWED_ORIGINS")

	log.Printf("Environment variables - BASE_URL: %s, PORT: %s, ALLOWED_ORIGINS: %s", baseurl, port, allowedOrigins)

	r := mux.NewRouter()

	// Log all incoming requests
	r.Use(func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			log.Printf("Incoming request: %s %s from %s", r.Method, r.URL.Path, r.RemoteAddr)
			next.ServeHTTP(w, r)
		})
	})

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
		log.Println(ip)
	}))

	r.HandleFunc("/connect", func(w http.ResponseWriter, r *http.Request) {
		time.Sleep(time.Second * 2)
		queryParams := r.URL.Query()
		opponentType := queryParams.Get("opponentType")

		origin := r.Header.Get("Origin")
		log.Printf("WebSocket connection attempt from origin: %s", origin)

		connection, err := upgrader.Upgrade(w, r, nil)

		if err != nil {
			log.Printf("Failed to upgrade WebSocket from origin %s: %v", origin, err)
			return
		}

		log.Println("Connection successful.")

		color := "white"
		if rand.Intn(100) < 50 {
			color = "black"
		}
		var computer *game.Player
		player := &game.Player{Connection: connection, Hub: hub, WriteChan: make(chan []byte), IsComputer: false, Color: color}
		if opponentType == "computer" {
			computer = &game.Player{Hub: player.Hub, WriteChan: make(chan []byte), IsComputer: true}
			go game.PlayComputer(player, computer)
		}

		player.Hub.RegisterChan <- game.Registration{
			Player:   player,
			Computer: computer,
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

	// Set default values if not provided
	if baseurl == "" {
		baseurl = "0.0.0.0"
		log.Println("BASE_URL not set, defaulting to 0.0.0.0")
	}
	if port == "" {
		port = "8000"
		log.Println("PORT not set, defaulting to 8000")
	}

	srv.Addr = baseurl + ":" + port
	log.Printf("Server listening on %s", srv.Addr)
	log.Printf("ALLOWED_ORIGINS: %s", os.Getenv("ALLOWED_ORIGINS"))

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
	// Allow requests with no origin (direct browser access, same-origin requests)
	if origin == "" {
		log.Println("Request with no origin (direct browser access or same-origin), allowing")
		return true
	}

	allowedOriginsEnv := os.Getenv("ALLOWED_ORIGINS")
	if allowedOriginsEnv == "" {
		log.Println("WARNING: ALLOWED_ORIGINS not set, allowing all origins")
		return true
	}

	allowedOrigins := strings.Split(allowedOriginsEnv, ",")
	for _, curr := range allowedOrigins {
		curr = strings.TrimSpace(curr)
		if curr == origin {
			log.Printf("Origin %s is allowed", origin)
			return true
		}
	}

	log.Printf("Origin %s is NOT in allowed list: %v", origin, allowedOrigins)
	return false
}
