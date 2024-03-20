package main

import (
	"fmt"
	"log"
	"net/http"
	"time"

	handlers "mustgofaster/handlers"

	"github.com/gorilla/mux"
)

func main() {
	fmt.Println("test")
	r := mux.NewRouter()

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
