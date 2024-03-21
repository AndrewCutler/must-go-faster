package main

import (
	"fmt"
	"log"
	"net/http"
	"time"

	handlers "mustgofaster/handlers"

	"github.com/gorilla/mux"
	"github.com/gorilla/websocket"
)

func main() {
	r := mux.NewRouter()

	var upgrader = websocket.Upgrader{
		ReadBufferSize:  1024,
		WriteBufferSize: 1024,
	}

	r.HandleFunc("/connect", func(w http.ResponseWriter, r *http.Request) {
		fmt.Println("CONNECT")
		ws, err := upgrader.Upgrade(w, r, nil)
		if err != nil {
			log.Println(err)
			return
		}
		fmt.Println("connected to websocket")

		for {
			messageType, content, err := ws.ReadMessage()
			if err != nil {
				log.Println(err)
				return
			}

			fmt.Println(string(content))

			if err := ws.WriteMessage(messageType, []byte("test message")); err != nil {
				log.Println(err)
				return
			}
		}
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
